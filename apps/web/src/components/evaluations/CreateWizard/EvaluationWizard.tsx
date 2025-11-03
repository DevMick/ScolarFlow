// ========================================
// EVALUATION WIZARD - ASSISTANT DE CRÉATION
// ========================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { WizardProgress } from './components/WizardProgress';
import { WizardNavigation } from './components/WizardNavigation';
import { StepTemplate } from './steps/StepTemplate';
import { StepBasicInfo } from './steps/StepBasicInfo';
import { StepParameters } from './steps/StepParameters';
import { StepSchedule } from './steps/StepSchedule';
import { StepPreview } from './steps/StepPreview';
import { useWizardState } from './hooks/useWizardState';
import { useEvaluations } from '../../../hooks/useEvaluations';
import { cn } from '../../../utils/classNames';
import type { CreateEvaluationData, EvaluationTemplate } from '../../../types';

/**
 * Configuration des étapes du wizard
 */
export interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<WizardStepProps>;
  isOptional?: boolean;
  showInProgress?: boolean;
}

export interface WizardStepProps {
  data: Partial<CreateEvaluationData>;
  validationErrors: Record<string, string[]>;
  onDataChange: (data: Partial<CreateEvaluationData>) => void;
  onValidationChange: (isValid: boolean) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  classId: number;
}

/**
 * Configuration complète des étapes
 */
const wizardSteps: WizardStep[] = [
  {
    id: 'template',
    title: 'Modèle',
    description: 'Choisir un modèle ou partir de zéro',
    component: StepTemplate,
    isOptional: true,
    showInProgress: false
  },
  {
    id: 'basic',
    title: 'Informations',
    description: 'Titre, matière et type d\'évaluation',
    component: StepBasicInfo,
    showInProgress: true
  },
  {
    id: 'parameters',
    title: 'Paramètres',
    description: 'Note maximale, coefficient et options',
    component: StepParameters,
    showInProgress: true
  },
  {
    id: 'schedule',
    title: 'Planning',
    description: 'Date et instructions spéciales',
    component: StepSchedule,
    showInProgress: true
  },
  {
    id: 'preview',
    title: 'Aperçu',
    description: 'Vérification avant création',
    component: StepPreview,
    showInProgress: true
  }
];

/**
 * Props du composant principal
 */
interface EvaluationWizardProps {
  classId: number;
  draftId?: string;
  onComplete?: (evaluation: any) => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * Assistant de création d'évaluations
 */
export const EvaluationWizard: React.FC<EvaluationWizardProps> = ({
  classId,
  draftId,
  onComplete,
  onCancel,
  className = ''
}) => {
  const navigate = useNavigate();

  // ========================================
  // ÉTAT GLOBAL DU WIZARD
  // ========================================

  const {
    currentStep,
    formData,
    validationErrors,
    selectedTemplate,
    isSubmitting,
    hasUnsavedChanges,
    lastSavedAt,
    canGoNext,
    canGoPrevious,
    isFirstStep,
    isLastStep,
    updateData,
    selectTemplate,
    goNext,
    goPrevious,
    goToStep,
    submitEvaluation,
    resetWizard
  } = useWizardState(classId, draftId);

  // ========================================
  // HOOKS MÉTIER
  // ========================================

  const { createEvaluation } = useEvaluations();

  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({});
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // ========================================
  // GESTION DES ÉTAPES
  // ========================================

  const currentStepConfig = wizardSteps[currentStep];
  const CurrentStepComponent = currentStepConfig.component;

  const visibleSteps = wizardSteps.filter(step => step.showInProgress !== false);

  const progressSteps = visibleSteps.map((step, index) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    isCompleted: index < currentStep || (index === currentStep && stepValidation[currentStep]),
    isCurrent: index === currentStep,
    isAccessible: index <= currentStep
  }));

  // ========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const handleDataChange = useCallback((newData: Partial<CreateEvaluationData>) => {
    updateData(newData);
  }, [updateData]);

  const handleValidationChange = useCallback((isValid: boolean) => {
    setStepValidation(prev => ({
      ...prev,
      [currentStep]: isValid
    }));
  }, [currentStep]);

  const handleNext = useCallback(async () => {
    if (isLastStep) {
      // Dernière étape - créer l'évaluation
      try {
        const evaluation = await submitEvaluation();
        onComplete?.(evaluation);
        navigate(`/classes/${classId}/evaluations`);
      } catch (error) {
        console.error('Erreur lors de la création:', error);
      }
    } else {
      goNext();
    }
  }, [isLastStep, submitEvaluation, onComplete, navigate, classId, goNext]);

  const handlePrevious = useCallback(() => {
    goPrevious();
  }, [goPrevious]);

  const handleStepClick = useCallback((stepIndex: number) => {
    goToStep(stepIndex);
  }, [goToStep]);

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowExitConfirm(true);
    } else {
      onCancel?.();
      navigate(`/classes/${classId}/evaluations`);
    }
  }, [hasUnsavedChanges, onCancel, navigate, classId]);

  const handleConfirmExit = useCallback(() => {
    resetWizard();
    onCancel?.();
    navigate(`/classes/${classId}/evaluations`);
  }, [resetWizard, onCancel, navigate, classId]);

  const handleTemplateSelect = useCallback((template: EvaluationTemplate | null) => {
    if (template) {
      selectTemplate(template);
      // Passer automatiquement à l'étape suivante après sélection
      setTimeout(() => goNext(), 100);
    } else {
      // Continuer sans template
      goNext();
    }
  }, [selectTemplate, goNext]);

  // ========================================
  // EFFETS
  // ========================================

  // Prévenir la fermeture accidentelle
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Header avec progression */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Créer une évaluation
              </h1>
              <p className="text-gray-600 mt-1">
                {currentStepConfig.description}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Indicateur de sauvegarde */}
              {hasUnsavedChanges && (
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse" />
                  Sauvegarde automatique...
                </div>
              )}

              {lastSavedAt && !hasUnsavedChanges && (
                <div className="flex items-center text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                  Sauvegardé {lastSavedAt.toLocaleTimeString()}
                </div>
              )}

              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>

          {/* Barre de progression */}
          <WizardProgress
            steps={progressSteps}
            onStepClick={handleStepClick}
            className="mb-4"
          />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Contenu de l'étape */}
          <div className="p-6 md:p-8">
            <CurrentStepComponent
              data={formData}
              validationErrors={validationErrors}
              onDataChange={handleDataChange}
              onValidationChange={handleValidationChange}
              onNext={currentStepConfig.id === 'template' ? () => handleTemplateSelect(null) : undefined}
              onPrevious={handlePrevious}
              classId={classId}
            />
          </div>

          {/* Navigation */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 md:px-8">
            <WizardNavigation
              canGoPrevious={canGoPrevious && !isSubmitting}
              canGoNext={canGoNext && !isSubmitting}
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
              isSubmitting={isSubmitting}
              onPrevious={handlePrevious}
              onNext={handleNext}
              nextLabel={isLastStep ? 'Créer l\'évaluation' : 'Suivant'}
              previousLabel="Précédent"
            />
          </div>
        </div>

        {/* Template sélectionné */}
        {selectedTemplate && currentStep > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">{selectedTemplate.icon}</span>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-900">
                  Modèle sélectionné: {selectedTemplate.name}
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  {selectedTemplate.description}
                </p>
              </div>
              <button
                onClick={() => selectTemplate(null)}
                className="text-blue-400 hover:text-blue-600"
                title="Supprimer le modèle"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmation de sortie */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Quitter la création d'évaluation ?
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Vous avez des modifications non sauvegardées. Si vous quittez maintenant, 
                        vous perdrez vos changements.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleConfirmExit}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Quitter sans sauvegarder
                </button>
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Continuer l'édition
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationWizard;
