// ========================================
// HOOK USE STATISTICS - CALCULS STATISTIQUES PRÉCIS
// ========================================

import { useMemo } from 'react';
import type { EvaluationResult, Student, Evaluation } from '../types';

/**
 * Interface pour les données statistiques complètes
 */
export interface StatisticsData {
  evaluation: Evaluation;
  
  // Données de base
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  
  // Scores valides (présents avec note)
  validScores: number[];
  
  // Mesures de tendance centrale
  average: number;
  median: number;
  mode: number | null;
  
  // Mesures de dispersion
  standardDeviation: number;
  variance: number;
  range: number;
  min: number;
  max: number;
  
  // Quartiles et percentiles
  quartiles: {
    q1: number;   // 25ème percentile
    q2: number;   // 50ème percentile (médiane)
    q3: number;   // 75ème percentile
  };
  percentiles: {
    p10: number;
    p25: number;
    p50: number;  // médiane
    p75: number;
    p90: number;
    p95: number;
  };
  
  // Distribution des notes
  distribution: Array<{
    range: string;
    min: number;
    max: number;
    count: number;
    percentage: number;
  }>;
  
  // Indicateurs de performance
  passingRate: number;        // Pourcentage >= 10/20
  excellenceRate: number;     // Pourcentage >= 16/20
  difficultyRate: number;     // Pourcentage < 8/20
  
  // Analyses contextuelles
  isNormalDistribution: boolean;
  skewness: number;           // Asymétrie (-1 à 1)
  kurtosis: number;           // Aplatissement
  outliers: number[];         // Valeurs aberrantes
  
  // Comparaison avec référentiels
  classLevel: 'excellent' | 'good' | 'average' | 'below_average' | 'concerning';
  
  // Métadonnées de calcul
  calculatedAt: Date;
  isReliable: boolean;        // Fiabilité des calculs (min 5 élèves)
}

/**
 * Calcule la moyenne arithmétique
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Calcule la médiane (valeur centrale)
 */
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  } else {
    return sorted[middle];
  }
}

/**
 * Calcule le mode (valeur la plus fréquente)
 */
function calculateMode(values: number[]): number | null {
  if (values.length === 0) return null;
  
  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  let mode: number | null = null;
  
  values.forEach(value => {
    frequency[value] = (frequency[value] || 0) + 1;
    if (frequency[value] > maxFreq) {
      maxFreq = frequency[value];
      mode = value;
    }
  });
  
  // Retourner null si pas de mode clair (fréquence = 1)
  return maxFreq > 1 ? mode : null;
}

/**
 * Calcule l'écart-type et la variance
 */
function calculateStandardDeviation(values: number[]): { standardDeviation: number; variance: number } {
  if (values.length <= 1) return { standardDeviation: 0, variance: 0 };
  
  const mean = calculateMean(values);
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / (values.length - 1);
  const standardDeviation = Math.sqrt(variance);
  
  return { standardDeviation, variance };
}

/**
 * Calcule un percentile spécifique
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  
  if (Number.isInteger(index)) {
    return sorted[index];
  } else {
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
}

/**
 * Calcule la distribution des notes par tranches
 */
function calculateDistribution(values: number[], maxScore: number): StatisticsData['distribution'] {
  const ranges = [
    { range: '0-4', min: 0, max: 4 },
    { range: '5-7', min: 5, max: 7 },
    { range: '8-9', min: 8, max: 9 },
    { range: '10-11', min: 10, max: 11 },
    { range: '12-13', min: 12, max: 13 },
    { range: '14-15', min: 14, max: 15 },
    { range: '16-17', min: 16, max: 17 },
    { range: '18-20', min: 18, max: 20 }
  ];
  
  // Adapter les tranches au barème (si différent de 20)
  const adjustedRanges = ranges.map(range => ({
    ...range,
    min: (range.min / 20) * maxScore,
    max: (range.max / 20) * maxScore,
    range: maxScore === 20 ? range.range : `${((range.min / 20) * maxScore).toFixed(1)}-${((range.max / 20) * maxScore).toFixed(1)}`
  }));
  
  return adjustedRanges.map(range => {
    const count = values.filter(value => value >= range.min && value <= range.max).length;
    const percentage = values.length > 0 ? (count / values.length) * 100 : 0;
    
    return {
      range: range.range,
      min: range.min,
      max: range.max,
      count,
      percentage: Math.round(percentage * 10) / 10 // Arrondi à 1 décimale
    };
  });
}

/**
 * Détecte les valeurs aberrantes (outliers) avec la méthode IQR
 */
function detectOutliers(values: number[]): number[] {
  if (values.length < 4) return [];
  
  const q1 = calculatePercentile(values, 25);
  const q3 = calculatePercentile(values, 75);
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return values.filter(value => value < lowerBound || value > upperBound);
}

/**
 * Calcule l'asymétrie (skewness)
 */
function calculateSkewness(values: number[]): number {
  if (values.length < 3) return 0;
  
  const mean = calculateMean(values);
  const { standardDeviation } = calculateStandardDeviation(values);
  
  if (standardDeviation === 0) return 0;
  
  const n = values.length;
  const m3 = values.reduce((sum, value) => sum + Math.pow((value - mean) / standardDeviation, 3), 0) / n;
  
  return m3;
}

/**
 * Calcule l'aplatissement (kurtosis)
 */
function calculateKurtosis(values: number[]): number {
  if (values.length < 4) return 0;
  
  const mean = calculateMean(values);
  const { standardDeviation } = calculateStandardDeviation(values);
  
  if (standardDeviation === 0) return 0;
  
  const n = values.length;
  const m4 = values.reduce((sum, value) => sum + Math.pow((value - mean) / standardDeviation, 4), 0) / n;
  
  return m4 - 3; // Excès de kurtosis (0 = distribution normale)
}

/**
 * Détermine le niveau de la classe
 */
function determineClassLevel(average: number, maxScore: number): StatisticsData['classLevel'] {
  const percentage = (average / maxScore) * 100;
  
  if (percentage >= 90) return 'excellent';
  if (percentage >= 75) return 'good';
  if (percentage >= 60) return 'average';
  if (percentage >= 45) return 'below_average';
  return 'concerning';
}

/**
 * Hook principal pour les calculs statistiques
 */
export function useStatistics(
  evaluation: Evaluation | null,
  results: EvaluationResult[],
  students: Student[]
): StatisticsData | null {
  return useMemo(() => {
    if (!evaluation || !results.length || !students.length) {
      return null;
    }

    // Filtrer les résultats valides
    const validResults = results.filter(result => 
      students.some(student => student.id === result.studentId)
    );

    const presentResults = validResults.filter(result => !result.isAbsent);
    const absentResults = validResults.filter(result => result.isAbsent);
    
    // Extraire les scores valides (présents avec note)
    const validScores = presentResults
      .filter(result => result.score !== null && result.score !== undefined)
      .map(result => Number(result.score))
      .filter(score => !isNaN(score));

    // Calculs de base
    const totalStudents = students.length;
    const presentStudents = presentResults.length;
    const absentStudents = absentResults.length;

    // Si pas assez de données
    if (validScores.length === 0) {
      return {
        evaluation,
        totalStudents,
        presentStudents,
        absentStudents,
        validScores: [],
        average: 0,
        median: 0,
        mode: null,
        standardDeviation: 0,
        variance: 0,
        range: 0,
        min: 0,
        max: 0,
        quartiles: { q1: 0, q2: 0, q3: 0 },
        percentiles: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0, p95: 0 },
        distribution: [],
        passingRate: 0,
        excellenceRate: 0,
        difficultyRate: 0,
        isNormalDistribution: false,
        skewness: 0,
        kurtosis: 0,
        outliers: [],
        classLevel: 'concerning' as const,
        calculatedAt: new Date(),
        isReliable: false
      };
    }

    // Calculs statistiques
    const average = calculateMean(validScores);
    const median = calculateMedian(validScores);
    const mode = calculateMode(validScores);
    
    const { standardDeviation, variance } = calculateStandardDeviation(validScores);
    
    const min = Math.min(...validScores);
    const max = Math.max(...validScores);
    const range = max - min;
    
    // Quartiles et percentiles
    const quartiles = {
      q1: calculatePercentile(validScores, 25),
      q2: calculatePercentile(validScores, 50),
      q3: calculatePercentile(validScores, 75)
    };
    
    const percentiles = {
      p10: calculatePercentile(validScores, 10),
      p25: calculatePercentile(validScores, 25),
      p50: calculatePercentile(validScores, 50),
      p75: calculatePercentile(validScores, 75),
      p90: calculatePercentile(validScores, 90),
      p95: calculatePercentile(validScores, 95)
    };
    
    // Distribution
    const distribution = calculateDistribution(validScores, Number(evaluation.maxScore));
    
    // Taux de performance
    const maxScore = Number(evaluation.maxScore);
    const passingThreshold = maxScore * 0.5; // 50% pour réussite
    const excellenceThreshold = maxScore * 0.8; // 80% pour excellence
    const difficultyThreshold = maxScore * 0.4; // 40% pour difficulté
    
    const passingRate = (validScores.filter(score => score >= passingThreshold).length / validScores.length) * 100;
    const excellenceRate = (validScores.filter(score => score >= excellenceThreshold).length / validScores.length) * 100;
    const difficultyRate = (validScores.filter(score => score < difficultyThreshold).length / validScores.length) * 100;
    
    // Analyses avancées
    const outliers = detectOutliers(validScores);
    const skewness = calculateSkewness(validScores);
    const kurtosis = calculateKurtosis(validScores);
    
    // Test de normalité simple (basé sur skewness et kurtosis)
    const isNormalDistribution = Math.abs(skewness) < 1 && Math.abs(kurtosis) < 1;
    
    const classLevel = determineClassLevel(average, maxScore);
    
    return {
      evaluation,
      totalStudents,
      presentStudents,
      absentStudents,
      validScores,
      average: Math.round(average * 100) / 100,
      median: Math.round(median * 100) / 100,
      mode: mode ? Math.round(mode * 100) / 100 : null,
      standardDeviation: Math.round(standardDeviation * 100) / 100,
      variance: Math.round(variance * 100) / 100,
      range: Math.round(range * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      quartiles: {
        q1: Math.round(quartiles.q1 * 100) / 100,
        q2: Math.round(quartiles.q2 * 100) / 100,
        q3: Math.round(quartiles.q3 * 100) / 100
      },
      percentiles: {
        p10: Math.round(percentiles.p10 * 100) / 100,
        p25: Math.round(percentiles.p25 * 100) / 100,
        p50: Math.round(percentiles.p50 * 100) / 100,
        p75: Math.round(percentiles.p75 * 100) / 100,
        p90: Math.round(percentiles.p90 * 100) / 100,
        p95: Math.round(percentiles.p95 * 100) / 100
      },
      distribution,
      passingRate: Math.round(passingRate * 10) / 10,
      excellenceRate: Math.round(excellenceRate * 10) / 10,
      difficultyRate: Math.round(difficultyRate * 10) / 10,
      isNormalDistribution,
      skewness: Math.round(skewness * 1000) / 1000,
      kurtosis: Math.round(kurtosis * 1000) / 1000,
      outliers: outliers.map(o => Math.round(o * 100) / 100),
      classLevel,
      calculatedAt: new Date(),
      isReliable: validScores.length >= 5 // Minimum 5 élèves pour des stats fiables
    };
  }, [evaluation, results, students]);
}

export default useStatistics;
