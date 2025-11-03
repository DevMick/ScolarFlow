// ========================================
// CONTEXTE D'ÉVALUATIONS - GESTION D'ÉTAT GLOBALE
// ========================================

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type {
  EvaluationContextState,
  EvaluationAction,
  Evaluation,
  EvaluationResult,
  EvaluationStatistics,
  ClassRanking,
  DEFAULT_LOADING_STATE
} from '../types';
import { globalCache, CACHE_TAGS } from '../utils/cache';
import { globalErrorHandler } from '../utils/errorHandling';

// ========================================
// ÉTAT INITIAL
// ========================================

const initialState: EvaluationContextState = {
  evaluationsByClass: {},
  resultsByEvaluation: {},
  statisticsByEvaluation: {},
  rankingsByEvaluation: {},
  loading: {
    evaluations: {},
    results: {},
    calculations: {},
    global: false
  },
  errors: {
    evaluations: {},
    results: {},
    calculations: {},
    global: null
  },
  cache: {
    lastFetch: {},
    invalidationKeys: new Set()
  },
  ui: {
    selectedEvaluation: null,
    selectedClass: null,
    showFinalizedOnly: false,
    showStatsPanel: false
  }
};

// ========================================
// REDUCER PRINCIPAL
// ========================================

/**
 * Reducer pour la gestion de l'état des évaluations
 */
function evaluationReducer(state: EvaluationContextState, action: EvaluationAction): EvaluationContextState {
  switch (action.type) {
    // ========================================
    // GESTION DES ÉVALUATIONS
    // ========================================
    
    case 'SET_EVALUATIONS':
      return {
        ...state,
        evaluationsByClass: {
          ...state.evaluationsByClass,
          [action.payload.classId]: action.payload.evaluations
        },
        cache: {
          ...state.cache,
          lastFetch: {
            ...state.cache.lastFetch,
            [`evaluations:${action.payload.classId}`]: Date.now()
          }
        }
      };

    case 'ADD_EVALUATION':
      return {
        ...state,
        evaluationsByClass: {
          ...state.evaluationsByClass,
          [action.payload.classId]: [
            action.payload.evaluation,
            ...(state.evaluationsByClass[action.payload.classId] || [])
          ]
        }
      };

    case 'UPDATE_EVALUATION':
      return {
        ...state,
        evaluationsByClass: {
          ...state.evaluationsByClass,
          [action.payload.classId]: (state.evaluationsByClass[action.payload.classId] || []).map(evaluation =>
            evaluation.id === action.payload.evaluation.id
              ? action.payload.evaluation
              : evaluation
          )
        }
      };

    case 'REMOVE_EVALUATION':
      return {
        ...state,
        evaluationsByClass: {
          ...state.evaluationsByClass,
          [action.payload.classId]: (state.evaluationsByClass[action.payload.classId] || []).filter(
            evaluation => evaluation.id !== action.payload.evaluationId
          )
        },
        // Nettoyer les données liées
        resultsByEvaluation: {
          ...state.resultsByEvaluation,
          [action.payload.evaluationId]: undefined
        },
        statisticsByEvaluation: {
          ...state.statisticsByEvaluation,
          [action.payload.evaluationId]: undefined
        },
        rankingsByEvaluation: {
          ...state.rankingsByEvaluation,
          [action.payload.evaluationId]: undefined
        }
      };

    case 'ADD_EVALUATION_OPTIMISTIC':
      return {
        ...state,
        evaluationsByClass: {
          ...state.evaluationsByClass,
          [action.payload.classId]: [
            { ...action.payload.evaluation, isOptimistic: true },
            ...(state.evaluationsByClass[action.payload.classId] || [])
          ]
        }
      };

    case 'REMOVE_EVALUATION_OPTIMISTIC':
      return {
        ...state,
        evaluationsByClass: {
          ...state.evaluationsByClass,
          [action.payload.classId]: (state.evaluationsByClass[action.payload.classId] || []).filter(
            evaluation => !(evaluation as any).isOptimistic || evaluation.id !== action.payload.evaluationId
          )
        }
      };

    // ========================================
    // GESTION DES RÉSULTATS
    // ========================================

    case 'SET_RESULTS':
      return {
        ...state,
        resultsByEvaluation: {
          ...state.resultsByEvaluation,
          [action.payload.evaluationId]: action.payload.results
        },
        cache: {
          ...state.cache,
          lastFetch: {
            ...state.cache.lastFetch,
            [`results:${action.payload.evaluationId}`]: Date.now()
          }
        }
      };

    case 'UPDATE_RESULT':
      return {
        ...state,
        resultsByEvaluation: {
          ...state.resultsByEvaluation,
          [action.payload.evaluationId]: (state.resultsByEvaluation[action.payload.evaluationId] || []).map(result =>
            result.studentId === action.payload.result.studentId
              ? action.payload.result
              : result
          )
        }
      };

    case 'UPDATE_RESULTS_BULK':
      return {
        ...state,
        resultsByEvaluation: {
          ...state.resultsByEvaluation,
          [action.payload.evaluationId]: action.payload.results
        }
      };

    // ========================================
    // GESTION DES STATISTIQUES ET CLASSEMENTS
    // ========================================

    case 'SET_STATISTICS':
      return {
        ...state,
        statisticsByEvaluation: {
          ...state.statisticsByEvaluation,
          [action.payload.evaluationId]: action.payload.statistics
        },
        cache: {
          ...state.cache,
          lastFetch: {
            ...state.cache.lastFetch,
            [`statistics:${action.payload.evaluationId}`]: Date.now()
          }
        }
      };

    case 'SET_RANKING':
      return {
        ...state,
        rankingsByEvaluation: {
          ...state.rankingsByEvaluation,
          [action.payload.evaluationId]: action.payload.ranking
        },
        cache: {
          ...state.cache,
          lastFetch: {
            ...state.cache.lastFetch,
            [`ranking:${action.payload.evaluationId}`]: Date.now()
          }
        }
      };

    // ========================================
    // GESTION DES ÉTATS DE CHARGEMENT
    // ========================================

    case 'SET_LOADING_EVALUATIONS':
      return {
        ...state,
        loading: {
          ...state.loading,
          evaluations: {
            ...state.loading.evaluations,
            [action.payload.classId]: action.payload.loading
          }
        }
      };

    case 'SET_LOADING_RESULTS':
      return {
        ...state,
        loading: {
          ...state.loading,
          results: {
            ...state.loading.results,
            [action.payload.evaluationId]: action.payload.loading
          }
        }
      };

    case 'SET_LOADING_CALCULATIONS':
      return {
        ...state,
        loading: {
          ...state.loading,
          calculations: {
            ...state.loading.calculations,
            [action.payload.evaluationId]: action.payload.loading
          }
        }
      };

    case 'SET_LOADING_GLOBAL':
      return {
        ...state,
        loading: {
          ...state.loading,
          global: action.payload
        }
      };

    // ========================================
    // GESTION DES ERREURS
    // ========================================

    case 'SET_ERROR_EVALUATIONS':
      return {
        ...state,
        errors: {
          ...state.errors,
          evaluations: {
            ...state.errors.evaluations,
            [action.payload.classId]: action.payload.error
          }
        }
      };

    case 'SET_ERROR_RESULTS':
      return {
        ...state,
        errors: {
          ...state.errors,
          results: {
            ...state.errors.results,
            [action.payload.evaluationId]: action.payload.error
          }
        }
      };

    case 'SET_ERROR_CALCULATIONS':
      return {
        ...state,
        errors: {
          ...state.errors,
          calculations: {
            ...state.errors.calculations,
            [action.payload.evaluationId]: action.payload.error
          }
        }
      };

    case 'SET_ERROR_GLOBAL':
      return {
        ...state,
        errors: {
          ...state.errors,
          global: action.payload
        }
      };

    // ========================================
    // GESTION DU CACHE
    // ========================================

    case 'UPDATE_CACHE_TIMESTAMP':
      return {
        ...state,
        cache: {
          ...state.cache,
          lastFetch: {
            ...state.cache.lastFetch,
            [action.payload.key]: action.payload.timestamp
          }
        }
      };

    case 'INVALIDATE_CACHE':
      const newInvalidationKeys = new Set(state.cache.invalidationKeys);
      action.payload.forEach(key => newInvalidationKeys.add(key));
      
      return {
        ...state,
        cache: {
          ...state.cache,
          invalidationKeys: newInvalidationKeys
        }
      };

    // ========================================
    // GESTION DE L'UI
    // ========================================

    case 'SET_SELECTED_EVALUATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedEvaluation: action.payload
        }
      };

    case 'SET_SELECTED_CLASS':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedClass: action.payload
        }
      };

    case 'SET_SHOW_FINALIZED_ONLY':
      return {
        ...state,
        ui: {
          ...state.ui,
          showFinalizedOnly: action.payload
        }
      };

    case 'SET_SHOW_STATS_PANEL':
      return {
        ...state,
        ui: {
          ...state.ui,
          showStatsPanel: action.payload
        }
      };

    // ========================================
    // RESET
    // ========================================

    case 'RESET_STATE':
      return initialState;

    case 'RESET_CLASS_DATA':
      const { [action.payload]: removedClass, ...remainingEvaluations } = state.evaluationsByClass;
      
      // Nettoyer toutes les données liées à cette classe
      const classEvaluations = state.evaluationsByClass[action.payload] || [];
      const evaluationIdsToClean = classEvaluations.map(e => e.id);
      
      const newResultsByEvaluation = { ...state.resultsByEvaluation };
      const newStatisticsByEvaluation = { ...state.statisticsByEvaluation };
      const newRankingsByEvaluation = { ...state.rankingsByEvaluation };
      
      evaluationIdsToClean.forEach(id => {
        delete newResultsByEvaluation[id];
        delete newStatisticsByEvaluation[id];
        delete newRankingsByEvaluation[id];
      });

      return {
        ...state,
        evaluationsByClass: remainingEvaluations,
        resultsByEvaluation: newResultsByEvaluation,
        statisticsByEvaluation: newStatisticsByEvaluation,
        rankingsByEvaluation: newRankingsByEvaluation,
        loading: {
          ...state.loading,
          evaluations: {
            ...state.loading.evaluations,
            [action.payload]: false
          }
        },
        errors: {
          ...state.errors,
          evaluations: {
            ...state.errors.evaluations,
            [action.payload]: null
          }
        }
      };

    default:
      return state;
  }
}

// ========================================
// CONTEXTE ET PROVIDER
// ========================================

interface EvaluationContextValue {
  state: EvaluationContextState;
  dispatch: React.Dispatch<EvaluationAction>;
  
  // Actions utilitaires
  setEvaluations: (classId: number, evaluations: Evaluation[]) => void;
  addEvaluation: (classId: number, evaluation: Evaluation) => void;
  updateEvaluation: (classId: number, evaluation: Evaluation) => void;
  removeEvaluation: (classId: number, evaluationId: number) => void;
  
  setResults: (evaluationId: number, results: EvaluationResult[]) => void;
  updateResult: (evaluationId: number, result: EvaluationResult) => void;
  
  setStatistics: (evaluationId: number, statistics: EvaluationStatistics) => void;
  setRanking: (evaluationId: number, ranking: ClassRanking) => void;
  
  setLoading: (type: 'evaluations' | 'results' | 'calculations' | 'global', id: number | boolean, loading: boolean) => void;
  setError: (type: 'evaluations' | 'results' | 'calculations' | 'global', id: number | string | null, error: string | null) => void;
  
  // Sélecteurs
  getEvaluationsForClass: (classId: number) => Evaluation[];
  getResultsForEvaluation: (evaluationId: number) => EvaluationResult[];
  getStatisticsForEvaluation: (evaluationId: number) => EvaluationStatistics | undefined;
  getRankingForEvaluation: (evaluationId: number) => ClassRanking | undefined;
  
  isLoading: (type: 'evaluations' | 'results' | 'calculations', id: number) => boolean;
  getError: (type: 'evaluations' | 'results' | 'calculations', id: number) => string | null;
  
  // UI helpers
  selectEvaluation: (evaluation: Evaluation | null) => void;
  selectClass: (classId: number | null) => void;
  toggleFinalizedOnly: () => void;
  toggleStatsPanel: () => void;
  
  // Cache helpers
  invalidateCache: (keys: string[]) => void;
  clearAllCache: () => void;
}

const EvaluationContext = createContext<EvaluationContextValue | null>(null);

// ========================================
// PROVIDER COMPONENT
// ========================================

interface EvaluationProviderProps {
  children: React.ReactNode;
  initialClassId?: number;
}

export function EvaluationProvider({ children, initialClassId }: EvaluationProviderProps) {
  const [state, dispatch] = useReducer(evaluationReducer, {
    ...initialState,
    ui: {
      ...initialState.ui,
      selectedClass: initialClassId || null
    }
  });

  // ========================================
  // ACTIONS UTILITAIRES
  // ========================================

  const setEvaluations = useCallback((classId: number, evaluations: Evaluation[]) => {
    dispatch({ type: 'SET_EVALUATIONS', payload: { classId, evaluations } });
  }, []);

  const addEvaluation = useCallback((classId: number, evaluation: Evaluation) => {
    dispatch({ type: 'ADD_EVALUATION', payload: { classId, evaluation } });
  }, []);

  const updateEvaluation = useCallback((classId: number, evaluation: Evaluation) => {
    dispatch({ type: 'UPDATE_EVALUATION', payload: { classId, evaluation } });
  }, []);

  const removeEvaluation = useCallback((classId: number, evaluationId: number) => {
    dispatch({ type: 'REMOVE_EVALUATION', payload: { classId, evaluationId } });
  }, []);

  const setResults = useCallback((evaluationId: number, results: EvaluationResult[]) => {
    dispatch({ type: 'SET_RESULTS', payload: { evaluationId, results } });
  }, []);

  const updateResult = useCallback((evaluationId: number, result: EvaluationResult) => {
    dispatch({ type: 'UPDATE_RESULT', payload: { evaluationId, result } });
  }, []);

  const setStatistics = useCallback((evaluationId: number, statistics: EvaluationStatistics) => {
    dispatch({ type: 'SET_STATISTICS', payload: { evaluationId, statistics } });
  }, []);

  const setRanking = useCallback((evaluationId: number, ranking: ClassRanking) => {
    dispatch({ type: 'SET_RANKING', payload: { evaluationId, ranking } });
  }, []);

  const setLoading = useCallback((
    type: 'evaluations' | 'results' | 'calculations' | 'global',
    id: number | boolean,
    loading: boolean
  ) => {
    if (type === 'global') {
      dispatch({ type: 'SET_LOADING_GLOBAL', payload: loading });
    } else if (type === 'evaluations') {
      dispatch({ type: 'SET_LOADING_EVALUATIONS', payload: { classId: id as number, loading } });
    } else if (type === 'results') {
      dispatch({ type: 'SET_LOADING_RESULTS', payload: { evaluationId: id as number, loading } });
    } else if (type === 'calculations') {
      dispatch({ type: 'SET_LOADING_CALCULATIONS', payload: { evaluationId: id as number, loading } });
    }
  }, []);

  const setError = useCallback((
    type: 'evaluations' | 'results' | 'calculations' | 'global',
    id: number | string | null,
    error: string | null
  ) => {
    if (type === 'global') {
      dispatch({ type: 'SET_ERROR_GLOBAL', payload: error });
    } else if (type === 'evaluations') {
      dispatch({ type: 'SET_ERROR_EVALUATIONS', payload: { classId: id as number, error } });
    } else if (type === 'results') {
      dispatch({ type: 'SET_ERROR_RESULTS', payload: { evaluationId: id as number, error } });
    } else if (type === 'calculations') {
      dispatch({ type: 'SET_ERROR_CALCULATIONS', payload: { evaluationId: id as number, error } });
    }
  }, []);

  // ========================================
  // SÉLECTEURS
  // ========================================

  const getEvaluationsForClass = useCallback((classId: number): Evaluation[] => {
    return state.evaluationsByClass[classId] || [];
  }, [state.evaluationsByClass]);

  const getResultsForEvaluation = useCallback((evaluationId: number): EvaluationResult[] => {
    return state.resultsByEvaluation[evaluationId] || [];
  }, [state.resultsByEvaluation]);

  const getStatisticsForEvaluation = useCallback((evaluationId: number): EvaluationStatistics | undefined => {
    return state.statisticsByEvaluation[evaluationId];
  }, [state.statisticsByEvaluation]);

  const getRankingForEvaluation = useCallback((evaluationId: number): ClassRanking | undefined => {
    return state.rankingsByEvaluation[evaluationId];
  }, [state.rankingsByEvaluation]);

  const isLoading = useCallback((type: 'evaluations' | 'results' | 'calculations', id: number): boolean => {
    return state.loading[type][id] || false;
  }, [state.loading]);

  const getError = useCallback((type: 'evaluations' | 'results' | 'calculations', id: number): string | null => {
    return state.errors[type][id] || null;
  }, [state.errors]);

  // ========================================
  // UI HELPERS
  // ========================================

  const selectEvaluation = useCallback((evaluation: Evaluation | null) => {
    dispatch({ type: 'SET_SELECTED_EVALUATION', payload: evaluation });
  }, []);

  const selectClass = useCallback((classId: number | null) => {
    dispatch({ type: 'SET_SELECTED_CLASS', payload: classId });
  }, []);

  const toggleFinalizedOnly = useCallback(() => {
    dispatch({ type: 'SET_SHOW_FINALIZED_ONLY', payload: !state.ui.showFinalizedOnly });
  }, [state.ui.showFinalizedOnly]);

  const toggleStatsPanel = useCallback(() => {
    dispatch({ type: 'SET_SHOW_STATS_PANEL', payload: !state.ui.showStatsPanel });
  }, [state.ui.showStatsPanel]);

  // ========================================
  // CACHE HELPERS
  // ========================================

  const invalidateCache = useCallback((keys: string[]) => {
    dispatch({ type: 'INVALIDATE_CACHE', payload: keys });
    // Également invalider le cache global
    globalCache.invalidate(keys);
  }, []);

  const clearAllCache = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
    globalCache.clear();
  }, []);

  // ========================================
  // EFFETS
  // ========================================

  // Synchronisation avec le cache global
  useEffect(() => {
    const unsubscribe = globalCache.on('invalidate', (data: any) => {
      if (data.pattern && typeof data.pattern === 'string') {
        invalidateCache([data.pattern]);
      }
    });

    return unsubscribe;
  }, [invalidateCache]);

  // Nettoyage automatique des erreurs après un délai
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    Object.entries(state.errors).forEach(([type, errors]) => {
      if (typeof errors === 'object' && errors !== null) {
        Object.entries(errors).forEach(([id, error]) => {
          if (error) {
            const timeout = setTimeout(() => {
              setError(type as any, parseInt(id) || id, null);
            }, 10000); // Nettoyer après 10 secondes
            timeouts.push(timeout);
          }
        });
      } else if (errors) {
        const timeout = setTimeout(() => {
          setError('global', null, null);
        }, 10000);
        timeouts.push(timeout);
      }
    });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [state.errors, setError]);

  // ========================================
  // VALEUR DU CONTEXTE
  // ========================================

  const contextValue: EvaluationContextValue = {
    state,
    dispatch,
    
    // Actions
    setEvaluations,
    addEvaluation,
    updateEvaluation,
    removeEvaluation,
    setResults,
    updateResult,
    setStatistics,
    setRanking,
    setLoading,
    setError,
    
    // Sélecteurs
    getEvaluationsForClass,
    getResultsForEvaluation,
    getStatisticsForEvaluation,
    getRankingForEvaluation,
    isLoading,
    getError,
    
    // UI
    selectEvaluation,
    selectClass,
    toggleFinalizedOnly,
    toggleStatsPanel,
    
    // Cache
    invalidateCache,
    clearAllCache
  };

  return (
    <EvaluationContext.Provider value={contextValue}>
      {children}
    </EvaluationContext.Provider>
  );
}

// ========================================
// HOOK D'UTILISATION
// ========================================

/**
 * Hook pour utiliser le contexte des évaluations
 */
export function useEvaluationContext(): EvaluationContextValue {
  const context = useContext(EvaluationContext);
  
  if (!context) {
    throw new Error('useEvaluationContext doit être utilisé dans un EvaluationProvider');
  }
  
  return context;
}

/**
 * Export par défaut
 */
export default EvaluationContext;
