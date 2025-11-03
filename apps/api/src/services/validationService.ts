// ========================================
// SERVICE DE VALIDATION MÉTIER AVANCÉE
// ========================================

import { PrismaClient } from '@prisma/client';
import { 
  CreateEvaluationData, 
  UpdateEvaluationData,
  EvaluationType,
  AbsentHandling
} from '@edustats/shared';
import { 
  ValidationError, 
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  handleDatabaseOperation 
} from '../utils/errors';

// ========================================
// TYPES POUR LA VALIDATION MÉTIER
// ========================================

interface ClassContext {
  id: number;
  name: string;
  studentCount: number;
  students: Array<{
    id: number;
    firstName: string;
    lastName: string;
    isActive: boolean;
  }>;
}

interface ValidationRule {
  name: string;
  check: () => boolean | Promise<boolean>;
  message: string;
  level: 'error' | 'warning';
}

// ========================================
// SERVICE DE VALIDATION MÉTIER
// ========================================

export class ValidationService {
  constructor(private prisma: PrismaClient) {}

  // ========================================
  // VALIDATION CRÉATION D'ÉVALUATION
  // ========================================

  /**
   * Valide la création d'une nouvelle évaluation
   */
  async validateEvaluationCreation(
    data: CreateEvaluationData,
    classContext: ClassContext
  ): Promise<void> {
    const rules: ValidationRule[] = [
      // Règle 1: Vérifier le niveau de la classe vs type d'évaluation
      {
        name: 'LEVEL_TYPE_CONSISTENCY',
        check: () => this.validateLevelTypeConsistency(data.type, (classContext as any).level || 'PRIMARY'),
        message: this.getLevelTypeMessage(data.type, (classContext as any).level || 'PRIMARY'),
        level: 'warning'
      },

      // Règle 2: Vérifier la cohérence coefficient/type
      {
        name: 'COEFFICIENT_TYPE_CONSISTENCY',
        check: () => this.validateCoefficientTypeConsistency(data.coefficient || 1, data.type),
        message: this.getCoefficientTypeMessage(data.coefficient || 1, data.type),
        level: 'warning'
      },

      // Règle 3: Vérifier la limite d'évaluations par mois
      {
        name: 'MONTHLY_EVALUATION_LIMIT',
        check: async () => this.checkMonthlyEvaluationLimit(classContext.id, data.evaluationDate),
        message: 'Limite d\'évaluations par mois atteinte (maximum 8 par mois recommandé)',
        level: 'warning'
      },

      // Règle 4: Vérifier que la classe a des élèves actifs
      {
        name: 'ACTIVE_STUDENTS_REQUIRED',
        check: () => classContext.students.filter(s => s.isActive).length > 0,
        message: 'Impossible de créer une évaluation pour une classe sans élèves actifs',
        level: 'error'
      },

      // Règle 5: Vérifier l'unicité du titre dans la classe
      {
        name: 'UNIQUE_TITLE_IN_CLASS',
        check: async () => this.checkUniqueTitleInClass(classContext.id, data.title),
        message: `Une évaluation avec le titre "${data.title}" existe déjà dans cette classe`,
        level: 'error'
      },

      // Règle 6: Vérifier la fréquence d'évaluations par matière
      {
        name: 'SUBJECT_FREQUENCY_CHECK',
        check: async () => this.checkSubjectFrequency(
          classContext.id, 
          data.subject, 
          data.evaluationDate
        ),
        message: `Fréquence élevée d'évaluations en ${data.subject} ce mois-ci`,
        level: 'warning'
      }
    ];

    await this.executeValidationRules(rules);
  }

  // ========================================
  // VALIDATION MODIFICATION D'ÉVALUATION
  // ========================================

  /**
   * Valide la modification d'une évaluation
   */
  async validateEvaluationUpdate(
    data: UpdateEvaluationData,
    existingEvaluation: any
  ): Promise<void> {
    const rules: ValidationRule[] = [
      // Règle 1: Vérifier si l'évaluation est finalisée
      {
        name: 'FINALIZED_MODIFICATION_CHECK',
        check: () => this.canModifyFinalizedEvaluation(data, existingEvaluation),
        message: 'Modifications limitées sur une évaluation finalisée',
        level: 'error'
      },

      // Règle 2: Vérifier l'impact sur les résultats existants
      {
        name: 'EXISTING_RESULTS_IMPACT',
        check: async () => this.checkExistingResultsImpact(data, existingEvaluation),
        message: 'Cette modification peut affecter les résultats existants',
        level: 'warning'
      },

      // Règle 3: Vérifier la cohérence des modifications
      {
        name: 'MODIFICATION_CONSISTENCY',
        check: () => this.validateModificationConsistency(data, existingEvaluation),
        message: 'Les modifications apportées ne sont pas cohérentes',
        level: 'error'
      },

      // Règle 4: Vérifier l'unicité du nouveau titre
      {
        name: 'UNIQUE_TITLE_UPDATE',
        check: async () => {
          if (data.title && data.title !== existingEvaluation.title) {
            return this.checkUniqueTitleInClass(existingEvaluation.classId, data.title);
          }
          return true;
        },
        message: `Une évaluation avec le titre "${data.title}" existe déjà dans cette classe`,
        level: 'error'
      }
    ];

    await this.executeValidationRules(rules);
  }

  // ========================================
  // VALIDATION RÉSULTATS D'ÉVALUATION
  // ========================================

  /**
   * Valide la saisie d'un résultat d'évaluation
   */
  async validateEvaluationResult(
    studentId: number,
    score: number | undefined,
    isAbsent: boolean,
    evaluationId: number,
    maxScore: number
  ): Promise<void> {
    const rules: ValidationRule[] = [
      // Règle 1: Vérifier que l'élève appartient à la classe
      {
        name: 'STUDENT_IN_CLASS',
        check: async () => this.isStudentInEvaluationClass(studentId, evaluationId),
        message: 'Cet élève n\'appartient pas à la classe de l\'évaluation',
        level: 'error'
      },

      // Règle 2: Vérifier la cohérence score/absence
      {
        name: 'SCORE_ABSENCE_CONSISTENCY',
        check: () => this.validateScoreAbsenceConsistency(score, isAbsent),
        message: 'Incohérence entre le score et le statut d\'absence',
        level: 'error'
      },

      // Règle 3: Vérifier que le score est dans les limites
      {
        name: 'SCORE_WITHIN_LIMITS',
        check: () => this.validateScoreWithinLimits(score, maxScore),
        message: `Le score doit être entre 0 et ${maxScore}`,
        level: 'error'
      },

      // Règle 4: Détecter les scores suspects
      {
        name: 'SUSPICIOUS_SCORE_DETECTION',
        check: async () => this.detectSuspiciousScore(studentId, score, evaluationId),
        message: 'Ce score semble anormalement différent des performances habituelles de l\'élève',
        level: 'warning'
      }
    ];

    await this.executeValidationRules(rules);
  }

  /**
   * Valide un lot de résultats
   */
  async validateBulkResults(
    results: Array<{
      studentId: number;
      score?: number;
      isAbsent: boolean;
    }>,
    evaluationId: number,
    maxScore: number
  ): Promise<void> {
    const rules: ValidationRule[] = [
      // Règle 1: Vérifier l'unicité des élèves
      {
        name: 'UNIQUE_STUDENTS_IN_BULK',
        check: () => this.validateUniqueStudentsInBulk(results),
        message: 'Certains élèves apparaissent plusieurs fois dans le lot',
        level: 'error'
      },

      // Règle 2: Vérifier la cohérence des résultats
      {
        name: 'BULK_RESULTS_CONSISTENCY',
        check: () => this.validateBulkResultsConsistency(results, maxScore),
        message: 'Incohérences détectées dans les résultats du lot',
        level: 'warning'
      },

      // Règle 3: Détecter les patterns suspects
      {
        name: 'SUSPICIOUS_PATTERNS',
        check: () => this.detectSuspiciousPatterns(results),
        message: 'Patterns suspects détectés dans les résultats (scores identiques, progression anormale)',
        level: 'warning'
      }
    ];

    await this.executeValidationRules(rules);

    // Valider chaque résultat individuellement
    for (const result of results) {
      await this.validateEvaluationResult(
        result.studentId,
        result.score,
        result.isAbsent,
        evaluationId,
        maxScore
      );
    }
  }

  // ========================================
  // RÈGLES DE VALIDATION PRIVÉES
  // ========================================

  /**
   * Valide la cohérence niveau/type d'évaluation
   */
  private validateLevelTypeConsistency(type: EvaluationType, level: string): boolean {
    const recommendations = {
      'CP1': ['Controle', 'Oral', 'Participation'],
      'CP2': ['Controle', 'Oral', 'Participation'],
      'CE1': ['Controle', 'Devoir', 'Oral', 'Participation'],
      'CE2': ['Controle', 'Devoir', 'Oral', 'Participation'],
      'CM1': ['Controle', 'Devoir', 'Examen', 'Oral', 'TP', 'Participation'],
      'CM2': ['Controle', 'Devoir', 'Examen', 'Oral', 'TP', 'Projet', 'Participation']
    };

    const allowedTypes = recommendations[level as keyof typeof recommendations] || [];
    return allowedTypes.includes(type);
  }

  private getLevelTypeMessage(type: EvaluationType, level: string): string {
    return `Le type "${type}" n'est pas recommandé pour le niveau ${level}`;
  }

  /**
   * Valide la cohérence coefficient/type
   */
  private validateCoefficientTypeConsistency(coefficient: number, type: EvaluationType): boolean {
    const recommendations = {
      'Participation': { min: 0.25, max: 1 },
      'Controle': { min: 0.5, max: 2 },
      'Devoir': { min: 1, max: 3 },
      'Oral': { min: 0.5, max: 2 },
      'TP': { min: 1, max: 3 },
      'Projet': { min: 1.5, max: 4 },
      'Examen': { min: 2, max: 5 }
    };

    const range = recommendations[type];
    if (!range) return true; // Type non reconnu = pas de validation

    return coefficient >= range.min && coefficient <= range.max;
  }

  private getCoefficientTypeMessage(coefficient: number, type: EvaluationType): string {
    return `Le coefficient ${coefficient} semble inadapté pour une évaluation de type "${type}"`;
  }

  /**
   * Vérifie la limite d'évaluations par mois
   */
  private async checkMonthlyEvaluationLimit(classId: number, evaluationDate: Date): Promise<boolean> {
    const startOfMonth = new Date(evaluationDate.getFullYear(), evaluationDate.getMonth(), 1);
    const endOfMonth = new Date(evaluationDate.getFullYear(), evaluationDate.getMonth() + 1, 0);

    const count = await this.prisma.evaluations.count({
      where: {
        class_id: classId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    return count < 8; // Maximum 8 évaluations par mois
  }

  /**
   * Vérifie l'unicité du titre dans la classe
   */
  private async checkUniqueTitleInClass(classId: number, title: string): Promise<boolean> {
    const existing = await this.prisma.evaluations.findFirst({
      where: {
        class_id: classId,
        nom: {
          equals: title,
          mode: 'insensitive'
        }
      }
    });

    return !existing;
  }

  /**
   * Vérifie la fréquence par matière
   */
  private async checkSubjectFrequency(
    classId: number, 
    subject: string, 
    evaluationDate: Date
  ): Promise<boolean> {
    const startOfMonth = new Date(evaluationDate.getFullYear(), evaluationDate.getMonth(), 1);
    const endOfMonth = new Date(evaluationDate.getFullYear(), evaluationDate.getMonth() + 1, 0);

    const count = await this.prisma.evaluations.count({
      where: {
        class_id: classId,
        notes: {
          some: {
            subjects: {
              name: {
                equals: subject,
                mode: 'insensitive'
              }
            }
          }
        },
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    return count < 4; // Maximum 4 évaluations par matière par mois
  }

  /**
   * Vérifie si on peut modifier une évaluation finalisée
   */
  private canModifyFinalizedEvaluation(
    data: UpdateEvaluationData, 
    existing: any
  ): boolean {
    if (!existing.isFinalized) return true;

    // Seuls certains champs peuvent être modifiés sur une évaluation finalisée
    const allowedFields = ['description', 'showRanking'];
    const modifiedFields = Object.keys(data).filter(key => 
      data[key as keyof typeof data] !== undefined
    );

    return modifiedFields.every(field => allowedFields.includes(field));
  }

  /**
   * Vérifie l'impact sur les résultats existants
   */
  private async checkExistingResultsImpact(
    data: UpdateEvaluationData,
    existing: any
  ): Promise<boolean> {
    if (!data.maxScore && !data.coefficient && !data.absentHandling) {
      return true; // Pas d'impact sur les calculs
    }

    // Vérifier s'il y a des notes pour cette évaluation
    const hasResults = await this.prisma.notes.count({
      where: { 
        evaluation_id: existing.id,
        OR: [
          { value: { not: null } },
          { is_absent: true }
        ]
      }
    }) > 0;

    return !hasResults; // Warning si il y a déjà des résultats
  }

  /**
   * Valide la cohérence des modifications
   */
  private validateModificationConsistency(
    data: UpdateEvaluationData,
    existing: any
  ): boolean {
    // Vérifier cohérence type/coefficient si les deux sont modifiés
    if (data.type && data.coefficient) {
      return this.validateCoefficientTypeConsistency(data.coefficient, data.type);
    }

    // Vérifier cohérence type/coefficient avec valeurs existantes
    if (data.type && !data.coefficient) {
      return this.validateCoefficientTypeConsistency(existing.coefficient, data.type);
    }

    if (data.coefficient && !data.type) {
      return this.validateCoefficientTypeConsistency(data.coefficient, existing.type);
    }

    return true;
  }

  /**
   * Vérifie qu'un élève appartient à la classe de l'évaluation
   */
  private async isStudentInEvaluationClass(
    studentId: number, 
    evaluationId: number
  ): Promise<boolean> {
    const result = await this.prisma.evaluations.findFirst({
      where: {
        id: evaluationId,
        classes: {
          students: {
            some: {
              id: studentId,
              is_active: true
            }
          }
        }
      }
    });

    return !!result;
  }

  /**
   * Valide la cohérence score/absence
   */
  private validateScoreAbsenceConsistency(
    score: number | undefined, 
    isAbsent: boolean
  ): boolean {
    if (isAbsent && score !== undefined) {
      return false; // Absent ne peut pas avoir de score
    }

    if (!isAbsent && score === undefined) {
      return false; // Présent doit avoir un score
    }

    return true;
  }

  /**
   * Valide que le score est dans les limites
   */
  private validateScoreWithinLimits(
    score: number | undefined, 
    maxScore: number
  ): boolean {
    if (score === undefined) return true;
    return score >= 0 && score <= maxScore;
  }

  /**
   * Détecte les scores suspects pour un élève
   */
  private async detectSuspiciousScore(
    studentId: number,
    score: number | undefined,
    evaluationId: number
  ): Promise<boolean> {
    if (score === undefined) return true;

    // Récupérer les 5 dernières notes de l'élève
    // Récupérer les 5 dernières notes de l'élève via les moyennes
    const recentScores = await this.prisma.moyennes.findMany({
      where: {
        student_id: studentId,
        is_active: true
      },
      include: {
        evaluations: true
      },
      orderBy: {
        evaluations: { date: 'desc' }
      },
      take: 5
    });

    if (recentScores.length < 3) return true; // Pas assez d'historique

    // Normaliser les moyennes sur 20 (la moyenne est déjà calculée)
    const normalizedRecentScores = recentScores.map(result => 
      Number(result.moyenne)
    );

    const currentEvaluation = await this.prisma.evaluations.findUnique({
      where: { id: evaluationId }
    });

    if (!currentEvaluation) return true;

    // Pour les évaluations, on utilise une moyenne estimée sur 20
    const normalizedCurrentScore = score;

    // Calculer la moyenne et l'écart-type des scores précédents
    const average = normalizedRecentScores.reduce((sum, s) => sum + s, 0) / normalizedRecentScores.length;
    const variance = normalizedRecentScores.reduce((sum, s) => sum + Math.pow(s - average, 2), 0) / normalizedRecentScores.length;
    const standardDeviation = Math.sqrt(variance);

    // Score suspect si il dévie de plus de 2 écarts-types
    const deviation = Math.abs(normalizedCurrentScore - average);
    return deviation <= (2 * standardDeviation);
  }

  /**
   * Valide l'unicité des élèves dans un lot
   */
  private validateUniqueStudentsInBulk(
    results: Array<{ studentId: number }>
  ): boolean {
    const studentIds = results.map(r => r.studentId);
    const uniqueIds = new Set(studentIds);
    return uniqueIds.size === studentIds.length;
  }

  /**
   * Valide la cohérence d'un lot de résultats
   */
  private validateBulkResultsConsistency(
    results: Array<{ score?: number; isAbsent: boolean }>,
    maxScore: number
  ): boolean {
    return results.every(result => 
      this.validateScoreAbsenceConsistency(result.score, result.isAbsent) &&
      this.validateScoreWithinLimits(result.score, maxScore)
    );
  }

  /**
   * Détecte les patterns suspects dans un lot
   */
  private detectSuspiciousPatterns(
    results: Array<{ score?: number; isAbsent: boolean }>
  ): boolean {
    const scores = results
      .filter(r => !r.isAbsent && r.score !== undefined)
      .map(r => r.score!);

    if (scores.length < 3) return true;

    // Pattern 1: Tous les scores identiques
    const uniqueScores = new Set(scores);
    if (uniqueScores.size === 1 && scores.length > 5) {
      return false;
    }

    // Pattern 2: Progression arithmétique parfaite
    if (scores.length >= 5) {
      const sortedScores = [...scores].sort((a, b) => a - b);
      const differences = [];
      for (let i = 1; i < sortedScores.length; i++) {
        differences.push(sortedScores[i] - sortedScores[i - 1]);
      }
      const uniqueDifferences = new Set(differences);
      if (uniqueDifferences.size === 1 && differences[0] > 0) {
        return false; // Progression arithmétique parfaite
      }
    }

    return true;
  }

  // ========================================
  // EXÉCUTION DES RÈGLES
  // ========================================

  /**
   * Exécute une liste de règles de validation
   */
  private async executeValidationRules(rules: ValidationRule[]): Promise<void> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of rules) {
      try {
        const isValid = await rule.check();
        if (!isValid) {
          if (rule.level === 'error') {
            errors.push(rule.message);
          } else {
            warnings.push(rule.message);
          }
        }
      } catch (error) {
        console.error(`Erreur lors de l'exécution de la règle ${rule.name}:`, error);
        if (rule.level === 'error') {
          errors.push(`Erreur de validation: ${rule.name}`);
        }
      }
    }

    // Lancer les erreurs bloquantes
    if (errors.length > 0) {
      throw new ValidationError(
        'Erreurs de validation métier détectées',
        errors.map(message => ({ field: 'general', message, code: 'BUSINESS_RULE' }))
      );
    }

    // Logger les warnings (dans un vrai projet: système de logging)
    if (warnings.length > 0) {
      console.warn('[VALIDATION WARNINGS]', warnings);
    }
  }
}
