// ========================================
// WIZARD NAVIGATION - BOUTONS DE NAVIGATION
// ========================================

import React from 'react';
import { cn } from '../../../../utils/classNames';

/**
 * Props du composant WizardNavigation
 */
interface WizardNavigationProps {
  canGoPrevious: boolean;
  canGoNext: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  nextLabel?: string;
  previousLabel?: string;
  className?: string;
  showStepInfo?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

/**
 * Composant de navigation du wizard
 */
export const WizardNavigation: React.FC<WizardNavigationProps> = ({
  canGoPrevious,
  canGoNext,
  isFirstStep,
  isLastStep,
  isSubmitting = false,
  onPrevious,
  onNext,
  nextLabel,
  previousLabel,
  className = '',
  showStepInfo = false,
  currentStep,
  totalSteps
}) => {
  // ========================================
  // LABELS DYNAMIQUES
  // ========================================

  const defaultNextLabel = isLastStep 
    ? 'Créer l\'évaluation' 
    : 'Suivant';

  const defaultPreviousLabel = 'Précédent';

  const finalNextLabel = nextLabel || defaultNextLabel;
  const finalPreviousLabel = previousLabel || defaultPreviousLabel;

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {/* Bouton précédent */}
      <div className="flex-1">
        {!isFirstStep && (
          <button
            type="button"
            onClick={onPrevious}
            disabled={!canGoPrevious || isSubmitting}
            className={cn(
              'inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm',
              'text-sm font-medium text-gray-700 bg-white transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              
              // États interactifs
              canGoPrevious && !isSubmitting
                ? 'hover:bg-gray-50 hover:text-gray-900'
                : 'opacity-50 cursor-not-allowed'
            )}
          >
            <svg 
              className="w-4 h-4 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
            {finalPreviousLabel}
          </button>
        )}
      </div>

      {/* Informations d'étape (optionnel) */}
      {showStepInfo && currentStep !== undefined && totalSteps !== undefined && (
        <div className="flex-1 text-center">
          <span className="text-sm text-gray-500">
            Étape {currentStep + 1} sur {totalSteps}
          </span>
        </div>
      )}

      {/* Bouton suivant */}
      <div className="flex-1 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || isSubmitting}
          className={cn(
            'inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm',
            'text-sm font-medium text-white transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
            
            // États de base
            canGoNext && !isSubmitting
              ? 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
              : 'bg-gray-400 cursor-not-allowed',
              
            // État de soumission
            isSubmitting && 'animate-pulse',
            
            // Style spécial pour le dernier bouton
            isLastStep && canGoNext && !isSubmitting &&
              'bg-green-600 hover:bg-green-700 ring-green-500'
          )}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {isLastStep ? 'Création...' : 'Traitement...'}
            </>
          ) : (
            <>
              {finalNextLabel}
              {!isLastStep && (
                <svg 
                  className="w-4 h-4 ml-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              )}
              {isLastStep && (
                <svg 
                  className="w-4 h-4 ml-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

/**
 * Version simplifiée pour navigation mobile
 */
export const MobileWizardNavigation: React.FC<WizardNavigationProps> = ({
  canGoPrevious,
  canGoNext,
  isFirstStep,
  isLastStep,
  isSubmitting = false,
  onPrevious,
  onNext,
  nextLabel,
  previousLabel,
  className = '',
  currentStep,
  totalSteps
}) => {
  const finalNextLabel = nextLabel || (isLastStep ? 'Créer' : 'Suivant');
  const finalPreviousLabel = previousLabel || 'Précédent';

  return (
    <div className={cn('space-y-3', className)}>
      {/* Barre de progression mobile */}
      {currentStep !== undefined && totalSteps !== undefined && (
        <div className="w-full">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Étape {currentStep + 1}</span>
            <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Boutons */}
      <div className="flex space-x-3">
        {/* Bouton précédent */}
        {!isFirstStep && (
          <button
            type="button"
            onClick={onPrevious}
            disabled={!canGoPrevious || isSubmitting}
            className={cn(
              'flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300',
              'rounded-md text-sm font-medium text-gray-700 bg-white transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              
              canGoPrevious && !isSubmitting
                ? 'hover:bg-gray-50'
                : 'opacity-50 cursor-not-allowed'
            )}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {finalPreviousLabel}
          </button>
        )}

        {/* Bouton suivant */}
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || isSubmitting}
          className={cn(
            'inline-flex items-center justify-center px-6 py-3 border border-transparent',
            'rounded-md text-sm font-medium text-white transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
            
            // Largeur adaptative
            isFirstStep ? 'flex-1' : 'flex-[2]',
            
            // États
            canGoNext && !isSubmitting
              ? isLastStep 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed',
              
            isSubmitting && 'animate-pulse'
          )}
        >
          {isSubmitting ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              {finalNextLabel}
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={isLastStep ? "M5 13l4 4L19 7" : "M9 5l7 7-7 7"} 
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default WizardNavigation;
