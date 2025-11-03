// ========================================
// HOOK USE RANKING - CLASSEMENTS ET RANGS
// ========================================

import { useMemo } from 'react';
import type { EvaluationResult, Student, Evaluation } from '../types';

/**
 * Interface pour les données de classement d'un élève
 */
export interface RankingData {
  student: Student;
  result: EvaluationResult | null;
  score: number | null;
  rank: number | null;
  isAbsent: boolean;
  percentile: number | null;
  deviation: number | null;        // Écart à la moyenne
  deviationPercentage: number | null; // Écart en pourcentage
  relativePosition: 'top' | 'above_average' | 'average' | 'below_average' | 'bottom' | 'absent';
  trend: 'up' | 'down' | 'stable' | 'unknown'; // Évolution (nécessite historique)
  isOutlier: boolean;             // Valeur aberrante
  quartile: 1 | 2 | 3 | 4 | null; // Quartile (1 = 25% supérieur)
  
  // Métadonnées pour affichage
  displayName: string;            // Nom pour affichage (anonymisable)
  anonymousId: string;            // ID anonyme (Élève 1, 2, 3...)
  hasNote: boolean;               // A une note (pas seulement absent)
}

/**
 * Options pour le calcul du classement
 */
export interface RankingOptions {
  includeAbsent?: boolean;        // Inclure les absents dans le classement
  anonymize?: boolean;            // Anonymiser les noms
  sortBy?: 'score' | 'name' | 'rank'; // Critère de tri
  sortOrder?: 'asc' | 'desc';     // Ordre de tri
  showOnlyPresent?: boolean;      // Afficher seulement les présents
  highlightOutliers?: boolean;    // Mettre en évidence les valeurs aberrantes
}

/**
 * Interface pour les statistiques de classement
 */
export interface RankingStatistics {
  totalRanked: number;            // Nombre d'élèves classés
  avgRank: number;                // Rang moyen
  medianRank: number;             // Rang médian
  rankedStudents: number;         // Étudiants avec rang
  unrankedStudents: number;       // Étudiants sans rang (absents)
  tiesCount: number;              // Nombre d'ex-aequo
  topPerformers: RankingData[];   // Top 3 performers
  needsAttention: RankingData[];  // Élèves nécessitant attention
}

/**
 * Calcule le rang avec gestion des ex-aequo
 */
function calculateRanks(scores: { id: number; score: number }[]): Record<number, number> {
  // Trier par score décroissant
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  
  const ranks: Record<number, number> = {};
  let currentRank = 1;
  
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    
    // Si ce n'est pas le premier et que le score est différent du précédent
    if (i > 0 && sorted[i - 1].score !== current.score) {
      currentRank = i + 1;
    }
    
    ranks[current.id] = currentRank;
  }
  
  return ranks;
}

/**
 * Calcule les percentiles pour chaque élève
 */
function calculatePercentiles(scores: number[], studentScore: number): number {
  if (scores.length === 0) return 0;
  
  const lowerScores = scores.filter(score => score < studentScore).length;
  return (lowerScores / scores.length) * 100;
}

/**
 * Détermine la position relative d'un élève
 */
function determineRelativePosition(
  percentile: number | null,
  isAbsent: boolean
): RankingData['relativePosition'] {
  if (isAbsent) return 'absent';
  if (percentile === null) return 'average';
  
  if (percentile >= 90) return 'top';
  if (percentile >= 70) return 'above_average';
  if (percentile >= 30) return 'average';
  if (percentile >= 10) return 'below_average';
  return 'bottom';
}

/**
 * Détermine le quartile d'un élève
 */
function determineQuartile(percentile: number | null): RankingData['quartile'] {
  if (percentile === null) return null;
  
  if (percentile >= 75) return 1; // Premier quartile (25% supérieur)
  if (percentile >= 50) return 2; // Deuxième quartile
  if (percentile >= 25) return 3; // Troisième quartile
  return 4; // Quatrième quartile (25% inférieur)
}

/**
 * Détecte les valeurs aberrantes
 */
function detectOutliers(scores: number[], studentScore: number): boolean {
  if (scores.length < 4) return false;
  
  const sorted = [...scores].sort((a, b) => a - b);
  const q1Index = Math.floor(0.25 * (sorted.length - 1));
  const q3Index = Math.floor(0.75 * (sorted.length - 1));
  
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return studentScore < lowerBound || studentScore > upperBound;
}

/**
 * Génère un nom anonyme
 */
function generateAnonymousName(index: number): string {
  return `Élève ${index + 1}`;
}

/**
 * Hook principal pour les classements
 */
export function useRanking(
  evaluation: Evaluation | null,
  results: EvaluationResult[],
  students: Student[],
  options: RankingOptions = {}
): {
  ranking: RankingData[];
  statistics: RankingStatistics;
  loading: boolean;
  error: string | null;
} {
  const {
    includeAbsent = true,
    anonymize = false,
    sortBy = 'rank',
    sortOrder = 'asc',
    showOnlyPresent = false,
    highlightOutliers = true
  } = options;

  return useMemo(() => {
    if (!evaluation || !students.length) {
      return {
        ranking: [],
        statistics: {
          totalRanked: 0,
          avgRank: 0,
          medianRank: 0,
          rankedStudents: 0,
          unrankedStudents: 0,
          tiesCount: 0,
          topPerformers: [],
          needsAttention: []
        },
        loading: false,
        error: null
      };
    }

    try {
      // Créer une map des résultats par élève
      const resultsByStudent = new Map<number, EvaluationResult>();
      results.forEach(result => {
        resultsByStudent.set(result.studentId, result);
      });

      // Calculer les scores valides pour les statistiques
      const validScores = results
        .filter(result => !result.isAbsent && result.score !== null)
        .map(result => Number(result.score))
        .filter(score => !isNaN(score));

      const average = validScores.length > 0 
        ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length 
        : 0;

      // Calculer les rangs
      const scoresForRanking = results
        .filter(result => !result.isAbsent && result.score !== null)
        .map(result => ({
          id: result.studentId,
          score: Number(result.score)
        }));

      const ranks = calculateRanks(scoresForRanking);

      // Créer les données de classement pour chaque élève
      const rankingData: RankingData[] = students.map((student, index) => {
        const result = resultsByStudent.get(student.id) || null;
        const score = result && !result.isAbsent && result.score !== null 
          ? Number(result.score) 
          : null;
        const isAbsent = result?.isAbsent ?? false;
        const rank = score !== null ? (ranks[student.id] || null) : null;
        
        // Calculs statistiques pour cet élève
        const percentile = score !== null && validScores.length > 0
          ? calculatePercentiles(validScores, score)
          : null;

        const deviation = score !== null && average > 0
          ? score - average
          : null;

        const deviationPercentage = score !== null && average > 0
          ? ((score - average) / average) * 100
          : null;

        const relativePosition = determineRelativePosition(percentile, isAbsent);
        const quartile = determineQuartile(percentile);
        const isOutlier = score !== null && highlightOutliers
          ? detectOutliers(validScores, score)
          : false;

        return {
          student,
          result,
          score,
          rank,
          isAbsent,
          percentile: percentile ? Math.round(percentile * 10) / 10 : null,
          deviation: deviation ? Math.round(deviation * 100) / 100 : null,
          deviationPercentage: deviationPercentage ? Math.round(deviationPercentage * 10) / 10 : null,
          relativePosition,
          trend: 'unknown' as const, // TODO: Implémenter avec historique
          isOutlier,
          quartile,
          displayName: anonymize ? generateAnonymousName(index) : `${student.firstName} ${student.lastName}`,
          anonymousId: generateAnonymousName(index),
          hasNote: score !== null
        };
      });

      // Filtrer selon les options
      let filteredRanking = rankingData;
      
      if (showOnlyPresent) {
        filteredRanking = filteredRanking.filter(item => !item.isAbsent);
      }
      
      if (!includeAbsent) {
        filteredRanking = filteredRanking.filter(item => item.hasNote);
      }

      // Trier selon les critères
      filteredRanking.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'score':
            if (a.score === null && b.score === null) comparison = 0;
            else if (a.score === null) comparison = 1;
            else if (b.score === null) comparison = -1;
            else comparison = b.score - a.score; // Score décroissant par défaut
            break;
            
          case 'rank':
            if (a.rank === null && b.rank === null) comparison = 0;
            else if (a.rank === null) comparison = 1;
            else if (b.rank === null) comparison = -1;
            else comparison = a.rank - b.rank; // Rang croissant par défaut
            break;
            
          case 'name':
            comparison = a.displayName.localeCompare(b.displayName);
            break;
            
          default:
            comparison = 0;
        }
        
        return sortOrder === 'desc' ? -comparison : comparison;
      });

      // Calculer les statistiques de classement
      const rankedStudents = rankingData.filter(item => item.rank !== null);
      const unrankedStudents = rankingData.filter(item => item.rank === null);
      
      const avgRank = rankedStudents.length > 0
        ? rankedStudents.reduce((sum, item) => sum + (item.rank || 0), 0) / rankedStudents.length
        : 0;

      const rankedScores = rankedStudents.map(item => item.rank || 0).sort((a, b) => a - b);
      const medianRank = rankedScores.length > 0
        ? rankedScores[Math.floor(rankedScores.length / 2)]
        : 0;

      // Détecter les ex-aequo
      const scoreGroups = new Map<number, number>();
      rankedStudents.forEach(item => {
        if (item.score !== null) {
          scoreGroups.set(item.score, (scoreGroups.get(item.score) || 0) + 1);
        }
      });
      const tiesCount = Array.from(scoreGroups.values()).filter(count => count > 1).length;

      // Top performers (3 premiers)
      const topPerformers = rankedStudents
        .filter(item => item.rank !== null)
        .sort((a, b) => (a.rank || 0) - (b.rank || 0))
        .slice(0, 3);

      // Élèves nécessitant attention (quartile inférieur ou valeurs aberrantes basses)
      const needsAttention = rankedStudents
        .filter(item => 
          item.quartile === 4 || 
          (item.isOutlier && (item.score || 0) < average) ||
          item.relativePosition === 'bottom'
        )
        .slice(0, 5);

      const statistics: RankingStatistics = {
        totalRanked: rankedStudents.length,
        avgRank: Math.round(avgRank * 10) / 10,
        medianRank,
        rankedStudents: rankedStudents.length,
        unrankedStudents: unrankedStudents.length,
        tiesCount,
        topPerformers,
        needsAttention
      };

      return {
        ranking: filteredRanking,
        statistics,
        loading: false,
        error: null
      };

    } catch (error) {
      console.error('Erreur lors du calcul du classement:', error);
      return {
        ranking: [],
        statistics: {
          totalRanked: 0,
          avgRank: 0,
          medianRank: 0,
          rankedStudents: 0,
          unrankedStudents: 0,
          tiesCount: 0,
          topPerformers: [],
          needsAttention: []
        },
        loading: false,
        error: 'Erreur lors du calcul du classement'
      };
    }
  }, [evaluation, results, students, includeAbsent, anonymize, sortBy, sortOrder, showOnlyPresent, highlightOutliers]);
}

export default useRanking;
