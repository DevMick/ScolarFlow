// ========================================
// TEMPLATE CARD - CARTE TEMPLATE INDIVIDUEL
// ========================================

import React from 'react';
import { cn } from '../../../../utils/classNames';
import { templateCategories } from './templateData';
import type { EvaluationTemplate } from './templateData';

/**
 * Props du composant TemplateCard
 */
interface TemplateCardProps {
  template: EvaluationTemplate;
  onClick: () => void;
  isSelected?: boolean;
  showDescription?: boolean;
  compact?: boolean;
}

/**
 * Composant card pour template individuel
 */
export const TemplateCard: React.FC<TemplateCardProps> = ({ 
  template, 
  onClick, 
  isSelected = false,
  showDescription = true,
  compact = false
}) => {
  // ========================================
  // STYLES DYNAMIQUES
  // ========================================

  const categoryInfo = templateCategories[template.category];
  
  const categoryColors = {
    mathematiques: 'border-blue-200 bg-blue-50 text-blue-900',
    francais: 'border-green-200 bg-green-50 text-green-900',
    sciences: 'border-purple-200 bg-purple-50 text-purple-900',
    histoire_geo: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    general: 'border-gray-200 bg-gray-50 text-gray-900'
  };

  const hoverColors = {
    mathematiques: 'hover:border-blue-400',
    francais: 'hover:border-green-400',
    sciences: 'hover:border-purple-400',
    histoire_geo: 'hover:border-yellow-400',
    general: 'hover:border-gray-400'
  };

  // ========================================
  // RENDU
  // ========================================

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-lg border-2 text-left transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        
        // État sélectionné
        isSelected 
          ? 'border-blue-500 bg-blue-100 shadow-lg ring-2 ring-blue-500 ring-opacity-50' 
          : cn(
              'border-gray-200 bg-white shadow-sm',
              'hover:shadow-md hover:scale-105',
              hoverColors[template.category]
            ),
            
        // Taille compacte
        compact && 'p-3'
      )}
      aria-pressed={isSelected}
      aria-label={`Sélectionner le modèle ${template.name}`}
    >
      <div className="flex items-start h-full">
        {/* Icône */}
        <div className="flex-shrink-0 mr-3">
          <span className={cn(
            'block text-center',
            compact ? 'text-xl' : 'text-2xl'
          )}>
            {template.icon}
          </span>
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          {/* Titre */}
          <h3 className={cn(
            'font-semibold text-gray-900 mb-1 truncate',
            compact ? 'text-sm' : 'text-base'
          )}>
            {template.name}
          </h3>

          {/* Description */}
          {showDescription && (
            <p className={cn(
              'text-gray-600 mb-3',
              compact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'
            )}>
              {template.description}
            </p>
          )}

          {/* Tags et métadonnées */}
          <div className="space-y-2">
            {/* Tags principaux */}
            <div className="flex flex-wrap gap-1">
              {/* Catégorie */}
              <span className={cn(
                'px-2 py-1 rounded-full font-medium border',
                categoryColors[template.category],
                compact ? 'text-xs' : 'text-xs'
              )}>
                {categoryInfo.icon} {categoryInfo.label}
              </span>

              {/* Niveau */}
              {template.level !== 'all' && (
                <span className={cn(
                  'px-2 py-1 rounded-full border border-gray-200 bg-gray-100 text-gray-700',
                  compact ? 'text-xs' : 'text-xs'
                )}>
                  {template.level}
                </span>
              )}
            </div>

            {/* Tags secondaires */}
            {!compact && template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                    +{template.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Popularité et détails */}
            <div className="flex items-center justify-between">
              {/* Étoiles de popularité */}
              <div className="flex items-center">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={cn(
                        compact ? 'w-2.5 h-2.5' : 'w-3 h-3',
                        i < template.popularity ? 'text-yellow-400' : 'text-gray-300'
                      )}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {!compact && (
                  <span className="ml-1 text-xs text-gray-500">
                    ({template.popularity}/5)
                  </span>
                )}
              </div>

              {/* Aperçu des paramètres */}
              {!compact && template.data.maxScore && (
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    /{template.data.maxScore} pts
                  </div>
                  {template.data.coefficient && template.data.coefficient !== 1 && (
                    <div className="text-xs text-gray-400">
                      coeff. {template.data.coefficient}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Indicateur de sélection */}
        {isSelected && (
          <div className="flex-shrink-0 ml-2">
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Barre de progression pour template complet */}
      {!compact && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Paramètres pré-remplis</span>
            <span>85%</span>
          </div>
          <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
            <div className="bg-blue-600 h-1 rounded-full w-[85%]"></div>
          </div>
        </div>
      )}
    </button>
  );
};

export default TemplateCard;
