// ========================================
// ALERTS PANEL - PANNEAU D'ALERTES
// ========================================

import React, { useState } from 'react';
import type { RankingData } from '../../../../hooks/useRanking';
import { cn } from '../../../../utils/classNames';

/**
 * Interface pour une alerte pédagogique
 */
export interface PedagogicalAlert {
  id: string;
  type: 'student_difficulty' | 'class_performance' | 'distribution_issue' | 'outlier_detected';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  students?: RankingData[];
  recommendations: string[];
}

/**
 * Props du composant AlertsPanel
 */
interface AlertsPanelProps {
  alerts: PedagogicalAlert[];
  compact?: boolean;
  className?: string;
}

/**
 * Composant panneau d'alertes pédagogiques
 */
export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  compact = false,
  className = ''
}) => {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  if (alerts.length === 0) return null;

  // ========================================
  // CONFIGURATION DES STYLES
  // ========================================

  const severityConfig = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: '🚨',
      iconBg: 'bg-red-100'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: '⚠️',
      iconBg: 'bg-yellow-100'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'ℹ️',
      iconBg: 'bg-blue-100'
    }
  };

  // ========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const handleAlertExpand = (alertId: string) => {
    setExpandedAlert(prev => prev === alertId ? null : alertId);
  };

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center">
        <h3 className="text-lg font-medium text-gray-900">
          🚨 Alertes pédagogiques
        </h3>
        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {alerts.length}
        </span>
      </div>

      <div className="space-y-2">
        {alerts.map(alert => {
          const config = severityConfig[alert.severity];
          const isExpanded = expandedAlert === alert.id;

          return (
            <div
              key={alert.id}
              className={cn(
                'border rounded-lg transition-all duration-200',
                config.bg,
                config.border
              )}
            >
              {/* Header de l'alerte */}
              <div
                className={cn(
                  'p-4 cursor-pointer',
                  !compact && 'hover:opacity-80'
                )}
                onClick={() => !compact && handleAlertExpand(alert.id)}
              >
                <div className="flex items-start">
                  <div className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3',
                    config.iconBg
                  )}>
                    <span className="text-sm">{config.icon}</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={cn('font-medium text-sm', config.text)}>
                        {alert.title}
                      </h4>
                      
                      {!compact && (
                        <button className={cn('ml-2 text-sm', config.text, 'opacity-60 hover:opacity-100')}>
                          <svg 
                            className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <p className={cn('text-sm mt-1 opacity-90', config.text)}>
                      {alert.description}
                    </p>

                    {/* Élèves concernés (aperçu) */}
                    {alert.students && alert.students.length > 0 && (
                      <div className="mt-2">
                        <span className={cn('text-xs font-medium', config.text)}>
                          Élèves concernés: 
                        </span>
                        <span className={cn('text-xs ml-1', config.text, 'opacity-80')}>
                          {alert.students.slice(0, 3).map(s => s.displayName).join(', ')}
                          {alert.students.length > 3 && ` +${alert.students.length - 3} autres`}
                        </span>
                      </div>
                    )}

                    {/* Première recommandation en aperçu */}
                    {compact && alert.recommendations.length > 0 && (
                      <div className="mt-2 text-xs opacity-80">
                        💡 {alert.recommendations[0]}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contenu étendu */}
              {isExpanded && !compact && (
                <div className="border-t border-current border-opacity-20 p-4">
                  {/* Liste des élèves concernés */}
                  {alert.students && alert.students.length > 0 && (
                    <div className="mb-4">
                      <h5 className={cn('font-medium text-sm mb-2', config.text)}>
                        Élèves concernés ({alert.students.length})
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {alert.students.map(student => (
                          <div
                            key={student.student.id}
                            className={cn(
                              'flex items-center justify-between p-2 rounded border',
                              'bg-white bg-opacity-60'
                            )}
                          >
                            <span className="text-sm font-medium">
                              {student.displayName}
                            </span>
                            <span className="text-sm opacity-80">
                              {student.score !== null ? `${student.score.toFixed(1)}` : 'Absent'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommandations */}
                  <div>
                    <h5 className={cn('font-medium text-sm mb-2', config.text)}>
                      Recommandations pédagogiques
                    </h5>
                    <ul className="space-y-1">
                      {alert.recommendations.map((rec, index) => (
                        <li
                          key={index}
                          className={cn('text-sm flex items-start', config.text, 'opacity-90')}
                        >
                          <span className="mr-2 flex-shrink-0">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPanel;
