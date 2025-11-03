// ========================================
// ADVANCED CHART - COMPOSANT GRAPHIQUE UNIVERSEL
// ========================================

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import type { ChartOptions, TooltipItem } from 'chart.js';
import {
  Bar,
  Line,
  Pie,
  Radar,
  Scatter
} from 'react-chartjs-2';
import type {
  StatisticResult,
  ChartType,
  ColorScheme
} from '@edustats/shared/types';
import { cn } from '../../../utils/classNames';

// Enregistrer tous les composants Chart.js nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Interface pour les données Chart.js
 */
interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
    pointRadius?: number;
    pointHoverRadius?: number;
  }>;
}

/**
 * Props du composant AdvancedChart
 */
interface AdvancedChartProps {
  /** Données statistiques à afficher */
  result: StatisticResult;
  /** Type de graphique à afficher */
  chartType?: ChartType;
  /** Hauteur du graphique */
  height?: number;
  /** Largeur du graphique */
  width?: number;
  /** Options personnalisées pour Chart.js */
  customOptions?: Partial<ChartOptions>;
  /** Classe CSS personnalisée */
  className?: string;
  /** Mode anonyme pour masquer les noms */
  isAnonymous?: boolean;
}

/**
 * Palettes de couleurs prédéfinies
 */
const COLOR_PALETTES: Record<ColorScheme, string[]> = {
  blue: ['#3B82F6', '#1D4ED8', '#60A5FA', '#93C5FD', '#DBEAFE'],
  green: ['#10B981', '#059669', '#34D399', '#6EE7B7', '#D1FAE5'],
  purple: ['#8B5CF6', '#7C3AED', '#A78BFA', '#C4B5FD', '#EDE9FE'],
  orange: ['#F59E0B', '#D97706', '#FCD34D', '#FDE68A', '#FEF3C7'],
  rainbow: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'],
  monochrome: ['#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6']
};

/**
 * Composant graphique universel avec Chart.js
 */
export const AdvancedChart: React.FC<AdvancedChartProps> = ({
  result,
  chartType,
  height = 400,
  width,
  customOptions = {},
  className,
  isAnonymous = false
}) => {
  // ========================================
  // DONNÉES ET CONFIGURATION
  // ========================================

  const finalChartType = chartType || result.configuration.visualization.chartType;
  const colorScheme = result.configuration.visualization.colorScheme || 'blue';
  const colors = COLOR_PALETTES[colorScheme];

  // ========================================
  // TRANSFORMATION DES DONNÉES
  // ========================================

  const chartData = useMemo((): ChartData => {
    if (!result.datasets || result.datasets.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Extraire les labels à partir du premier dataset
    const labels = result.datasets[0]?.data.map((point: any) => 
      isAnonymous && point.label?.includes(' ') ? 
        `Élève ${point.label.split(' ')[0]}` : 
        point.label || 'Sans nom'
    ) || [];

    // Transformer chaque dataset
    const datasets = result.datasets.map((dataset: any, index: number) => {
      const baseColor = colors[index % colors.length];
      const data = dataset.data.map((point: any) => point.value);

      switch (finalChartType) {
        case 'bar':
          return {
            label: dataset.label,
            data,
            backgroundColor: dataset.color || baseColor.replace(')', ', 0.7)').replace('rgb', 'rgba'),
            borderColor: dataset.color || baseColor,
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false as any
          };

        case 'line':
          return {
            label: dataset.label,
            data,
            backgroundColor: 'transparent',
            borderColor: dataset.color || baseColor,
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: dataset.color || baseColor,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          };

        case 'pie':
          return {
            label: dataset.label,
            data,
            backgroundColor: data.map((_: any, i: number) => colors[i % colors.length]),
            borderColor: '#ffffff',
            borderWidth: 2
          };

        case 'radar':
          return {
            label: dataset.label,
            data,
            backgroundColor: (dataset.color || baseColor).replace(')', ', 0.2)').replace('rgb', 'rgba'),
            borderColor: dataset.color || baseColor,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: dataset.color || baseColor,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          };

        case 'scatter':
          const scatterData = dataset.data.map((point: any) => ({
            x: point.x || point.value,
            y: point.y || point.value
          }));
          return {
            label: dataset.label,
            data: scatterData as any,
            backgroundColor: (dataset.color || baseColor).replace(')', ', 0.6)').replace('rgb', 'rgba'),
            borderColor: dataset.color || baseColor,
            borderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
          };

        default:
          return {
            label: dataset.label,
            data,
            backgroundColor: dataset.color || baseColor,
            borderColor: dataset.color || baseColor,
            borderWidth: 1
          };
      }
    });

    return { labels, datasets };
  }, [result.datasets, finalChartType, colors, isAnonymous]);

  // ========================================
  // OPTIONS DU GRAPHIQUE
  // ========================================

  const chartOptions = useMemo((): ChartOptions => {
    const baseOptions: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: result.configuration.name,
          font: {
            size: 16,
            weight: 'bold'
          },
          color: '#374151',
          padding: {
            top: 10,
            bottom: 20
          }
        },
        legend: {
          display: result.configuration.visualization.showLegend,
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          enabled: true,
          mode: 'index' as const,
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: colors[0],
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          callbacks: {
            title: function(context: TooltipItem<any>[]) {
              return context[0]?.label || 'Sans titre';
            },
            label: function(context: TooltipItem<any>) {
              const label = context.dataset.label || '';
              const value = context.parsed.y !== null ? context.parsed.y : context.parsed;
              
              if (finalChartType === 'pie') {
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
              
              return `${label}: ${typeof value === 'number' ? value.toFixed(2) : value}`;
            }
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    };

    // Options spécifiques par type de graphique
    switch (finalChartType) {
      case 'bar':
        return {
          ...baseOptions,
          scales: {
            x: {
              title: {
                display: true,
                text: getXAxisLabel(),
                font: { weight: 'bold' }
              },
              grid: {
                display: result.configuration.visualization.showGrid
              }
            },
            y: {
              title: {
                display: true,
                text: getYAxisLabel(),
                font: { weight: 'bold' }
              },
              beginAtZero: true,
              grid: {
                display: result.configuration.visualization.showGrid,
                color: 'rgba(0, 0, 0, 0.1)'
              }
            }
          }
        };

      case 'line':
        return {
          ...baseOptions,
          scales: {
            x: {
              title: {
                display: true,
                text: getXAxisLabel(),
                font: { weight: 'bold' }
              },
              grid: {
                display: result.configuration.visualization.showGrid
              }
            },
            y: {
              title: {
                display: true,
                text: getYAxisLabel(),
                font: { weight: 'bold' }
              },
              beginAtZero: true,
              grid: {
                display: result.configuration.visualization.showGrid,
                color: 'rgba(0, 0, 0, 0.1)'
              }
            }
          },
          elements: {
            line: {
              tension: 0.4
            },
            point: {
              radius: 4,
              hoverRadius: 8
            }
          }
        };

      case 'pie':
        return {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            legend: {
              ...baseOptions.plugins?.legend,
              position: 'right' as const
            }
          }
        };

      case 'radar':
        return {
          ...baseOptions,
          scales: {
            r: {
              beginAtZero: true,
              grid: {
                display: result.configuration.visualization.showGrid,
                color: 'rgba(0, 0, 0, 0.1)'
              },
              pointLabels: {
                font: {
                  size: 11
                }
              }
            }
          }
        };

      case 'scatter':
        return {
          ...baseOptions,
          scales: {
            x: {
              type: 'linear' as const,
              position: 'bottom' as const,
              title: {
                display: true,
                text: getXAxisLabel(),
                font: { weight: 'bold' }
              },
              grid: {
                display: result.configuration.visualization.showGrid
              }
            },
            y: {
              title: {
                display: true,
                text: getYAxisLabel(),
                font: { weight: 'bold' }
              },
              grid: {
                display: result.configuration.visualization.showGrid,
                color: 'rgba(0, 0, 0, 0.1)'
              }
            }
          }
        };

      default:
        return baseOptions;
    }
  }, [result, finalChartType, colors]);

  // ========================================
  // FONCTIONS UTILITAIRES
  // ========================================

  const getXAxisLabel = (): string => {
    switch (result.configuration.calculations.groupBy) {
      case 'student': return isAnonymous ? 'Élèves' : 'Élèves';
      case 'evaluation': return 'Évaluations';
      case 'subject': return 'Matières';
      case 'class': return 'Classes';
      case 'month': return 'Mois';
      case 'week': return 'Semaines';
      default: return 'Catégories';
    }
  };

  const getYAxisLabel = (): string => {
    const primaryMetric = result.configuration.calculations.metrics[0];
    switch (primaryMetric) {
      case 'average': return 'Moyenne';
      case 'median': return 'Médiane';
      case 'standardDeviation': return 'Écart-type';
      case 'min': return 'Minimum';
      case 'max': return 'Maximum';
      default: return 'Valeurs';
    }
  };

  // ========================================
  // RENDU DU GRAPHIQUE
  // ========================================

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      options: { ...chartOptions, ...customOptions } as ChartOptions<any>,
      width,
      height
    };

    switch (finalChartType) {
      case 'bar':
        return <Bar {...commonProps} />;
      case 'line':
        return <Line {...commonProps} />;
      case 'pie':
        return <Pie {...commonProps} />;
      case 'radar':
        return <Radar {...commonProps} />;
      case 'scatter':
        return <Scatter {...commonProps} />;
      default:
        return <Bar {...commonProps} />;
    }
  };

  // ========================================
  // GESTION DES CAS D'ERREUR
  // ========================================

  if (!result || !result.datasets || result.datasets.length === 0) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg',
        className
      )} style={{ height }}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm">Aucune donnée à afficher</p>
          <p className="text-xs text-gray-400 mt-1">
            Vérifiez vos critères de sélection
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className={cn('relative bg-white rounded-lg border border-gray-200 p-4', className)}>
      {/* Indicateur de mode anonyme */}
      {isAnonymous && (
        <div className="absolute top-2 right-2 z-10">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
            Mode anonyme
          </span>
        </div>
      )}

      {/* Graphique */}
      <div style={{ height, width: width || '100%' }}>
        {renderChart()}
      </div>

      {/* Métadonnées */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div>
            {result.summary.totalDataPoints} point(s) de données • 
            Généré en {result.summary.processingTime}ms
          </div>
          <div>
            {new Date(result.summary.calculatedAt).toLocaleString('fr-FR')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedChart;