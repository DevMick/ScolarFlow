// ========================================
// COMPARISON CHART - GRAPHIQUE DE COMPARAISON
// ========================================

import React from 'react';
import type { StatisticsData } from '../../../../hooks/useStatistics';

interface ComparisonChartProps {
  evaluationId: number;
  currentStatistics: StatisticsData;
  height?: number;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  evaluationId,
  currentStatistics,
  height = 300
}) => {
  // TODO: Implémenter la comparaison avec d'autres évaluations
  return (
    <div style={{ height: `${height}px` }} className="flex items-center justify-center text-gray-500">
      <div className="text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium mb-2">Comparaison avec autres évaluations</h3>
        <p>Fonctionnalité en cours de développement</p>
        <p className="text-sm mt-2">
          Moyenne actuelle: {currentStatistics.average.toFixed(1)}/{currentStatistics.evaluation.maxScore}
        </p>
      </div>
    </div>
  );
};

export default ComparisonChart;
