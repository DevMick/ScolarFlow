// ========================================
// RANKING PREVIEW - APERÇU CLASSEMENT TEMPS RÉEL
// ========================================

import React, { useMemo } from 'react';
import { cn } from '../../../utils/classNames';
import type { Evaluation, EvaluationResult, Student } from '../../../types';

/**
 * Props du composant RankingPreview
 */
interface RankingPreviewProps {
  evaluation: Evaluation;
  students: Student[];
  results: Record<number, EvaluationResult>;
  className?: string;
  maxDisplay?: number;
  showAnimation?: boolean;
}

/**
 * Interface pour un élément du classement
 */
interface RankingItem {
  student: Student;
  result: EvaluationResult;
  rank: number;
  score: number;
  percentage: number;
  isExAequo: boolean;
  change?: 'up' | 'down' | 'same' | 'new';
}

/**
 * Composant pour afficher un aperçu du classement en temps réel
 */
export const RankingPreview = React.memo<RankingPreviewProps>(({
  evaluation,
  students,
  results,
  className = '',
  maxDisplay = 10,
  showAnimation = true
}) => {
  // ========================================
  // CALCUL DU CLASSEMENT
  // ========================================

  const ranking = useMemo<RankingItem[]>(() => {
    const maxScore = Number(evaluation.maxScore);
    
    // Créer la liste des étudiants avec leurs résultats
    const studentsWithScores = students
      .map(student => {
        const result = results[student.id];
        if (!result || result.isAbsent || result.score === null || result.score === undefined) {
          return null;
        }
        
        return {
          student,
          result,
          score: Number(result.score),
          percentage: (Number(result.score) / maxScore) * 100
        };
      })
      .filter(Boolean) as Array<{
        student: Student;
        result: EvaluationResult;
        score: number;
        percentage: number;
      }>;

    // Trier par score décroissant
    studentsWithScores.sort((a, b) => b.score - a.score);

    // Attribuer les rangs avec gestion des ex-aequo
    let currentRank = 1;
    const rankingItems: RankingItem[] = [];

    for (let i = 0; i < studentsWithScores.length; i++) {
      const current = studentsWithScores[i];
      const isExAequo = i > 0 && studentsWithScores[i - 1].score === current.score;
      
      // Si ce n'est pas un ex-aequo avec le précédent, mettre à jour le rang
      if (i > 0 && studentsWithScores[i - 1].score !== current.score) {
        currentRank = i + 1;
      }

      rankingItems.push({
        ...current,
        rank: currentRank,
        isExAequo
      });
    }

    return rankingItems.slice(0, maxDisplay);
  }, [students, results, evaluation.maxScore, maxDisplay]);

  // ========================================
  // UTILITAIRES DE RENDU
  // ========================================

  const formatScore = (score: number) => {
    return score % 1 === 0 ? score.toString() : score.toFixed(1);
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 2: return 'text-gray-600 bg-gray-50 border-gray-200';
      case 3: return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-green-500';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  // ========================================
  // RENDU
  // ========================================

  if (ranking.length === 0) {
    return (
      <div className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏆 Classement provisoire
        </h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>Le classement apparaîtra dès qu'il y aura des notes saisies</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          🏆 Classement provisoire
        </h3>
        <div className="text-sm text-gray-500">
          Top {Math.min(maxDisplay, ranking.length)} / {students.length}
        </div>
      </div>

      {/* Liste du classement */}
      <div className="space-y-2">
        {ranking.map((item, index) => (
          <div
            key={item.student.id}
            className={cn(
              'flex items-center p-3 rounded-lg border transition-all duration-300',
              'hover:shadow-sm',
              showAnimation && 'animate-in slide-in-from-left',
              item.rank <= 3 ? getRankColor(item.rank) : 'bg-gray-50 border-gray-200'
            )}
            style={{
              animationDelay: showAnimation ? `${index * 100}ms` : '0ms'
            }}
          >
            {/* Rang */}
            <div className="flex items-center justify-center w-12 h-10 mr-3">
              <span className="text-lg font-semibold">
                {getRankIcon(item.rank)}
              </span>
            </div>

            {/* Informations élève */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="truncate">
                  <p className="font-medium text-gray-900 truncate">
                    {item.student.firstName} {item.student.lastName}
                  </p>
                  {item.student.studentNumber && (
                    <p className="text-xs text-gray-500">
                      #{item.student.studentNumber}
                    </p>
                  )}
                </div>

                {/* Score et pourcentage */}
                <div className="text-right ml-4">
                  <div className={cn('font-semibold', getScoreColor(item.percentage))}>
                    {formatScore(item.score)}/{evaluation.maxScore}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round(item.percentage)}%
                  </div>
                </div>
              </div>

              {/* Barre de progression du score */}
              <div className="mt-2">
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      'h-full transition-all duration-500 ease-out rounded-full',
                      item.percentage >= 90 ? 'bg-green-600' :
                      item.percentage >= 70 ? 'bg-green-500' :
                      item.percentage >= 50 ? 'bg-yellow-500' :
                      item.percentage >= 30 ? 'bg-orange-500' : 'bg-red-500'
                    )}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Indicateurs ex-aequo */}
            {item.isExAequo && (
              <div className="ml-2">
                <span 
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                  title="Ex-aequo"
                >
                  =
                </span>
              </div>
            )}

            {/* Évolution (si disponible) */}
            {item.change && (
              <div className="ml-2">
                <span className={cn(
                  'text-xs px-2 py-1 rounded-full',
                  item.change === 'up' && 'bg-green-100 text-green-800',
                  item.change === 'down' && 'bg-red-100 text-red-800',
                  item.change === 'same' && 'bg-gray-100 text-gray-800',
                  item.change === 'new' && 'bg-blue-100 text-blue-800'
                )}>
                  {item.change === 'up' && '↗️'}
                  {item.change === 'down' && '↘️'}
                  {item.change === 'same' && '→'}
                  {item.change === 'new' && '✨'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer avec informations supplémentaires */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Élèves classés: {ranking.length}</span>
            <span>•</span>
            <span>Notes saisies: {ranking.length}/{students.length}</span>
          </div>
          
          {ranking.length < students.length && (
            <div className="text-xs text-gray-500">
              {students.length - ranking.length} élève(s) en attente de note
            </div>
          )}
        </div>

        {/* Message d'encouragement pour le premier */}
        {ranking.length > 0 && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center text-sm">
              <span className="mr-2">🎉</span>
              <span className="text-yellow-800">
                <strong>{ranking[0].student.firstName} {ranking[0].student.lastName}</strong> 
                {' '}mène actuellement avec {formatScore(ranking[0].score)}/{evaluation.maxScore}
                {' '}({Math.round(ranking[0].percentage)}%)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

RankingPreview.displayName = 'RankingPreview';

export default RankingPreview;
