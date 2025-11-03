// ========================================
// WIZARD PROGRESS - BARRE DE PROGRESSION
// ========================================

import React from 'react';
import { cn } from '../../../../utils/classNames';

/**
 * Interface pour une étape de progression
 */
interface ProgressStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isAccessible: boolean;
}

/**
 * Props du composant WizardProgress
 */
interface WizardProgressProps {
  steps: ProgressStep[];
  onStepClick?: (stepIndex: number) => void;
  className?: string;
  variant?: 'horizontal' | 'vertical';
  showDescription?: boolean;
}

/**
 * Composant de barre de progression du wizard
 */
export const WizardProgress: React.FC<WizardProgressProps> = ({
  steps,
  onStepClick,
  className = '',
  variant = 'horizontal',
  showDescription = false
}) => {
  // ========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const handleStepClick = (stepIndex: number) => {
    const step = steps[stepIndex];
    if (step.isAccessible && onStepClick) {
      onStepClick(stepIndex);
    }
  };

  // ========================================
  // RENDU HORIZONTAL (DÉFAUT)
  // ========================================

  if (variant === 'horizontal') {
    return (
      <div className={cn('w-full', className)}>
        <nav aria-label="Progression du wizard">
          <ol className="flex items-center justify-between w-full">
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;

              return (
                <li key={step.id} className="flex items-center flex-1">
                  {/* Étape */}
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleStepClick(index)}
                      disabled={!step.isAccessible}
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                        
                        // États de base
                        step.isAccessible 
                          ? 'cursor-pointer hover:scale-105' 
                          : 'cursor-not-allowed opacity-50',
                        
                        // États visuels
                        step.isCompleted
                          ? 'bg-green-600 border-green-600 text-white'
                          : step.isCurrent
                          ? 'bg-blue-600 border-blue-600 text-white animate-pulse'
                          : step.isAccessible
                          ? 'bg-white border-gray-300 text-gray-700 hover:border-blue-500'
                          : 'bg-gray-100 border-gray-200 text-gray-400'
                      )}
                      aria-current={step.isCurrent ? 'step' : undefined}
                      aria-label={`Étape ${index + 1}: ${step.title}`}
                    >
                      {step.isCompleted ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-sm font-semibold">
                          {index + 1}
                        </span>
                      )}
                    </button>

                    {/* Label de l'étape */}
                    <div className="ml-3 hidden sm:block">
                      <div 
                        className={cn(
                          'text-sm font-medium transition-colors',
                          step.isCurrent 
                            ? 'text-blue-600' 
                            : step.isCompleted 
                            ? 'text-green-600' 
                            : 'text-gray-500'
                        )}
                      >
                        {step.title}
                      </div>
                      {showDescription && (
                        <div className="text-xs text-gray-400 mt-1">
                          {step.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connecteur */}
                  {!isLast && (
                    <div className="flex-1 mx-4 hidden sm:block">
                      <div 
                        className={cn(
                          'h-0.5 w-full transition-colors duration-300',
                          step.isCompleted ? 'bg-green-600' : 'bg-gray-200'
                        )}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Version mobile compacte */}
        <div className="sm:hidden mt-4">
          <div className="flex items-center justify-center">
            <span className="text-sm text-gray-500">
              Étape {steps.findIndex(s => s.isCurrent) + 1} sur {steps.length}
            </span>
          </div>
          <div className="mt-2">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((steps.findIndex(s => s.isCurrent) + 1) / steps.length) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDU VERTICAL
  // ========================================

  return (
    <div className={cn('w-full', className)}>
      <nav aria-label="Progression du wizard">
        <ol className="space-y-6">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;

            return (
              <li key={step.id} className="relative">
                {/* Connecteur vertical */}
                {!isLast && (
                  <div 
                    className={cn(
                      'absolute left-4 top-10 w-0.5 h-6 transition-colors duration-300',
                      step.isCompleted ? 'bg-green-600' : 'bg-gray-200'
                    )}
                  />
                )}

                {/* Contenu de l'étape */}
                <div className="flex items-start">
                  <button
                    type="button"
                    onClick={() => handleStepClick(index)}
                    disabled={!step.isAccessible}
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 flex-shrink-0',
                      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                      
                      // États de base
                      step.isAccessible 
                        ? 'cursor-pointer hover:scale-105' 
                        : 'cursor-not-allowed opacity-50',
                      
                      // États visuels
                      step.isCompleted
                        ? 'bg-green-600 border-green-600 text-white'
                        : step.isCurrent
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : step.isAccessible
                        ? 'bg-white border-gray-300 text-gray-700 hover:border-blue-500'
                        : 'bg-gray-100 border-gray-200 text-gray-400'
                    )}
                    aria-current={step.isCurrent ? 'step' : undefined}
                    aria-label={`Étape ${index + 1}: ${step.title}`}
                  >
                    {step.isCompleted ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs font-semibold">
                        {index + 1}
                      </span>
                    )}
                  </button>

                  {/* Contenu de l'étape */}
                  <div className="ml-4 min-w-0 flex-1">
                    <div 
                      className={cn(
                        'text-sm font-medium transition-colors',
                        step.isCurrent 
                          ? 'text-blue-600' 
                          : step.isCompleted 
                          ? 'text-green-600' 
                          : 'text-gray-900'
                      )}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default WizardProgress;
