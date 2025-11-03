// ========================================
// RANKING FILTERS - FILTRES DE CLASSEMENT
// ========================================

import React, { useState, useMemo } from 'react';
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
 * Props du composant RankingFilters
 */
interface RankingFiltersProps {
  filters: TableFilters;
  onChange: (filters: TableFilters) => void;
  totalCount: number;
  filteredCount: number;
  evaluation: Evaluation;
  compact?: boolean;
  className?: string;
}

/**
 * Composant filtres de classement
 */
export const RankingFilters: React.FC<RankingFiltersProps> = ({
  filters,
  onChange,
  totalCount,
  filteredCount,
  evaluation,
  compact = false,
  className = ''
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [isExpanded, setIsExpanded] = useState(!compact);
  const [localFilters, setLocalFilters] = useState<TableFilters>(filters);

  // ========================================
  // CALCULS
  // ========================================

  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => {
      const value = filters[key as keyof TableFilters];
      return value !== undefined && value !== null && value !== '';
    });
  }, [filters]);

  const isFiltered = totalCount !== filteredCount;

  // ========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const handleFilterChange = (key: keyof TableFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onChange(clearedFilters);
  };

  const handleQuickFilter = (filterType: string) => {
    let newFilters: TableFilters = {};
    
    switch (filterType) {
      case 'present':
        newFilters = { showPresentOnly: true };
        break;
      case 'absent':
        newFilters = { showAbsentsOnly: true };
        break;
      case 'top_performers':
        newFilters = { relativePosition: 'top' };
        break;
      case 'needs_attention':
        newFilters = { relativePosition: 'bottom' };
        break;
      case 'above_average':
        newFilters = { minScore: Number(evaluation.maxScore) * 0.6 };
        break;
      case 'below_average':
        newFilters = { maxScore: Number(evaluation.maxScore) * 0.5 };
        break;
    }
    
    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 shadow-sm', className)}>
      {/* Header des filtres */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-medium text-gray-900">
            Filtres et tri
          </h3>
          
          {isFiltered && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {filteredCount} sur {totalCount} élèves
            </span>
          )}
          
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Effacer tout
            </button>
          )}
        </div>

        {compact && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg 
              className={cn('w-5 h-5 transition-transform', isExpanded && 'transform rotate-180')}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Contenu des filtres */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Filtres rapides */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtres rapides
            </label>
            <div className="flex flex-wrap gap-2">
              <QuickFilterButton
                onClick={() => handleQuickFilter('present')}
                active={!!filters.showPresentOnly}
                icon="👥"
                label="Présents seulement"
              />
              <QuickFilterButton
                onClick={() => handleQuickFilter('absent')}
                active={!!filters.showAbsentsOnly}
                icon="❌"
                label="Absents seulement"
              />
              <QuickFilterButton
                onClick={() => handleQuickFilter('top_performers')}
                active={filters.relativePosition === 'top'}
                icon="🏆"
                label="Excellence"
              />
              <QuickFilterButton
                onClick={() => handleQuickFilter('needs_attention')}
                active={filters.relativePosition === 'bottom'}
                icon="⚠️"
                label="À surveiller"
              />
              <QuickFilterButton
                onClick={() => handleQuickFilter('above_average')}
                active={filters.minScore === Number(evaluation.maxScore) * 0.6}
                icon="📈"
                label="Au-dessus moyenne"
              />
              <QuickFilterButton
                onClick={() => handleQuickFilter('below_average')}
                active={filters.maxScore === Number(evaluation.maxScore) * 0.5}
                icon="📉"
                label="En-dessous moyenne"
              />
            </div>
          </div>

          {/* Filtres détaillés */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rechercher un élève
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.searchTerm || ''}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  placeholder="Nom ou prénom..."
                  className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Note minimale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note minimale
              </label>
              <input
                type="number"
                min="0"
                max={evaluation.maxScore}
                step="0.5"
                value={filters.minScore || ''}
                onChange={(e) => handleFilterChange('minScore', e.target.value ? Number(e.target.value) : undefined)}
                placeholder={`0 - ${evaluation.maxScore}`}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Note maximale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note maximale
              </label>
              <input
                type="number"
                min="0"
                max={evaluation.maxScore}
                step="0.5"
                value={filters.maxScore || ''}
                onChange={(e) => handleFilterChange('maxScore', e.target.value ? Number(e.target.value) : undefined)}
                placeholder={`0 - ${evaluation.maxScore}`}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Quartile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quartile
              </label>
              <select
                value={filters.quartile || ''}
                onChange={(e) => handleFilterChange('quartile', e.target.value ? Number(e.target.value) : null)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous</option>
                <option value="1">Q1 (25% supérieur)</option>
                <option value="2">Q2 (25-50%)</option>
                <option value="3">Q3 (50-75%)</option>
                <option value="4">Q4 (25% inférieur)</option>
              </select>
            </div>
          </div>

          {/* Position relative */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position relative
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'top', label: 'Excellence', color: 'bg-green-100 text-green-800' },
                { value: 'above_average', label: 'Au-dessus moyenne', color: 'bg-blue-100 text-blue-800' },
                { value: 'average', label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800' },
                { value: 'below_average', label: 'En-dessous moyenne', color: 'bg-orange-100 text-orange-800' },
                { value: 'bottom', label: 'Difficulté', color: 'bg-red-100 text-red-800' },
                { value: 'absent', label: 'Absent', color: 'bg-gray-100 text-gray-800' }
              ].map(position => (
                <button
                  key={position.value}
                  onClick={() => handleFilterChange('relativePosition', 
                    filters.relativePosition === position.value ? undefined : position.value
                  )}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                    filters.relativePosition === position.value
                      ? position.color + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-gray-100 text-gray-700 hover:' + position.color
                  )}
                >
                  {position.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Composant bouton de filtre rapide
 */
interface QuickFilterButtonProps {
  onClick: () => void;
  active: boolean;
  icon: string;
  label: string;
}

const QuickFilterButton: React.FC<QuickFilterButtonProps> = ({ onClick, active, icon, label }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
        active
          ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-300'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      )}
    >
      <span className="mr-1.5">{icon}</span>
      {label}
    </button>
  );
};

export default RankingFilters;
