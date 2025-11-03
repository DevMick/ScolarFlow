// ========================================
// RANKING TABLE - TABLEAU DE CLASSEMENT AVANCÉ
// ========================================

import React, { useState, useMemo, useCallback } from 'react';
import { RankingRow } from './RankingRow';
import { RankingFilters } from './RankingFilters';
import { RankingHeader, type SortKey, type SortDirection, type SortConfig } from './RankingHeader';
import type { RankingData } from '../../../../hooks/useRanking';
import type { Evaluation } from '../../../../types';
import { cn } from '../../../../utils/classNames';

/**
 * Interface pour les filtres
 */
interface TableFilters {
  showAbsentsOnly?: boolean;
  showPresentOnly?: boolean;
  minScore?: number;
  maxScore?: number;
  quartile?: 1 | 2 | 3 | 4 | null;
  searchTerm?: string;
  relativePosition?: 'top' | 'above_average' | 'average' | 'below_average' | 'bottom' | 'absent';
}

/**
 * Props du composant RankingTable
 */
interface RankingTableProps {
  evaluation: Evaluation;
  ranking: RankingData[];
  isAnonymous: boolean;
  filters?: TableFilters;
  onFiltersChange?: (filters: TableFilters) => void;
  className?: string;
  compact?: boolean;
  showFilters?: boolean;
  maxHeight?: string;
}

/**
 * Composant tableau de classement principal
 */
export const RankingTable: React.FC<RankingTableProps> = ({
  evaluation,
  ranking,
  isAnonymous,
  filters = {},
  onFiltersChange,
  className = '',
  compact = false,
  showFilters = true,
  maxHeight = '600px'
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'rank',
    direction: 'asc'
  });

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // ========================================
  // FILTRAGE ET TRI
  // ========================================

  const filteredAndSortedRanking = useMemo(() => {
    // Filtrage
    let filtered = ranking.filter(item => {
      // Recherche textuelle
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          item.displayName.toLowerCase().includes(searchLower) ||
          item.anonymousId.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtres de présence
      if (filters.showAbsentsOnly && !item.isAbsent) return false;
      if (filters.showPresentOnly && item.isAbsent) return false;

      // Filtres de score
      if (filters.minScore !== undefined && item.score !== null && item.score < filters.minScore) return false;
      if (filters.maxScore !== undefined && item.score !== null && item.score > filters.maxScore) return false;

      // Filtre de quartile
      if (filters.quartile && item.quartile !== filters.quartile) return false;

      // Filtre de position relative
      if (filters.relativePosition && item.relativePosition !== filters.relativePosition) return false;

      return true;
    });

    // Tri
    filtered.sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof RankingData];
      let bValue: any = b[sortConfig.key as keyof RankingData];

      // Tri spécial pour le nom d'élève
      if (sortConfig.key === 'studentName') {
        aValue = a.displayName;
        bValue = b.displayName;
      }

      // Gestion des valeurs nulles
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      // Tri alphabétique pour les chaînes
      if (typeof aValue === 'string') {
        const result = aValue.localeCompare(bValue, 'fr', { numeric: true });
        return sortConfig.direction === 'desc' ? -result : result;
      }

      // Tri numérique
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const result = aValue - bValue;
        return sortConfig.direction === 'desc' ? -result : result;
      }

      // Comparaison par défaut
      const result = String(aValue).localeCompare(String(bValue));
      return sortConfig.direction === 'desc' ? -result : result;
    });

    return filtered;
  }, [ranking, filters, sortConfig]);

  // ========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const handleSort = useCallback((key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleFiltersChange = useCallback((newFilters: TableFilters) => {
    onFiltersChange?.(newFilters);
  }, [onFiltersChange]);

  const handleRowSelect = useCallback((studentId: number, selected: boolean) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      if (selected) {
        newSelection.add(studentId);
      } else {
        newSelection.delete(studentId);
      }
      return newSelection;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = filteredAndSortedRanking.map(item => item.student.id);
    setSelectedRows(new Set(allIds));
  }, [filteredAndSortedRanking]);

  const handleSelectNone = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  const handleRowExpand = useCallback((studentId: number | null) => {
    setExpandedRow(prev => prev === studentId ? null : studentId);
  }, []);

  // ========================================
  // CALCULS DE RÉSUMÉ
  // ========================================

  const summaryStats = useMemo(() => {
    const totalShown = filteredAndSortedRanking.length;
    const totalOriginal = ranking.length;
    const presentShown = filteredAndSortedRanking.filter(item => !item.isAbsent).length;
    const selectedCount = selectedRows.size;

    return {
      totalShown,
      totalOriginal,
      presentShown,
      selectedCount,
      isFiltered: totalShown !== totalOriginal
    };
  }, [filteredAndSortedRanking, ranking, selectedRows]);

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filtres */}
      {showFilters && (
        <RankingFilters
          filters={filters}
          onChange={handleFiltersChange}
          totalCount={ranking.length}
          filteredCount={filteredAndSortedRanking.length}
          evaluation={evaluation}
          compact={compact}
        />
      )}

      {/* Barre d'actions et résumé */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>
            {summaryStats.totalShown} élève{summaryStats.totalShown !== 1 ? 's' : ''} affiché{summaryStats.totalShown !== 1 ? 's' : ''}
            {summaryStats.isFiltered && (
              <span className="text-gray-500"> sur {summaryStats.totalOriginal}</span>
            )}
          </span>
          
          {summaryStats.selectedCount > 0 && (
            <span className="text-blue-600 font-medium">
              {summaryStats.selectedCount} sélectionné{summaryStats.selectedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Actions de sélection */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Tout sélectionner
          </button>
          <button
            onClick={handleSelectNone}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Tout désélectionner
          </button>
        </div>
      </div>

      {/* Tableau principal */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div 
          className="overflow-auto"
          style={{ maxHeight }}
        >
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {/* Checkbox de sélection */}
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filteredAndSortedRanking.length && filteredAndSortedRanking.length > 0}
                    onChange={(e) => e.target.checked ? handleSelectAll() : handleSelectNone()}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>

                {/* Colonnes de données */}
                <RankingHeader
                  label="Rang"
                  sortKey="rank"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  className="w-20"
                />

                {!isAnonymous && (
                  <RankingHeader
                    label="Élève"
                    sortKey="studentName"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    className="min-w-[200px]"
                  />
                )}

                {isAnonymous && (
                  <RankingHeader
                    label="Identifiant"
                    sortKey="studentName"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    className="min-w-[120px]"
                  />
                )}

                <RankingHeader
                  label={`Note (/${evaluation.maxScore})`}
                  sortKey="score"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  className="w-32"
                />

                <RankingHeader
                  label="Percentile"
                  sortKey="percentile"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  className="w-24"
                />

                <RankingHeader
                  label="Écart Moyenne"
                  sortKey="deviation"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  className="w-32"
                />

                <RankingHeader
                  label="Position"
                  sortKey="relativePosition"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  className="w-32"
                />

                {!compact && (
                  <th className="w-16 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Détails
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedRanking.map((item, index) => (
                <RankingRow
                  key={item.student.id}
                  data={item}
                  evaluation={evaluation}
                  isAnonymous={isAnonymous}
                  isSelected={selectedRows.has(item.student.id)}
                  isExpanded={expandedRow === item.student.id}
                  isEven={index % 2 === 0}
                  compact={compact}
                  onSelect={handleRowSelect}
                  onExpand={handleRowExpand}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Message si aucun résultat */}
        {filteredAndSortedRanking.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun résultat</h3>
            <p className="mt-1 text-sm text-gray-500">
              {ranking.length === 0 
                ? "Aucun résultat disponible pour cette évaluation."
                : "Aucun élève ne correspond aux filtres sélectionnés."
              }
            </p>
            {summaryStats.isFiltered && (
              <button
                onClick={() => handleFiltersChange({})}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Légende pour les positions relatives */}
      {!compact && filteredAndSortedRanking.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Légende des positions</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Top (90%+)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Au-dessus moyenne (70%+)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span>Moyenne (30-70%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <span>En-dessous moyenne (10-30%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>Bas (-10%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
              <span>Absent</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingTable;
