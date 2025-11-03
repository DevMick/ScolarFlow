// ========================================
// LIVE STATS - STATISTIQUES EN TEMPS RÉEL
// ========================================

import React, { useMemo } from 'react';
import { cn } from '../../../utils/classNames';
import type { Evaluation, EvaluationResult, Student } from '../../../types';

/**
 * Props du composant LiveStats
 */
interface LiveStatsProps {
  evaluation: Evaluation;
  students: Student[];
  results: Record<number, EvaluationResult>;
  className?: string;
  compact?: boolean;
}

/**
 * Interface pour les statistiques calculées
 */
interface CalculatedStats {
  // Participation
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  completedResults: number;
  participationRate: number;
  
  // Notes
  scores: number[];
  averageScore: number;
  averagePercentage: number;
  medianScore: number;
  minScore: number;
  maxScore: number;
  
  // Distribution
  excellentCount: number; // >= 90%
  goodCount: number;      // 70-89%
  averageCount: number;   // 50-69%
  belowAverageCount: number; // < 50%
  
  // Progression
  progressPercentage: number;
}

/**
 * Composant pour afficher les statistiques en temps réel
 */
export const LiveStats = React.memo<LiveStatsProps>(({
  evaluation,
  students,
  results,
  className = '',
  compact = false
}) => {
  // ========================================
  // CALCULS STATISTIQUES
  // ========================================

  const stats = useMemo<CalculatedStats>(() => {
    const totalStudents = students.length;
    const maxScore = Number(evaluation.maxScore);
    
    // Filtrer les résultats valides
    const validResults = students.map(student => results[student.id]).filter(Boolean);
    const presentResults = validResults.filter(result => !result.isAbsent);
    const absentResults = validResults.filter(result => result.isAbsent);
    const completedResults = validResults.filter(result => 
      result.isAbsent || (result.score !== null && result.score !== undefined)
    );

    // Extraire les notes valides
    const scores = presentResults
      .filter(result => result.score !== null && result.score !== undefined)
      .map(result => Number(result.score));

    // Calculs de base
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;

    const averagePercentage = (averageScore / maxScore) * 100;

    // Médiane
    const sortedScores = [...scores].sort((a, b) => a - b);
    const medianScore = sortedScores.length > 0
      ? sortedScores.length % 2 === 0
        ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
        : sortedScores[Math.floor(sortedScores.length / 2)]
      : 0;

    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const maxScoreAchieved = scores.length > 0 ? Math.max(...scores) : 0;

    // Distribution par niveau
    const excellentCount = scores.filter(score => (score / maxScore) >= 0.9).length;
    const goodCount = scores.filter(score => {
      const percentage = score / maxScore;
      return percentage >= 0.7 && percentage < 0.9;
    }).length;
    const averageCount = scores.filter(score => {
      const percentage = score / maxScore;
      return percentage >= 0.5 && percentage < 0.7;
    }).length;
    const belowAverageCount = scores.filter(score => (score / maxScore) < 0.5).length;

    // Taux de participation et progression
    const participationRate = totalStudents > 0 ? (presentResults.length / totalStudents) * 100 : 0;
    const progressPercentage = totalStudents > 0 ? (completedResults.length / totalStudents) * 100 : 0;

    return {
      totalStudents,
      presentStudents: presentResults.length,
      absentStudents: absentResults.length,
      completedResults: completedResults.length,
      participationRate,
      scores,
      averageScore,
      averagePercentage,
      medianScore,
      minScore,
      maxScore: maxScoreAchieved,
      excellentCount,
      goodCount,
      averageCount,
      belowAverageCount,
      progressPercentage
    };
  }, [evaluation.maxScore, students, results]);

  // ========================================
  // UTILITAIRES DE RENDU
  // ========================================

  const formatScore = (score: number) => {
    return score % 1 === 0 ? score.toString() : score.toFixed(1);
  };

  const formatPercentage = (percentage: number) => {
    return `${Math.round(percentage)}%`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-green-500';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // ========================================
  // RENDU COMPACT
  // ========================================

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-4 text-sm', className)}>
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">Progression:</span>
          <span className="font-medium">{formatPercentage(stats.progressPercentage)}</span>
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={cn('h-full transition-all duration-300', getProgressColor(stats.progressPercentage))}
              style={{ width: `${stats.progressPercentage}%` }}
            />
          </div>
        </div>

        {stats.scores.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Moyenne:</span>
            <span className={cn('font-medium', getScoreColor(stats.averagePercentage))}>
              {formatScore(stats.averageScore)}/{evaluation.maxScore}
            </span>
            <span className="text-gray-500 text-xs">
              ({formatPercentage(stats.averagePercentage)})
            </span>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <span className="text-gray-600">Présents:</span>
          <span className="font-medium">{stats.presentStudents}/{stats.totalStudents}</span>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDU COMPLET
  // ========================================

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          📊 Statistiques en temps réel
        </h3>
        <div className="text-sm text-gray-500">
          Mis à jour automatiquement
        </div>
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Participation */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
            👥 Participation
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total élèves</span>
              <span className="font-semibold">{stats.totalStudents}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Présents</span>
              <span className="font-semibold text-green-600">{stats.presentStudents}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Absents</span>
              <span className="font-semibold text-red-600">{stats.absentStudents}</span>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Taux de participation</span>
                <span className={cn('font-semibold', getScoreColor(stats.participationRate))}>
                  {formatPercentage(stats.participationRate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progression */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
            ⏱️ Progression
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Résultats saisis</span>
              <span className="font-semibold">{stats.completedResults}/{stats.totalStudents}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Progression</span>
                <span className="font-semibold">{formatPercentage(stats.progressPercentage)}</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={cn('h-full transition-all duration-500 ease-out', getProgressColor(stats.progressPercentage))}
                  style={{ width: `${stats.progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques de notes */}
        {stats.scores.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
              📈 Notes
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Moyenne</span>
                <div className="text-right">
                  <div className={cn('font-semibold', getScoreColor(stats.averagePercentage))}>
                    {formatScore(stats.averageScore)}/{evaluation.maxScore}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatPercentage(stats.averagePercentage)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Médiane</span>
                <span className="font-semibold">{formatScore(stats.medianScore)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Min - Max</span>
                <span className="font-semibold">
                  {formatScore(stats.minScore)} - {formatScore(stats.maxScore)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Distribution */}
        {stats.scores.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
              📊 Distribution
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Excellent (≥90%)</span>
                <span className="font-semibold text-green-600">{stats.excellentCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bien (70-89%)</span>
                <span className="font-semibold text-green-500">{stats.goodCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Moyen (50-69%)</span>
                <span className="font-semibold text-yellow-600">{stats.averageCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Faible (&lt;50%)</span>
                <span className="font-semibold text-red-500">{stats.belowAverageCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Graphique de distribution visuel */}
      {stats.scores.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="font-medium text-gray-700 mb-3">Distribution visuelle</h4>
          <div className="flex items-end space-x-2 h-16">
            <div className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-red-500 rounded-t transition-all duration-500"
                style={{ height: `${stats.belowAverageCount > 0 ? (stats.belowAverageCount / stats.scores.length) * 100 : 5}%` }}
              />
              <span className="text-xs text-gray-600 mt-1">Faible</span>
              <span className="text-xs font-semibold">{stats.belowAverageCount}</span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-yellow-600 rounded-t transition-all duration-500"
                style={{ height: `${stats.averageCount > 0 ? (stats.averageCount / stats.scores.length) * 100 : 5}%` }}
              />
              <span className="text-xs text-gray-600 mt-1">Moyen</span>
              <span className="text-xs font-semibold">{stats.averageCount}</span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-green-500 rounded-t transition-all duration-500"
                style={{ height: `${stats.goodCount > 0 ? (stats.goodCount / stats.scores.length) * 100 : 5}%` }}
              />
              <span className="text-xs text-gray-600 mt-1">Bien</span>
              <span className="text-xs font-semibold">{stats.goodCount}</span>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-green-600 rounded-t transition-all duration-500"
                style={{ height: `${stats.excellentCount > 0 ? (stats.excellentCount / stats.scores.length) * 100 : 5}%` }}
              />
              <span className="text-xs text-gray-600 mt-1">Excellent</span>
              <span className="text-xs font-semibold">{stats.excellentCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Message d'encouragement */}
      {stats.progressPercentage === 100 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-green-600 mr-2">🎉</span>
            <span className="text-green-800 font-medium">
              Félicitations ! Toutes les notes ont été saisies.
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

LiveStats.displayName = 'LiveStats';

export default LiveStats;
