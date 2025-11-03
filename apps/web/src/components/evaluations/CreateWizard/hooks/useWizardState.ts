// ========================================
// HOOK WIZARD STATE - GESTION ÉTAT GLOBAL WIZARD
// ========================================

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { useDraftSave } from './useDraftSave';
import { useEvaluations } from '../../../../hooks/useEvaluations';
import type { CreateEvaluationData, EvaluationTemplate } from '../../../../types';

/**
 * État global du wizard
 */
interface WizardState {
  // Navigation
  currentStep: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  
  // Données
  formData: Partial<CreateEvaluationData>;
  selectedTemplate: EvaluationTemplate | null;
  validationErrors: Record<string, string[]>;
  stepValidations: Record<number, boolean>;
  
  // UI State
  isSubmitting: boolean;
  draftId: string | null;
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;
  submitError: string | null;
}

/**
 * Actions pour le reducer
 */
type WizardAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'UPDATE_DATA'; payload: Partial<CreateEvaluationData> }
  | { type: 'SET_TEMPLATE'; payload: EvaluationTemplate | null }
  | { type: 'SET_VALIDATION_ERRORS'; payload: Record<string, string[]> }
  | { type: 'SET_STEP_VALIDATION'; payload: { step: number; isValid: boolean } }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_DRAFT_SAVED'; payload: { draftId: string; timestamp: Date } }
  | { type: 'SET_UNSAVED_CHANGES'; payload: boolean }
  | { type: 'SET_SUBMIT_ERROR'; payload: string | null }
  | { type: 'RESET_WIZARD' }
  | { type: 'LOAD_DRAFT'; payload: { data: Partial<CreateEvaluationData>; draftId: string } };

/**
 * État initial du wizard
 */
const initialState: WizardState = {
  currentStep: 0,
  isFirstStep: true,
  isLastStep: false,
  canGoNext: true,
  canGoPrevious: false,
  formData: {},
  selectedTemplate: null,
  validationErrors: {},
  stepValidations: {},
  isSubmitting: false,
  draftId: null,
  lastSavedAt: null,
  hasUnsavedChanges: false,
  submitError: null
};

/**
 * Nombre total d'étapes
 */
const TOTAL_STEPS = 5;

/**
 * Reducer pour la gestion d'état complexe
 */
function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      const newStep = Math.max(0, Math.min(TOTAL_STEPS - 1, action.payload));
      return {
        ...state,
        currentStep: newStep,
        isFirstStep: newStep === 0,
        isLastStep: newStep === TOTAL_STEPS - 1,
        canGoPrevious: newStep > 0,
        canGoNext: true // La validation sera gérée séparément
      };

    case 'UPDATE_DATA':
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.payload
        },
        hasUnsavedChanges: true,
        submitError: null
      };

    case 'SET_TEMPLATE':
      return {
        ...state,
        selectedTemplate: action.payload,
        formData: action.payload 
          ? { ...state.formData, ...action.payload.data }
          : state.formData,
        hasUnsavedChanges: true
      };

    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: action.payload
      };

    case 'SET_STEP_VALIDATION':
      return {
        ...state,
        stepValidations: {
          ...state.stepValidations,
          [action.payload.step]: action.payload.isValid
        }
      };

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload
      };

    case 'SET_DRAFT_SAVED':
      return {
        ...state,
        draftId: action.payload.draftId,
        lastSavedAt: action.payload.timestamp,
        hasUnsavedChanges: false
      };

    case 'SET_UNSAVED_CHANGES':
      return {
        ...state,
        hasUnsavedChanges: action.payload
      };

    case 'SET_SUBMIT_ERROR':
      return {
        ...state,
        submitError: action.payload,
        isSubmitting: false
      };

    case 'LOAD_DRAFT':
      return {
        ...state,
        formData: action.payload.data,
        draftId: action.payload.draftId,
        hasUnsavedChanges: false
      };

    case 'RESET_WIZARD':
      return initialState;

    default:
      return state;
  }
}

/**
 * Validations de base pour chaque étape
 */
const validateStep = (step: number, data: Partial<CreateEvaluationData>): boolean => {
  switch (step) {
    case 0: // Template - toujours valide
      return true;

    case 1: // Basic Info
      return !!(data.title && data.title.length >= 3 && data.subject && data.type);

    case 2: // Parameters
      return !!(data.maxScore && data.maxScore > 0 && data.coefficient && data.coefficient > 0);

    case 3: // Schedule
      return !!(data.evaluationDate);

    case 4: // Preview - validation complète
      return !!(
        data.title && data.title.length >= 3 &&
        data.subject && 
        data.type &&
        data.maxScore && data.maxScore > 0 &&
        data.coefficient && data.coefficient > 0 &&
        data.evaluationDate
      );

    default:
      return false;
  }
};

/**
 * Hook principal pour la gestion de l'état du wizard
 */
export function useWizardState(classId: number, initialDraftId?: string) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  
  // ========================================
  // HOOKS MÉTIER
  // ========================================

  const { createEvaluation } = useEvaluations();
  const { saveDraft, loadDraft, deleteDraft } = useDraftSave();

  // ========================================
  // REFS POUR OPTIMISATION
  // ========================================

  const autoSaveTimeoutRef = useRef<number | null>(null);
  const lastSaveDataRef = useRef<string>('');

  // ========================================
  // VALIDATION DYNAMIQUE
  // ========================================

  const canGoNext = validateStep(state.currentStep, state.formData);
  
  // ========================================
  // NAVIGATION
  // ========================================

  const goToStep = useCallback((step: number) => {
    // Vérifier que l'étape est accessible
    if (step < 0 || step >= TOTAL_STEPS) return false;
    
    // On peut toujours revenir en arrière
    if (step < state.currentStep) {
      dispatch({ type: 'SET_STEP', payload: step });
      return true;
    }
    
    // Pour aller en avant, vérifier la validation de l'étape actuelle
    if (step > state.currentStep && !validateStep(state.currentStep, state.formData)) {
      return false;
    }
    
    dispatch({ type: 'SET_STEP', payload: step });
    return true;
  }, [state.currentStep, state.formData]);

  const goNext = useCallback(() => {
    return goToStep(state.currentStep + 1);
  }, [goToStep, state.currentStep]);

  const goPrevious = useCallback(() => {
    return goToStep(state.currentStep - 1);
  }, [goToStep, state.currentStep]);

  // ========================================
  // GESTION DES DONNÉES
  // ========================================

  const updateData = useCallback((newData: Partial<CreateEvaluationData>) => {
    dispatch({ type: 'UPDATE_DATA', payload: newData });
  }, []);

  const selectTemplate = useCallback((template: EvaluationTemplate | null) => {
    dispatch({ type: 'SET_TEMPLATE', payload: template });
  }, []);

  // ========================================
  // AUTO-SAUVEGARDE DES BROUILLONS
  // ========================================

  useEffect(() => {
    if (state.hasUnsavedChanges) {
      // Éviter les sauvegardes identiques
      const currentDataString = JSON.stringify(state.formData);
      if (currentDataString === lastSaveDataRef.current) {
        return;
      }

      // Annuler la sauvegarde précédente
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Programmer une nouvelle sauvegarde
      autoSaveTimeoutRef.current = window.setTimeout(async () => {
        try {
          const draftId = await saveDraft({
            classId,
            data: state.formData,
            currentStep: state.currentStep,
            selectedTemplate: state.selectedTemplate
          });

          dispatch({ 
            type: 'SET_DRAFT_SAVED', 
            payload: { 
              draftId, 
              timestamp: new Date() 
            } 
          });

          lastSaveDataRef.current = currentDataString;
        } catch (error) {
          console.error('Erreur lors de la sauvegarde du brouillon:', error);
        }
      }, 2000); // Sauvegarde après 2 secondes d'inactivité
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [state.hasUnsavedChanges, state.formData, state.currentStep, state.selectedTemplate, classId, saveDraft]);

  // ========================================
  // CHARGEMENT DE BROUILLON INITIAL
  // ========================================

  useEffect(() => {
    if (initialDraftId) {
      const loadInitialDraft = async () => {
        try {
          const draftData = await loadDraft(initialDraftId);
          if (draftData) {
            dispatch({
              type: 'LOAD_DRAFT',
              payload: {
                data: draftData.data,
                draftId: initialDraftId
              }
            });

            // Charger aussi le template s'il y en a un
            if (draftData.selectedTemplate) {
              dispatch({
                type: 'SET_TEMPLATE',
                payload: draftData.selectedTemplate
              });
            }

            // Aller à l'étape sauvegardée
            if (draftData.currentStep !== undefined) {
              dispatch({
                type: 'SET_STEP',
                payload: draftData.currentStep
              });
            }
          }
        } catch (error) {
          console.error('Erreur lors du chargement du brouillon:', error);
        }
      };

      loadInitialDraft();
    }
  }, [initialDraftId, loadDraft]);

  // ========================================
  // SOUMISSION FINALE
  // ========================================

  const submitEvaluation = useCallback(async () => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    dispatch({ type: 'SET_SUBMIT_ERROR', payload: null });

    try {
      // Validation finale
      if (!validateStep(4, state.formData)) {
        throw new Error('Données d\'évaluation incomplètes');
      }

      // Créer l'évaluation
      const evaluation = await createEvaluation(state.formData as CreateEvaluationData);

      // Supprimer le brouillon s'il existe
      if (state.draftId) {
        try {
          await deleteDraft(state.draftId);
        } catch (error) {
          console.warn('Erreur lors de la suppression du brouillon:', error);
        }
      }

      return evaluation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création';
      dispatch({ type: 'SET_SUBMIT_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  }, [state.formData, state.draftId, createEvaluation, deleteDraft]);

  // ========================================
  // RESET
  // ========================================

  const resetWizard = useCallback(() => {
    dispatch({ type: 'RESET_WIZARD' });
  }, []);

  // ========================================
  // NETTOYAGE
  // ========================================

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // ========================================
  // RÉSULTAT
  // ========================================

  return {
    // État de navigation
    currentStep: state.currentStep,
    isFirstStep: state.isFirstStep,
    isLastStep: state.isLastStep,
    canGoNext,
    canGoPrevious: state.canGoPrevious,

    // Données
    formData: state.formData,
    selectedTemplate: state.selectedTemplate,
    validationErrors: state.validationErrors,

    // État UI
    isSubmitting: state.isSubmitting,
    hasUnsavedChanges: state.hasUnsavedChanges,
    lastSavedAt: state.lastSavedAt,
    submitError: state.submitError,
    draftId: state.draftId,

    // Actions
    updateData,
    selectTemplate,
    goNext,
    goPrevious,
    goToStep,
    submitEvaluation,
    resetWizard
  };
}

export default useWizardState;
