// ========================================
// STATISTICS ENGINE - MOTEUR DE CALCUL STATISTIQUE
// ========================================

import { PrismaClient } from '@prisma/client';
// TODO: @edustats/shared/types/statistics n'existe pas
// Types locaux temporaires
type StatisticConfiguration = any;
type StatisticResult = any;
type ChartDataset = any;
type ChartDataPoint = any;
type StatisticMetrics = any;
type GroupedStatisticMetrics = any;
type StatisticInsight = any;
type StatisticSummary = any;
type CalculationType = any;
type MetricType = any;
type GroupByOption = any;
import { createHash } from 'crypto';

/**
 * Interface pour les données brutes d'évaluation
 */
interface RawEvaluationData {
  id: number;
  score: number | null;
  isAbsent: boolean;
  evaluationDate: Date;
  maxScore: number;
  subject: string;
  type: string;
  classId: number;
  studentId: number;
  studentName: string;
  className: string;
}

/**
 * Moteur principal de calcul des statistiques personnalisées
 */
export class StatisticsEngine {
  private prisma: PrismaClient;
  private cache: Map<string, { data: StatisticResult; timestamp: number; ttl: number }>;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.cache = new Map();
  }

  /**
   * Génère les statistiques selon la configuration fournie
   */
  async generateStatistics(config: StatisticConfiguration): Promise<StatisticResult> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(config);

    // Vérifier le cache
    const cached = this.cache.get(cacheKey);
    if (cached && !this.isStale(cached)) {
      return cached.data;
    }

    try {
      // 1. Récupérer les données brutes
      const rawData = await this.fetchData(config.dataSources);

      // 2. Appliquer les filtres
      const filteredData = this.applyFilters(rawData, config.dataSources);

      // 3. Calculer les statistiques
      const statistics = this.calculateStatistics(filteredData, config.calculations);

      // 4. Préparer les datasets pour visualisation
      const datasets = this.prepareDatasets(filteredData, statistics, config);

      // 5. Générer les insights automatiques
      const insights = await this.generateInsights(statistics, config, filteredData);

      // 6. Créer le résultat final
      const result: StatisticResult = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        configId: config.id,
        configuration: config,
        datasets,
        summary: {
          totalDataPoints: filteredData.length,
          timeRange: this.getTimeRange(filteredData),
          calculatedAt: new Date(),
          processingTime: Date.now() - startTime
        },
        statistics,
        insights,
        processingTime: Date.now() - startTime,
        dataPointsCount: filteredData.length,
        cacheKey,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 300000) // 5 minutes
      };

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: 300000 // 5 minutes
      });

      return result;

    } catch (error) {
      console.error('Erreur génération statistiques:', error);
      throw new Error(`Erreur lors du calcul des statistiques: ${error.message}`);
    }
  }

  /**
   * Récupère les données brutes depuis la base de données
   */
  private async fetchData(dataSources: StatisticConfiguration['dataSources']): Promise<RawEvaluationData[]> {
    const whereConditions: any = {};

    // Filtres par classes
    if (dataSources.classIds.length > 0) {
      whereConditions.evaluation = {
        classId: { in: dataSources.classIds }
      };
    }

    // Filtres par dates
    if (dataSources.dateRange) {
      const [startDate, endDate] = dataSources.dateRange;
      whereConditions.evaluation = {
        ...whereConditions.evaluation,
        evaluationDate: {
          gte: startDate,
          lte: endDate
        }
      };
    }

    // Filtres par matières
    if (dataSources.subjectFilters.length > 0) {
      whereConditions.evaluation = {
        ...whereConditions.evaluation,
        subject: { in: dataSources.subjectFilters }
      };
    }

    // Filtres par types
    if (dataSources.typeFilters.length > 0) {
      whereConditions.evaluation = {
        ...whereConditions.evaluation,
        type: { in: dataSources.typeFilters }
      };
    }

    // Filtres par évaluations spécifiques
    if (dataSources.evaluationIds.length > 0) {
      whereConditions.evaluationId = { in: dataSources.evaluationIds };
    }

    // TODO: evaluationResult n'existe pas dans le schéma Prisma
    // Utiliser notes ou moyennes à la place
    const results: any[] = [];
    /* const results = await this.prisma.evaluationResult.findMany({
      where: whereConditions,
      include: {
        evaluation: {
          include: {
            class: true
          }
        },
        student: true
      },
      orderBy: [
        { evaluation: { evaluationDate: 'asc' } },
        { student: { lastName: 'asc' } }
      ]
    });

    return results.map(result => ({
      id: result.id,
      score: result.score ? Number(result.score) : null,
      isAbsent: result.isAbsent,
      evaluationDate: result.evaluation.evaluationDate,
      maxScore: Number(result.evaluation.maxScore),
      subject: result.evaluation.subject,
      type: result.evaluation.type,
      classId: result.evaluation.classId,
      studentId: result.studentId,
      studentName: `${result.student.firstName} ${result.student.lastName}`,
      className: result.evaluation.class.name
    }));
  }

  /**
   * Applique les filtres aux données
   */
  private applyFilters(data: RawEvaluationData[], dataSources: StatisticConfiguration['dataSources']): RawEvaluationData[] {
    let filtered = [...data];

    // Exclure les absents si demandé
    if (dataSources.excludeAbsent) {
      filtered = filtered.filter(item => !item.isAbsent);
    }

    // Exclure les évaluations incomplètes si demandé
    if (dataSources.excludeIncomplete) {
      filtered = filtered.filter(item => item.score !== null);
    }

    return filtered;
  }

  /**
   * Calcule les statistiques selon la configuration
   */
  private calculateStatistics(
    data: RawEvaluationData[], 
    calculations: StatisticConfiguration['calculations']
  ): { global: StatisticMetrics; byGroup?: GroupedStatisticMetrics } {
    
    const grouped = this.groupData(data, calculations.groupBy);
    const byGroup: GroupedStatisticMetrics = {};

    // Calculer les statistiques pour chaque groupe
    for (const [groupKey, groupData] of Object.entries(grouped)) {
      const scores = groupData
        .filter(item => !item.isAbsent && item.score !== null)
        .map(item => item.score!);

      if (scores.length > 0) {
        byGroup[groupKey] = {
          ...this.calculateBasicStats(scores),
          percentage: (scores.length / data.filter(d => !d.isAbsent && d.score !== null).length) * 100,
          trend: this.calculateTrend(scores, groupData.map(d => d.evaluationDate))
        };
      }
    }

    // Calculer les statistiques globales
    const allScores = data
      .filter(item => !item.isAbsent && item.score !== null)
      .map(item => item.score!);

    const global = {
      ...this.calculateBasicStats(allScores),
      trend: this.calculateTrend(allScores, data.map(d => d.evaluationDate))
    };

    return { global, byGroup };
  }

  /**
   * Calcule les statistiques de base pour un ensemble de scores
   */
  private calculateBasicStats(scores: number[]): StatisticMetrics {
    if (scores.length === 0) {
      return {
        average: 0,
        median: 0,
        standardDeviation: 0,
        min: 0,
        max: 0,
        trend: 'stable',
        count: 0
      };
    }

    const sorted = [...scores].sort((a, b) => a - b);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    let median: number;
    if (sorted.length % 2 === 0) {
      median = (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    } else {
      median = sorted[Math.floor(sorted.length / 2)];
    }

    const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      average: this.roundValue(average),
      median: this.roundValue(median),
      standardDeviation: this.roundValue(standardDeviation),
      min: Math.min(...scores),
      max: Math.max(...scores),
      trend: 'stable', // Sera calculé par calculateTrend
      count: scores.length
    };
  }

  /**
   * Calcule la tendance temporelle
   */
  private calculateTrend(scores: number[], dates: Date[]): 'increasing' | 'decreasing' | 'stable' {
    if (scores.length < 2) return 'stable';

    // Calcul de régression linéaire simple
    const n = scores.length;
    const timeValues = dates.map(date => date.getTime());
    
    const sumX = timeValues.reduce((sum, val) => sum + val, 0);
    const sumY = scores.reduce((sum, val) => sum + val, 0);
    const sumXY = timeValues.reduce((sum, val, i) => sum + val * scores[i], 0);
    const sumXX = timeValues.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    if (Math.abs(slope) < 0.01) return 'stable';
    return slope > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Groupe les données selon le critère spécifié
   */
  private groupData(data: RawEvaluationData[], groupBy: GroupByOption): Record<string, RawEvaluationData[]> {
    const groups: Record<string, RawEvaluationData[]> = {};

    for (const item of data) {
      let key: string;

      switch (groupBy) {
        case 'student':
          key = item.studentName;
          break;
        case 'evaluation':
          key = `${item.subject} - ${item.evaluationDate.toLocaleDateString('fr-FR')}`;
          break;
        case 'subject':
          key = item.subject;
          break;
        case 'class':
          key = item.className;
          break;
        case 'month':
          key = item.evaluationDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
          break;
        case 'week':
          const weekNumber = this.getWeekNumber(item.evaluationDate);
          key = `Semaine ${weekNumber}`;
          break;
        default:
          key = 'Général';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    }

    return groups;
  }

  /**
   * Prépare les datasets pour la visualisation
   */
  private prepareDatasets(
    data: RawEvaluationData[],
    statistics: { global: StatisticMetrics; byGroup?: GroupedStatisticMetrics },
    config: StatisticConfiguration
  ): ChartDataset[] {
    const datasets: ChartDataset[] = [];

    if (!statistics.byGroup) {
      return datasets;
    }

    const groupKeys = Object.keys(statistics.byGroup);
    const colors = config.visualization.colors || ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

    // Dataset principal
    const mainDataset: ChartDataset = {
      label: this.getDatasetLabel(config.calculations.metrics[0]),
      data: groupKeys.map(key => ({
        label: key,
        value: statistics.byGroup![key].average,
        metadata: statistics.byGroup![key]
      })),
      color: colors[0]
    };

    datasets.push(mainDataset);

    // Datasets additionnels pour multi-séries
    if (config.visualization.multiSeries && config.calculations.metrics.length > 1) {
      config.calculations.metrics.slice(1).forEach((metric, index) => {
        const dataset: ChartDataset = {
          label: this.getDatasetLabel(metric),
          data: groupKeys.map(key => ({
            label: key,
            value: this.getMetricValue(statistics.byGroup![key], metric),
            metadata: statistics.byGroup![key]
          })),
          color: colors[(index + 1) % colors.length]
        };
        datasets.push(dataset);
      });
    }

    return datasets;
  }

  /**
   * Génère les insights automatiques
   */
  private async generateInsights(
    statistics: { global: StatisticMetrics; byGroup?: GroupedStatisticMetrics },
    config: StatisticConfiguration,
    data: RawEvaluationData[]
  ): Promise<StatisticInsight[]> {
    const insights: StatisticInsight[] = [];

    // Insight sur la tendance globale
    if (statistics.global.trend !== 'stable') {
      insights.push({
        type: 'trend',
        title: `Tendance ${statistics.global.trend === 'increasing' ? 'positive' : 'négative'} détectée`,
        description: `Les performances montrent une tendance à la ${statistics.global.trend === 'increasing' ? 'hausse' : 'baisse'} sur la période analysée.`,
        confidence: 0.8,
        actionable: true,
        priority: statistics.global.trend === 'decreasing' ? 'high' : 'medium'
      });
    }

    // Insights sur la dispersion
    if (statistics.global.standardDeviation > statistics.global.average * 0.3) {
      insights.push({
        type: 'outlier',
        title: 'Forte dispersion des résultats',
        description: `L'écart-type élevé (${statistics.global.standardDeviation.toFixed(1)}) indique une forte hétérogénéité des performances.`,
        confidence: 0.9,
        actionable: true,
        priority: 'medium'
      });
    }

    // Insights sur les groupes performants/en difficulté
    if (statistics.byGroup) {
      const groupStats = Object.entries(statistics.byGroup);
      const sortedByAverage = groupStats.sort((a, b) => b[1].average - a[1].average);

      if (sortedByAverage.length >= 2) {
        const best = sortedByAverage[0];
        const worst = sortedByAverage[sortedByAverage.length - 1];
        const gap = best[1].average - worst[1].average;

        if (gap > statistics.global.average * 0.2) {
          insights.push({
            type: 'recommendation',
            title: 'Écart significatif détecté',
            description: `Un écart de ${gap.toFixed(1)} points existe entre "${best[0]}" (${best[1].average.toFixed(1)}) et "${worst[0]}" (${worst[1].average.toFixed(1)}).`,
            confidence: 0.85,
            actionable: true,
            priority: 'high'
          });
        }
      }
    }

    // Insight sur le niveau général
    const averageRatio = statistics.global.average / (data[0]?.maxScore || 20);
    if (averageRatio > 0.8) {
      insights.push({
        type: 'trend',
        title: 'Excellent niveau général',
        description: `La moyenne de classe (${statistics.global.average.toFixed(1)}) indique un très bon niveau général.`,
        confidence: 0.9,
        actionable: false,
        priority: 'low'
      });
    } else if (averageRatio < 0.5) {
      insights.push({
        type: 'recommendation',
        title: 'Niveau préoccupant',
        description: `La moyenne de classe (${statistics.global.average.toFixed(1)}) est en dessous des attentes. Un accompagnement renforcé pourrait être nécessaire.`,
        confidence: 0.85,
        actionable: true,
        priority: 'high'
      });
    }

    return insights;
  }

  /**
   * Utilitaires
   */
  private getCacheKey(config: StatisticConfiguration): string {
    const configString = JSON.stringify({
      dataSources: config.dataSources,
      calculations: config.calculations
    });
    return createHash('md5').update(configString).digest('hex');
  }

  private isStale(cached: { data: StatisticResult; timestamp: number; ttl: number }): boolean {
    return Date.now() - cached.timestamp > cached.ttl;
  }

  private getTimeRange(data: RawEvaluationData[]): [Date, Date] {
    if (data.length === 0) {
      const now = new Date();
      return [now, now];
    }

    const dates = data.map(d => d.evaluationDate);
    return [
      new Date(Math.min(...dates.map(d => d.getTime()))),
      new Date(Math.max(...dates.map(d => d.getTime())))
    ];
  }

  private getWeekNumber(date: Date): number {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  }

  private roundValue(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private getDatasetLabel(metric: MetricType): string {
    const labels = {
      average: 'Moyenne',
      median: 'Médiane',
      standardDeviation: 'Écart-type',
      min: 'Minimum',
      max: 'Maximum',
      percentiles: 'Percentiles',
      quartiles: 'Quartiles',
      iqr: 'IQR',
      correlation: 'Corrélation',
      trend: 'Tendance'
    };
    return labels[metric] || metric;
  }

  private getMetricValue(stats: StatisticMetrics, metric: MetricType): number {
    switch (metric) {
      case 'average': return stats.average;
      case 'median': return stats.median;
      case 'standardDeviation': return stats.standardDeviation;
      case 'min': return stats.min;
      case 'max': return stats.max;
      default: return stats.average;
    }
  }
}

export default StatisticsEngine;