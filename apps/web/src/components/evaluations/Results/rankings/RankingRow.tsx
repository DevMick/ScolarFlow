// ========================================
// RANKING ROW - LIGNE DE CLASSEMENT
// ========================================

import React, { useCallback } from 'react';
import type { RankingData } from '../../../../hooks/useRanking';
import type { Evaluation } from '../../../../types';
import { cn } from '../../../../utils/classNames';

/**
 * Props du composant RankingRow
 */
interface RankingRowProps {
  data: RankingData;
  evaluation: Evaluation;
  isAnonymous: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  isEven: boolean;
  compact?: boolean;
  onSelect: (studentId: number, selected: boolean) => void;
  onExpand: (studentId: number | null) => void;
}

/**
 * Composant ligne de classement
 */
export const RankingRow: React.FC<RankingRowProps> = ({
  data,
  evaluation,
  isAnonymous,
  isSelected,
  isExpanded,
  isEven,
  compact = false,
  onSelect,
  onExpand
}) => {
  // ========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const handleSelectChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSelect(data.student.id, e.target.checked);
  }, [data.student.id, onSelect]);

  const handleExpandToggle = useCallback(() => {
    onExpand(isExpanded ? null : data.student.id);
  }, [data.student.id, isExpanded, onExpand]);

  // ========================================
  // FONCTIONS D'AFFICHAGE
  // ========================================

  const getPositionColor = (position: RankingData['relativePosition']) => {
    switch (position) {
      case 'top': return 'text-green-600 bg-green-50';
      case 'above_average': return 'text-blue-600 bg-blue-50';
      case 'average': return 'text-yellow-600 bg-yellow-50';
      case 'below_average': return 'text-orange-600 bg-orange-50';
      case 'bottom': return 'text-red-600 bg-red-50';
      case 'absent': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPositionLabel = (position: RankingData['relativePosition']) => {
    switch (position) {
      case 'top': return 'Excellence';
      case 'above_average': return 'Au-dessus';
      case 'average': return 'Moyenne';
      case 'below_average': return 'En-dessous';
      case 'bottom': return 'Difficulté';
      case 'absent': return 'Absent';
      default: return 'Inconnu';
    }
  };

  const formatScore = (score: number | null) => {
    if (score === null) return '-';
    return score.toFixed(1);
  };

  const formatDeviation = (deviation: number | null, deviationPercentage: number | null) => {
    if (deviation === null) return '-';
    
    const sign = deviation >= 0 ? '+' : '';
    const color = deviation >= 0 ? 'text-green-600' : 'text-red-600';
    
    return (
      <span className={color}>
        {sign}{deviation.toFixed(1)}
        {deviationPercentage !== null && (
          <span className="text-xs ml-1">
            ({sign}{deviationPercentage.toFixed(0)}%)
          </span>
        )}
      </span>
    );
  };

  const getRankDisplay = (rank: number | null, isAbsent: boolean) => {
    if (isAbsent) return { display: 'ABS', color: 'text-gray-500' };
    if (rank === null) return { display: '-', color: 'text-gray-500' };
    
    // Couleurs selon le rang
    let color = 'text-gray-900';
    if (rank === 1) color = 'text-yellow-600 font-bold'; // 1er
    else if (rank === 2) color = 'text-gray-600 font-bold'; // 2ème
    else if (rank === 3) color = 'text-amber-600 font-bold'; // 3ème
    else if (rank <= 5) color = 'text-green-600'; // Top 5
    
    return { display: rank.toString(), color };
  };

  // ========================================
  // RENDU
  // ========================================

  const rankDisplay = getRankDisplay(data.rank, data.isAbsent);
  const positionColor = getPositionColor(data.relativePosition);
  const positionLabel = getPositionLabel(data.relativePosition);

  return (
    <>
      <tr
        className={cn(
          'transition-colors duration-150',
          isEven ? 'bg-white' : 'bg-gray-50',
          isSelected && 'bg-blue-50 border-l-4 border-blue-500',
          data.isOutlier && 'ring-1 ring-yellow-300',
          'hover:bg-blue-25'
        )}
      >
        {/* Checkbox de sélection */}
        <td className="px-3 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectChange}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </td>

        {/* Rang */}
        <td className="px-3 py-3 text-center">
          <div className="flex items-center justify-center">
            <span className={cn('text-sm font-medium', rankDisplay.color)}>
              {rankDisplay.display}
            </span>
            {data.rank === 1 && <span className="ml-1">🥇</span>}
            {data.rank === 2 && <span className="ml-1">🥈</span>}
            {data.rank === 3 && <span className="ml-1">🥉</span>}
            {data.isOutlier && (
              <span className="ml-1" title="Valeur aberrante">⚠️</span>
            )}
          </div>
        </td>

        {/* Nom/Identifiant élève */}
        <td className="px-3 py-3">
          <div className="flex items-center">
            <div>
              <div className="text-sm font-medium text-gray-900">
                {isAnonymous ? data.anonymousId : data.displayName}
              </div>
              {data.quartile && (
                <div className="text-xs text-gray-500">
                  Q{data.quartile} • {data.percentile !== null ? `${data.percentile.toFixed(0)}e percentile` : 'N/A'}
                </div>
              )}
            </div>
          </div>
        </td>

        {/* Note */}
        <td className="px-3 py-3 text-center">
          <div className="flex flex-col items-center">
            {data.isAbsent ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Absent
              </span>
            ) : (
              <>
                <span className="text-lg font-semibold text-gray-900">
                  {formatScore(data.score)}
                </span>
                <span className="text-xs text-gray-500">
                  /{evaluation.maxScore}
                </span>
              </>
            )}
          </div>
        </td>

        {/* Percentile */}
        <td className="px-3 py-3 text-center">
          <span className="text-sm text-gray-900">
            {data.percentile !== null ? `${data.percentile.toFixed(0)}%` : '-'}
          </span>
        </td>

        {/* Écart à la moyenne */}
        <td className="px-3 py-3 text-center">
          <div className="text-sm">
            {formatDeviation(data.deviation, data.deviationPercentage)}
          </div>
        </td>

        {/* Position relative */}
        <td className="px-3 py-3 text-center">
          <span className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            positionColor
          )}>
            {positionLabel}
          </span>
        </td>

        {/* Bouton d'expansion des détails */}
        {!compact && (
          <td className="px-3 py-3 text-center">
            <button
              onClick={handleExpandToggle}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title={isExpanded ? 'Masquer les détails' : 'Afficher les détails'}
            >
              <svg 
                className={cn('w-4 h-4 transition-transform', isExpanded && 'transform rotate-180')}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </td>
        )}
      </tr>

      {/* Ligne de détails étendue */}
      {isExpanded && !compact && (
        <tr className={cn(
          'transition-all duration-200',
          isEven ? 'bg-gray-25' : 'bg-gray-75'
        )}>
          <td colSpan={isAnonymous ? 7 : 8} className="px-3 py-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Informations détaillées */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Informations détaillées</h4>
                  <dl className="space-y-1 text-sm">
                    {!isAnonymous && (
                      <>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Nom complet:</dt>
                          <dd className="text-gray-900">{data.student.firstName} {data.student.lastName}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500">Né(e) le:</dt>
                          <dd className="text-gray-900">
                            {data.student.dateOfBirth ? 
                              new Date(data.student.dateOfBirth).toLocaleDateString('fr-FR') : 
                              'N/A'
                            }
                          </dd>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Statut:</dt>
                      <dd className="text-gray-900">{data.student.status || 'Actif'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Statistiques de performance */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Performance</h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Quartile:</dt>
                      <dd className="text-gray-900">
                        {data.quartile ? `Q${data.quartile}` : 'N/A'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Percentile:</dt>
                      <dd className="text-gray-900">
                        {data.percentile !== null ? `${data.percentile.toFixed(1)}%` : 'N/A'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Valeur aberrante:</dt>
                      <dd className="text-gray-900">
                        {data.isOutlier ? 'Oui ⚠️' : 'Non'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Notes et commentaires */}
                {data.result?.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                      {data.result.notes}
                    </p>
                  </div>
                )}

                {/* Informations d'absence */}
                {data.isAbsent && data.result?.absentReason && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Raison d'absence</h4>
                    <p className="text-sm text-gray-700">
                      {data.result.absentReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default RankingRow;
