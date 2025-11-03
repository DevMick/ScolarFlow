// ========================================
// WIZARD PROGRESS - INDICATEUR DE PROGRESSION
// ========================================

import React from 'react';
import { CheckIcon } from '@heroicons/react/20/solid';
import { cn } from '../../../utils/classNames';

/**
 * Interface pour une étape du wizard
 */
interface WizardStep {
  id: string;
  title: string;
  description: string;
  isOptional?: boolean;
}

/**
 * Props du composant WizardProgress
 */
interface WizardProgressProps {
  currentStep: number;
  steps: WizardStep[];
  onStepClick?: (stepIndex: number) => void;
  canGoNext: boolean;
}

/**
 * Composant d'affichage de la progression du wizard
 */
export const WizardProgress: React.FC<WizardProgressProps> = ({
  currentStep,
  steps,
  onStepClick,
  canGoNext
}) => {
  const handleStepClick = (stepIndex: number) => {
    if (onStepClick && stepIndex <= currentStep) {
      onStepClick(stepIndex);
    }
  };

  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {steps.map((step, stepIdx) => {
          const isCompleted = stepIdx < currentStep;
          const isCurrent = stepIdx === currentStep;
          const isClickable = stepIdx <= currentStep && onStepClick;

          return (
            <li key={step.id} className={cn(
              'relative',
              stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''
            )}>
              {/* Ligne de connexion */}
              {stepIdx !== steps.length - 1 && (
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className={cn(
                    'h-0.5 w-full',
                    isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                  )} />
                </div>
              )}

              {/* Étape */}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => handleStepClick(stepIdx)}
                className={cn(
                  'relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                  isCompleted && 'bg-blue-600 border-blue-600 hover:bg-blue-700',
                  isCurrent && !isCompleted && 'border-blue-600 bg-white',
                  !isCurrent && !isCompleted && 'border-gray-300 bg-white',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-default'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span className="flex h-full w-full items-center justify-center">
                  {isCompleted ? (
                    <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                  ) : (
                    <span className={cn(
                      'text-sm font-medium',
                      isCurrent ? 'text-blue-600' : 'text-gray-500'
                    )}>
                      {stepIdx + 1}
                    </span>
                  )}
                </span>
              </button>

              {/* Titre et description */}
              <div className="mt-2 text-center">
                <h3 className={cn(
                  'text-sm font-medium',
                  isCurrent ? 'text-blue-600' : 'text-gray-900'
                )}>
                  {step.title}
                  {step.isOptional && (
                    <span className="text-gray-500 text-xs ml-1">(optionnel)</span>
                  )}
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-24 mx-auto">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* État de validation */}
      <div className="mt-4 flex items-center justify-center">
        {currentStep < steps.length - 1 && (
          <div className={cn(
            'px-3 py-1 rounded-full text-xs font-medium',
            canGoNext 
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          )}>
            {canGoNext ? '✓ Étape complète' : '⚠ Veuillez compléter les champs requis'}
          </div>
        )}
      </div>
    </nav>
  );
};

export default WizardProgress;
