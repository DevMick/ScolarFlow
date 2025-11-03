// ========================================
// UTILITAIRES MATHÉMATIQUES POUR ÉVALUATIONS
// ========================================

import { RoundingMethod } from '@edustats/shared';

/**
 * Calcule la médiane d'un tableau de nombres
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * Calcule l'écart-type d'un tableau de nombres
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / (values.length - 1);
  
  return Math.sqrt(variance);
}

/**
 * Calcule le percentile d'une valeur dans un ensemble
 */
export function calculatePercentile(value: number, values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const belowCount = sorted.filter(v => v < value).length;
  const equalCount = sorted.filter(v => v === value).length;
  
  // Percentile = (nombre de valeurs inférieures + 0.5 * nombre de valeurs égales) / total * 100
  return ((belowCount + (equalCount * 0.5)) / sorted.length) * 100;
}

/**
 * Calcule les quartiles d'un ensemble de données
 */
export function calculateQuartiles(values: number[]): {
  q1: number;
  q2: number; // médiane
  q3: number;
} {
  if (values.length === 0) {
    return { q1: 0, q2: 0, q3: 0 };
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  
  const q2 = calculateMedian(sorted);
  const midIndex = Math.floor(sorted.length / 2);
  
  const lowerHalf = sorted.slice(0, midIndex);
  const upperHalf = sorted.length % 2 === 0 
    ? sorted.slice(midIndex)
    : sorted.slice(midIndex + 1);
  
  const q1 = calculateMedian(lowerHalf);
  const q3 = calculateMedian(upperHalf);
  
  return { q1, q2, q3 };
}

/**
 * Arrondit une valeur selon la méthode spécifiée
 */
export function roundValue(value: number, method: RoundingMethod): number {
  switch (method) {
    case 'none':
      return value;
      
    case 'nearest_integer':
      return Math.round(value);
      
    case 'nearest_half':
      return Math.round(value * 2) / 2;
      
    case 'nearest_quarter':
      return Math.round(value * 4) / 4;
      
    case 'one_decimal':
      return Math.round(value * 10) / 10;
      
    case 'two_decimals':
      return Math.round(value * 100) / 100;
      
    case 'ceil':
      return Math.ceil(value);
      
    case 'floor':
      return Math.floor(value);
      
    default:
      return Math.round(value * 100) / 100; // Par défaut: 2 décimales
  }
}

/**
 * Arrondit à un nombre spécifique de décimales
 */
export function roundToDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calcule la moyenne pondérée
 */
export function calculateWeightedAverage(
  values: Array<{ score: number; weight: number }>
): number {
  if (values.length === 0) return 0;
  
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return 0;
  
  const weightedSum = values.reduce((sum, item) => sum + (item.score * item.weight), 0);
  return weightedSum / totalWeight;
}

/**
 * Normalise un score sur une échelle donnée
 */
export function normalizeScore(
  score: number,
  currentMax: number,
  targetMax: number = 20
): number {
  if (currentMax === 0) return 0;
  return (score / currentMax) * targetMax;
}

/**
 * Calcule le rang d'une valeur dans un ensemble (1 = meilleur)
 */
export function calculateRank(
  value: number,
  values: number[],
  descending: boolean = true
): number {
  const sorted = [...values].sort(descending ? (a, b) => b - a : (a, b) => a - b);
  const index = sorted.findIndex(v => v === value);
  return index + 1;
}

/**
 * Détecte les valeurs aberrantes (outliers) avec la méthode IQR
 */
export function detectOutliers(values: number[]): {
  outliers: number[];
  lowerBound: number;
  upperBound: number;
} {
  if (values.length < 4) {
    return { outliers: [], lowerBound: 0, upperBound: 0 };
  }
  
  const { q1, q3 } = calculateQuartiles(values);
  const iqr = q3 - q1;
  const lowerBound = q1 - (1.5 * iqr);
  const upperBound = q3 + (1.5 * iqr);
  
  const outliers = values.filter(v => v < lowerBound || v > upperBound);
  
  return { outliers, lowerBound, upperBound };
}

/**
 * Calcule la distribution des notes par tranches
 */
export function calculateScoreDistribution(
  scores: number[],
  maxScore: number,
  numberOfBins: number = 5
): Array<{
  range: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
}> {
  if (scores.length === 0) return [];
  
  const binSize = maxScore / numberOfBins;
  const distribution = [];
  
  for (let i = 0; i < numberOfBins; i++) {
    const min = i * binSize;
    const max = (i + 1) * binSize;
    const count = scores.filter(score => score >= min && score < max).length;
    
    // Pour le dernier bin, inclure les scores égaux au maximum
    const actualCount = i === numberOfBins - 1 
      ? scores.filter(score => score >= min && score <= max).length
      : count;
    
    distribution.push({
      range: `${roundToDecimals(min, 1)}-${roundToDecimals(max, 1)}`,
      min: roundToDecimals(min, 2),
      max: roundToDecimals(max, 2),
      count: actualCount,
      percentage: roundToDecimals((actualCount / scores.length) * 100, 1)
    });
  }
  
  return distribution;
}

/**
 * Calcule les statistiques de base d'un ensemble de scores
 */
export function calculateBasicStatistics(scores: number[]): {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  mode: number[];
  standardDeviation: number;
  variance: number;
  range: number;
  quartiles: { q1: number; q2: number; q3: number };
} {
  if (scores.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      mode: [],
      standardDeviation: 0,
      variance: 0,
      range: 0,
      quartiles: { q1: 0, q2: 0, q3: 0 }
    };
  }
  
  const count = scores.length;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const mean = scores.reduce((sum, score) => sum + score, 0) / count;
  const median = calculateMedian(scores);
  const mode = calculateMode(scores);
  const standardDeviation = calculateStandardDeviation(scores);
  const variance = Math.pow(standardDeviation, 2);
  const range = max - min;
  const quartiles = calculateQuartiles(scores);
  
  return {
    count,
    min: roundToDecimals(min, 2),
    max: roundToDecimals(max, 2),
    mean: roundToDecimals(mean, 2),
    median: roundToDecimals(median, 2),
    mode: mode.map(m => roundToDecimals(m, 2)),
    standardDeviation: roundToDecimals(standardDeviation, 2),
    variance: roundToDecimals(variance, 2),
    range: roundToDecimals(range, 2),
    quartiles: {
      q1: roundToDecimals(quartiles.q1, 2),
      q2: roundToDecimals(quartiles.q2, 2),
      q3: roundToDecimals(quartiles.q3, 2)
    }
  };
}

/**
 * Calcule le mode (valeur(s) la/les plus fréquente(s))
 */
export function calculateMode(values: number[]): number[] {
  if (values.length === 0) return [];
  
  const frequency: Record<string, number> = {};
  let maxFreq = 0;
  
  // Compter les fréquences
  for (const value of values) {
    const key = value.toString();
    frequency[key] = (frequency[key] || 0) + 1;
    maxFreq = Math.max(maxFreq, frequency[key]);
  }
  
  // Si toutes les valeurs ont la même fréquence, pas de mode
  if (maxFreq === 1) return [];
  
  // Récupérer toutes les valeurs avec la fréquence maximale
  const modes = Object.entries(frequency)
    .filter(([_, freq]) => freq === maxFreq)
    .map(([value, _]) => parseFloat(value));
  
  return modes.sort((a, b) => a - b);
}

/**
 * Vérifie si une distribution suit une loi normale (test simple)
 */
export function isNormalDistribution(scores: number[]): {
  isNormal: boolean;
  skewness: number;
  kurtosis: number;
} {
  if (scores.length < 3) {
    return { isNormal: false, skewness: 0, kurtosis: 0 };
  }
  
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const n = scores.length;
  
  // Calcul de l'asymétrie (skewness)
  const m3 = scores.reduce((sum, score) => sum + Math.pow(score - mean, 3), 0) / n;
  const m2 = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / n;
  const skewness = m3 / Math.pow(m2, 1.5);
  
  // Calcul de l'aplatissement (kurtosis)
  const m4 = scores.reduce((sum, score) => sum + Math.pow(score - mean, 4), 0) / n;
  const kurtosis = (m4 / Math.pow(m2, 2)) - 3;
  
  // Distribution considérée comme normale si:
  // - |skewness| < 1 (asymétrie acceptable)
  // - |kurtosis| < 1 (aplatissement acceptable)
  const isNormal = Math.abs(skewness) < 1 && Math.abs(kurtosis) < 1;
  
  return {
    isNormal,
    skewness: roundToDecimals(skewness, 3),
    kurtosis: roundToDecimals(kurtosis, 3)
  };
}

/**
 * Calcule la corrélation entre deux séries de données
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;
  
  let numerator = 0;
  let sumSquareX = 0;
  let sumSquareY = 0;
  
  for (let i = 0; i < n; i++) {
    const deltaX = x[i] - meanX;
    const deltaY = y[i] - meanY;
    
    numerator += deltaX * deltaY;
    sumSquareX += deltaX * deltaX;
    sumSquareY += deltaY * deltaY;
  }
  
  const denominator = Math.sqrt(sumSquareX * sumSquareY);
  
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Convertit un score vers une note sur 20
 */
export function convertToScale20(score: number, maxScore: number): number {
  if (maxScore === 0) return 0;
  return roundToDecimals((score / maxScore) * 20, 2);
}

/**
 * Calcule le taux de réussite (pourcentage au-dessus d'un seuil)
 */
export function calculateSuccessRate(
  scores: number[],
  threshold: number = 10,
  maxScore: number = 20
): number {
  if (scores.length === 0) return 0;
  
  // Normaliser le seuil si nécessaire
  const normalizedThreshold = maxScore === 20 ? threshold : (threshold / 20) * maxScore;
  
  const passedCount = scores.filter(score => score >= normalizedThreshold).length;
  return roundToDecimals((passedCount / scores.length) * 100, 1);
}

/**
 * Génère des statistiques pour un rapport d'évaluation
 */
export function generateEvaluationReport(
  scores: number[],
  maxScore: number,
  absentCount: number = 0
): {
  overview: {
    totalStudents: number;
    presentStudents: number;
    absentStudents: number;
    participationRate: number;
  };
  scores: {
    statistics: ReturnType<typeof calculateBasicStatistics>;
    distribution: ReturnType<typeof calculateScoreDistribution>;
    successRate: number;
    scoresOn20: number[];
  };
  analysis: {
    isNormalDistribution: ReturnType<typeof isNormalDistribution>;
    outliers: ReturnType<typeof detectOutliers>;
    qualityIndicators: {
      difficulty: 'Très facile' | 'Facile' | 'Modérée' | 'Difficile' | 'Très difficile';
      discrimination: 'Faible' | 'Acceptable' | 'Bonne' | 'Excellente';
    };
  };
} {
  const totalStudents = scores.length + absentCount;
  const presentStudents = scores.length;
  const participationRate = totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0;
  
  const statistics = calculateBasicStatistics(scores);
  const distribution = calculateScoreDistribution(scores, maxScore);
  const successRate = calculateSuccessRate(scores, 10, maxScore);
  const scoresOn20 = scores.map(score => convertToScale20(score, maxScore));
  
  const normalityTest = isNormalDistribution(scores);
  const outliers = detectOutliers(scores);
  
  // Indicateurs de qualité de l'évaluation
  const averagePercentage = (statistics.mean / maxScore) * 100;
  let difficulty: 'Très facile' | 'Facile' | 'Modérée' | 'Difficile' | 'Très difficile';
  
  if (averagePercentage >= 85) difficulty = 'Très facile';
  else if (averagePercentage >= 70) difficulty = 'Facile';
  else if (averagePercentage >= 50) difficulty = 'Modérée';
  else if (averagePercentage >= 35) difficulty = 'Difficile';
  else difficulty = 'Très difficile';
  
  // Discrimination basée sur l'écart-type
  const discriminationPercentage = (statistics.standardDeviation / maxScore) * 100;
  let discrimination: 'Faible' | 'Acceptable' | 'Bonne' | 'Excellente';
  
  if (discriminationPercentage < 5) discrimination = 'Faible';
  else if (discriminationPercentage < 10) discrimination = 'Acceptable';
  else if (discriminationPercentage < 20) discrimination = 'Bonne';
  else discrimination = 'Excellente';
  
  return {
    overview: {
      totalStudents,
      presentStudents,
      absentStudents: absentCount,
      participationRate: roundToDecimals(participationRate, 1)
    },
    scores: {
      statistics,
      distribution,
      successRate,
      scoresOn20
    },
    analysis: {
      isNormalDistribution: normalityTest,
      outliers,
      qualityIndicators: {
        difficulty,
        discrimination
      }
    }
  };
}
