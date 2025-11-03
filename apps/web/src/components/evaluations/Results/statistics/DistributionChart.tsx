// ========================================
// DISTRIBUTION CHART - GRAPHIQUE DE DISTRIBUTION
// ========================================

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { StatisticsData } from '../../../../hooks/useStatistics';
import type { Evaluation } from '../../../../types';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Props du composant DistributionChart
 */
interface DistributionChartProps {
  statistics: StatisticsData;
  evaluation: Evaluation;
  height?: number;
  showPercentages?: boolean;
  interactive?: boolean;
  className?: string;
}

/**
 * Composant graphique de distribution des notes
 */
export const DistributionChart: React.FC<DistributionChartProps> = ({
  statistics,
  evaluation,
  height = 300,
  showPercentages = true,
  interactive = true,
  className = ''
}) => {
  // ========================================
  // PRÉPARATION DES DONNÉES
  // ========================================

  const chartData = useMemo(() => {
    const labels = statistics.distribution.map(d => d.range);
    const counts = statistics.distribution.map(d => d.count);
    const percentages = statistics.distribution.map(d => d.percentage);

    // Couleurs adaptatives selon la performance
    const backgroundColors = statistics.distribution.map(d => {
      const midPoint = (d.min + d.max) / 2;
      const maxScore = Number(evaluation.maxScore);
      const ratio = midPoint / maxScore;
      
      if (ratio >= 0.8) return 'rgba(34, 197, 94, 0.6)';  // Vert pour excellence
      if (ratio >= 0.6) return 'rgba(59, 130, 246, 0.6)'; // Bleu pour bon
      if (ratio >= 0.5) return 'rgba(245, 158, 11, 0.6)'; // Orange pour moyen
      return 'rgba(239, 68, 68, 0.6)';                    // Rouge pour faible
    });

    const borderColors = backgroundColors.map(color => 
      color.replace('0.6', '1')
    );

    return {
      labels,
      datasets: [
        {
          label: 'Nombre d\'élèves',
          data: counts,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }
      ]
    };
  }, [statistics.distribution, evaluation.maxScore]);

  // ========================================
  // CONFIGURATION DU GRAPHIQUE
  // ========================================

  const options: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: `Distribution des notes - ${evaluation.title}`,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            const range = statistics.distribution[index];
            return `Notes ${range.range}`;
          },
          label: (context) => {
            const index = context.dataIndex;
            const range = statistics.distribution[index];
            
            if (context.dataset.label === 'Nombre d\'élèves') {
              return `${range.count} élève${range.count !== 1 ? 's' : ''}`;
            } else {
              return `${range.percentage.toFixed(1)}% de la classe`;
            }
          },
          afterBody: (context) => {
            const index = context[0].dataIndex;
            const range = statistics.distribution[index];
            
            // Informations supplémentaires
            const lines = [];
            lines.push(`Tranche: ${range.min.toFixed(1)} - ${range.max.toFixed(1)}`);
            
            if (range.count > 0) {
              const ratio = (range.min + range.max) / 2 / Number(evaluation.maxScore);
              if (ratio >= 0.8) lines.push('🏆 Excellence');
              else if (ratio >= 0.6) lines.push('👍 Bon niveau');
              else if (ratio >= 0.5) lines.push('📊 Niveau moyen');
              else lines.push('📉 À améliorer');
            }
            
            return lines;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: `Tranches de notes (/${evaluation.maxScore})`,
          font: {
            weight: 'bold'
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Nombre d\'élèves',
          font: {
            weight: 'bold'
          }
        },
        beginAtZero: true,
        max: Math.max(...statistics.distribution.map(d => d.count)) + 1,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            return Number.isInteger(value) ? value : '';
          }
        }
      },
    },
    elements: {
      bar: {
        borderRadius: 4
      }
    },
    animation: interactive ? {
      duration: 1000,
      easing: 'easeOutQuart'
    } : false
  }), [statistics.distribution, evaluation, showPercentages, interactive]);

  // ========================================
  // INDICATEURS STATISTIQUES SUPPLÉMENTAIRES
  // ========================================

  const distributionInsights = useMemo(() => {
    const maxCount = Math.max(...statistics.distribution.map(d => d.count));
    const modalRanges = statistics.distribution.filter(d => d.count === maxCount);
    
    const insights = [];
    
    if (modalRanges.length === 1) {
      insights.push(`📊 Mode: tranche ${modalRanges[0].range} (${maxCount} élèves)`);
    } else if (modalRanges.length > 1) {
      insights.push(`📊 Distribution multi-modale: ${modalRanges.map(r => r.range).join(', ')}`);
    }
    
    // Concentration des notes
    const topRanges = statistics.distribution.filter(d => {
      const midPoint = (d.min + d.max) / 2;
      return midPoint / Number(evaluation.maxScore) >= 0.6;
    });
    const topPercentage = topRanges.reduce((sum, range) => sum + range.percentage, 0);
    
    if (topPercentage >= 60) {
      insights.push(`🏆 ${topPercentage.toFixed(0)}% des élèves dans les bonnes tranches`);
    }
    
    return insights;
  }, [statistics.distribution, evaluation.maxScore]);

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className={className}>
      <div style={{ height: `${height}px` }}>
        <Bar data={chartData} options={options} />
      </div>
      
      {/* Insights sous le graphique */}
      {distributionInsights.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            📈 Analyse de la distribution
          </h4>
          <ul className="text-sm text-gray-700 space-y-1">
            {distributionInsights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Statistiques complémentaires */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="text-center p-2 bg-blue-50 rounded">
          <div className="font-medium text-blue-900">Moyenne</div>
          <div className="text-blue-700">{statistics.average.toFixed(1)}</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded">
          <div className="font-medium text-green-900">Médiane</div>
          <div className="text-green-700">{statistics.median.toFixed(1)}</div>
        </div>
        <div className="text-center p-2 bg-yellow-50 rounded">
          <div className="font-medium text-yellow-900">Écart-type</div>
          <div className="text-yellow-700">{statistics.standardDeviation.toFixed(1)}</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded">
          <div className="font-medium text-purple-900">Étendue</div>
          <div className="text-purple-700">{statistics.range.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
};

export default DistributionChart;
