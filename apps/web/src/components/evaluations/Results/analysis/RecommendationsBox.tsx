// ========================================
// RECOMMENDATIONS BOX - BOÎTE DE RECOMMANDATIONS
// ========================================

import React, { useState } from 'react';
import { cn } from '../../../../utils/classNames';

/**
 * Props du composant RecommendationsBox
 */
interface RecommendationsBoxProps {
  recommendations: string[];
  compact?: boolean;
  className?: string;
  title?: string;
}

/**
 * Composant boîte de recommandations pédagogiques
 */
export const RecommendationsBox: React.FC<RecommendationsBoxProps> = ({
  recommendations,
  compact = false,
  className = '',
  title = 'Recommandations pédagogiques'
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);

  if (recommendations.length === 0) {
    return (
      <div className={cn('bg-gray-50 rounded-lg p-4 border border-gray-200', className)}>
        <div className="flex items-center">
          <span className="text-2xl mr-3">💡</span>
          <div>
            <h3 className="font-medium text-gray-900">Aucune recommandation spécifique</h3>
            <p className="text-sm text-gray-600 mt-1">
              Les résultats de cette évaluation ne nécessitent pas d'actions particulières.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-blue-50 rounded-lg border border-blue-200', className)}>
      {/* Header */}
      <div
        className={cn(
          'p-4 flex items-center justify-between',
          compact && 'cursor-pointer hover:bg-blue-75'
        )}
        onClick={compact ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div className="flex items-center">
          <span className="text-2xl mr-3">💡</span>
          <div>
            <h3 className="font-medium text-blue-900">{title}</h3>
            <p className="text-sm text-blue-700 mt-1">
              {recommendations.length} suggestion{recommendations.length > 1 ? 's' : ''} pour améliorer les résultats
            </p>
          </div>
        </div>
        
        {compact && (
          <button className="text-blue-600 hover:text-blue-800">
            <svg 
              className={cn('w-5 h-5 transition-transform', isExpanded && 'rotate-180')}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Contenu des recommandations */}
      {isExpanded && (
        <div className="border-t border-blue-200 p-4">
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <RecommendationItem
                key={index}
                recommendation={recommendation}
                index={index}
                priority={index < 2 ? 'high' : index < 4 ? 'medium' : 'low'}
              />
            ))}
          </div>

          {/* Actions rapides */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Actions rapides
            </h4>
            <div className="flex flex-wrap gap-2">
              <QuickActionButton
                icon="📋"
                label="Créer plan de remédiation"
                onClick={() => {/* TODO: Implémenter */}}
              />
              <QuickActionButton
                icon="👥"
                label="Former groupes de besoin"
                onClick={() => {/* TODO: Implémenter */}}
              />
              <QuickActionButton
                icon="📊"
                label="Générer rapport parents"
                onClick={() => {/* TODO: Implémenter */}}
              />
              <QuickActionButton
                icon="📝"
                label="Créer évaluation différenciée"
                onClick={() => {/* TODO: Implémenter */}}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Composant item de recommandation
 */
interface RecommendationItemProps {
  recommendation: string;
  index: number;
  priority: 'high' | 'medium' | 'low';
}

const RecommendationItem: React.FC<RecommendationItemProps> = ({
  recommendation,
  index,
  priority
}) => {
  const priorityConfig = {
    high: {
      badge: 'bg-red-100 text-red-800',
      icon: '🔥',
      label: 'Priorité haute'
    },
    medium: {
      badge: 'bg-yellow-100 text-yellow-800',
      icon: '⚡',
      label: 'Priorité moyenne'
    },
    low: {
      badge: 'bg-green-100 text-green-800',
      icon: '✨',
      label: 'Amélioration'
    }
  };

  const config = priorityConfig[priority];

  return (
    <div className="flex items-start space-x-3 p-3 bg-white bg-opacity-60 rounded-lg">
      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-800">
        {index + 1}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm">{config.icon}</span>
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
            config.badge
          )}>
            {config.label}
          </span>
        </div>
        
        <p className="text-sm text-blue-900">
          {recommendation}
        </p>
      </div>
    </div>
  );
};

/**
 * Composant bouton d'action rapide
 */
interface QuickActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon,
  label,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center px-3 py-1.5 bg-white bg-opacity-80 border border-blue-300 rounded-md text-sm font-medium text-blue-800 hover:bg-opacity-100 hover:bg-blue-100 transition-colors"
    >
      <span className="mr-1.5">{icon}</span>
      {label}
    </button>
  );
};

export default RecommendationsBox;
