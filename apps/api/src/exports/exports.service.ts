import { PrismaClient } from '@prisma/client';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { 
  EvaluationPDFData,
  StudentNoteData,
  PDFExportResult
} from './dto/pdf-export.dto';
import { Logger } from '../utils/logger';

export class ExportsService {
  constructor(
    private prisma: PrismaClient,
    private pdfGenerator: PdfGeneratorService,
  ) {}

  async exportEvaluationToPDF(evaluationId: number, classId: number) {
    // 1. Récupérer les données de l'évaluation
    const evaluation = await this.prisma.evaluations.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      throw new Error('Évaluation non trouvée');
    }

    // 2. Récupérer les données de la classe
    const classData = await this.prisma.classes.findUnique({
      where: { id: classId },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            establishment: true,
          },
        },
      },
    });

    if (!classData) {
      throw new Error('Classe non trouvée');
    }

    // 3. Récupérer les matières
    const subjects = await this.prisma.subjects.findMany({
      where: { class_id: classId },
      orderBy: { name: 'asc' },
    });

    // 3.1. Récupérer la configuration de calcul pour cette classe
    let classConfig = await this.prisma.class_average_configs.findFirst({
      where: { 
        class_id: classId,
        user_id: classData.user_id,
        is_active: true
      },
    });

    // Si aucune configuration n'existe, créer une configuration par défaut (moyenne simple)
    if (!classConfig) {
      const subjectNames = subjects.map(s => s.name).join(' + ');
      classConfig = {
        id: 0,
        class_id: classId,
        user_id: classData.user_id,
        divisor: { value: subjects.length.toString() } as any,
        formula: `=(${subjectNames}) ÷ ${subjects.length}`,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
    }

    // 4. Récupérer les élèves de la classe
    const students = await this.prisma.students.findMany({
      where: { class_id: classId },
      orderBy: { name: 'asc' },
    });

    // 5. Récupérer toutes les notes de cette évaluation
    const studentsData: StudentNoteData[] = [];

    for (const student of students) {
      const notesMap: Record<number, number> = {};

      for (const subject of subjects) {
        const note = await this.prisma.notes.findFirst({
          where: {
            student_id: student.id,
            subject_id: subject.id,
            evaluation_id: evaluationId,
          },
        });

        if (note) {
          notesMap[subject.id] =
            typeof note.value === 'number'
              ? note.value
              : parseFloat(note.value.toString());
        }
      }

      const total = Object.values(notesMap).reduce(
        (sum, note) => sum + note,
        0,
      );
      
      // Calculer la moyenne selon la configuration de la classe
      const moyenne = this.calculateMoyenneWithConfig(notesMap, classConfig, subjects);

      studentsData.push({
        student: {
          id: student.id,
          name: student.name,
          firstName: (student as any).first_name || '',
          lastName: (student as any).last_name || '',
          gender: student.gender,
        },
        notes: notesMap,
        total,
        moyenne: Math.round(moyenne * 100) / 100,
        rang: 0,
      });
    }

    // 6. Trier par moyenne décroissante et attribuer les rangs
    studentsData.sort((a, b) => b.moyenne - a.moyenne);
    studentsData.forEach((data, index) => {
      data.rang = index + 1;
    });

    // 7. Calculer les statistiques
    const moyennes = studentsData.map((s) => s.moyenne);
    const totaux = studentsData.map((s) => s.total);
    const nombreAdmis = studentsData.filter((s) => s.moyenne >= 10).length;

    const statistics = {
      moyenneClasse:
        Math.round(
          (moyennes.reduce((a, b) => a + b, 0) / moyennes.length) * 100,
        ) / 100,
      totalMax: Math.max(...totaux),
      moyenneMax: Math.max(...moyennes),
      totalMin: Math.min(...totaux),
      moyenneMin: Math.min(...moyennes),
      nombreAdmis,
      nombreNonAdmis: studentsData.length - nombreAdmis,
    };

    // 8. Préparer les données pour le PDF
    const pdfData: EvaluationPDFData = {
      evaluationData: {
        id: evaluation.id,
        nom: evaluation.nom,
        date: evaluation.date,
      },
      classData: {
        id: classData.id,
        name: classData.name,
        user: {
          firstName: classData.users.first_name,
          lastName: classData.users.last_name,
          establishment: classData.users.establishment,
        },
      },
      subjects,
      studentsData,
      statistics,
    };

    // 9. Générer le PDF avec le nouveau service
    return await this.pdfGenerator.generateBulletinPDF(pdfData);
  }

  /**
   * Calcule la moyenne selon une configuration de classe (même logique que l'application frontend)
   */
  private calculateMoyenneWithConfig(
    notes: Record<number, number>, 
    config: any, 
    subjects: any[]
  ): number {
    try {
      let formulaText = config.formula;
      
      // Remplacer les noms de matières par les notes correspondantes
      subjects.forEach(subject => {
        const note = notes[subject.id] || 0;
        // Remplacer toutes les occurrences du nom de la matière
        formulaText = formulaText.replace(new RegExp(subject.name, 'g'), note.toString());
      });
      
      // Remplacer les opérateurs
      formulaText = formulaText.replace(/÷/g, '/');
      formulaText = formulaText.replace(/=/g, '');
      
      // Enlever les espaces
      formulaText = formulaText.trim();
      
      // Si la formule est vide ou ne contient que des espaces, retourner 0
      if (!formulaText || formulaText.trim() === '') {
        return 0;
      }
      
      // Évaluer la formule (attention: utilisation de eval - à sécuriser en production)
      // eslint-disable-next-line no-eval
      const result = eval(formulaText);
      
      // Vérifier que le résultat est un nombre valide
      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        Logger.warn('Résultat de configuration invalide:', { result, formula: config.formula });
        return 0;
      }
      
      return Math.round(result * 100) / 100; // Arrondir à 2 décimales
    } catch (error) {
      Logger.error('Erreur lors du calcul de la moyenne avec configuration:', { error, formula: config.formula });
      return 0;
    }
  }

}
