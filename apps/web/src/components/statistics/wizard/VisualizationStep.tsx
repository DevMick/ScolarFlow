// ========================================
// VISUALIZATION STEP - CONFIGURATION DE LA VISUALISATION
// ========================================

import React, { useState } from 'react';
import { PaintBrushIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import type {
  CreateStatisticConfigurationData,
  ChartType,
  LayoutType,
  ColorScheme
} from '@edustats/shared/types';
import { cn } from '../../../utils/classNames';

/**
 * Configuration des types de graphiques
 */
const CHART_TYPES: Array<{
  type: ChartType;
  title: string;
  description: string;
  icon: string;
  bestFor: string[];
}> = [
  {
    type: 'bar',
    title: 'Barres',
    description: 'Graphique en barres verticales',
    icon: '📊',
    bestFor: ['Comparaisons', 'Distributions', 'Catégories']
  },
  {
    type: 'line',
    title: 'Courbes',
    description: 'Graphique linéaire',
    icon: '📈',
    bestFor: ['Évolutions temporelles', 'Tendances', 'Progressions']
  },
  {
    type: 'pie',
    title: 'Camembert',
    description: 'Graphique circulaire',
    icon: '🥧',
    bestFor: ['Répartitions', 'Proportions', 'Pourcentages']
  },
  {
    type: 'radar',
    title: 'Radar',
    description: 'Graphique en radar/étoile',
    icon: '🕸️',
    bestFor: ['Comparaisons multidimensionnelles', 'Profils', 'Compétences']
  },
  {
    type: 'scatter',
    title: 'Nuage de points',
    description: 'Graphique de dispersion',
    icon: '🔵',
    bestFor: ['Corrélations', 'Relations', 'Dispersions']
  },
  {
    type: 'heatmap',
    title: 'Carte de chaleur',
    description: 'Matrice colorée par intensité',
    icon: '🌡️',
    bestFor: ['Matrices', 'Intensités', 'Densités']
  }
];

/**
 * Types de mise en page
 */
const LAYOUT_TYPES: Array<{
  type: LayoutType;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    type: 'single',
    title: 'Graphique unique',
    description: 'Un seul graphique pleine largeur',
    icon: '▬'
  },
  {
    type: 'grid',
    title: 'Grille',
    description: 'Plusieurs graphiques en grille',
    icon: '⊞'
  },
  {
    type: 'dashboard',
    title: 'Tableau de bord',
    description: 'Mise en page dashboard avancée',
    icon: '⊡'
  }
];

/**
 * Palettes de couleurs prédéfinies
 */
const COLOR_SCHEMES: Array<{
  scheme: ColorScheme;
  title: string;
  colors: string[];
  description: string;
}> = [
  {
    scheme: 'blue',
    title: 'Bleus',
    colors: ['#3B82F6', '#1D4ED8', '#60A5FA', '#93C5FD'],
    description: 'Palette classique et professionnelle'
  },
  {
    scheme: 'green',
    title: 'Verts',
    colors: ['#10B981', '#059669', '#34D399', '#6EE7B7'],
    description: 'Idéal pour les réussites et progressions'
  },
  {
    scheme: 'purple',
    title: 'Violets',
    colors: ['#8B5CF6', '#7C3AED', '#A78BFA', '#C4B5FD'],
    description: 'Moderne et distinctif'
  },
  {
    scheme: 'orange',
    title: 'Oranges',
    colors: ['#F59E0B', '#D97706', '#FCD34D', '#FDE68A'],
    description: 'Énergique et chaleureux'
  },
  {
    scheme: 'rainbow',
    title: 'Arc-en-ciel',
    colors: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'],
    description: 'Coloré et varié'
  },
  {
    scheme: 'monochrome',
    title: 'Monochrome',
    colors: ['#374151', '#6B7280', '#9CA3AF', '#D1D5DB'],
    description: 'Sobre et élégant'
  }
];

/**
 * Props du composant VisualizationStep
 */
interface VisualizationStepProps {
  data: Partial<CreateStatisticConfigurationData>;
  validationErrors: Record<string, string[]>;
  onDataChange: (data: Partial<CreateStatisticConfigurationData>) => void;
}

/**
 * Étape de configuration de la visualisation
 */
export const VisualizationStep: React.FC<VisualizationStepProps> = ({
  data,
  validationErrors,
  onDataChange
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [selectedChartType, setSelectedChartType] = useState<ChartType>(
    data.visualization?.chartType || 'bar'
  );
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(
    data.visualization?.layout || 'single'
  );
  const [selectedColorScheme, setSelectedColorScheme] = useState<ColorScheme>(
    data.visualization?.colorScheme || 'blue'
  );
  const [multiSeries, setMultiSeries] = useState<boolean>(
    data.visualization?.multiSeries || false
  );
  const [showAnnotations, setShowAnnotations] = useState<boolean>(
    data.visualization?.annotations || false
  );
  const [showLegend, setShowLegend] = useState<boolean>(
    data.visualization?.showLegend !== false // Par défaut true
  );
  const [showGrid, setShowGrid] = useState<boolean>(
    data.visualization?.showGrid !== false // Par défaut true
  );

  // ========================================
  // FONCTION DE MISE À JOUR
  // ========================================

  const updateVisualization = React.useCallback((updates: Partial<typeof data.visualization>) => {
    onDataChange({
      visualization: {
        ...data.visualization,
        ...updates
      }
    });
  }, [data.visualization, onDataChange]);

  // ========================================
  // GESTION DES CHANGEMENTS
  // ========================================

  const handleChartTypeChange = (chartType: ChartType) => {
    setSelectedChartType(chartType);
    updateVisualization({ chartType });
  };

  const handleLayoutChange = (layout: LayoutType) => {
    setSelectedLayout(layout);
    updateVisualization({ layout });
  };

  const handleColorSchemeChange = (colorScheme: ColorScheme) => {
    setSelectedColorScheme(colorScheme);
    const scheme = COLOR_SCHEMES.find(s => s.scheme === colorScheme);
    updateVisualization({ 
      colorScheme,
      colors: scheme?.colors || []
    });
  };

  const handleMultiSeriesChange = (value: boolean) => {
    setMultiSeries(value);
    updateVisualization({ multiSeries: value });
  };

  const handleAnnotationsChange = (value: boolean) => {
    setShowAnnotations(value);
    updateVisualization({ annotations: value });
  };

  const handleLegendChange = (value: boolean) => {
    setShowLegend(value);
    updateVisualization({ showLegend: value });
  };

  const handleGridChange = (value: boolean) => {
    setShowGrid(value);
    updateVisualization({ showGrid: value });
  };

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className="space-y-8">
      {/* Sélection du type de graphique */}
      <div>
        <div className="flex items-center mb-4">
          <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">
            Type de graphique
            <span className="text-red-500 ml-1">*</span>
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CHART_TYPES.map((chartType) => {
            const isSelected = selectedChartType === chartType.type;
            
            return (
              <button
                key={chartType.type}
                type="button"
                onClick={() => handleChartTypeChange(chartType.type)}
                className={cn(
                  'relative p-4 border rounded-lg text-left transition-all hover:shadow-md',
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                    : 'border-gray-300 hover:border-gray-400'
                )}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">{chartType.icon}</div>
                  <h4 className={cn(
                    'font-medium text-sm',
                    isSelected ? 'text-blue-900' : 'text-gray-900'
                  )}>
                    {chartType.title}
                  </h4>
                  <p className={cn(
                    'text-xs mt-1',
                    isSelected ? 'text-blue-700' : 'text-gray-500'
                  )}>
                    {chartType.description}
                  </p>
                  
                  {/* Tags pour les cas d'usage */}
                  <div className="mt-2 flex flex-wrap justify-center gap-1">
                    {chartType.bestFor.slice(0, 2).map((use) => (
                      <span 
                        key={use}
                        className={cn(
                          'px-2 py-1 text-xs rounded-full',
                          isSelected 
                            ? 'bg-blue-200 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {use}
                      </span>
                    ))}
                  </div>
                </div>
                
                {isSelected && (
                  <div className="absolute top-2 right-2 text-blue-600">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {validationErrors['visualization.chartType'] && (
          <div className="text-red-600 text-sm mt-2">
            {validationErrors['visualization.chartType'].join(', ')}
          </div>
        )}
      </div>

      {/* Palette de couleurs */}
      <div>
        <div className="flex items-center mb-4">
          <PaintBrushIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Palette de couleurs</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {COLOR_SCHEMES.map((scheme) => {
            const isSelected = selectedColorScheme === scheme.scheme;
            
            return (
              <button
                key={scheme.scheme}
                type="button"
                onClick={() => handleColorSchemeChange(scheme.scheme)}
                className={cn(
                  'relative p-4 border rounded-lg text-left transition-all hover:shadow-md',
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                    : 'border-gray-300 hover:border-gray-400'
                )}
              >
                <div className="text-center">
                  {/* Aperçu des couleurs */}
                  <div className="flex justify-center mb-3">
                    {scheme.colors.map((color, index) => (
                      <div
                        key={index}
                        className="h-6 w-6 rounded-full border border-white border-2"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  
                  <h4 className={cn(
                    'font-medium text-sm',
                    isSelected ? 'text-blue-900' : 'text-gray-900'
                  )}>
                    {scheme.title}
                  </h4>
                  <p className={cn(
                    'text-xs mt-1',
                    isSelected ? 'text-blue-700' : 'text-gray-500'
                  )}>
                    {scheme.description}
                  </p>
                </div>
                
                {isSelected && (
                  <div className="absolute top-2 right-2 text-blue-600">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Type de mise en page */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Mise en page</h3>
        
        <div className="grid grid-cols-3 gap-4">
          {LAYOUT_TYPES.map((layout) => {
            const isSelected = selectedLayout === layout.type;
            
            return (
              <button
                key={layout.type}
                type="button"
                onClick={() => handleLayoutChange(layout.type)}
                className={cn(
                  'relative p-4 border rounded-lg text-center transition-all hover:shadow-md',
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                    : 'border-gray-300 hover:border-gray-400'
                )}
              >
                <div className="text-2xl mb-2">{layout.icon}</div>
                <h4 className={cn(
                  'font-medium text-sm',
                  isSelected ? 'text-blue-900' : 'text-gray-900'
                )}>
                  {layout.title}
                </h4>
                <p className={cn(
                  'text-xs mt-1',
                  isSelected ? 'text-blue-700' : 'text-gray-500'
                )}>
                  {layout.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Options avancées */}
      <div>
        <div className="flex items-center mb-4">
          <Cog6ToothIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Options d'affichage</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colonne gauche */}
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                checked={multiSeries}
                onChange={(e) => handleMultiSeriesChange(e.target.checked)}
              />
              <span className="ml-3 text-sm text-gray-700">
                Séries multiples
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-7">
              Afficher plusieurs jeux de données sur le même graphique
            </p>

            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                checked={showAnnotations}
                onChange={(e) => handleAnnotationsChange(e.target.checked)}
              />
              <span className="ml-3 text-sm text-gray-700">
                Annotations automatiques
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-7">
              Ajouter des commentaires et insights sur le graphique
            </p>
          </div>

          {/* Colonne droite */}
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                checked={showLegend}
                onChange={(e) => handleLegendChange(e.target.checked)}
              />
              <span className="ml-3 text-sm text-gray-700">
                Afficher la légende
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-7">
              Inclure une légende explicative
            </p>

            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                checked={showGrid}
                onChange={(e) => handleGridChange(e.target.checked)}
              />
              <span className="ml-3 text-sm text-gray-700">
                Grille de référence
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-7">
              Afficher une grille pour faciliter la lecture
            </p>
          </div>
        </div>
      </div>

      {/* Aperçu de la configuration */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-purple-900 mb-2">Configuration de visualisation</h4>
        <div className="text-sm text-purple-800 space-y-1">
          <div>
            Type: {CHART_TYPES.find(c => c.type === selectedChartType)?.title}
          </div>
          <div>
            Couleurs: {COLOR_SCHEMES.find(s => s.scheme === selectedColorScheme)?.title}
          </div>
          <div>
            Mise en page: {LAYOUT_TYPES.find(l => l.type === selectedLayout)?.title}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {multiSeries && (
              <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full">
                Séries multiples
              </span>
            )}
            {showAnnotations && (
              <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full">
                Annotations
              </span>
            )}
            {showLegend && (
              <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full">
                Légende
              </span>
            )}
            {showGrid && (
              <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full">
                Grille
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationStep;
