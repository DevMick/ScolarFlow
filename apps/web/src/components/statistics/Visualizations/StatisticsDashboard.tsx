// ========================================
// STATISTICS DASHBOARD - TABLEAU DE BORD STATISTIQUES
// ========================================

import React, { useState } from 'react';
import { 
  ChartBarIcon, 
  TableCellsIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';
import { AdvancedChart } from './AdvancedChart';
import { ChartGrid } from './ChartGrid';
import type { StatisticResult } from '@edustats/shared/types';
import { LayoutType } from '@edustats/shared/types';
import { cn } from '../../../utils/classNames';

/**
 * Props du composant StatisticsDashboard
 */
interface StatisticsDashboardProps {
  /** Résultats statistiques principaux */
  primaryResult: StatisticResult;
  /** Résultats statistiques secondaires (pour comparaisons) */
  secondaryResults?: StatisticResult[];
  /** Type de layout */
  layout?: LayoutType;
  /** Mode anonyme */
  isAnonymous?: boolean;
  /** Permet le basculement entre les modes */
  allowModeToggle?: boolean;
  /** Callback lors du changement de mode anonyme */
  onAnonymousToggle?: (isAnonymous: boolean) => void;
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Composant de tableau de bord pour les statistiques
 */
export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({
  primaryResult,
  secondaryResults = [],
  layout = LayoutType.Single,
  isAnonymous = false,
  allowModeToggle = true,
  onAnonymousToggle,
  className
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [currentLayout, setCurrentLayout] = useState<LayoutType>(layout);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedView, setSelectedView] = useState<'chart' | 'table' | 'insights'>('chart');

  // ========================================
  // GESTION DES ACTIONS
  // ========================================

  const handleLayoutChange = (newLayout: LayoutType) => {
    setCurrentLayout(newLayout);
  };

  const handleAnonymousToggle = () => {
    const newValue = !isAnonymous;
    onAnonymousToggle?.(newValue);
  };

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
  };

  // ========================================
  // PRÉPARATION DES DONNÉES
  // ========================================

  const allResults = [primaryResult, ...secondaryResults];
  const gridItems = allResults.map((result, index) => ({
    result,
    title: index === 0 ? 'Analyse principale' : `Comparaison ${index}`,
    subtitle: result.configuration.description
  }));

  // ========================================
  // CALCULS STATISTIQUES AGRÉGÉS
  // ========================================

  const summaryStats = React.useMemo(() => {
    const totalDataPoints = allResults.reduce((sum, r) => sum + r.summary.totalDataPoints, 0);
    const avgProcessingTime = allResults.reduce((sum, r) => sum + r.summary.processingTime, 0) / allResults.length;
    const totalInsights = allResults.reduce((sum, r) => sum + r.insights.length, 0);
    
    return {
      totalDataPoints,
      avgProcessingTime: Math.round(avgProcessingTime),
      totalInsights,
      analysisCount: allResults.length
    };
  }, [allResults]);

  // ========================================
  // COMPOSANTS DE RENDU
  // ========================================

  const renderControlBar = () => (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      {/* Informations de base */}
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {primaryResult.configuration.name}
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>{summaryStats.totalDataPoints} données</span>
          <span>•</span>
          <span>{summaryStats.totalInsights} insights</span>
          {summaryStats.analysisCount > 1 && (
            <>
              <span>•</span>
              <span>{summaryStats.analysisCount} analyses</span>
            </>
          )}
        </div>
      </div>

      {/* Contrôles */}
      <div className="flex items-center space-x-2">
        {/* Sélection de vue */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedView('chart')}
            className={cn(
              'px-3 py-1 rounded-md text-sm font-medium transition-colors',
              selectedView === 'chart'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <ChartBarIcon className="h-4 w-4 mr-1 inline" />
            Graphiques
          </button>
          <button
            onClick={() => setSelectedView('table')}
            className={cn(
              'px-3 py-1 rounded-md text-sm font-medium transition-colors',
              selectedView === 'table'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <TableCellsIcon className="h-4 w-4 mr-1 inline" />
            Données
          </button>
          <button
            onClick={() => setSelectedView('insights')}
            className={cn(
              'px-3 py-1 rounded-md text-sm font-medium transition-colors',
              selectedView === 'insights'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            💡 Insights
          </button>
        </div>

        {/* Layout toggles */}
        {secondaryResults.length > 0 && (
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleLayoutChange(LayoutType.Single)}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium transition-colors',
                currentLayout === LayoutType.Single
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Single
            </button>
            <button
              onClick={() => handleLayoutChange(LayoutType.Grid)}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium transition-colors',
                currentLayout === LayoutType.Grid
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Grid
            </button>
            <button
              onClick={() => handleLayoutChange(LayoutType.Dashboard)}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium transition-colors',
                currentLayout === LayoutType.Dashboard
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Dashboard
            </button>
          </div>
        )}

        {/* Mode anonyme */}
        {allowModeToggle && (
          <button
            onClick={handleAnonymousToggle}
            className={cn(
              'inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors',
              isAnonymous
                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {isAnonymous ? (
              <EyeSlashIcon className="h-4 w-4 mr-1" />
            ) : (
              <EyeIcon className="h-4 w-4 mr-1" />
            )}
            {isAnonymous ? 'Anonyme' : 'Normal'}
          </button>
        )}

        {/* Plein écran */}
        <button
          onClick={handleFullscreenToggle}
          className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          {isFullscreen ? (
            <ArrowsPointingInIcon className="h-4 w-4" />
          ) : (
            <ArrowsPointingOutIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );

  const renderChartView = () => {
    switch (currentLayout) {
      case 'single':
        return (
          <AdvancedChart
            result={primaryResult}
            height={600}
            isAnonymous={isAnonymous}
            className="h-full"
          />
        );

      case 'grid':
        return (
          <ChartGrid
            items={gridItems}
            columns={secondaryResults.length > 2 ? 3 : 2}
            chartHeight={400}
            isAnonymous={isAnonymous}
            gap="md"
          />
        );

      case 'dashboard':
        return (
          <div className="grid grid-cols-12 gap-6 h-full">
            {/* Graphique principal */}
            <div className="col-span-12 lg:col-span-8">
              <AdvancedChart
                result={primaryResult}
                height={500}
                isAnonymous={isAnonymous}
              />
            </div>

            {/* Panneau latéral avec insights et comparaisons */}
            <div className="col-span-12 lg:col-span-4 space-y-4">
              {/* Statistics summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Résumé</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Moyenne:</span>
                    <span className="font-medium">
                      {primaryResult.statistics.global?.average?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Médiane:</span>
                    <span className="font-medium">
                      {primaryResult.statistics.global?.median?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Écart-type:</span>
                    <span className="font-medium">
                      {primaryResult.statistics.global?.standardDeviation?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tendance:</span>
                    <span className={cn(
                      'font-medium',
                      primaryResult.statistics.global?.trend === 'increasing' ? 'text-green-600' :
                      primaryResult.statistics.global?.trend === 'decreasing' ? 'text-red-600' :
                      'text-gray-600'
                    )}>
                      {primaryResult.statistics.global?.trend === 'increasing' ? '📈 Hausse' :
                       primaryResult.statistics.global?.trend === 'decreasing' ? '📉 Baisse' :
                       '➡️ Stable'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Insights */}
              {primaryResult.insights.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-3">Insights</h3>
                  <div className="space-y-2">
                    {primaryResult.insights.slice(0, 3).map((insight, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium text-blue-800">{insight.title}</div>
                        <div className="text-blue-700 text-xs mt-1">{insight.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comparaisons */}
              {secondaryResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Comparaisons</h3>
                  {secondaryResults.slice(0, 2).map((result, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded p-3">
                      <AdvancedChart
                        result={result}
                        height={200}
                        isAnonymous={isAnonymous}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return renderChartView();
    }
  };

  const renderDataTable = () => {
    const data = primaryResult.datasets[0]?.data || [];
    
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Données brutes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {isAnonymous ? 'Identifiant' : 'Nom'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valeur
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Métadonnées
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((point, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {isAnonymous ? `Item ${index + 1}` : point.label}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {point.value.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {point.metadata ? JSON.stringify(point.metadata, null, 2) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderInsights = () => (
    <div className="space-y-4">
      {allResults.map((result, resultIndex) => (
        <div key={resultIndex} className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4">
            {resultIndex === 0 ? 'Analyse principale' : `Analyse ${resultIndex + 1}`}
          </h3>
          
          {result.insights.length > 0 ? (
            <div className="space-y-3">
              {result.insights.map((insight, index) => (
                <div key={index} className={cn(
                  'p-4 rounded-lg border-l-4',
                  insight.priority === 'high' ? 'bg-red-50 border-red-400' :
                  insight.priority === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                  'bg-blue-50 border-blue-400'
                )}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={cn(
                        'font-medium text-sm',
                        insight.priority === 'high' ? 'text-red-900' :
                        insight.priority === 'medium' ? 'text-yellow-900' :
                        'text-blue-900'
                      )}>
                        {insight.title}
                      </h4>
                      <p className={cn(
                        'text-sm mt-1',
                        insight.priority === 'high' ? 'text-red-700' :
                        insight.priority === 'medium' ? 'text-yellow-700' :
                        'text-blue-700'
                      )}>
                        {insight.description}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {Math.round(insight.confidence * 100)}%
                      </span>
                      {insight.actionable && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Actionnable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-sm">Aucun insight généré pour cette analyse</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className={cn(
      'flex flex-col bg-gray-50',
      isFullscreen ? 'fixed inset-0 z-50' : 'rounded-lg border border-gray-200',
      className
    )}>
      {/* Barre de contrôle */}
      {renderControlBar()}

      {/* Contenu principal */}
      <div className="flex-1 p-6 overflow-auto">
        {selectedView === 'chart' && renderChartView()}
        {selectedView === 'table' && renderDataTable()}
        {selectedView === 'insights' && renderInsights()}
      </div>

      {/* Footer avec métriques */}
      <div className="px-6 py-3 bg-gray-100 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex justify-between items-center">
          <div>
            Généré le {new Date(primaryResult.summary.calculatedAt).toLocaleString('fr-FR')}
          </div>
          <div>
            Temps de traitement: {summaryStats.avgProcessingTime}ms
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;
