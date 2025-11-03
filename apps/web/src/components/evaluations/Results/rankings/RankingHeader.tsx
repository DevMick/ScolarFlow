// ========================================
// RANKING HEADER - EN-TÊTE DE COLONNE TRIABLE
// ========================================

import React from 'react';
import { cn } from '../../../../utils/classNames';

/**
 * Types pour le tri
 */
export type SortKey = string;
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

/**
 * Props du composant RankingHeader
 */
interface RankingHeaderProps {
  label: string;
  sortKey: SortKey;
  sortConfig: SortConfig;
  onSort: (key: SortKey) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  tooltip?: string;
}

/**
 * Composant en-tête de colonne triable
 */
export const RankingHeader: React.FC<RankingHeaderProps> = ({
  label,
  sortKey,
  sortConfig,
  onSort,
  className = '',
  align = 'left',
  sortable = true,
  tooltip
}) => {
  // ========================================
  // ÉTAT ACTUEL DU TRI
  // ========================================

  const isActive = sortConfig.key === sortKey;
  const direction = isActive ? sortConfig.direction : null;

  // ========================================
  // GESTIONNAIRE D'ÉVÉNEMENTS
  // ========================================

  const handleClick = () => {
    if (sortable) {
      onSort(sortKey);
    }
  };

  // ========================================
  // CLASSES CSS
  // ========================================

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  const headerClasses = cn(
    'px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider',
    'select-none',
    alignmentClasses[align],
    sortable && 'cursor-pointer hover:text-gray-700 hover:bg-gray-100 transition-colors',
    isActive && 'text-gray-700 bg-gray-100',
    className
  );

  // ========================================
  // ICÔNE DE TRI
  // ========================================

  const SortIcon = () => {
    if (!sortable) return null;

    if (!isActive) {
      // État neutre - icône de tri double
      return (
        <svg className="w-3 h-3 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (direction === 'asc') {
      // Tri ascendant
      return (
        <svg className="w-3 h-3 ml-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    // Tri descendant
    return (
      <svg className="w-3 h-3 ml-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // ========================================
  // RENDU
  // ========================================

  const content = (
    <div className="flex items-center justify-center">
      <span>{label}</span>
      <SortIcon />
    </div>
  );

  return (
    <th 
      className={headerClasses}
      onClick={handleClick}
      title={tooltip || (sortable ? `Trier par ${label.toLowerCase()}` : undefined)}
      role={sortable ? 'button' : undefined}
      tabIndex={sortable ? 0 : undefined}
      onKeyDown={(e) => {
        if (sortable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {align === 'center' ? (
        content
      ) : align === 'right' ? (
        <div className="flex items-center justify-end">
          <span>{label}</span>
          <SortIcon />
        </div>
      ) : (
        <div className="flex items-center">
          <span>{label}</span>
          <SortIcon />
        </div>
      )}
    </th>
  );
};

export default RankingHeader;
