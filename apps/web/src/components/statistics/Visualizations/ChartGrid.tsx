// ========================================
// CHART GRID - GRILLE DE GRAPHIQUES MULTIPLES
// ========================================

import React from 'react';
import { AdvancedChart } from './AdvancedChart';
import type { StatisticResult, ChartType } from '@edustats/shared/types';
import { cn } from '../../../utils/classNames';

/**
 * Interface pour une cellule de la grille
 */
interface ChartGridItem {
  result: StatisticResult;
  chartType?: ChartType;
  title?: string;
  subtitle?: string;
}

/**
 * Props du composant ChartGrid
 */
interface ChartGridProps {
  /** Items à afficher dans la grille */
  items: ChartGridItem[];
  /** Nombre de colonnes (responsive automatique) */
  columns?: 1 | 2 | 3 | 4;
  /** Hauteur des graphiques */
  chartHeight?: number;
  /** Espacement entre les graphiques */
  gap?: 'sm' | 'md' | 'lg';
  /** Mode anonyme */
  isAnonymous?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Composant de grille pour afficher plusieurs graphiques
 */
export const ChartGrid: React.FC<ChartGridProps> = ({
  items,
  columns = 2,
  chartHeight = 300,
  gap = 'md',
  isAnonymous = false,
  className
}) => {
  // ========================================
  // CONFIGURATION DES STYLES
  // ========================================

  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
  };

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-6',
    lg: 'gap-8'
  };

  // ========================================
  // GESTION DES CAS D'ERREUR
  // ========================================

  if (!items || items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-lg', className)}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm">Aucun graphique à afficher</p>
          <p className="text-xs text-gray-400 mt-1">
            Vérifiez votre configuration
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className={cn('w-full', className)}>
      <div className={cn(
        'grid',
        gridClasses[columns],
        gapClasses[gap]
      )}>
        {items.map((item, index) => (
          <div key={index} className="relative">
            {/* Titre personnalisé si fourni */}
            {(item.title || item.subtitle) && (
              <div className="mb-4">
                {item.title && (
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                )}
                {item.subtitle && (
                  <p className="text-sm text-gray-600 mt-1">{item.subtitle}</p>
                )}
              </div>
            )}

            {/* Graphique */}
            <AdvancedChart
              result={item.result}
              chartType={item.chartType}
              height={chartHeight}
              isAnonymous={isAnonymous}
              className="shadow-sm hover:shadow-md transition-shadow"
            />

            {/* Indicateur de position dans la grille */}
            <div className="absolute top-2 left-2 z-10">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-800 bg-opacity-75 text-white text-xs font-medium rounded-full">
                {index + 1}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Métadonnées de la grille */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div>
            {items.length} graphique(s) affiché(s)
            {isAnonymous && ' • Mode anonyme activé'}
          </div>
          <div>
            Grille {columns} colonne(s)
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartGrid;
