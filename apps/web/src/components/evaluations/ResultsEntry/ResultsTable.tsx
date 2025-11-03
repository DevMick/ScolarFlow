// ========================================
// TABLEAU DE SAISIE NOTES - INTERFACE PRINCIPALE
// ========================================

import React, { useState, useEffect, useCallback, useReducer, useMemo } from 'react';
import { StudentRow } from './StudentRow';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { useKeyboardNavigation } from '../../../hooks/useKeyboardNavigation';
import { useAutoSave } from '../../../hooks/useAutoSave';
import { useResults } from '../../../hooks/useResults';
import { useCalculations } from '../../../hooks/useCalculations';
import type {
  Evaluation,
  Student,
  EvaluationResult,
  EvaluationResultInput,
  AbsentReason
} from '../../../types';

/**
 * État local du tableau de saisie
 */
interface ResultsTableState {
  // Données de saisie
  results: Record<number, EvaluationResult>;
  pendingChanges: Record<number, Partial<EvaluationResultInput>>;
  
  // État UI
  currentCell: { studentId: number; field: 'score' | 'notes' | 'absent' };
  isDirty: boolean;
  hasUnsavedChanges: boolean;
  
  // Validation
  validationErrors: Record<number, {
    field: string;
    message: string;
    type: 'error' | 'warning';
  }[]>;
  
  // Performance
  lastInteraction: number;
  batchUpdateQueue: Array<{
    studentId: number;
    data: Partial<EvaluationResultInput>;
    timestamp: number;
  }>;
}

/**
 * Actions pour le reducer
 */
type ResultsTableAction =
  | { type: 'SET_RESULTS'; payload: Record<number, EvaluationResult> }
  | { type: 'UPDATE_RESULT'; payload: { studentId: number; data: Partial<EvaluationResultInput> } }
  | { type: 'SET_CURRENT_CELL'; payload: { studentId: number; field: 'score' | 'notes' | 'absent' } }
  | { type: 'SET_VALIDATION_ERROR'; payload: { studentId: number; errors: any[] } }
  | { type: 'CLEAR_VALIDATION_ERROR'; payload: { studentId: number } }
  | { type: 'MARK_DIRTY'; payload: boolean }
  | { type: 'ADD_TO_BATCH_QUEUE'; payload: { studentId: number; data: Partial<EvaluationResultInput> } }
  | { type: 'CLEAR_BATCH_QUEUE' }
  | { type: 'SET_LAST_INTERACTION'; payload: number };

/**
 * Reducer pour la gestion d'état complexe
 */
const resultsTableReducer = (state: ResultsTableState, action: ResultsTableAction): ResultsTableState => {
  switch (action.type) {
    case 'SET_RESULTS':
      return {
        ...state,
        results: action.payload
      };

    case 'UPDATE_RESULT':
      const { studentId, data } = action.payload;
      return {
        ...state,
        results: {
          ...state.results,
          [studentId]: {
            ...state.results[studentId],
            ...data
          }
        },
        pendingChanges: {
          ...state.pendingChanges,
          [studentId]: {
            ...state.pendingChanges[studentId],
            ...data
          }
        },
        isDirty: true,
        hasUnsavedChanges: true,
        lastInteraction: Date.now()
      };

    case 'SET_CURRENT_CELL':
      return {
        ...state,
        currentCell: action.payload
      };

    case 'SET_VALIDATION_ERROR':
      return {
        ...state,
        validationErrors: {
          ...state.validationErrors,
          [action.payload.studentId]: action.payload.errors
        }
      };

    case 'CLEAR_VALIDATION_ERROR':
      const { [action.payload.studentId]: _, ...remainingErrors } = state.validationErrors;
      return {
        ...state,
        validationErrors: remainingErrors
      };

    case 'MARK_DIRTY':
      return {
        ...state,
        isDirty: action.payload
      };

    case 'ADD_TO_BATCH_QUEUE':
      return {
        ...state,
        batchUpdateQueue: [
          ...state.batchUpdateQueue.filter(item => item.studentId !== action.payload.studentId),
          {
            studentId: action.payload.studentId,
            data: action.payload.data,
            timestamp: Date.now()
          }
        ]
      };

    case 'CLEAR_BATCH_QUEUE':
      return {
        ...state,
        batchUpdateQueue: [],
        hasUnsavedChanges: false
      };

    case 'SET_LAST_INTERACTION':
      return {
        ...state,
        lastInteraction: action.payload
      };

    default:
      return state;
  }
};

/**
 * État initial du reducer
 */
const initialState: ResultsTableState = {
  results: {},
  pendingChanges: {},
  currentCell: { studentId: 0, field: 'score' },
  isDirty: false,
  hasUnsavedChanges: false,
  validationErrors: {},
  lastInteraction: Date.now(),
  batchUpdateQueue: []
};

/**
 * Props du composant principal
 */
interface ResultsTableProps {
  evaluation: Evaluation;
  students: Student[];
  className?: string;
  onResultsChange?: (results: Record<number, EvaluationResult>) => void;
  autoSaveEnabled?: boolean;
  showKeyboardShortcuts?: boolean;
}

/**
 * Composant principal du tableau de saisie
 */
export const ResultsTable: React.FC<ResultsTableProps> = ({
  evaluation,
  students,
  className = '',
  onResultsChange,
  autoSaveEnabled = true,
  showKeyboardShortcuts = true
}) => {
  const [state, dispatch] = useReducer(resultsTableReducer, initialState);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // ========================================
  // HOOKS MÉTIER
  // ========================================

  const {
    getEvaluationResults,
    updateBulkResults,
    loading: resultsLoading,
    error: resultsError
  } = useResults();

  const calculations = useCalculations(evaluation.id);

  // ========================================
  // NAVIGATION CLAVIER
  // ========================================

  const { handleKeyDown } = useKeyboardNavigation({
    studentsCount: students.length,
    fieldsPerRow: ['score', 'notes'],
    onCellChange: useCallback((studentId: number, field: string) => {
      dispatch({
        type: 'SET_CURRENT_CELL',
        payload: { studentId, field: field as 'score' | 'notes' | 'absent' }
      });
    }, []),
    onEscape: useCallback(() => {
      // Annuler les modifications en cours sur la cellule actuelle
      const currentStudentId = state.currentCell.studentId;
      if (state.pendingChanges[currentStudentId]) {
        dispatch({ type: 'UPDATE_RESULT', payload: { studentId: currentStudentId, data: {} } });
      }
    }, [state.currentCell.studentId, state.pendingChanges])
  });

  // ========================================
  // CHARGEMENT DES DONNÉES
  // ========================================

  useEffect(() => {
    const loadResults = async () => {
      try {
        const results = await getEvaluationResults(evaluation.id);
        const resultsMap = results.reduce((acc: Record<number, EvaluationResult>, result: EvaluationResult) => {
          acc[result.studentId] = result;
          return acc;
        }, {} as Record<number, EvaluationResult>);
        
        dispatch({ type: 'SET_RESULTS', payload: resultsMap });
      } catch (error) {
        console.error('Erreur lors du chargement des résultats:', error);
      }
    };

    loadResults();
  }, [evaluation.id, getEvaluationResults]);

  // ========================================
  // AUTO-SAUVEGARDE
  // ========================================

  const saveBatchResults = useCallback(async (batchQueue: typeof state.batchUpdateQueue) => {
    if (batchQueue.length === 0) return;

    try {
      const bulkData = batchQueue.map(item => ({
        studentId: item.studentId,
        ...item.data
      }));

      await updateBulkResults(evaluation.id, { results: bulkData });
      dispatch({ type: 'CLEAR_BATCH_QUEUE' });
      
      // Notifier le parent des changements
      if (onResultsChange) {
        onResultsChange(state.results);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde en lot:', error);
      throw error;
    }
  }, [evaluation.id, updateBulkResults, state.results, onResultsChange]);

  const { isSaving, lastSaved, error: saveError } = useAutoSave(
    state.batchUpdateQueue,
    saveBatchResults,
    {
      delay: 2000,
      enabled: autoSaveEnabled && state.hasUnsavedChanges,
      maxRetries: 3
    }
  );

  // ========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const handleScoreChange = useCallback((studentId: number, score: number | null) => {
    const data: Partial<EvaluationResultInput> = {
      score: score || undefined,
      isAbsent: false,
      absentReason: undefined
    };

    dispatch({ type: 'UPDATE_RESULT', payload: { studentId, data } });
    dispatch({ type: 'ADD_TO_BATCH_QUEUE', payload: { studentId, data } });
    dispatch({ type: 'CLEAR_VALIDATION_ERROR', payload: { studentId } });
  }, []);

  const handleAbsentToggle = useCallback((studentId: number, isAbsent: boolean, reason?: AbsentReason) => {
    const data: Partial<EvaluationResultInput> = {
      isAbsent,
      absentReason: isAbsent ? reason : undefined,
      score: isAbsent ? undefined : (state.results[studentId]?.score || undefined)
    };

    dispatch({ type: 'UPDATE_RESULT', payload: { studentId, data } });
    dispatch({ type: 'ADD_TO_BATCH_QUEUE', payload: { studentId, data } });
  }, [state.results]);

  const handleNotesChange = useCallback((studentId: number, notes: string) => {
    const data: Partial<EvaluationResultInput> = { notes };
    
    dispatch({ type: 'UPDATE_RESULT', payload: { studentId, data } });
    dispatch({ type: 'ADD_TO_BATCH_QUEUE', payload: { studentId, data } });
  }, []);

  const handleValidationError = useCallback((studentId: number, errors: any[]) => {
    dispatch({ type: 'SET_VALIDATION_ERROR', payload: { studentId, errors } });
  }, []);

  // ========================================
  // RACCOURCIS CLAVIER GLOBAUX
  // ========================================

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S : Sauvegarde manuelle
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (state.batchUpdateQueue.length > 0) {
          saveBatchResults(state.batchUpdateQueue);
        }
        return;
      }

      // Ctrl+Z : Undo (simplifié)
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        // TODO: Implémenter undo/redo stack
        return;
      }

      // F1 : Afficher/masquer raccourcis
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcuts(!showShortcuts);
        return;
      }

      // Déléguer la navigation au hook
      handleKeyDown(e);
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleKeyDown, saveBatchResults, state.batchUpdateQueue, showShortcuts]);

  // ========================================
  // MÉMORISATION DES CALCULS COÛTEUX
  // ========================================

  const studentsWithResults = useMemo(() => {
    return students.map(student => ({
      ...student,
      result: state.results[student.id] || {
        id: 0,
        evaluationId: evaluation.id,
        studentId: student.id,
        score: null,
        isAbsent: false,
        absentReason: null,
        notes: null,
        rank: null,
        percentile: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }));
  }, [students, state.results, evaluation.id]);

  const completionRate = useMemo(() => {
    const completedCount = students.filter(student => {
      const result = state.results[student.id];
      return result && (result.score !== null || result.isAbsent);
    }).length;
    
    return students.length > 0 ? (completedCount / students.length) * 100 : 0;
  }, [students, state.results]);

  // ========================================
  // RENDU
  // ========================================

  if (resultsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Chargement des résultats...</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Header avec indicateurs */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Saisie des notes - {evaluation.title}
          </h3>
          <div className="text-sm text-gray-600">
            Progression: {completionRate.toFixed(0)}% ({students.filter(s => {
              const result = state.results[s.id];
              return result && (result.score !== null || result.isAbsent);
            }).length}/{students.length})
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <AutoSaveIndicator
            isSaving={isSaving}
            lastSaved={lastSaved}
            error={saveError}
            hasUnsavedChanges={state.hasUnsavedChanges}
          />
          
          {showKeyboardShortcuts && (
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              title="Raccourcis clavier (F1)"
            >
              ?
            </button>
          )}
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progression de la saisie</span>
          <span>{completionRate.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Tableau principal */}
      <div className="relative overflow-hidden border border-gray-200 rounded-lg bg-white">
        {/* Header du tableau */}
        <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-1 p-2 text-sm font-medium text-gray-700">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-4">Élève</div>
            <div className="col-span-2 text-center">Note /{evaluation.maxScore}</div>
            <div className="col-span-2 text-center">Absent</div>
            <div className="col-span-3 text-center">Commentaires</div>
          </div>
        </div>

        {/* Corps du tableau */}
        <div 
          className="max-h-96 overflow-y-auto"
          style={{ scrollBehavior: 'smooth' }}
        >
          {studentsWithResults.map((studentWithResult, index) => (
            <StudentRow
              key={studentWithResult.id}
              student={studentWithResult}
              result={studentWithResult.result}
              evaluation={evaluation}
              index={index}
              isCurrentRow={state.currentCell.studentId === studentWithResult.id}
              currentField={state.currentCell.field}
              validationErrors={state.validationErrors[studentWithResult.id] || []}
              onScoreChange={handleScoreChange}
              onAbsentToggle={handleAbsentToggle}
              onNotesChange={handleNotesChange}
              onValidationError={handleValidationError}
              onFocus={(field) => {
                dispatch({
                  type: 'SET_CURRENT_CELL',
                  payload: { studentId: studentWithResult.id, field }
                });
              }}
            />
          ))}
        </div>
      </div>

      {/* Messages d'erreur globaux */}
      {(resultsError || saveError) && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded-md">
          <p className="text-sm text-red-700">
            {resultsError || saveError}
          </p>
        </div>
      )}

      {/* Guide des raccourcis clavier */}
      {showShortcuts && (
        <KeyboardShortcuts
          onClose={() => setShowShortcuts(false)}
          className="fixed inset-0 z-50"
        />
      )}
    </div>
  );
};

export default ResultsTable;
