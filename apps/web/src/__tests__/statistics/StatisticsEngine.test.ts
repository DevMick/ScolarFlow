// ========================================
// STATISTICS ENGINE TESTS - TESTS DU MOTEUR STATISTIQUE
// ========================================

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { 
  StatisticConfiguration, 
  StatisticResult,
  DataSourceConfig,
  CalculationConfig,
  VisualizationConfig
} from '@edustats/shared/types/statistics';

// Mock des données de test
const mockEvaluationData = [
  { id: 1, studentId: 1, score: 15, isAbsent: false, evaluationId: 1, createdAt: new Date('2024-01-15') },
  { id: 2, studentId: 2, score: 12, isAbsent: false, evaluationId: 1, createdAt: new Date('2024-01-15') },
  { id: 3, studentId: 3, score: 18, isAbsent: false, evaluationId: 1, createdAt: new Date('2024-01-15') },
  { id: 4, studentId: 4, score: null, isAbsent: true, evaluationId: 1, createdAt: new Date('2024-01-15') },
  { id: 5, studentId: 5, score: 14, isAbsent: false, evaluationId: 1, createdAt: new Date('2024-01-15') },
  { id: 6, studentId: 1, score: 16, isAbsent: false, evaluationId: 2, createdAt: new Date('2024-02-15') },
  { id: 7, studentId: 2, score: 13, isAbsent: false, evaluationId: 2, createdAt: new Date('2024-02-15') },
  { id: 8, studentId: 3, score: 19, isAbsent: false, evaluationId: 2, createdAt: new Date('2024-02-15') },
];

const mockStudents = [
  { id: 1, firstName: 'Alice', lastName: 'Martin', classId: 1 },
  { id: 2, firstName: 'Bob', lastName: 'Dupont', classId: 1 },
  { id: 3, firstName: 'Charlie', lastName: 'Bernard', classId: 1 },
  { id: 4, firstName: 'Diana', lastName: 'Moreau', classId: 1 },
  { id: 5, firstName: 'Eve', lastName: 'Petit', classId: 1 },
];

const mockClasses = [
  { id: 1, name: 'CM2 A', level: 'CM2', teacherId: 1 }
];

// Mock de l'API
const mockApiCall = jest.fn();

// Configuration de test de base
const baseConfig: StatisticConfiguration = {
  id: 'test-config-1',
  userId: 1,
  name: 'Test Performance Analysis',
  description: 'Analyse de performance pour les tests',
  category: 'performance',
  dataSources: {
    evaluationIds: [1, 2],
    classIds: [1],
    dateRange: [new Date('2024-01-01'), new Date('2024-03-01')],
    subjectFilters: [],
    typeFilters: [],
    excludeAbsent: true,
    excludeIncomplete: false
  },
  calculations: {
    type: 'basic',
    metrics: ['average', 'median', 'standardDeviation', 'min', 'max'],
    groupBy: 'student',
    aggregation: 'average'
  },
  visualization: {
    chartType: 'bar',
    multiSeries: false,
    colors: ['#3B82F6'],
    layout: 'single',
    annotations: false,
    showGrid: true,
    showLegend: true
  },
  isTemplate: false,
  isPublic: false,
  tags: ['test', 'performance'],
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('StatisticsEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Calculs statistiques de base', () => {
    it('devrait calculer correctement la moyenne', () => {
      const scores = [15, 12, 18, 14];
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      expect(average).toBe(14.75);
    });

    it('devrait calculer correctement la médiane', () => {
      const scores = [15, 12, 18, 14];
      const sortedScores = [...scores].sort((a, b) => a - b);
      const median = sortedScores.length % 2 === 0
        ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
        : sortedScores[Math.floor(sortedScores.length / 2)];
      expect(median).toBe(14.5);
    });

    it('devrait calculer correctement l\'écart-type', () => {
      const scores = [15, 12, 18, 14];
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
      const standardDeviation = Math.sqrt(variance);
      expect(standardDeviation).toBeCloseTo(2.165, 3);
    });

    it('devrait identifier les valeurs min et max', () => {
      const scores = [15, 12, 18, 14];
      expect(Math.min(...scores)).toBe(12);
      expect(Math.max(...scores)).toBe(18);
    });
  });

  describe('Filtrage des données', () => {
    it('devrait exclure les absents quand configuré', () => {
      const filteredData = mockEvaluationData.filter(result => 
        !baseConfig.dataSources.excludeAbsent || !result.isAbsent
      );
      expect(filteredData).toHaveLength(7); // 8 - 1 absent
      expect(filteredData.every(result => !result.isAbsent)).toBe(true);
    });

    it('devrait filtrer par période de dates', () => {
      const startDate = new Date('2024-02-01');
      const endDate = new Date('2024-02-28');
      
      const filteredData = mockEvaluationData.filter(result => 
        result.createdAt >= startDate && result.createdAt <= endDate
      );
      expect(filteredData).toHaveLength(3); // Seulement les résultats de février
    });

    it('devrait filtrer par évaluations spécifiques', () => {
      const evaluationIds = [1];
      const filteredData = mockEvaluationData.filter(result => 
        evaluationIds.includes(result.evaluationId)
      );
      expect(filteredData).toHaveLength(5); // Seulement l'évaluation 1
    });
  });

  describe('Regroupement des données', () => {
    it('devrait regrouper par étudiant', () => {
      const groupedData = mockEvaluationData
        .filter(result => !result.isAbsent && result.score !== null)
        .reduce((groups, result) => {
          const key = result.studentId.toString();
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(result);
          return groups;
        }, {} as Record<string, typeof mockEvaluationData>);

      expect(Object.keys(groupedData)).toHaveLength(4); // 4 étudiants avec des notes
      expect(groupedData['1']).toHaveLength(2); // Alice a 2 notes
      expect(groupedData['3']).toHaveLength(2); // Charlie a 2 notes
    });

    it('devrait regrouper par évaluation', () => {
      const groupedData = mockEvaluationData
        .filter(result => !result.isAbsent && result.score !== null)
        .reduce((groups, result) => {
          const key = result.evaluationId.toString();
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(result);
          return groups;
        }, {} as Record<string, typeof mockEvaluationData>);

      expect(Object.keys(groupedData)).toHaveLength(2); // 2 évaluations
      expect(groupedData['1']).toHaveLength(4); // Évaluation 1 a 4 notes
      expect(groupedData['2']).toHaveLength(3); // Évaluation 2 a 3 notes
    });
  });

  describe('Calculs avancés', () => {
    it('devrait calculer les percentiles correctement', () => {
      const scores = [10, 12, 14, 15, 16, 18, 20].sort((a, b) => a - b);
      
      const calculatePercentile = (values: number[], percentile: number): number => {
        const index = (percentile / 100) * (values.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;
        
        if (upper >= values.length) return values[values.length - 1];
        return values[lower] * (1 - weight) + values[upper] * weight;
      };

      expect(calculatePercentile(scores, 25)).toBeCloseTo(12.5, 1);
      expect(calculatePercentile(scores, 50)).toBe(15);
      expect(calculatePercentile(scores, 75)).toBeCloseTo(17, 1);
    });

    it('devrait détecter les tendances', () => {
      const timeSeriesData = [
        { date: new Date('2024-01-01'), value: 12 },
        { date: new Date('2024-02-01'), value: 14 },
        { date: new Date('2024-03-01'), value: 16 },
        { date: new Date('2024-04-01'), value: 15 },
      ];

      // Calcul de tendance simple (régression linéaire basique)
      const n = timeSeriesData.length;
      const sumX = timeSeriesData.reduce((sum, _, index) => sum + index, 0);
      const sumY = timeSeriesData.reduce((sum, item) => sum + item.value, 0);
      const sumXY = timeSeriesData.reduce((sum, item, index) => sum + index * item.value, 0);
      const sumXX = timeSeriesData.reduce((sum, _, index) => sum + index * index, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      
      expect(slope).toBeGreaterThan(0); // Tendance positive globale
    });

    it('devrait calculer les corrélations entre évaluations', () => {
      const eval1Scores = [15, 12, 18, 14];
      const eval2Scores = [16, 13, 19, 15];

      const calculateCorrelation = (x: number[], y: number[]): number => {
        const n = x.length;
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        const sumYY = y.reduce((sum, val) => sum + val * val, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
      };

      const correlation = calculateCorrelation(eval1Scores, eval2Scores);
      expect(correlation).toBeGreaterThan(0.9); // Forte corrélation positive
    });
  });

  describe('Génération d\'insights', () => {
    it('devrait identifier les élèves en difficulté', () => {
      const studentAverages = [
        { studentId: 1, average: 15.5, name: 'Alice Martin' },
        { studentId: 2, average: 12.5, name: 'Bob Dupont' },
        { studentId: 3, average: 18.5, name: 'Charlie Bernard' },
        { studentId: 5, average: 14, name: 'Eve Petit' },
      ];

      const classAverage = studentAverages.reduce((sum, student) => sum + student.average, 0) / studentAverages.length;
      const strugglingStudents = studentAverages.filter(student => student.average < classAverage - 2);

      expect(strugglingStudents).toHaveLength(1);
      expect(strugglingStudents[0].name).toBe('Bob Dupont');
    });

    it('devrait identifier les élèves excellents', () => {
      const studentAverages = [
        { studentId: 1, average: 15.5, name: 'Alice Martin' },
        { studentId: 2, average: 12.5, name: 'Bob Dupont' },
        { studentId: 3, average: 18.5, name: 'Charlie Bernard' },
        { studentId: 5, average: 14, name: 'Eve Petit' },
      ];

      const classAverage = studentAverages.reduce((sum, student) => sum + student.average, 0) / studentAverages.length;
      const excellentStudents = studentAverages.filter(student => student.average > classAverage + 2);

      expect(excellentStudents).toHaveLength(1);
      expect(excellentStudents[0].name).toBe('Charlie Bernard');
    });

    it('devrait détecter les améliorations significatives', () => {
      const progressData = [
        { studentId: 1, eval1: 12, eval2: 16, improvement: 4 },
        { studentId: 2, eval1: 14, eval2: 15, improvement: 1 },
        { studentId: 3, eval1: 16, eval2: 18, improvement: 2 },
      ];

      const significantImprovements = progressData.filter(student => student.improvement >= 3);
      expect(significantImprovements).toHaveLength(1);
      expect(significantImprovements[0].studentId).toBe(1);
    });
  });

  describe('Validation des configurations', () => {
    it('devrait valider une configuration correcte', () => {
      const isValidConfig = (config: StatisticConfiguration): boolean => {
        return (
          config.dataSources.classIds.length > 0 &&
          config.calculations.metrics.length > 0 &&
          config.dataSources.dateRange[0] < config.dataSources.dateRange[1]
        );
      };

      expect(isValidConfig(baseConfig)).toBe(true);
    });

    it('devrait rejeter une configuration invalide', () => {
      const invalidConfig = {
        ...baseConfig,
        dataSources: {
          ...baseConfig.dataSources,
          classIds: [] // Pas de classes sélectionnées
        }
      };

      const isValidConfig = (config: StatisticConfiguration): boolean => {
        return (
          config.dataSources.classIds.length > 0 &&
          config.calculations.metrics.length > 0 &&
          config.dataSources.dateRange[0] < config.dataSources.dateRange[1]
        );
      };

      expect(isValidConfig(invalidConfig)).toBe(false);
    });

    it('devrait valider les métriques supportées', () => {
      const supportedMetrics = ['average', 'median', 'standardDeviation', 'min', 'max', 'percentiles'];
      const configMetrics = baseConfig.calculations.metrics;

      const allMetricsSupported = configMetrics.every(metric => supportedMetrics.includes(metric));
      expect(allMetricsSupported).toBe(true);
    });
  });

  describe('Performance et optimisation', () => {
    it('devrait traiter efficacement de gros volumes de données', () => {
      // Simuler 1000 résultats
      const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
        id: index + 1,
        studentId: (index % 50) + 1,
        score: Math.floor(Math.random() * 20) + 1,
        isAbsent: Math.random() < 0.05, // 5% d'absents
        evaluationId: Math.floor(index / 50) + 1,
        createdAt: new Date(2024, 0, 1 + Math.floor(index / 25))
      }));

      const startTime = performance.now();
      
      // Calculs sur le gros dataset
      const validScores = largeDataset
        .filter(result => !result.isAbsent && result.score !== null)
        .map(result => result.score);
      
      const average = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
      const sortedScores = [...validScores].sort((a, b) => a - b);
      const median = sortedScores.length % 2 === 0
        ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
        : sortedScores[Math.floor(sortedScores.length / 2)];

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(100); // Moins de 100ms
      expect(average).toBeGreaterThan(0);
      expect(median).toBeGreaterThan(0);
      expect(validScores.length).toBeGreaterThan(900); // ~95% de présents
    });

    it('devrait gérer les cas limites', () => {
      // Dataset vide
      const emptyDataset: any[] = [];
      const emptyResult = emptyDataset.filter(result => !result.isAbsent);
      expect(emptyResult).toHaveLength(0);

      // Tous absents
      const allAbsentDataset = [
        { id: 1, studentId: 1, score: null, isAbsent: true },
        { id: 2, studentId: 2, score: null, isAbsent: true },
      ];
      const presentResults = allAbsentDataset.filter(result => !result.isAbsent);
      expect(presentResults).toHaveLength(0);

      // Une seule valeur
      const singleValueDataset = [
        { id: 1, studentId: 1, score: 15, isAbsent: false }
      ];
      const singleScore = singleValueDataset.filter(result => !result.isAbsent)[0].score;
      expect(singleScore).toBe(15);
    });
  });

  describe('Intégration avec le cache', () => {
    it('devrait utiliser le cache pour éviter les recalculs', () => {
      const cacheKey = 'test-stats-key';
      const mockCache = new Map();

      // Première exécution - calcul et mise en cache
      const calculateStats = (data: any[]) => {
        if (mockCache.has(cacheKey)) {
          return mockCache.get(cacheKey);
        }

        const result = {
          average: data.reduce((sum, item) => sum + item.score, 0) / data.length,
          count: data.length,
          timestamp: Date.now()
        };

        mockCache.set(cacheKey, result);
        return result;
      };

      const testData = [
        { score: 15 }, { score: 12 }, { score: 18 }
      ];

      const result1 = calculateStats(testData);
      const result2 = calculateStats(testData);

      expect(result1).toBe(result2); // Même référence d'objet = cache utilisé
      expect(result1.average).toBe(15);
    });
  });
});

describe('Intégration complète du système', () => {
  it('devrait traiter un workflow complet d\'analyse', async () => {
    // 1. Configuration
    const config = { ...baseConfig };
    expect(config).toBeDefined();

    // 2. Récupération des données (simulée)
    const mockFetchData = jest.fn().mockResolvedValue(mockEvaluationData);
    const data = await mockFetchData();
    expect(data).toHaveLength(8);

    // 3. Filtrage
    const filteredData = data.filter(result => 
      !config.dataSources.excludeAbsent || !result.isAbsent
    );
    expect(filteredData).toHaveLength(7);

    // 4. Calculs statistiques
    const scores = filteredData.map(result => result.score).filter(score => score !== null);
    const stats = {
      average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      min: Math.min(...scores),
      max: Math.max(...scores),
      count: scores.length
    };

    expect(stats.average).toBeCloseTo(15.14, 2);
    expect(stats.min).toBe(12);
    expect(stats.max).toBe(19);
    expect(stats.count).toBe(7);

    // 5. Génération d'insights
    const insights = [];
    if (stats.average > 15) {
      insights.push({
        type: 'positive',
        message: 'La classe a une bonne moyenne générale',
        confidence: 0.8
      });
    }

    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe('positive');
  });
});
