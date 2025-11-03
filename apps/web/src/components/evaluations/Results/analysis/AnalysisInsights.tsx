// ========================================
// ANALYSIS INSIGHTS - INSIGHTS AUTOMATIQUES
// ========================================

import React, { useMemo } from 'react';
import { AlertsPanel } from './AlertsPanel';
import { RecommendationsBox } from './RecommendationsBox';
import type { StatisticsData } from '../../../../hooks/useStatistics';
import type { RankingData } from '../../../../hooks/useRanking';
import type { Evaluation } from '../../../../types';
import { cn } from '../../../../utils/classNames';

/**
 * Interface pour un insight automatique
 */
interface AnalysisInsight {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  data?: any;
}

/**
 * Interface pour une alerte pédagogique
 */
interface PedagogicalAlert {
  id: string;
  type: 'student_difficulty' | 'class_performance' | 'distribution_issue' | 'outlier_detected';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  students?: RankingData[];
  recommendations: string[];
}

/**
 * Props du composant AnalysisInsights
 */
interface AnalysisInsightsProps {
  statistics: StatisticsData;
  ranking: RankingData[];
  evaluation: Evaluation;
  detailed?: boolean;
  className?: string;
}

/**
 * Composant principal d'analyse automatique
 */
export const AnalysisInsights: React.FC<AnalysisInsightsProps> = ({
  statistics,
  ranking,
  evaluation,
  detailed = false,
  className = ''
}) => {
  // ========================================
  // ANALYSE AUTOMATIQUE DES INSIGHTS
  // ========================================

  const insights = useMemo((): AnalysisInsight[] => {
    const insights: AnalysisInsight[] = [];

    // Performance générale de la classe
    const averagePercentage = (statistics.average / Number(evaluation.maxScore)) * 100;
    
    if (averagePercentage >= 85) {
      insights.push({
        id: 'excellent_performance',
        type: 'success',
        title: 'Performance excellente',
        description: `La classe a obtenu une moyenne de ${statistics.average.toFixed(1)}/${evaluation.maxScore} (${averagePercentage.toFixed(0)}%).`,
        priority: 'high',
        icon: '🏆'
      });
    } else if (averagePercentage < 50) {
      insights.push({
        id: 'poor_performance',
        type: 'danger',
        title: 'Performance préoccupante',
        description: `La moyenne de classe (${statistics.average.toFixed(1)}/${evaluation.maxScore}) est en-dessous du seuil de réussite.`,
        action: 'Envisager une remédiation',
        priority: 'high',
        icon: '🚨'
      });
    }

    // Analyse de la dispersion
    if (statistics.standardDeviation > 4) {
      insights.push({
        id: 'high_dispersion',
        type: 'warning',
        title: 'Forte hétérogénéité',
        description: `L'écart-type élevé (${statistics.standardDeviation.toFixed(1)}) indique une grande disparité de niveaux.`,
        action: 'Différenciation pédagogique recommandée',
        priority: 'medium',
        icon: '📊'
      });
    } else if (statistics.standardDeviation < 1.5) {
      insights.push({
        id: 'low_dispersion',
        type: 'info',
        title: 'Groupe homogène',
        description: `L'écart-type faible (${statistics.standardDeviation.toFixed(1)}) indique un niveau homogène.`,
        priority: 'low',
        icon: '📈'
      });
    }

    // Taux de réussite
    if (statistics.passingRate < 60) {
      insights.push({
        id: 'low_success_rate',
        type: 'danger',
        title: 'Taux de réussite faible',
        description: `Seulement ${statistics.passingRate.toFixed(0)}% des élèves ont la moyenne.`,
        action: 'Révision du chapitre nécessaire',
        priority: 'high',
        icon: '📉'
      });
    } else if (statistics.passingRate >= 90) {
      insights.push({
        id: 'high_success_rate',
        type: 'success',
        title: 'Excellent taux de réussite',
        description: `${statistics.passingRate.toFixed(0)}% des élèves ont la moyenne ou plus.`,
        priority: 'medium',
        icon: '✅'
      });
    }

    // Valeurs aberrantes
    if (statistics.outliers.length > 0) {
      const highOutliers = statistics.outliers.filter(o => o > statistics.average);
      const lowOutliers = statistics.outliers.filter(o => o < statistics.average);
      
      if (highOutliers.length > 0) {
        insights.push({
          id: 'high_outliers',
          type: 'info',
          title: 'Performances exceptionnelles',
          description: `${highOutliers.length} élève(s) avec des résultats exceptionnellement élevés.`,
          priority: 'low',
          icon: '⭐',
          data: { scores: highOutliers }
        });
      }
      
      if (lowOutliers.length > 0) {
        insights.push({
          id: 'low_outliers',
          type: 'warning',
          title: 'Résultats exceptionnellement faibles',
          description: `${lowOutliers.length} élève(s) avec des résultats bien en-dessous de la moyenne.`,
          action: 'Suivi individualisé recommandé',
          priority: 'high',
          icon: '⚠️',
          data: { scores: lowOutliers }
        });
      }
    }

    // Distribution asymétrique
    if (Math.abs(statistics.skewness) > 0.5) {
      const direction = statistics.skewness > 0 ? 'vers les notes basses' : 'vers les notes hautes';
      insights.push({
        id: 'skewed_distribution',
        type: 'info',
        title: 'Distribution asymétrique',
        description: `La distribution des notes est déséquilibrée ${direction}.`,
        priority: 'low',
        icon: '📐'
      });
    }

    // Fiabilité des statistiques
    if (!statistics.isReliable) {
      insights.push({
        id: 'unreliable_stats',
        type: 'warning',
        title: 'Statistiques peu fiables',
        description: `Trop peu d'élèves présents (${statistics.presentStudents}) pour des statistiques robustes.`,
        priority: 'medium',
        icon: '⚠️'
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [statistics, evaluation]);

  // ========================================
  // ALERTES PÉDAGOGIQUES
  // ========================================

  const alerts = useMemo((): PedagogicalAlert[] => {
    const alerts: PedagogicalAlert[] = [];

    // Élèves en grande difficulté
    const strugglingStudents = ranking.filter(r => 
      r.relativePosition === 'bottom' || 
      (r.score !== null && r.score < Number(evaluation.maxScore) * 0.4)
    );

    if (strugglingStudents.length > 0) {
      alerts.push({
        id: 'struggling_students',
        type: 'student_difficulty',
        severity: 'critical',
        title: `${strugglingStudents.length} élève(s) en grande difficulté`,
        description: 'Ces élèves nécessitent un accompagnement immédiat.',
        students: strugglingStudents,
        recommendations: [
          'Organiser un entretien individuel',
          'Proposer du soutien scolaire',
          'Adapter les exercices au niveau',
          'Contacter les parents si nécessaire'
        ]
      });
    }

    // Performance de classe préoccupante
    if (statistics.average < Number(evaluation.maxScore) * 0.5) {
      alerts.push({
        id: 'poor_class_performance',
        type: 'class_performance',
        severity: 'warning',
        title: 'Performance de classe préoccupante',
        description: 'La moyenne générale est en-dessous du seuil de réussite.',
        recommendations: [
          'Reprendre les notions difficiles',
          'Organiser une séance de remédiation',
          'Vérifier la compréhension des consignes',
          'Adapter le rythme d\'apprentissage'
        ]
      });
    }

    // Distribution problématique
    if (statistics.difficultyRate > 40) {
      alerts.push({
        id: 'high_difficulty_rate',
        type: 'distribution_issue',
        severity: 'warning',
        title: 'Taux de difficulté élevé',
        description: `${statistics.difficultyRate.toFixed(0)}% des élèves sont en difficulté sur cette évaluation.`,
        recommendations: [
          'Revoir la difficulté de l\'évaluation',
          'Organiser des groupes de besoin',
          'Proposer des exercices de renforcement',
          'Envisager une évaluation différenciée'
        ]
      });
    }

    // Valeurs aberrantes inquiétantes
    const concerningOutliers = ranking.filter(r => 
      r.isOutlier && r.score !== null && r.score < statistics.average
    );

    if (concerningOutliers.length > 0) {
      alerts.push({
        id: 'concerning_outliers',
        type: 'outlier_detected',
        severity: 'info',
        title: 'Résultats atypiques détectés',
        description: 'Certains élèves ont des résultats statistiquement atypiques.',
        students: concerningOutliers,
        recommendations: [
          'Vérifier les conditions d\'évaluation',
          'S\'assurer de la compréhension des consignes',
          'Investiguer d\'éventuelles difficultés personnelles'
        ]
      });
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 3, warning: 2, info: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [statistics, ranking, evaluation]);

  // ========================================
  // RECOMMANDATIONS PÉDAGOGIQUES
  // ========================================

  const recommendations = useMemo(() => {
    const recs: string[] = [];

    // Basé sur la performance
    if (statistics.classLevel === 'excellent') {
      recs.push('Proposer des défis supplémentaires pour maintenir la motivation');
      recs.push('Utiliser les élèves performants comme tuteurs');
    } else if (statistics.classLevel === 'concerning') {
      recs.push('Organiser une séance de remédiation immédiate');
      recs.push('Revoir les prérequis avant de continuer');
    }

    // Basé sur la dispersion
    if (statistics.standardDeviation > 3) {
      recs.push('Mettre en place une pédagogie différenciée');
      recs.push('Créer des groupes de niveau temporaires');
    }

    // Basé sur les outliers
    if (statistics.outliers.length > 2) {
      recs.push('Investiguer les causes des résultats atypiques');
      recs.push('Adapter l\'évaluation aux besoins individuels');
    }

    return recs;
  }, [statistics]);

  // ========================================
  // RENDU
  // ========================================

  const hasSignificantInsights = insights.filter(i => i.priority === 'high').length > 0;
  const hasCriticalAlerts = alerts.filter(a => a.severity === 'critical').length > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Alertes critiques en premier */}
      {hasCriticalAlerts && (
        <AlertsPanel 
          alerts={alerts.filter(a => a.severity === 'critical')} 
          compact={!detailed}
        />
      )}

      {/* Insights principaux */}
      {(hasSignificantInsights || detailed) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🧠</span>
            Analyse automatique
          </h3>
          
          <div className="space-y-3">
            {insights.slice(0, detailed ? 10 : 3).map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Recommandations */}
      {(recommendations.length > 0 || detailed) && (
        <RecommendationsBox 
          recommendations={recommendations}
          compact={!detailed}
        />
      )}

      {/* Autres alertes */}
      {alerts.filter(a => a.severity !== 'critical').length > 0 && detailed && (
        <AlertsPanel 
          alerts={alerts.filter(a => a.severity !== 'critical')} 
          compact={false}
        />
      )}
    </div>
  );
};

/**
 * Composant carte d'insight
 */
interface InsightCardProps {
  insight: AnalysisInsight;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const typeColors = {
    success: 'border-green-200 bg-green-50 text-green-800',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    danger: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800'
  };

  return (
    <div className={cn(
      'border rounded-lg p-3 transition-colors',
      typeColors[insight.type]
    )}>
      <div className="flex items-start">
        <span className="text-lg mr-3 flex-shrink-0">
          {insight.icon}
        </span>
        <div className="flex-1">
          <h4 className="font-medium text-sm mb-1">
            {insight.title}
          </h4>
          <p className="text-sm opacity-90 mb-2">
            {insight.description}
          </p>
          {insight.action && (
            <div className="text-xs font-medium opacity-80">
              → {insight.action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisInsights;
