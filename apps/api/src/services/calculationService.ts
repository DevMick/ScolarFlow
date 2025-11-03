// ========================================
// SERVICE DE CALCUL - MOTEUR MATHÉMATIQUE
// ========================================

import { PrismaClient, Evaluation, EvaluationResult } from '@prisma/client';
import { AbsentHandling, RoundingMethod } from '@edustats/shared';
import { 
  calculateMedian, 
  calculateStandardDeviation, 
  calculatePercentile,
  roundValue,
  roundToDecimals,
  calculateBasicStatistics,
  calculateScoreDistribution,
  convertToScale20,
  calculateSuccessRate,
  detectOutliers,
  generateEvaluationReport
} from '../utils/math';
import { 
  CalculationError, 
  NotFoundError, 
  handleDatabaseOperation 
} from '../utils/errors';

// ========================================
// TYPES POUR LE SERVICE DE CALCUL
// ========================================

interface StudentScore {
  studentId: number;
  student: {
    id: number;
    firstName: string;
    lastName: string;
    studentNumber?: string;
    isActive: boolean;
  };
  score?: number;
  isAbsent: boolean;
  absentReason?: string;
  adjustedScore?: number;
  rank?: number;
  percentile?: number;
  resultId: number;
}

interface RankingResult {
  rank: number;
  studentId: number;
  student: StudentScore['student'];
  score?: number;
  scoreOn20: number;
  isAbsent: boolean;
  isExAequo: boolean;
  exAequoWith?: number[];
  percentile: number;
  resultId: number;
}

interface EvaluationStatistics {
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  completedCount: number;
  averageScore: number;
  averageOn20: number;
  medianScore: number;
  standardDeviation: number;
  minScore: number;
  maxScore: number;
  successRate: number;
  distribution: ReturnType<typeof calculateScoreDistribution>;
  quartiles: { q1: number; q2: number; q3: number };
}

// ========================================
// SERVICE DE CALCUL PRINCIPAL
// ========================================

export class CalculationService {
  constructor(private prisma: PrismaClient) {}

  // ========================================
  // CALCULS STATISTIQUES DE BASE
  // ========================================

  /**
   * Calcule les statistiques de base d'une évaluation
   */
  async calculateBasicStats(evaluationId: number): Promise<{
    completedCount: number;
    averageScore: number;
    averageOn20: number;
    medianScore: number;
    minScore: number;
    maxScore: number;
    standardDeviation: number;
  }> {
    return handleDatabaseOperation(async () => {
      const evaluation = await this.getEvaluationWithResults(evaluationId);
      
      const activeResults = this.getActiveResults(evaluation.results);
      const scores = this.extractValidScores(activeResults);
      
      if (scores.length === 0) {
        return {
          completedCount: 0,
          averageScore: 0,
          averageOn20: 0,
          medianScore: 0,
          minScore: 0,
          maxScore: 0,
          standardDeviation: 0,
        };
      }
      
      const stats = calculateBasicStatistics(scores);
      const maxScore = Number(evaluation.maxScore);
      
      return {
        completedCount: activeResults.filter(r => r.score !== null || r.isAbsent).length,
        averageScore: stats.mean,
        averageOn20: convertToScale20(stats.mean, maxScore),
        medianScore: stats.median,
        minScore: stats.min,
        maxScore: stats.max,
        standardDeviation: stats.standardDeviation,
      };
    }, 'Calcul des statistiques de base');
  }

  /**
   * Calcule les statistiques complètes d'une évaluation
   */
  async calculateFullStatistics(evaluationId: number): Promise<EvaluationStatistics> {
    return handleDatabaseOperation(async () => {
      const evaluation = await this.getEvaluationWithResults(evaluationId);
      
      const activeResults = this.getActiveResults(evaluation.results);
      const presentResults = activeResults.filter(r => !r.isAbsent);
      const absentResults = activeResults.filter(r => r.isAbsent);
      const scores = this.extractValidScores(activeResults);
      
      const maxScore = Number(evaluation.maxScore);
      const stats = calculateBasicStatistics(scores);
      const distribution = calculateScoreDistribution(scores, maxScore);
      const successRate = calculateSuccessRate(scores, 10, maxScore);
      
      return {
        totalStudents: activeResults.length,
        presentStudents: presentResults.length,
        absentStudents: absentResults.length,
        completedCount: activeResults.filter(r => r.score !== null || r.isAbsent).length,
        averageScore: stats.mean,
        averageOn20: convertToScale20(stats.mean, maxScore),
        medianScore: stats.median,
        standardDeviation: stats.standardDeviation,
        minScore: stats.min,
        maxScore: stats.max,
        successRate,
        distribution,
        quartiles: stats.quartiles,
      };
    }, 'Calcul des statistiques complètes');
  }

  // ========================================
  // CALCUL DE CLASSEMENT
  // ========================================

  /**
   * Calcule le classement complet d'une évaluation
   */
  async calculateRanking(evaluationId: number): Promise<RankingResult[]> {
    try {
      const evaluation = await this.getEvaluationWithResults(evaluationId);
      const maxScore = Number(evaluation.maxScore);
      const absentHandling = evaluation.absentHandling as AbsentHandling;
      
      // Préparer les données pour le classement
      const studentScores: StudentScore[] = evaluation.results.map(result => ({
        studentId: result.studentId,
        student: result.student!,
        score: result.score ? Number(result.score) : undefined,
        isAbsent: result.isAbsent,
        absentReason: result.absentReason || undefined,
        resultId: result.id,
      }));
      
      // Calculer les scores ajustés
      const scoresWithAdjustment = await this.calculateAdjustedScores(
        studentScores,
        absentHandling,
        evaluation
      );
      
      // Filtrer et trier pour le classement
      const rankableScores = scoresWithAdjustment
        .filter(s => this.isResultRankable(s, absentHandling))
        .sort((a, b) => (b.adjustedScore || 0) - (a.adjustedScore || 0));
      
      // Attribuer les rangs
      const ranking = this.assignRanks(rankableScores, maxScore);
      
      // Ajouter les non-classés
      const nonRankable = scoresWithAdjustment
        .filter(s => !this.isResultRankable(s, absentHandling))
        .map(s => this.createNonRankedResult(s, maxScore));
      
      return [...ranking, ...nonRankable];
      
    } catch (error) {
      throw new CalculationError(
        'Erreur lors du calcul du classement',
        'RANKING_CALCULATION',
        { evaluationId, error: (error as Error).message }
      );
    }
  }

  /**
   * Calcule les scores ajustés selon la gestion des absents
   */
  private async calculateAdjustedScores(
    studentScores: StudentScore[],
    absentHandling: AbsentHandling,
    evaluation: any
  ): Promise<StudentScore[]> {
    // Calculer la moyenne des présents si nécessaire
    let classAverage: number | null = null;
    if (absentHandling === 'class_average') {
      const presentScores = studentScores
        .filter(s => !s.isAbsent && s.score !== undefined)
        .map(s => s.score!);
      
      if (presentScores.length > 0) {
        classAverage = presentScores.reduce((sum, score) => sum + score, 0) / presentScores.length;
      }
    }
    
    return studentScores.map(studentScore => ({
      ...studentScore,
      adjustedScore: this.getAdjustedScore(studentScore, absentHandling, classAverage)
    }));
  }

  /**
   * Obtient le score ajusté selon la politique de gestion des absents
   */
  private getAdjustedScore(
    result: StudentScore,
    absentHandling: AbsentHandling,
    classAverage?: number | null
  ): number | null {
    if (!result.isAbsent && result.score !== undefined) {
      return result.score;
    }
    
    if (!result.isAbsent) {
      return null; // Pas de note et pas absent = pas de score
    }
    
    // Élève absent - appliquer la politique
    switch (absentHandling) {
      case 'zero_score':
        return 0;
        
      case 'class_average':
        return classAverage || null;
        
      case 'proportional_bonus':
        // TODO: Implémenter bonus proportionnel basé sur autres évaluations
        return null;
        
      case 'exclude_from_ranking':
      case 'manual_decision':
      default:
        return null;
    }
  }

  /**
   * Détermine si un résultat peut être classé
   */
  private isResultRankable(result: StudentScore, absentHandling: AbsentHandling): boolean {
    // Élève inactif = pas classé
    if (!result.student.isActive) return false;
    
    // A un score valide = classé
    if (result.adjustedScore !== null && result.adjustedScore !== undefined) {
      return true;
    }
    
    // Absent avec certaines politiques = pas classé
    if (result.isAbsent) {
      return absentHandling === 'zero_score' || absentHandling === 'class_average';
    }
    
    return false;
  }

  /**
   * Attribue les rangs aux scores classables
   */
  private assignRanks(rankableScores: StudentScore[], maxScore: number): RankingResult[] {
    const ranking: RankingResult[] = [];
    let currentRank = 1;
    
    for (let i = 0; i < rankableScores.length; i++) {
      const current = rankableScores[i];
      const scoreOn20 = convertToScale20(current.adjustedScore || 0, maxScore);
      
      // Détecter ex-aequo
      const { isExAequo, exAequoWith } = this.detectExAequo(
        current,
        rankableScores,
        i
      );
      
      // Calculer percentile
      const percentile = ((rankableScores.length - currentRank + 1) / rankableScores.length) * 100;
      
      ranking.push({
        rank: currentRank,
        studentId: current.studentId,
        student: current.student,
        score: current.score,
        scoreOn20: roundToDecimals(scoreOn20, 2),
        isAbsent: current.isAbsent,
        isExAequo,
        exAequoWith: exAequoWith.length > 0 ? exAequoWith : undefined,
        percentile: roundToDecimals(percentile, 1),
        resultId: current.resultId,
      });
      
      // Incrémenter le rang seulement si pas d'ex-aequo suivant
      if (i === rankableScores.length - 1 || 
          rankableScores[i + 1].adjustedScore !== current.adjustedScore) {
        currentRank = i + 2;
      }
    }
    
    return ranking;
  }

  /**
   * Détecte les ex-aequo pour un score donné
   */
  private detectExAequo(
    current: StudentScore,
    allScores: StudentScore[],
    currentIndex: number
  ): { isExAequo: boolean; exAequoWith: number[] } {
    const exAequoWith: number[] = [];
    const currentScore = current.adjustedScore;
    
    if (currentScore === null || currentScore === undefined) {
      return { isExAequo: false, exAequoWith: [] };
    }
    
    // Chercher les ex-aequo avant et après
    for (let j = 0; j < allScores.length; j++) {
      if (j !== currentIndex && allScores[j].adjustedScore === currentScore) {
        exAequoWith.push(allScores[j].studentId);
      }
    }
    
    return {
      isExAequo: exAequoWith.length > 0,
      exAequoWith
    };
  }

  /**
   * Crée un résultat pour les non-classés
   */
  private createNonRankedResult(score: StudentScore, maxScore: number): RankingResult {
    const scoreOn20 = score.adjustedScore 
      ? convertToScale20(score.adjustedScore, maxScore)
      : 0;
    
    return {
      rank: 0, // Pas de rang
      studentId: score.studentId,
      student: score.student,
      score: score.score,
      scoreOn20: roundToDecimals(scoreOn20, 2),
      isAbsent: score.isAbsent,
      isExAequo: false,
      percentile: 0,
      resultId: score.resultId,
    };
  }

  // ========================================
  // RECALCUL ET MISE À JOUR
  // ========================================

  /**
   * Recalcule et met à jour tous les rangs d'une évaluation
   */
  async recalculateEvaluation(evaluationId: number, tx?: any): Promise<void> {
    const prisma = tx || this.prisma;
    
    try {
      // 1. Calculer le nouveau classement
      const ranking = await this.calculateRanking(evaluationId);
      
      // 2. Mettre à jour les rangs en base de données
      const updatePromises = ranking.map(rank => 
        prisma.evaluationResult.update({
          where: { id: rank.resultId },
          data: {
            rank: rank.rank || null,
            percentile: rank.percentile || null,
          }
        })
      );
      
      await Promise.all(updatePromises);
      
    } catch (error) {
      throw new CalculationError(
        'Erreur lors du recalcul de l\'évaluation',
        'RECALCULATION',
        { evaluationId, error: (error as Error).message }
      );
    }
  }

  /**
   * Effectue tous les calculs finaux lors de la finalisation
   */
  async calculateFinalResults(evaluationId: number, tx?: any): Promise<void> {
    const prisma = tx || this.prisma;
    
    try {
      // 1. Recalculer le classement
      await this.recalculateEvaluation(evaluationId, prisma);
      
      // 2. Appliquer la méthode d'arrondi si nécessaire
      await this.applyRoundingMethod(evaluationId, prisma);
      
      // 3. Calculer les statistiques finales (pour cache)
      const stats = await this.calculateFullStatistics(evaluationId);
      
      // 4. Détecter les anomalies
      await this.detectAnomalies(evaluationId, stats);
      
    } catch (error) {
      throw new CalculationError(
        'Erreur lors des calculs finaux',
        'FINAL_CALCULATIONS',
        { evaluationId, error: (error as Error).message }
      );
    }
  }

  /**
   * Applique la méthode d'arrondi aux scores
   */
  private async applyRoundingMethod(evaluationId: number, tx: any): Promise<void> {
    const evaluation = await tx.evaluation.findUnique({
      where: { id: evaluationId },
      include: { results: true }
    });
    
    if (!evaluation) return;
    
    const roundingMethod = evaluation.roundingMethod as RoundingMethod;
    if (roundingMethod === 'none') return;
    
    const updatePromises = evaluation.results.map(result => {
      if (result.score === null) return Promise.resolve();
      
      const roundedScore = roundValue(Number(result.score), roundingMethod);
      
      return tx.evaluationResult.update({
        where: { id: result.id },
        data: { score: roundedScore }
      });
    });
    
    await Promise.all(updatePromises.filter(p => p !== null));
  }

  /**
   * Détecte les anomalies dans les résultats
   */
  private async detectAnomalies(
    evaluationId: number, 
    stats: EvaluationStatistics
  ): Promise<void> {
    const anomalies: string[] = [];
    
    // Moyenne très faible
    if (stats.averageOn20 < 5) {
      anomalies.push('Moyenne de classe très faible (< 5/20)');
    }
    
    // Moyenne très élevée
    if (stats.averageOn20 > 18) {
      anomalies.push('Moyenne de classe très élevée (> 18/20)');
    }
    
    // Écart-type très faible (pas de discrimination)
    if (stats.standardDeviation < 1) {
      anomalies.push('Écart-type très faible - évaluation peu discriminante');
    }
    
    // Taux d'absence élevé
    const absentRate = (stats.absentStudents / stats.totalStudents) * 100;
    if (absentRate > 30) {
      anomalies.push(`Taux d'absence élevé (${roundToDecimals(absentRate, 1)}%)`);
    }
    
    // Log des anomalies (dans un vrai projet, on utiliserait un système de logging)
    if (anomalies.length > 0) {
      console.warn(`[ANOMALIES] Évaluation ${evaluationId}:`, anomalies);
    }
  }

  // ========================================
  // GÉNÉRATION DE RAPPORTS
  // ========================================

  /**
   * Génère un rapport complet d'évaluation
   */
  async generateEvaluationReport(evaluationId: number): Promise<ReturnType<typeof generateEvaluationReport>> {
    return handleDatabaseOperation(async () => {
      const evaluation = await this.getEvaluationWithResults(evaluationId);
      const activeResults = this.getActiveResults(evaluation.results);
      const scores = this.extractValidScores(activeResults);
      const maxScore = Number(evaluation.maxScore);
      const absentCount = activeResults.filter(r => r.isAbsent).length;
      
      return generateEvaluationReport(scores, maxScore, absentCount);
    }, 'Génération du rapport d\'évaluation');
  }

  // ========================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ========================================

  /**
   * Récupère une évaluation avec ses résultats
   */
  private async getEvaluationWithResults(evaluationId: number) {
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        results: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentNumber: true,
                isActive: true
              }
            }
          }
        }
      }
    });

    if (!evaluation) {
      throw new NotFoundError('Évaluation', evaluationId);
    }

    return evaluation;
  }

  /**
   * Filtre les résultats des élèves actifs
   */
  private getActiveResults(results: any[]): any[] {
    return results.filter(result => result.student.isActive);
  }

  /**
   * Extrait les scores valides (non null, élèves présents)
   */
  private extractValidScores(results: any[]): number[] {
    return results
      .filter(result => !result.isAbsent && result.score !== null)
      .map(result => Number(result.score));
  }

  /**
   * Valide qu'une évaluation peut être calculée
   */
  private validateEvaluationForCalculation(evaluation: any): void {
    if (!evaluation) {
      throw new CalculationError('Évaluation non trouvée pour calcul');
    }
    
    if (Number(evaluation.maxScore) <= 0) {
      throw new CalculationError('Note maximale invalide pour les calculs');
    }
  }

  // ========================================
  // STATISTIQUES COMPLÈTES
  // ========================================

  async calculateFullStatistics(evaluationId: number): Promise<{
    totalStudents: number;
    completedCount: number;
    absentStudents: number;
    averageScore: number;
    averageOn20: number;
    median: number;
    standardDeviation: number;
    successRate: number;
    quartiles: { q1: number; q2: number; q3: number };
    distribution: Array<{ range: string; count: number; percentage: number }>;
    outliers: number[];
  }> {
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        results: {
          include: { student: true },
          where: { student: { isActive: true } }
        }
      }
    });

    if (!evaluation) {
      throw new CalculationError('Évaluation non trouvée');
    }

    const activeResults = evaluation.results.filter(r => r.student.isActive);
    const totalStudents = activeResults.length;
    const absentStudents = activeResults.filter(r => r.isAbsent).length;
    const completed = activeResults.filter(r => r.score !== null || r.isAbsent);
    const scores = activeResults
      .filter(r => !r.isAbsent && r.score !== null)
      .map(r => Number(r.score!));

    // Calculs de base
    const averageScore = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0;

    const averageOn20 = (averageScore / Number(evaluation.maxScore)) * 20;
    const median = calculateMedian(scores);
    const standardDeviation = calculateStandardDeviation(scores);

    // Calculs des quartiles
    const quartiles = this.calculateQuartilesInternal(scores);

    // Taux de réussite (supposons que 10/20 = réussite)
    const successThreshold = Number(evaluation.maxScore) * 0.5;
    const successCount = scores.filter(s => s >= successThreshold).length;
    const successRate = scores.length > 0 ? (successCount / scores.length) * 100 : 0;

    // Distribution par tranches
    const distribution = this.calculateDistribution(scores, Number(evaluation.maxScore));

    // Détection des outliers
    const outliers = this.detectOutliersInternal(scores);

    return {
      totalStudents,
      completedCount: completed.length,
      absentStudents,
      averageScore: this.roundToDecimals(averageScore, 2),
      averageOn20: this.roundToDecimals(averageOn20, 2),
      median: this.roundToDecimals(median, 2),
      standardDeviation: this.roundToDecimals(standardDeviation, 2),
      successRate: this.roundToDecimals(successRate, 1),
      quartiles: {
        q1: this.roundToDecimals(quartiles.q1, 2),
        q2: this.roundToDecimals(quartiles.q2, 2),
        q3: this.roundToDecimals(quartiles.q3, 2)
      },
      distribution,
      outliers
    };
  }

  // ========================================
  // GÉNÉRATION DE RAPPORT
  // ========================================

  async generateEvaluationReport(evaluationId: number): Promise<{
    overview: {
      totalStudents: number;
      completedCount: number;
      absentStudents: number;
      averageScore: number;
      successRate: number;
    };
    performance: {
      ranking: any[];
      topPerformers: any[];
      strugglingStudents: any[];
    };
    analysis: {
      distribution: any[];
      quartiles: any;
      outliers: number[];
      recommendations: string[];
    };
  }> {
    const stats = await this.calculateFullStatistics(evaluationId);
    const ranking = await this.calculateRanking(evaluationId);

    // Top performers (top 20%)
    const rankedStudents = ranking.filter(r => r.rank > 0);
    const topCount = Math.ceil(rankedStudents.length * 0.2);
    const topPerformers = rankedStudents.slice(0, topCount);

    // Struggling students (bottom 20%)
    const bottomCount = Math.ceil(rankedStudents.length * 0.2);
    const strugglingStudents = rankedStudents.slice(-bottomCount);

    // Recommandations basées sur les statistiques
    const recommendations = this.generateRecommendations(stats);

    return {
      overview: {
        totalStudents: stats.totalStudents,
        completedCount: stats.completedCount,
        absentStudents: stats.absentStudents,
        averageScore: stats.averageScore,
        successRate: stats.successRate
      },
      performance: {
        ranking,
        topPerformers,
        strugglingStudents
      },
      analysis: {
        distribution: stats.distribution,
        quartiles: stats.quartiles,
        outliers: stats.outliers,
        recommendations
      }
    };
  }

  // ========================================
  // MÉTHODES UTILITAIRES PRIVÉES ÉTENDUES
  // ========================================

  private calculateQuartilesInternal(numbers: number[]): { q1: number; q2: number; q3: number } {
    if (numbers.length === 0) {
      return { q1: 0, q2: 0, q3: 0 };
    }

    const sorted = [...numbers].sort((a, b) => a - b);
    const n = sorted.length;

    const getMedian = (arr: number[]) => {
      const mid = Math.floor(arr.length / 2);
      return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
    };

    const q2 = getMedian(sorted); // Médiane

    const lowerHalf = sorted.slice(0, Math.floor(n / 2));
    const upperHalf = sorted.slice(Math.ceil(n / 2), n);

    const q1 = getMedian(lowerHalf);
    const q3 = getMedian(upperHalf);

    return { q1, q2, q3 };
  }

  private calculateDistribution(scores: number[], maxScore: number): Array<{
    range: string;
    count: number;
    percentage: number;
  }> {
    if (scores.length === 0) {
      return [];
    }

    // Créer 5 tranches de performance
    const binSize = maxScore / 5;
    const bins = [
      { min: 0, max: binSize, range: `0-${Math.round(binSize)}` },
      { min: binSize, max: binSize * 2, range: `${Math.round(binSize + 1)}-${Math.round(binSize * 2)}` },
      { min: binSize * 2, max: binSize * 3, range: `${Math.round(binSize * 2 + 1)}-${Math.round(binSize * 3)}` },
      { min: binSize * 3, max: binSize * 4, range: `${Math.round(binSize * 3 + 1)}-${Math.round(binSize * 4)}` },
      { min: binSize * 4, max: maxScore, range: `${Math.round(binSize * 4 + 1)}-${maxScore}` }
    ];

    return bins.map(bin => {
      const count = scores.filter(score => 
        score >= bin.min && score <= bin.max
      ).length;
      
      const percentage = (count / scores.length) * 100;
      
      return {
        range: bin.range,
        count,
        percentage: this.roundToDecimals(percentage, 1)
      };
    });
  }

  private detectOutliersInternal(numbers: number[]): number[] {
    if (numbers.length < 4) {
      return [];
    }

    const { q1, q3 } = this.calculateQuartilesInternal(numbers);
    const iqr = q3 - q1;

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return numbers.filter(num => num < lowerBound || num > upperBound);
  }

  private generateRecommendations(stats: any): string[] {
    const recommendations = [];

    // Recommandations basées sur la moyenne
    if (stats.averageOn20 < 8) {
      recommendations.push('Moyenne faible : revoir les méthodes pédagogiques et ajuster la difficulté');
    } else if (stats.averageOn20 > 16) {
      recommendations.push('Moyenne élevée : considérer augmenter la difficulté pour mieux différencier');
    }

    // Recommandations basées sur l'écart-type
    if (stats.standardDeviation < 2) {
      recommendations.push('Faible discrimination : diversifier les types de questions pour mieux différencier les niveaux');
    } else if (stats.standardDeviation > 5) {
      recommendations.push('Forte dispersion : vérifier la cohérence de l\'évaluation et identifier les élèves en difficulté');
    }

    // Recommandations basées sur le taux d'absence
    const absentRate = (stats.absentStudents / stats.totalStudents) * 100;
    if (absentRate > 20) {
      recommendations.push('Taux d\'absence élevé : planifier une session de rattrapage');
    }

    // Recommandations basées sur le taux de réussite
    if (stats.successRate < 50) {
      recommendations.push('Taux de réussite faible : prévoir du soutien supplémentaire pour la classe');
    }

    // Recommandations sur les outliers
    if (stats.outliers.length > 0) {
      recommendations.push(`${stats.outliers.length} score(s) aberrant(s) détecté(s) : vérifier ces résultats individuellement`);
    }

    // Recommandation par défaut
    if (recommendations.length === 0) {
      recommendations.push('Résultats dans la norme : maintenir les méthodes pédagogiques actuelles');
    }

    return recommendations;
  }

  private roundToDecimals(value: number, decimals: number): number {
    return parseFloat(value.toFixed(decimals));
  }
}
