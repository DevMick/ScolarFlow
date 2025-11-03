import pdf from 'pdf-parse';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { PDF_CONFIG } from '../config/pdf';
import { TextCleaner } from '../utils/textCleaner';
import { Logger } from '../utils/logger';
import type { 
  ImportJob, 
  ImportResult, 
  ParsedStudent, 
  ImportError 
} from '@edustats/shared';

export class PDFParsingService {
  private jobs = new Map<string, ImportJob>();

  /**
   * Démarre un job d'import PDF
   */
  async startImportJob(
    classId: number, 
    filePath: string, 
    originalFileName: string
  ): Promise<string> {
    const jobId = uuidv4();
    
    const job: ImportJob = {
      id: jobId,
      classId,
      fileName: originalFileName,
      status: 'processing',
      progress: 0,
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job);
    
    // Traitement asynchrone
    this.processFile(jobId, filePath).catch(error => {
      Logger.error(`PDF import job ${jobId} failed`, error);
      this.updateJobStatus(jobId, 'failed');
    });

    return jobId;
  }

  /**
   * Récupère le statut d'un job
   */
  getJobStatus(jobId: string): ImportJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Traite le fichier PDF
   */
  private async processFile(jobId: string, filePath: string): Promise<void> {
    try {
      this.updateJobProgress(jobId, 10);

      // Lire le fichier PDF
      const fileBuffer = fs.readFileSync(filePath);
      this.updateJobProgress(jobId, 30);

      // Extraire le texte
      const pdfData = await pdf(fileBuffer);
      const text = pdfData.text;
      this.updateJobProgress(jobId, 50);

      Logger.info(`Extracted text from PDF (${text.length} chars)`, { jobId });

      // Parser le texte pour extraire les noms
      const result = this.parseStudentNames(text);
      this.updateJobProgress(jobId, 90);

      // Finaliser le job
      this.completeJob(jobId, result);
      
    } catch (error) {
      Logger.error(`Failed to process PDF for job ${jobId}`, error);
      this.updateJobStatus(jobId, 'failed');
    } finally {
      // Nettoyer le fichier temporaire
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        Logger.warn(`Failed to cleanup temp file: ${filePath}`);
      }
    }
  }

  /**
   * Parse le texte pour extraire les noms d'élèves
   */
  private parseStudentNames(text: string): ImportResult {
    const errors: ImportError[] = [];
    const students: ParsedStudent[] = [];

    // Nettoyer et extraire les lignes pertinentes
    const cleanedText = TextCleaner.cleanText(text);
    const relevantLines = TextCleaner.extractRelevantLines(cleanedText);

    Logger.info(`Processing ${relevantLines.length} relevant lines`);

    relevantLines.forEach((line, index) => {
      try {
        const parsedStudents = this.extractNamesFromLine(line, index + 1);
        students.push(...parsedStudents);
      } catch (error) {
        errors.push({
          row: index + 1,
          originalText: line,
          error: 'Erreur lors du parsing de la ligne',
          suggestion: 'Vérifiez le format de la ligne'
        });
      }
    });

    // Filtrer par seuil de confiance
    const filteredStudents = students.filter(student => 
      student.confidence >= PDF_CONFIG.confidenceThreshold
    );

    // Dédupliquer
    const uniqueStudents = this.deduplicateStudents(filteredStudents);

    return {
      totalProcessed: relevantLines.length,
      successCount: uniqueStudents.length,
      errorCount: errors.length,
      duplicateCount: students.length - uniqueStudents.length,
      students: uniqueStudents,
      errors,
      duplicates: [], // Sera rempli par le service de détection de doublons
    };
  }

  /**
   * Extrait les noms d'une ligne de texte
   */
  private extractNamesFromLine(line: string, lineNumber: number): ParsedStudent[] {
    const students: ParsedStudent[] = [];

    PDF_CONFIG.namePatterns.forEach(pattern => {
      const matches = Array.from(line.matchAll(pattern));
      
      matches.forEach(match => {
        let firstName: string;
        let lastName: string;

        // Le pattern détermine l'ordre des groupes
        if (pattern.source.includes(',')) {
          // Format "Nom, Prénom"
          lastName = TextCleaner.sanitizeName(match[1]);
          firstName = TextCleaner.sanitizeName(match[2]);
        } else {
          // Format "Prénom Nom"
          firstName = TextCleaner.sanitizeName(match[1]);
          lastName = TextCleaner.sanitizeName(match[2]);
        }

        // Normaliser les noms
        firstName = TextCleaner.normalizeName(firstName);
        lastName = TextCleaner.normalizeName(lastName);

        // Valider les noms
        if (TextCleaner.isValidName(firstName) && TextCleaner.isValidName(lastName)) {
          const confidence = TextCleaner.calculateNameConfidence(
            match[0], 
            firstName, 
            lastName
          );

          students.push({
            firstName,
            lastName,
            confidence,
            originalText: match[0],
            lineNumber,
          });
        }
      });
    });

    return students;
  }

  /**
   * Supprime les doublons basés sur la similarité des noms
   */
  private deduplicateStudents(students: ParsedStudent[]): ParsedStudent[] {
    const unique: ParsedStudent[] = [];
    
    students.forEach(student => {
      const isDuplicate = unique.some(existing => 
        this.areNamesSimilar(student, existing)
      );
      
      if (!isDuplicate) {
        unique.push(student);
      } else {
        Logger.debug(`Duplicate detected: ${student.firstName} ${student.lastName}`);
      }
    });

    return unique;
  }

  /**
   * Compare la similarité entre deux noms
   */
  private areNamesSimilar(student1: ParsedStudent, student2: ParsedStudent): boolean {
    const similarity1 = this.calculateStringSimilarity(
      student1.firstName.toLowerCase(),
      student2.firstName.toLowerCase()
    );
    
    const similarity2 = this.calculateStringSimilarity(
      student1.lastName.toLowerCase(),
      student2.lastName.toLowerCase()
    );

    // Considérer comme similaire si les deux noms ont une similarité élevée
    return similarity1 > 0.8 && similarity2 > 0.8;
  }

  /**
   * Calcule la similarité entre deux chaînes (distance de Levenshtein normalisée)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;
    
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLength);
  }

  /**
   * Calcule la distance de Levenshtein entre deux chaînes
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Met à jour le progrès d'un job
   */
  private updateJobProgress(jobId: string, progress: number): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = progress;
    }
  }

  /**
   * Met à jour le statut d'un job
   */
  private updateJobStatus(jobId: string, status: ImportJob['status']): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      if (status === 'completed' || status === 'failed') {
        job.completedAt = new Date();
      }
    }
  }

  /**
   * Finalise un job avec les résultats
   */
  private completeJob(jobId: string, results: ImportResult): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'completed';
      job.progress = 100;
      job.results = results;
      job.completedAt = new Date();
    }
  }

  /**
   * Nettoie les anciens jobs (garde les jobs des 24 dernières heures)
   */
  cleanupOldJobs(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.createdAt < oneDayAgo) {
        this.jobs.delete(jobId);
      }
    }
  }
}
