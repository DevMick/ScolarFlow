// ========================================
// ARCHIVE SERVICE - SERVICE D'ARCHIVAGE INTELLIGENT
// ========================================

import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  AnnualReport,
  AnnualArchive,
  ReportExportOptions
} from '@edustats/shared/types';
// TODO: Remplacer par des types locaux si le package n'existe pas
import { ExportService } from './ExportService';

/**
 * Configuration pour l'archivage
 */
interface ArchiveConfig {
  retentionYears: number;
  compressionEnabled: boolean;
  checksumAlgorithm: string;
  archiveFormats: string[];
  maxFileSize: number; // en bytes
}

/**
 * Statistiques d'archivage
 */
interface ArchiveStats {
  totalArchives: number;
  totalSize: number;
  oldestArchive: Date | null;
  newestArchive: Date | null;
  archivesByYear: Record<string, number>;
  compressionRatio: number;
}

/**
 * Service d'archivage intelligent pour les bilans annuels
 * Gère la conservation, compression et consultation historique
 */
export class ArchiveService {
  private prisma: PrismaClient;
  private exportService: ExportService;
  private archiveDir: string;
  private config: ArchiveConfig;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.exportService = new ExportService();
    this.archiveDir = process.env.ARCHIVE_DIR || path.join(process.cwd(), 'archives');
    
    this.config = {
      retentionYears: parseInt(process.env.ARCHIVE_RETENTION_YEARS || '7'),
      compressionEnabled: process.env.ARCHIVE_COMPRESSION === 'true',
      checksumAlgorithm: 'sha256',
      archiveFormats: ['pdf', 'json'],
      maxFileSize: 50 * 1024 * 1024 // 50MB
    };

    this.ensureArchiveDirectory();
  }

  // ========================================
  // ARCHIVAGE PRINCIPAL
  // ========================================

  /**
   * Archive un rapport annuel complet
   */
  async archiveReport(reportId: string): Promise<AnnualArchive> {
    try {
      // 1. Récupération du rapport
      const report = await this.getReportById(reportId);
      if (!report) {
        throw new Error('Rapport introuvable');
      }

      // 2. Vérification si déjà archivé
      // @ts-ignore - annualArchive model not in Prisma schema yet
      const existingArchive = await (this.prisma as any).annualArchive.findFirst({
        where: {
          classId: report.classId,
          academicYear: report.academicYear
        }
      });

      if (existingArchive) {
        throw new Error('Ce rapport est déjà archivé');
      }

      // 3. Génération des fichiers d'archive
      const archiveFiles = await this.generateArchiveFiles(report);

      // 4. Calcul des checksums
      const checksums = await this.calculateChecksums(archiveFiles);

      // 5. Compression (si activée)
      let finalFiles = archiveFiles;
      if (this.config.compressionEnabled) {
        finalFiles = await this.compressFiles(archiveFiles);
      }

      // 6. Création de l'entrée d'archive
      const archive = await this.createArchiveEntry(report, finalFiles, checksums);

      // 7. Nettoyage des fichiers temporaires
      await this.cleanupTempFiles(archiveFiles);

      return archive;

    } catch (error) {
      console.error('Erreur archivage rapport:', error);
      throw error;
    }
  }

  /**
   * Restaure un rapport depuis les archives
   */
  async restoreReport(archiveId: string): Promise<AnnualReport> {
    try {
      // 1. Récupération de l'archive
      // @ts-ignore - annualArchive model not in Prisma schema yet
      const archive = await (this.prisma as any).annualArchive.findUnique({
        where: { id: parseInt(archiveId) },
        include: {
          class: {
            include: {
              user: true
            }
          }
        }
      });

      if (!archive) {
        throw new Error('Archive introuvable');
      }

      // 2. Vérification de l'intégrité
      const integrityCheck = await this.verifyArchiveIntegrity(archive);
      if (!integrityCheck.valid) {
        throw new Error(`Archive corrompue: ${integrityCheck.error}`);
      }

      // 3. Décompression (si nécessaire)
      let reportPath = archive.fullReportPath;
      if (this.config.compressionEnabled && reportPath) {
        reportPath = await this.decompressFile(reportPath);
      }

      // 4. Lecture du rapport
      if (!reportPath) {
        throw new Error('Chemin du rapport introuvable');
      }

      const reportData = await fs.readFile(reportPath, 'utf8');
      const report: AnnualReport = JSON.parse(reportData);

      // 5. Mise à jour du statut
      report.status = 'archived';

      return report;

    } catch (error) {
      console.error('Erreur restauration rapport:', error);
      throw error;
    }
  }

  // ========================================
  // GESTION DES ARCHIVES
  // ========================================

  /**
   * Liste les archives avec filtres et pagination
   */
  async listArchives(options: {
    classId?: number;
    academicYear?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    archives: AnnualArchive[];
    total: number;
    pagination: any;
  }> {
    const {
      classId,
      academicYear,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20
    } = options;

    const where: any = {};

    if (classId) where.classId = classId;
    if (academicYear) where.academicYear = academicYear;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [archives, total] = await Promise.all([
      // @ts-ignore - annualArchive model not in Prisma schema yet
      (this.prisma as any).annualArchive.findMany({
        where,
        include: {
          class: {
            select: {
              name: true,
              level: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      // @ts-ignore - annualArchive model not in Prisma schema yet
      (this.prisma as any).annualArchive.count({ where })
    ]);

    // Conversion vers le type AnnualArchive
    const convertedArchives: AnnualArchive[] = archives.map(archive => ({
      id: archive.id.toString(),
      classId: archive.classId,
      academicYear: archive.academicYear,
      summaryData: archive.summaryData as any,
      fullReportPath: archive.fullReportPath || undefined,
      fileSize: archive.fileSize ? Number(archive.fileSize) : undefined,
      checksum: archive.checksum || undefined,
      metadata: archive.metadata as any,
      createdAt: archive.createdAt,
      archivedAt: archive.archivedAt
    }));

    return {
      archives: convertedArchives,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Obtient les statistiques d'archivage
   */
  async getArchiveStats(): Promise<ArchiveStats> {
    // @ts-ignore - annualArchive model not in Prisma schema yet
    const archives = await (this.prisma as any).annualArchive.findMany({
      select: {
        academicYear: true,
        fileSize: true,
        createdAt: true
      }
    });

    const totalArchives = archives.length;
    const totalSize = archives.reduce((sum, archive) => 
      sum + (archive.fileSize ? Number(archive.fileSize) : 0), 0);

    const dates = archives.map(a => a.createdAt).sort();
    const oldestArchive = dates.length > 0 ? dates[0] : null;
    const newestArchive = dates.length > 0 ? dates[dates.length - 1] : null;

    // Groupement par année
    const archivesByYear: Record<string, number> = {};
    archives.forEach(archive => {
      const year = archive.academicYear;
      archivesByYear[year] = (archivesByYear[year] || 0) + 1;
    });

    // Calcul du ratio de compression (estimation)
    const compressionRatio = this.config.compressionEnabled ? 0.3 : 1.0;

    return {
      totalArchives,
      totalSize,
      oldestArchive,
      newestArchive,
      archivesByYear,
      compressionRatio
    };
  }

  /**
   * Supprime les archives expirées selon la politique de rétention
   */
  async cleanupExpiredArchives(): Promise<{
    deletedCount: number;
    freedSpace: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - this.config.retentionYears);

    // Récupération des archives expirées
    // @ts-ignore - annualArchive model not in Prisma schema yet
    const expiredArchives = await (this.prisma as any).annualArchive.findMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    let freedSpace = 0;
    let deletedCount = 0;

    for (const archive of expiredArchives) {
      try {
        // Suppression du fichier physique
        if (archive.fullReportPath) {
          await fs.unlink(archive.fullReportPath);
          freedSpace += archive.fileSize ? Number(archive.fileSize) : 0;
        }

        // Suppression de l'entrée en base
        // @ts-ignore - annualArchive model not in Prisma schema yet
        await (this.prisma as any).annualArchive.delete({
          where: { id: archive.id }
        });

        deletedCount++;

      } catch (error) {
        console.error(`Erreur suppression archive ${archive.id}:`, error);
      }
    }

    return { deletedCount, freedSpace };
  }

  // ========================================
  // RECHERCHE ET CONSULTATION
  // ========================================

  /**
   * Recherche dans les archives avec critères avancés
   */
  async searchArchives(query: {
    searchTerm?: string;
    classLevel?: string;
    teacher?: string;
    performanceRange?: [number, number];
    hasInsights?: boolean;
    academicYears?: string[];
  }): Promise<AnnualArchive[]> {
    const {
      searchTerm,
      classLevel,
      teacher,
      performanceRange,
      hasInsights,
      academicYears
    } = query;

    // Construction de la requête complexe
    const where: any = {};

    if (academicYears && academicYears.length > 0) {
      where.academicYear = { in: academicYears };
    }

    if (classLevel) {
      where.class = {
        level: classLevel
      };
    }

    if (teacher) {
      where.class = {
        ...where.class,
        user: {
          OR: [
            { firstName: { contains: teacher, mode: 'insensitive' } },
            { lastName: { contains: teacher, mode: 'insensitive' } }
          ]
        }
      };
    }

    // Recherche textuelle dans les données de synthèse
    if (searchTerm) {
      where.OR = [
        {
          summaryData: {
            path: ['keyInsights'],
            array_contains: searchTerm
          }
        },
        {
          summaryData: {
            path: ['mainRecommendations'],
            array_contains: searchTerm
          }
        }
      ];
    }

    // @ts-ignore - annualArchive model not in Prisma schema yet
    const archives = await (this.prisma as any).annualArchive.findMany({
      where,
      include: {
        class: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filtrage post-requête pour les critères complexes
    let filteredArchives = archives;

    if (performanceRange) {
      filteredArchives = filteredArchives.filter(archive => {
        const avgPerformance = (archive.summaryData as any)?.averagePerformance;
        return avgPerformance >= performanceRange[0] && avgPerformance <= performanceRange[1];
      });
    }

    if (hasInsights !== undefined) {
      filteredArchives = filteredArchives.filter(archive => {
        const insights = (archive.summaryData as any)?.keyInsights || [];
        return hasInsights ? insights.length > 0 : insights.length === 0;
      });
    }

    // Conversion vers le type AnnualArchive
    return filteredArchives.map(archive => ({
      id: archive.id.toString(),
      classId: archive.classId,
      academicYear: archive.academicYear,
      summaryData: archive.summaryData as any,
      fullReportPath: archive.fullReportPath || undefined,
      fileSize: archive.fileSize ? Number(archive.fileSize) : undefined,
      checksum: archive.checksum || undefined,
      metadata: archive.metadata as any,
      createdAt: archive.createdAt,
      archivedAt: archive.archivedAt
    }));
  }

  /**
   * Génère un rapport de comparaison entre années
   */
  async generateComparisonReport(
    classId: number,
    academicYears: string[]
  ): Promise<{
    comparison: any;
    trends: any;
    recommendations: string[];
  }> {
    // @ts-ignore - annualArchive model not in Prisma schema yet
    const archives = await (this.prisma as any).annualArchive.findMany({
      where: {
        classId,
        academicYear: { in: academicYears }
      },
      orderBy: { academicYear: 'asc' }
    });

    if (archives.length < 2) {
      throw new Error('Au moins 2 années sont nécessaires pour la comparaison');
    }

    // Extraction des données de comparaison
    const yearlyData = archives.map(archive => ({
      year: archive.academicYear,
      data: archive.summaryData as any
    }));

    // Calcul des tendances
    const trends = this.calculateTrends(yearlyData);

    // Génération de recommandations basées sur l'évolution
    const recommendations = this.generateEvolutionRecommendations(trends);

    return {
      comparison: yearlyData,
      trends,
      recommendations
    };
  }

  // ========================================
  // MÉTHODES PRIVÉES
  // ========================================

  /**
   * Récupère un rapport par ID
   */
  private async getReportById(reportId: string): Promise<AnnualReport | null> {
    // @ts-ignore - annualReport model not in Prisma schema yet
    const report = await (this.prisma as any).annualReport.findUnique({
      where: { id: parseInt(reportId) },
      include: {
        class: {
          include: {
            user: true
          }
        }
      }
    });

    if (!report) return null;

    // Conversion vers AnnualReport
    return report.reportData as AnnualReport;
  }

  /**
   * Génère les fichiers d'archive
   */
  private async generateArchiveFiles(report: AnnualReport): Promise<string[]> {
    const files: string[] = [];

    for (const format of this.config.archiveFormats) {
      const exportOptions: ReportExportOptions = {
        format: format as any,
        includeCharts: true,
        includeRawData: true,
        quality: 'high'
      };

      const result = await this.exportService.exportReport(report, exportOptions);
      
      if (result.success && result.filePath) {
        files.push(result.filePath);
      }
    }

    return files;
  }

  /**
   * Calcule les checksums des fichiers
   */
  private async calculateChecksums(files: string[]): Promise<Record<string, string>> {
    const checksums: Record<string, string> = {};

    for (const file of files) {
      const content = await fs.readFile(file);
      const hash = crypto.createHash(this.config.checksumAlgorithm);
      hash.update(content);
      checksums[path.basename(file)] = hash.digest('hex');
    }

    return checksums;
  }

  /**
   * Compresse les fichiers
   */
  private async compressFiles(files: string[]): Promise<string[]> {
    // Implémentation de compression (gzip, zip, etc.)
    // Pour l'instant, retourne les fichiers originaux
    return files;
  }

  /**
   * Crée l'entrée d'archive en base
   */
  private async createArchiveEntry(
    report: AnnualReport,
    files: string[],
    checksums: Record<string, string>
  ): Promise<AnnualArchive> {
    const mainFile = files.find(f => f.endsWith('.json')) || files[0];
    const fileStats = await fs.stat(mainFile);

    const summaryData = {
      studentCount: report.metadata.totalStudents,
      averagePerformance: report.classSummary.averagePerformance,
      keyInsights: report.insights.slice(0, 5).map(i => i.title),
      mainRecommendations: report.pedagogicalRecommendations.suggestedActions
        .slice(0, 3).map(a => a.action)
    };

    // @ts-ignore - annualArchive model not in Prisma schema yet
    const archive = await (this.prisma as any).annualArchive.create({
      data: {
        classId: report.classId,
        academicYear: report.academicYear,
        summaryData,
        fullReportPath: mainFile,
        fileSize: fileStats.size,
        checksum: Object.values(checksums)[0],
        metadata: {
          files: files.map(f => path.basename(f)),
          checksums,
          compressionUsed: this.config.compressionEnabled,
          archiveVersion: '1.0'
        }
      }
    });

    return {
      id: archive.id.toString(),
      classId: archive.classId,
      academicYear: archive.academicYear,
      summaryData,
      fullReportPath: archive.fullReportPath || undefined,
      fileSize: Number(archive.fileSize),
      checksum: archive.checksum || undefined,
      metadata: archive.metadata as any,
      createdAt: archive.createdAt,
      archivedAt: archive.archivedAt
    };
  }

  /**
   * Vérifie l'intégrité d'une archive
   */
  private async verifyArchiveIntegrity(archive: any): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      if (!archive.fullReportPath) {
        return { valid: false, error: 'Chemin de fichier manquant' };
      }

      // Vérification de l'existence du fichier
      try {
        await fs.access(archive.fullReportPath);
      } catch {
        return { valid: false, error: 'Fichier introuvable' };
      }

      // Vérification du checksum
      if (archive.checksum) {
        const content = await fs.readFile(archive.fullReportPath);
        const hash = crypto.createHash(this.config.checksumAlgorithm);
        hash.update(content);
        const currentChecksum = hash.digest('hex');

        if (currentChecksum !== archive.checksum) {
          return { valid: false, error: 'Checksum invalide - fichier corrompu' };
        }
      }

      return { valid: true };

    } catch (error) {
      return { valid: false, error: `Erreur vérification: ${error}` };
    }
  }

  /**
   * Décompresse un fichier
   */
  private async decompressFile(filePath: string): Promise<string> {
    // Implémentation de décompression
    // Pour l'instant, retourne le chemin original
    return filePath;
  }

  /**
   * Nettoie les fichiers temporaires
   */
  private async cleanupTempFiles(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        // Ne pas supprimer les fichiers d'archive permanents
        if (!file.includes(this.archiveDir)) {
          await fs.unlink(file);
        }
      } catch (error) {
        console.warn(`Impossible de supprimer le fichier temporaire ${file}:`, error);
      }
    }
  }

  /**
   * Assure l'existence du répertoire d'archives
   */
  private async ensureArchiveDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.archiveDir, { recursive: true });
    } catch (error) {
      console.error('Erreur création répertoire archives:', error);
    }
  }

  /**
   * Calcule les tendances d'évolution
   */
  private calculateTrends(yearlyData: Array<{ year: string; data: any }>): any {
    const trends: any = {
      performance: [],
      participation: [],
      consistency: []
    };

    for (let i = 1; i < yearlyData.length; i++) {
      const current = yearlyData[i].data;
      const previous = yearlyData[i - 1].data;

      trends.performance.push({
        year: yearlyData[i].year,
        change: current.averagePerformance - previous.averagePerformance,
        percentage: ((current.averagePerformance - previous.averagePerformance) / previous.averagePerformance) * 100
      });
    }

    return trends;
  }

  /**
   * Génère des recommandations basées sur l'évolution
   */
  private generateEvolutionRecommendations(trends: any): string[] {
    const recommendations: string[] = [];

    // Analyse des tendances de performance
    const avgPerformanceChange = trends.performance.reduce((sum: number, t: any) => sum + t.change, 0) / trends.performance.length;

    if (avgPerformanceChange > 0.5) {
      recommendations.push('Maintenir les pratiques pédagogiques actuelles qui montrent une amélioration constante');
    } else if (avgPerformanceChange < -0.5) {
      recommendations.push('Revoir les méthodes pédagogiques pour inverser la tendance de baisse des performances');
    } else {
      recommendations.push('Stabiliser les acquis et identifier des leviers d\'amélioration ciblés');
    }

    return recommendations;
  }
}
