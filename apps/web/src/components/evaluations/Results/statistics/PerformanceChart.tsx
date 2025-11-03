// ========================================
// PERFORMANCE CHART - GRAPHIQUE DE PERFORMANCE
// ========================================

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { StatisticsData } from '../../../../hooks/useStatistics';
import type { RankingData } from '../../../../hooks/useRanking';
import type { Evaluation } from '../../../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceChartProps {
  statistics: StatisticsData;
  ranking: RankingData[];
  evaluation: Evaluation;
  height?: number;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  statistics,
  ranking,
  evaluation,
  height = 300
}) => {
  const chartData = useMemo(() => {
    const sortedRanking = ranking
      .filter(r => r.score !== null)
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    return {
      labels: sortedRanking.map((_, index) => `Élève ${index + 1}`),
      datasets: [
        {
          label: 'Notes des élèves',
          data: sortedRanking.map(r => r.score),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          pointBackgroundColor: sortedRanking.map(r => 
            r.relativePosition === 'top' ? 'rgb(34, 197, 94)' :
            r.relativePosition === 'bottom' ? 'rgb(239, 68, 68)' :
            'rgb(59, 130, 246)'
          ),
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointRadius: 6,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Moyenne de classe',
          data: Array(sortedRanking.length).fill(statistics.average),
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          pointRadius: 0,
          borderWidth: 2
        }
      ]
    };
  }, [statistics, ranking]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Performance individuelle des élèves'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            if (context.datasetIndex === 0) {
              const studentIndex = context.dataIndex;
              const student = ranking.filter(r => r.score !== null)
                .sort((a, b) => (b.score || 0) - (a.score || 0))[studentIndex];
              return `${student.displayName}: ${context.parsed.y?.toFixed(1)}/${evaluation.maxScore}`;
            }
            return `Moyenne: ${context.parsed.y?.toFixed(1)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Number(evaluation.maxScore),
        title: {
          display: true,
          text: `Notes (/${evaluation.maxScore})`
        }
      }
    }
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default PerformanceChart;
