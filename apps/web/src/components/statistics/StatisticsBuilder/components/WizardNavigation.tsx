// ========================================
// WIZARD NAVIGATION - CONTRÔLES DE NAVIGATION
// ========================================

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { cn } from '../../../../utils/classNames';

/**
 * Props du composant WizardNavigation
 */
interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  canGoNext: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  loading?: boolean;
}

/**
 * Composant de navigation pour le wizard
 */
export const WizardNavigation: React.FC<WizardNavigationProps> = ({
  currentStep,
  totalSteps,
  canGoNext,
  onNext,
  onPrevious,
  onSubmit,
  isSubmitting,
  loading = false
}) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex items-center justify-between">
      {/* Bouton Précédent */}
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstStep || loading}
        className={cn(
          'inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border transition-colors',
          isFirstStep || loading
            ? 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        )}
      >
        <ChevronLeftIcon className="h-4 w-4 mr-2" />
        Précédent
      </button>

      {/* Indicateur d'étape */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <span>Étape {currentStep + 1} sur {totalSteps}</span>
        {loading && (
          <div className="inline-flex items-center">
            <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="ml-2">Traitement...</span>
          </div>
        )}
      </div>

      {/* Bouton Suivant/Terminer */}
      {isLastStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canGoNext || isSubmitting || loading}
          className={cn(
            'inline-flex items-center px-6 py-2 text-sm font-medium rounded-md transition-colors',
            canGoNext && !isSubmitting && !loading
              ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              : 'text-gray-400 bg-gray-200 cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Création en cours...
            </>
          ) : (
            <>
              Créer la configuration
              <CheckIcon className="h-4 w-4 ml-2" />
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || loading}
          className={cn(
            'inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors',
            canGoNext && !loading
              ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              : 'text-gray-400 bg-gray-200 cursor-not-allowed'
          )}
        >
          Suivant
          <ChevronRightIcon className="h-4 w-4 ml-2" />
        </button>
      )}
    </div>
  );
};

// Import CheckIcon for the submit button
import { CheckIcon } from '@heroicons/react/20/solid';

export default WizardNavigation;
