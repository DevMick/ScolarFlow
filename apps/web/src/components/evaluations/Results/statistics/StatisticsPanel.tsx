// ========================================
// STATISTICS PANEL - PANNEAU STATISTIQUES
// ========================================

import React, { useState } from 'react';
import { DistributionChart } from './DistributionChart';
import { PerformanceChart } from './PerformanceChart';
import { ComparisonChart } from './ComparisonChart';
import { TrendsChart } from './TrendsChart';
import { StatCard } from './StatCard';
import type { StatisticsData } from '../../../../hooks/useStatistics';
import type { RankingData } from '../../../../hooks/useRanking';
import type { Evaluation } from '../../../../types';
import { cn } from '../../../../utils/classNames';

/**
 * Types pour les onglets de graphiques
 */
type ChartTab = 'distribution' | 'performance' | 'comparison' | 'trends';

/**
 * Props du composant StatisticsPanel
 */
interface StatisticsPanelProps {
  statistics: StatisticsData;
  ranking: RankingData[];
  evaluation: Evaluation;
  compact?: boolean;
  className?: string;
  defaultTab?: ChartTab;
}

/**
 * Composant panneau de statistiques
 */
export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  statistics,
  ranking,
  evaluation,
  compact = false,
  className = '',
  defaultTab = 'distribution'
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [activeTab, setActiveTab] = useState<ChartTab>(defaultTab);

  // ========================================
  // CALCULS POUR LES CARTES STATS
  // ========================================

  const statsCards = [
    {
      label: 'Moyenne générale',
      value: `${statistics.average.toFixed(1)}/${evaluation.maxScore}`,
      subValue: `${((statistics.average / Number(evaluation.maxScore)) * 100).toFixed(0)}%`,
      color: 'blue',
      trend: statistics.classLevel === 'excellent' || statistics.classLevel === 'good' ? 'up' : 
             statistics.classLevel === 'below_average' || statistics.classLevel === 'concerning' ? 'down' : 'stable',
      icon: '📊'
    },
    {
      label: 'Médiane',
      value: `${statistics.median.toFixed(1)}/${evaluation.maxScore}`,
      subValue: statistics.average !== statistics.median ? 
        `${statistics.average > statistics.median ? '+' : ''}${(statistics.average - statistics.median).toFixed(1)} vs moyenne` : 
        'Égale à la moyenne',
      color: 'green',
      trend: 'stable',
      icon: '📈'
    },
    {
      label: 'Écart-type',
      value: statistics.standardDeviation.toFixed(1),
      subValue: statistics.standardDeviation > 3 ? 'Dispersion élevée' : 
                statistics.standardDeviation < 1.5 ? 'Groupe homogène' : 'Dispersion normale',
      color: statistics.standardDeviation > 3 ? 'red' : statistics.standardDeviation < 1.5 ? 'green' : 'yellow',
      trend: 'stable',
      icon: '📐'
    },
    {
      label: 'Taux de réussite',
      value: `${statistics.passingRate.toFixed(0)}%`,
      subValue: `${statistics.presentStudents - Math.round((statistics.passingRate / 100) * statistics.presentStudents)} élèves en difficulté`,
      color: statistics.passingRate >= 80 ? 'green' : statistics.passingRate >= 60 ? 'yellow' : 'red',
      trend: statistics.passingRate >= 70 ? 'up' : 'down',
      icon: '✅'
    },
    {
      label: 'Excellence',
      value: `${statistics.excellenceRate.toFixed(0)}%`,
      subValue: `${Math.round((statistics.excellenceRate / 100) * statistics.presentStudents)} élèves`,
      color: statistics.excellenceRate >= 20 ? 'green' : statistics.excellenceRate >= 10 ? 'yellow' : 'gray',
      trend: statistics.excellenceRate >= 15 ? 'up' : 'stable',
      icon: '🏆'
    },
    {
      label: 'Fiabilité stats',
      value: statistics.isReliable ? 'Fiable' : 'Limitée',
      subValue: `${statistics.presentStudents} élèves présents`,
      color: statistics.isReliable ? 'green' : 'yellow',
      trend: 'stable',
      icon: statistics.isReliable ? '✓' : '⚠️'
    }
  ];

  // ========================================
  // CONFIGURATION DES ONGLETS
  // ========================================

  const tabs = [
    {
      id: 'distribution' as ChartTab,
      label: 'Distribution',
      description: 'Répartition des notes',
      icon: '📊'
    },
    {
      id: 'performance' as ChartTab,
      label: 'Performance',
      description: 'Analyse détaillée',
      icon: '📈'
    },
    {
      id: 'comparison' as ChartTab,
      label: 'Comparaison',
      description: 'Comparaison avec autres évaluations',
      icon: '⚖️'
    },
    {
      id: 'trends' as ChartTab,
      label: 'Évolution',
      description: 'Tendances dans le temps',
      icon: '📉'
    }
  ];

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className={cn('space-y-6', className)}>
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsCards.slice(0, compact ? 3 : 6).map((stat, index) => (
          <StatCard
            key={index}
            label={stat.label}
            value={stat.value}
            subValue={stat.subValue}
            color={stat.color}
            trend={stat.trend}
            icon={stat.icon}
            compact={compact}
          />
        ))}
      </div>

      {/* Onglets des graphiques */}
      {!compact && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Navigation des onglets */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors',
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <span className="mr-2">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.icon}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Contenu des graphiques */}
          <div className="p-6">
            {activeTab === 'distribution' && (
              <DistributionChart 
                statistics={statistics}
                evaluation={evaluation}
              />
            )}

            {activeTab === 'performance' && (
              <PerformanceChart 
                statistics={statistics}
                ranking={ranking}
                evaluation={evaluation}
              />
            )}

            {activeTab === 'comparison' && (
              <ComparisonChart 
                evaluationId={evaluation.id}
                currentStatistics={statistics}
              />
            )}

            {activeTab === 'trends' && (
              <TrendsChart 
                evaluationId={evaluation.id}
                classId={evaluation.classId}
              />
            )}
          </div>
        </div>
      )}

      {/* Version compacte avec graphique unique */}
      {compact && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            📊 Distribution des notes
          </h3>
          <DistributionChart 
            statistics={statistics}
            evaluation={evaluation}
            height={200}
          />
        </div>
      )}

      {/* Insights rapides */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          💡 Insights automatiques
        </h3>
        <div className="space-y-2 text-sm">
          {/* Niveau de la classe */}
          <div className="flex items-start">
            <span className="mr-2">
              {statistics.classLevel === 'excellent' ? '🏆' :
               statistics.classLevel === 'good' ? '👍' :
               statistics.classLevel === 'average' ? '📊' :
               statistics.classLevel === 'below_average' ? '📉' : '🚨'}
            </span>
            <div>
              <span className="font-medium">
                Niveau de classe: {
                  statistics.classLevel === 'excellent' ? 'Excellent' :
                  statistics.classLevel === 'good' ? 'Bon' :
                  statistics.classLevel === 'average' ? 'Moyen' :
                  statistics.classLevel === 'below_average' ? 'En-dessous de la moyenne' : 'Préoccupant'
                }
              </span>
              <p className="text-gray-600 mt-1">
                {statistics.classLevel === 'excellent' && 'Félicitations ! La classe a excellé dans cette évaluation.'}
                {statistics.classLevel === 'good' && 'Bonne performance générale de la classe.'}
                {statistics.classLevel === 'average' && 'Performance dans la moyenne attendue.'}
                {statistics.classLevel === 'below_average' && 'Des améliorations sont nécessaires.'}
                {statistics.classLevel === 'concerning' && 'Attention ! Des mesures correctives sont urgentes.'}
              </p>
            </div>
          </div>

          {/* Distribution */}
          <div className="flex items-start">
            <span className="mr-2">
              {statistics.isNormalDistribution ? '📈' : '⚠️'}
            </span>
            <div>
              <span className="font-medium">
                Distribution: {statistics.isNormalDistribution ? 'Normale' : 'Asymétrique'}
              </span>
              <p className="text-gray-600 mt-1">
                {statistics.isNormalDistribution ? 
                  'La répartition des notes suit une courbe normale.' :
                  `Distribution ${statistics.skewness > 0 ? 'concentrée vers les notes basses' : 'concentrée vers les notes hautes'}.`
                }
              </p>
            </div>
          </div>

          {/* Valeurs aberrantes */}
          {statistics.outliers.length > 0 && (
            <div className="flex items-start">
              <span className="mr-2">🎯</span>
              <div>
                <span className="font-medium">
                  Valeurs aberrantes détectées
                </span>
                <p className="text-gray-600 mt-1">
                  {statistics.outliers.length} note{statistics.outliers.length > 1 ? 's' : ''} exceptionnelle{statistics.outliers.length > 1 ? 's' : ''}: {statistics.outliers.map(o => o.toFixed(1)).join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Fiabilité */}
          {!statistics.isReliable && (
            <div className="flex items-start">
              <span className="mr-2">⚠️</span>
              <div>
                <span className="font-medium text-yellow-700">
                  Statistiques peu fiables
                </span>
                <p className="text-gray-600 mt-1">
                  Trop peu d'élèves présents ({statistics.presentStudents}) pour des statistiques fiables (minimum 5).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel;
