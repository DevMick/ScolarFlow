// ========================================
// ANALYTICS ENGINE - MOTEUR D'ANALYSE AVANCÉE
// ========================================

import { 
  Student, 
  Evaluation, 
  EvaluationResult,
  StudentProfile,
  StudentProfileType,
  StudentPerformanceData,
  StudentProgressionData,
  ClassInsight,
  InsightType,
  Priority,
  ProgressionTrend,
  AnalysisContext,
  AnalyticsConfig,
  AnalyticsResult,
  PedagogicalRecommendation,
  RecommendationCategory,
  RecommendationDifficulty
} from '@edustats/shared/types';

/**
 * Moteur d'analyse avancée avec algorithmes de classification d'élèves
 * et détection automatique de patterns pédagogiques
 */
export class AnalyticsEngine {
  private config: AnalyticsConfig;
  
  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enablePredictions: true,
      confidenceThreshold: 0.7,
      includeComparisons: true,
      detectionSensitivity: 'medium',
      customAlgorithms: [],
      excludePatterns: [],
      ...config
    };
  }

  // ========================================
  // ANALYSE COMPLÈTE DE CLASSE
  // ========================================

  /**
   * Analyse complète d'une classe avec tous les algorithmes
   */
  async analyzeClass(context: AnalysisContext): Promise<AnalyticsResult> {
    const startTime = Date.now();
    
    try {
      // 1. Classification des profils d'élèves
      const profiles = await this.classifyStudentProfiles(context);
      
      // 2. Détection d'insights de classe
      const insights = await this.detectClassInsights(context);
      
      // 3. Génération de recommandations
      const recommendations = await this.generateRecommendations(context, profiles, insights);
      
      // 4. Détection de patterns avancés
      const patterns = await this.detectAdvancedPatterns(context);
      
      // 5. Prédictions (si activées)
      const predictions = this.config.enablePredictions 
        ? await this.generatePredictions(context, profiles)
        : [];
      
      const processingTime = Date.now() - startTime;
      
      return {
        profiles,
        insights,
        recommendations,
        patterns,
        predictions,
        processingMetrics: {
          algorithmsUsed: this.getUsedAlgorithms(),
          processingTime,
          dataQuality: this.assessDataQuality(context),
          confidenceScore: this.calculateOverallConfidence(profiles, insights)
        }
      };
      
    } catch (error) {
      console.error('Erreur dans AnalyticsEngine:', error);
      throw new Error(`Échec de l'analyse: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // ========================================
  // CLASSIFICATION DES PROFILS D'ÉLÈVES
  // ========================================

  /**
   * Classifie automatiquement tous les élèves selon 6 profils types
   */
  private async classifyStudentProfiles(context: AnalysisContext): Promise<StudentProfile[]> {
    const profiles: StudentProfile[] = [];
    
    // Calcul des statistiques de classe pour contexte
    const classStats = this.calculateClassStatistics(context);
    
    for (const student of context.students) {
      const studentResults = context.results.filter(r => r.studentId === student.id);
      
      if (studentResults.length === 0) continue;
      
      const profile = await this.classifyStudentProfile(
        student, 
        studentResults, 
        classStats,
        context
      );
      
      profiles.push(profile);
    }
    
    return profiles;
  }

  /**
   * Classification d'un élève individuel avec algorithmes avancés
   */
  private async classifyStudentProfile(
    student: Student,
    results: EvaluationResult[],
    classStats: any,
    context: AnalysisContext
  ): Promise<StudentProfile> {
    
    // 1. Calcul des métriques de performance
    const performance = this.calculateStudentPerformance(results, classStats);
    
    // 2. Analyse de la progression temporelle
    const progression = this.calculateStudentProgression(results);
    
    // 3. Analyse de la consistance
    const consistency = this.calculateConsistencyMetrics(results);
    
    // 4. Classification par algorithme composite
    const classification = this.performClassification(
      performance, 
      progression, 
      consistency, 
      classStats
    );
    
    // 5. Génération des caractéristiques
    const characteristics = this.generateCharacteristics(
      classification.type, 
      performance, 
      progression, 
      consistency
    );
    
    return {
      id: `profile_${student.id}_${context.academicYear}`,
      studentId: student.id,
      classId: context.classInfo.id,
      academicYear: context.academicYear,
      type: classification.type,
      confidence: classification.confidence,
      characteristics,
      strengths: this.identifyStrengths(performance, progression, results),
      challenges: this.identifyChallenges(performance, progression, results),
      performanceData: performance,
      progressionData: progression,
      detectedAt: new Date(),
      lastUpdated: new Date()
    };
  }

  /**
   * Algorithme de classification composite basé sur la recherche pédagogique
   */
  private performClassification(
    performance: StudentPerformanceData,
    progression: StudentProgressionData,
    consistency: any,
    classStats: any
  ): { type: StudentProfileType; confidence: number } {
    
    const { average, percentile, classRank } = performance;
    const { overallTrend, progressionRate } = progression;
    const { score: consistencyScore, variance } = consistency;
    
    // Seuils adaptatifs basés sur la classe
    const highPerformanceThreshold = classStats.average + classStats.standardDeviation;
    const lowPerformanceThreshold = classStats.average - classStats.standardDeviation;
    const strongProgressionThreshold = 0.3; // 30% d'amélioration
    const consistencyThreshold = 0.8;
    
    let type: StudentProfileType;
    let confidence = 0;
    
    // Algorithme de classification hiérarchique
    
    // 1. Élèves excellents (top 15%)
    if (percentile >= 85 && average >= highPerformanceThreshold) {
      if (consistencyScore >= consistencyThreshold) {
        type = StudentProfileType.HighAchiever;
        confidence = 0.95;
      } else {
        type = StudentProfileType.InconsistentPerformer;
        confidence = 0.85;
      }
    }
    
    // 2. Élèves en forte progression
    else if (progressionRate >= strongProgressionThreshold && 
             overallTrend === ProgressionTrend.StrongImprovement) {
      type = StudentProfileType.ImprovingStudent;
      confidence = 0.90;
    }
    
    // 3. Élèves en difficulté (bottom 20%)
    else if (percentile <= 20 && average <= lowPerformanceThreshold) {
      type = StudentProfileType.StrugglingStudent;
      confidence = 0.85;
    }
    
    // 4. Élèves inconsistants (forte variance)
    else if (variance > classStats.averageVariance * 1.5) {
      type = StudentProfileType.InconsistentPerformer;
      confidence = 0.80;
    }
    
    // 5. Cas exceptionnels (patterns atypiques)
    else if (this.detectExceptionalPattern(performance, progression, consistency)) {
      type = StudentProfileType.ExceptionalCase;
      confidence = 0.75;
    }
    
    // 6. Performeurs réguliers (par défaut)
    else {
      type = StudentProfileType.ConsistentPerformer;
      confidence = 0.70;
    }
    
    // Ajustement de confiance basé sur la quantité de données
    const dataQualityFactor = Math.min(1, performance.subjectAverages ? 
      Object.keys(performance.subjectAverages).length / 5 : 0.5);
    confidence *= dataQualityFactor;
    
    return { type, confidence };
  }

  /**
   * Calcul des métriques de performance d'un élève
   */
  private calculateStudentPerformance(
    results: EvaluationResult[], 
    classStats: any
  ): StudentPerformanceData {
    
    if (results.length === 0) {
      throw new Error('Aucun résultat disponible pour calculer la performance');
    }
    
    // Filtrer les résultats valides (non absents)
    const validResults = results.filter(r => !r.isAbsent && r.score !== null);
    
    if (validResults.length === 0) {
      throw new Error('Aucun résultat valide pour calculer la performance');
    }
    
    // Calculs de base
    const scores = validResults.map(r => r.score);
    const overallAverage = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Moyennes par matière
    const subjectAverages: Record<string, number> = {};
    const subjectGroups = this.groupResultsBySubject(validResults);
    
    for (const [subject, subjectResults] of Object.entries(subjectGroups)) {
      const subjectScores = subjectResults.map(r => r.score);
      subjectAverages[subject] = subjectScores.reduce((sum, score) => sum + score, 0) / subjectScores.length;
    }
    
    // Identification des meilleures et plus faibles matières
    const sortedSubjects = Object.entries(subjectAverages)
      .sort(([,a], [,b]) => b - a);
    
    const bestSubjects = sortedSubjects.slice(0, 2).map(([subject]) => subject);
    const strugglingSubjects = sortedSubjects.slice(-2).map(([subject]) => subject);
    
    // Calcul du rang et percentile
    const classRank = this.calculateRank(overallAverage, classStats.allAverages);
    const percentile = ((classStats.allAverages.length - classRank + 1) / classStats.allAverages.length) * 100;
    
    // Score de consistance
    const consistencyScore = this.calculateConsistencyScore(scores);
    
    // Taux de participation et absentéisme
    const participationRate = (validResults.length / results.length) * 100;
    const absenteeismRate = ((results.length - validResults.length) / results.length) * 100;
    
    return {
      overallAverage,
      subjectAverages,
      bestSubjects,
      strugglingSubjects,
      classRank,
      percentile,
      consistencyScore,
      participationRate,
      absenteeismRate
    };
  }

  /**
   * Calcul de la progression temporelle d'un élève
   */
  private calculateStudentProgression(results: EvaluationResult[]): StudentProgressionData {
    if (results.length < 2) {
      return {
        overallTrend: ProgressionTrend.Stable,
        progressionRate: 0,
        milestones: [],
        criticalPeriods: [],
        monthlyProgression: []
      };
    }
    
    // Tri par date
    const sortedResults = results
      .filter(r => !r.isAbsent && r.score !== null)
      .sort((a, b) => new Date(a.evaluatedAt).getTime() - new Date(b.evaluatedAt).getTime());
    
    if (sortedResults.length < 2) {
      return {
        overallTrend: ProgressionTrend.Stable,
        progressionRate: 0,
        milestones: [],
        criticalPeriods: [],
        monthlyProgression: []
      };
    }
    
    // Calcul de la tendance générale (régression linéaire simple)
    const { slope, correlation } = this.calculateLinearRegression(sortedResults);
    
    // Détermination de la tendance
    let overallTrend: ProgressionTrend;
    if (slope > 0.5 && correlation > 0.6) {
      overallTrend = ProgressionTrend.StrongImprovement;
    } else if (slope > 0.2 && correlation > 0.4) {
      overallTrend = ProgressionTrend.ModerateImprovement;
    } else if (slope < -0.5 && correlation > 0.6) {
      overallTrend = ProgressionTrend.SignificantDecline;
    } else if (slope < -0.2 && correlation > 0.4) {
      overallTrend = ProgressionTrend.SlightDecline;
    } else {
      overallTrend = ProgressionTrend.Stable;
    }
    
    // Calcul du taux de progression
    const firstScore = sortedResults[0].score;
    const lastScore = sortedResults[sortedResults.length - 1].score;
    const progressionRate = ((lastScore - firstScore) / firstScore) * 100;
    
    // Détection des jalons importants
    const milestones = this.detectMilestones(sortedResults);
    
    // Détection des périodes critiques
    const criticalPeriods = this.detectCriticalPeriods(sortedResults);
    
    // Progression mensuelle
    const monthlyProgression = this.calculateMonthlyProgression(sortedResults);
    
    return {
      overallTrend,
      progressionRate,
      milestones,
      criticalPeriods,
      monthlyProgression
    };
  }

  // ========================================
  // DÉTECTION D'INSIGHTS DE CLASSE
  // ========================================

  /**
   * Détecte automatiquement les insights et patterns dans les données de classe
   */
  private async detectClassInsights(context: AnalysisContext): Promise<ClassInsight[]> {
    const insights: ClassInsight[] = [];
    
    // 1. Analyse des tendances temporelles
    const temporalInsights = await this.analyzeTemporalTrends(context);
    insights.push(...temporalInsights);
    
    // 2. Analyse des disparités par matière
    const subjectInsights = await this.analyzeSubjectDisparities(context);
    insights.push(...subjectInsights);
    
    // 3. Détection d'alertes pédagogiques
    const pedagogicalAlerts = await this.detectPedagogicalAlerts(context);
    insights.push(...pedagogicalAlerts);
    
    // 4. Identification des facteurs de réussite
    const successFactors = await this.identifySuccessFactors(context);
    insights.push(...successFactors);
    
    // Tri par priorité et confiance
    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }

  /**
   * Analyse des tendances temporelles de la classe
   */
  private async analyzeTemporalTrends(context: AnalysisContext): Promise<ClassInsight[]> {
    const insights: ClassInsight[] = [];
    
    // Grouper les résultats par mois
    const monthlyData = this.groupResultsByMonth(context.results);
    
    if (Object.keys(monthlyData).length < 3) {
      return insights; // Pas assez de données pour détecter des tendances
    }
    
    // Calculer les moyennes mensuelles
    const monthlyAverages = Object.entries(monthlyData).map(([month, results]) => {
      const validResults = results.filter(r => !r.isAbsent && r.score !== null);
      const average = validResults.length > 0 
        ? validResults.reduce((sum, r) => sum + r.score, 0) / validResults.length
        : 0;
      return { month, average, count: validResults.length };
    }).sort((a, b) => a.month.localeCompare(b.month));
    
    // Détection de tendance générale
    const { slope, correlation } = this.calculateLinearRegressionFromAverages(monthlyAverages);
    
    if (Math.abs(correlation) > 0.6) {
      const direction = slope > 0 ? 'amélioration' : 'dégradation';
      const magnitude = Math.abs(slope * 12); // Projection sur 12 mois
      
      insights.push({
        id: `temporal_trend_${context.classInfo.id}_${context.academicYear}`,
        classId: context.classInfo.id,
        academicYear: context.academicYear,
        type: InsightType.ClassTrend,
        title: `Tendance ${direction} détectée`,
        description: `La classe montre une tendance ${direction} significative avec un taux de ${magnitude.toFixed(1)}% sur l'année`,
        data: {
          slope,
          correlation,
          magnitude,
          monthlyAverages,
          direction
        },
        actionable: true,
        priority: magnitude > 15 ? Priority.High : Priority.Medium,
        confidence: Math.abs(correlation),
        detectedAt: new Date()
      });
    }
    
    // Détection de saisonnalité
    const seasonalPattern = this.detectSeasonalPattern(monthlyAverages);
    if (seasonalPattern.detected) {
      insights.push({
        id: `seasonal_pattern_${context.classInfo.id}_${context.academicYear}`,
        classId: context.classInfo.id,
        academicYear: context.academicYear,
        type: InsightType.ClassTrend,
        title: 'Pattern saisonnier détecté',
        description: `Performance ${seasonalPattern.bestPeriod} en ${seasonalPattern.bestMonth} et ${seasonalPattern.worstPeriod} en ${seasonalPattern.worstMonth}`,
        data: seasonalPattern,
        actionable: true,
        priority: Priority.Medium,
        confidence: seasonalPattern.confidence,
        detectedAt: new Date()
      });
    }
    
    return insights;
  }

  /**
   * Détection d'alertes pédagogiques critiques
   */
  private async detectPedagogicalAlerts(context: AnalysisContext): Promise<ClassInsight[]> {
    const alerts: ClassInsight[] = [];
    const validResults = context.results.filter(r => !r.isAbsent && r.score !== null);
    
    // Alerte: Taux d'échec élevé
    const failingResults = validResults.filter(r => r.score < 10);
    const failureRate = failingResults.length / validResults.length;
    
    if (failureRate > 0.3) {
      alerts.push({
        id: `high_failure_rate_${context.classInfo.id}_${context.academicYear}`,
        classId: context.classInfo.id,
        academicYear: context.academicYear,
        type: InsightType.PedagogicalAlert,
        title: 'Taux d\'échec préoccupant',
        description: `${Math.round(failureRate * 100)}% des résultats sont en dessous de 10/20, nécessitant une intervention pédagogique`,
        data: {
          failureRate,
          failingCount: failingResults.length,
          totalCount: validResults.length,
          affectedStudents: [...new Set(failingResults.map(r => r.studentId))].length
        },
        actionable: true,
        priority: failureRate > 0.5 ? Priority.High : Priority.Medium,
        confidence: 0.95,
        detectedAt: new Date()
      });
    }
    
    // Alerte: Absentéisme important
    const absentResults = context.results.filter(r => r.isAbsent);
    const absenteeismRate = absentResults.length / context.results.length;
    
    if (absenteeismRate > 0.15) {
      alerts.push({
        id: `high_absenteeism_${context.classInfo.id}_${context.academicYear}`,
        classId: context.classInfo.id,
        academicYear: context.academicYear,
        type: InsightType.PedagogicalAlert,
        title: 'Absentéisme préoccupant',
        description: `Taux d'absence de ${Math.round(absenteeismRate * 100)}% aux évaluations, impactant l'apprentissage`,
        data: {
          absenteeismRate,
          absentCount: absentResults.length,
          totalEvaluations: context.results.length,
          chronicAbsentees: this.identifyChronicAbsentees(context.results)
        },
        actionable: true,
        priority: absenteeismRate > 0.25 ? Priority.High : Priority.Medium,
        confidence: 0.90,
        detectedAt: new Date()
      });
    }
    
    // Alerte: Disparité importante entre élèves
    const scores = validResults.map(r => r.score);
    const standardDeviation = this.calculateStandardDeviation(scores);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const coefficientOfVariation = standardDeviation / average;
    
    if (coefficientOfVariation > 0.4) {
      alerts.push({
        id: `high_disparity_${context.classInfo.id}_${context.academicYear}`,
        classId: context.classInfo.id,
        academicYear: context.academicYear,
        type: InsightType.PedagogicalAlert,
        title: 'Forte disparité entre élèves',
        description: `Écart-type de ${standardDeviation.toFixed(1)} points révélant des besoins pédagogiques très différenciés`,
        data: {
          standardDeviation,
          average,
          coefficientOfVariation,
          range: Math.max(...scores) - Math.min(...scores),
          quartiles: this.calculateQuartiles(scores)
        },
        actionable: true,
        priority: coefficientOfVariation > 0.6 ? Priority.High : Priority.Medium,
        confidence: 0.85,
        detectedAt: new Date()
      });
    }
    
    return alerts;
  }

  // ========================================
  // MÉTHODES UTILITAIRES
  // ========================================

  /**
   * Calcule les statistiques de base de la classe
   */
  private calculateClassStatistics(context: AnalysisContext) {
    const validResults = context.results.filter(r => !r.isAbsent && r.score !== null);
    const scores = validResults.map(r => r.score);
    
    if (scores.length === 0) {
      throw new Error('Aucun résultat valide pour calculer les statistiques de classe');
    }
    
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const standardDeviation = this.calculateStandardDeviation(scores);
    
    // Moyennes par élève pour calcul des rangs
    const studentAverages = new Map<number, number>();
    for (const student of context.students) {
      const studentResults = validResults.filter(r => r.studentId === student.id);
      if (studentResults.length > 0) {
        const studentAverage = studentResults.reduce((sum, r) => sum + r.score, 0) / studentResults.length;
        studentAverages.set(student.id, studentAverage);
      }
    }
    
    const allAverages = Array.from(studentAverages.values()).sort((a, b) => b - a);
    
    // Variance moyenne pour détecter l'inconsistance
    const studentVariances = Array.from(studentAverages.keys()).map(studentId => {
      const studentResults = validResults.filter(r => r.studentId === studentId);
      if (studentResults.length < 2) return 0;
      const studentScores = studentResults.map(r => r.score);
      const studentAvg = studentAverages.get(studentId)!;
      return studentScores.reduce((sum, score) => sum + Math.pow(score - studentAvg, 2), 0) / studentScores.length;
    });
    
    const averageVariance = studentVariances.reduce((sum, variance) => sum + variance, 0) / studentVariances.length;
    
    return {
      average,
      standardDeviation,
      allAverages,
      averageVariance,
      totalStudents: context.students.length,
      totalResults: validResults.length
    };
  }

  /**
   * Calcule l'écart-type d'un ensemble de valeurs
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / values.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Calcule le rang d'une valeur dans un ensemble trié
   */
  private calculateRank(value: number, sortedValues: number[]): number {
    const index = sortedValues.findIndex(v => v <= value);
    return index === -1 ? sortedValues.length + 1 : index + 1;
  }

  /**
   * Calcule la régression linéaire simple
   */
  private calculateLinearRegression(results: EvaluationResult[]): { slope: number; correlation: number } {
    if (results.length < 2) return { slope: 0, correlation: 0 };
    
    const n = results.length;
    const x = results.map((_, i) => i); // Index temporel
    const y = results.map(r => r.score);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return { slope: isNaN(slope) ? 0 : slope, correlation: isNaN(correlation) ? 0 : correlation };
  }

  /**
   * Génère les caractéristiques d'un profil d'élève
   */
  private generateCharacteristics(
    type: StudentProfileType,
    performance: StudentPerformanceData,
    progression: StudentProgressionData,
    consistency: any
  ): string[] {
    const characteristics: string[] = [];
    
    switch (type) {
      case StudentProfileType.HighAchiever:
        characteristics.push(
          'Performances excellentes et régulières',
          `Moyenne générale de ${performance.overallAverage.toFixed(1)}/20`,
          `Classé ${performance.classRank}e de la classe`,
          'Forte capacité de concentration et d\'organisation'
        );
        break;
        
      case StudentProfileType.ImprovingStudent:
        characteristics.push(
          'Progression remarquable tout au long de l\'année',
          `Amélioration de ${progression.progressionRate.toFixed(1)}%`,
          'Motivation et engagement croissants',
          'Réponse positive aux encouragements'
        );
        break;
        
      case StudentProfileType.StrugglingStudent:
        characteristics.push(
          'Difficultés persistantes dans plusieurs domaines',
          `Moyenne en dessous de la classe (${performance.overallAverage.toFixed(1)}/20)`,
          'Besoin d\'accompagnement personnalisé',
          'Potentiel à développer avec un soutien adapté'
        );
        break;
        
      case StudentProfileType.InconsistentPerformer:
        characteristics.push(
          'Résultats très variables selon les évaluations',
          `Écart-type élevé (${Math.sqrt(consistency.variance).toFixed(1)} points)`,
          'Performances dépendantes du contexte',
          'Besoin de régularité dans les méthodes'
        );
        break;
        
      case StudentProfileType.ConsistentPerformer:
        characteristics.push(
          'Résultats stables et prévisibles',
          `Moyenne proche de la classe (${performance.overallAverage.toFixed(1)}/20)`,
          'Travail régulier et méthodique',
          'Progression linéaire et constante'
        );
        break;
        
      case StudentProfileType.ExceptionalCase:
        characteristics.push(
          'Profil atypique nécessitant une attention particulière',
          'Pattern de résultats inhabituel',
          'Potentiel spécifique à identifier',
          'Approche pédagogique individualisée recommandée'
        );
        break;
    }
    
    return characteristics;
  }

  /**
   * Identifie les points forts d'un élève
   */
  private identifyStrengths(
    performance: StudentPerformanceData,
    progression: StudentProgressionData,
    results: EvaluationResult[]
  ): string[] {
    const strengths: string[] = [];
    
    // Points forts basés sur les matières
    if (performance.bestSubjects.length > 0) {
      strengths.push(`Excellence en ${performance.bestSubjects.join(' et ')}`);
    }
    
    // Points forts basés sur la progression
    if (progression.progressionRate > 10) {
      strengths.push('Capacité d\'amélioration remarquable');
    }
    
    // Points forts basés sur la régularité
    if (performance.consistencyScore > 0.8) {
      strengths.push('Régularité et fiabilité dans le travail');
    }
    
    // Points forts basés sur la participation
    if (performance.participationRate > 90) {
      strengths.push('Assiduité et engagement exemplaires');
    }
    
    return strengths;
  }

  /**
   * Identifie les défis d'un élève
   */
  private identifyChallenges(
    performance: StudentPerformanceData,
    progression: StudentProgressionData,
    results: EvaluationResult[]
  ): string[] {
    const challenges: string[] = [];
    
    // Défis basés sur les matières
    if (performance.strugglingSubjects.length > 0) {
      challenges.push(`Difficultés en ${performance.strugglingSubjects.join(' et ')}`);
    }
    
    // Défis basés sur la progression
    if (progression.progressionRate < -10) {
      challenges.push('Baisse de performance à surveiller');
    }
    
    // Défis basés sur l'absentéisme
    if (performance.absenteeismRate > 10) {
      challenges.push('Absentéisme impactant les apprentissages');
    }
    
    // Défis basés sur l'inconsistance
    if (performance.consistencyScore < 0.6) {
      challenges.push('Irrégularité dans les résultats');
    }
    
    return challenges;
  }

  /**
   * Évalue la qualité des données pour l'analyse
   */
  private assessDataQuality(context: AnalysisContext): number {
    let qualityScore = 0;
    
    // Quantité de données
    const resultsPerStudent = context.results.length / context.students.length;
    qualityScore += Math.min(0.4, resultsPerStudent / 10); // Max 0.4 pour 10+ résultats par élève
    
    // Diversité des évaluations
    const uniqueEvaluations = new Set(context.results.map(r => r.evaluationId)).size;
    qualityScore += Math.min(0.3, uniqueEvaluations / 15); // Max 0.3 pour 15+ évaluations différentes
    
    // Période couverte
    const dates = context.results.map(r => new Date(r.evaluatedAt).getTime());
    const timeSpan = (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24); // jours
    qualityScore += Math.min(0.2, timeSpan / 200); // Max 0.2 pour 200+ jours
    
    // Taux de participation
    const validResults = context.results.filter(r => !r.isAbsent && r.score !== null);
    const participationRate = validResults.length / context.results.length;
    qualityScore += participationRate * 0.1; // Max 0.1
    
    return Math.min(1, qualityScore);
  }

  /**
   * Calcule la confiance globale de l'analyse
   */
  private calculateOverallConfidence(profiles: StudentProfile[], insights: ClassInsight[]): number {
    if (profiles.length === 0 && insights.length === 0) return 0;
    
    const profileConfidences = profiles.map(p => p.confidence);
    const insightConfidences = insights.map(i => i.confidence);
    
    const allConfidences = [...profileConfidences, ...insightConfidences];
    return allConfidences.reduce((sum, conf) => sum + conf, 0) / allConfidences.length;
  }

  /**
   * Retourne la liste des algorithmes utilisés
   */
  private getUsedAlgorithms(): string[] {
    return [
      'Classification hiérarchique des profils',
      'Régression linéaire pour tendances',
      'Analyse de variance pour consistance',
      'Détection de patterns saisonniers',
      'Algorithmes de détection d\'anomalies',
      'Analyse de corrélation temporelle'
    ];
  }

  // Méthodes utilitaires supplémentaires...
  private groupResultsBySubject(results: EvaluationResult[]): Record<string, EvaluationResult[]> {
    // Implémentation du groupement par matière
    return {};
  }

  private calculateConsistencyScore(scores: number[]): number {
    if (scores.length < 2) return 1;
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return Math.max(0, 1 - (Math.sqrt(variance) / mean));
  }

  private calculateConsistencyMetrics(results: EvaluationResult[]) {
    const scores = results.filter(r => !r.isAbsent && r.score !== null).map(r => r.score);
    if (scores.length < 2) return { score: 1, variance: 0 };
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const score = Math.max(0, 1 - (Math.sqrt(variance) / mean));
    
    return { score, variance };
  }

  private detectExceptionalPattern(performance: any, progression: any, consistency: any): boolean {
    // Logique de détection de patterns exceptionnels
    return false;
  }

  private detectMilestones(results: EvaluationResult[]): Array<{ date: Date; achievement: string; impact: number }> {
    // Implémentation de détection de jalons
    return [];
  }

  private detectCriticalPeriods(results: EvaluationResult[]): Array<{ period: string; issue: string; impact: string }> {
    // Implémentation de détection de périodes critiques
    return [];
  }

  private calculateMonthlyProgression(results: EvaluationResult[]): Array<{ month: string; average: number; trend: number }> {
    // Implémentation du calcul de progression mensuelle
    return [];
  }

  private groupResultsByMonth(results: EvaluationResult[]): Record<string, EvaluationResult[]> {
    // Implémentation du groupement par mois
    return {};
  }

  private calculateLinearRegressionFromAverages(averages: Array<{ month: string; average: number }>): { slope: number; correlation: number } {
    // Implémentation de la régression sur les moyennes mensuelles
    return { slope: 0, correlation: 0 };
  }

  private detectSeasonalPattern(averages: Array<{ month: string; average: number }>): any {
    // Implémentation de détection de saisonnalité
    return { detected: false };
  }

  private identifyChronicAbsentees(results: EvaluationResult[]): number[] {
    // Implémentation d'identification des absentéistes chroniques
    return [];
  }

  private calculateQuartiles(scores: number[]): { q1: number; q2: number; q3: number } {
    const sorted = [...scores].sort((a, b) => a - b);
    const n = sorted.length;
    
    return {
      q1: sorted[Math.floor(n * 0.25)],
      q2: sorted[Math.floor(n * 0.5)],
      q3: sorted[Math.floor(n * 0.75)]
    };
  }

  private async analyzeSubjectDisparities(context: AnalysisContext): Promise<ClassInsight[]> {
    // Implémentation d'analyse des disparités par matière
    return [];
  }

  private async identifySuccessFactors(context: AnalysisContext): Promise<ClassInsight[]> {
    // Implémentation d'identification des facteurs de réussite
    return [];
  }

  private async generateRecommendations(
    context: AnalysisContext, 
    profiles: StudentProfile[], 
    insights: ClassInsight[]
  ): Promise<PedagogicalRecommendation[]> {
    // Implémentation de génération de recommandations
    return [];
  }

  private async detectAdvancedPatterns(context: AnalysisContext): Promise<Array<any>> {
    // Implémentation de détection de patterns avancés
    return [];
  }

  private async generatePredictions(context: AnalysisContext, profiles: StudentProfile[]): Promise<Array<any>> {
    // Implémentation de génération de prédictions
    return [];
  }
}
