// ========================================
// TRENDS CHART - GRAPHIQUE D'ÉVOLUTION
// ========================================

import React from 'react';

interface TrendsChartProps {
  evaluationId: number;
  classId: number;
  height?: number;
}

export const TrendsChart: React.FC<TrendsChartProps> = ({
  evaluationId,
  classId,
  height = 300
}) => {
  // TODO: Implémenter l'évolution temporelle
  return (
    <div style={{ height: `${height}px` }} className="flex items-center justify-center text-gray-500">
      <div className="text-center">
        <div className="text-4xl mb-4">📈</div>
        <h3 className="text-lg font-medium mb-2">Évolution temporelle</h3>
        <p>Fonctionnalité en cours de développement</p>
        <p className="text-sm mt-2">
          Analyse des tendances pour la classe {classId}
        </p>
      </div>
    </div>
  );
};

export default TrendsChart;
