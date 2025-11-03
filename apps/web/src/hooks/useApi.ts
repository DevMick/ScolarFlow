// ========================================
// HOOK API GÉNÉRIQUE - GESTION DONNÉES AVEC CACHE
// ========================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { globalCache } from '../utils/cache';
import { globalErrorHandler, errorUtils } from '../utils/errorHandling';
import type { 
  DataHook, 
  MutationHook, 
  HookConfig, 
  DEFAULT_HOOK_CONFIG,
  ApiService
} from '../types';

// ========================================
// HOOK DE DONNÉES (LECTURE)
// ========================================

/**
 * Hook générique pour les opérations de lecture avec cache intelligent
 */
export function useApi<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = [],
  config: Partial<HookConfig> = {}
): DataHook<T> {
  const finalConfig = { ...DEFAULT_HOOK_CONFIG, ...config };
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(true);

  /**
   * Fonction de récupération des données
   */
  const fetchData = useCallback(async (force: boolean = false) => {
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouveau contrôleur d'abort
    abortControllerRef.current = new AbortController();
    
    const startTime = Date.now();
    
    // Vérifier la fraîcheur des données en cache
    if (!force && finalConfig.enableCache && data) {
      const age = Date.now() - lastFetchRef.current;
      if (age < (finalConfig.staleTime || 0)) {
        return; // Les données sont encore fraîches
      }
    }

    try {
      setLoading(true);
      setError(null);

      const result = await fetchFn();
      
      if (!mountedRef.current) return;

      setData(result);
      lastFetchRef.current = startTime;
      retryCountRef.current = 0;

      // Callback de succès
      if (finalConfig.onSuccess) {
        finalConfig.onSuccess(result);
      }

    } catch (err: any) {
      if (!mountedRef.current) return;

      // Ignorer les erreurs d'abort
      if (err.name === 'AbortError') return;

      const appError = globalErrorHandler.handleError(err, {
        context: 'useApi',
        fetchFn: fetchFn.name,
        deps
      });

      // Gérer les retry
      const shouldRetry = finalConfig.retry && 
                         retryCountRef.current < (typeof finalConfig.retry === 'number' ? finalConfig.retry : 3) &&
                         errorUtils.isNetworkError(err);

      if (shouldRetry) {
        retryCountRef.current++;
        const delay = finalConfig.retryDelay || 1000;
        setTimeout(() => {
          if (mountedRef.current) {
            fetchData(force);
          }
        }, delay * Math.pow(2, retryCountRef.current - 1)); // Backoff exponentiel
        return;
      }

      setError(appError.userMessage || appError.message);

      // Callback d'erreur
      if (finalConfig.onError) {
        finalConfig.onError(appError);
      }

      // Lancer l'erreur si configuré
      if (finalConfig.throwOnError) {
        throw appError;
      }

    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, finalConfig, data, ...deps]);

  /**
   * Fonction de re-fetch manuel
   */
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  /**
   * Fonction d'invalidation du cache
   */
  const invalidate = useCallback(() => {
    if (finalConfig.enableCache) {
      // Cette fonction pourrait être améliorée avec une clé de cache spécifique
      globalCache.clear();
    }
    setData(null);
    lastFetchRef.current = 0;
  }, [finalConfig.enableCache]);

  // Effet principal pour le chargement initial et les dépendances
  useEffect(() => {
    if (finalConfig.refetchOnMount !== false) {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, deps);

  // Effet pour le polling
  useEffect(() => {
    if (finalConfig.refetchInterval && finalConfig.refetchInterval > 0) {
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchData();
        }
      }, finalConfig.refetchInterval);

      return () => clearInterval(interval);
    }
  }, [fetchData, finalConfig.refetchInterval]);

  // Effet pour le refetch au focus
  useEffect(() => {
    if (finalConfig.refetchOnWindowFocus) {
      const handleFocus = () => {
        if (data && Date.now() - lastFetchRef.current > (finalConfig.staleTime || 0)) {
          fetchData();
        }
      };

      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleFocus);

      return () => {
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleFocus);
      };
    }
  }, [fetchData, finalConfig.refetchOnWindowFocus, finalConfig.staleTime, data]);

  // Effet de nettoyage
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate
  };
}

// ========================================
// HOOK DE MUTATION (ÉCRITURE)
// ========================================

/**
 * Hook générique pour les opérations de mutation
 */
export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  config: Partial<HookConfig> = {}
): MutationHook<TData, TVariables> {
  const finalConfig = { ...DEFAULT_HOOK_CONFIG, ...config };
  
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const mountedRef = useRef<boolean>(true);

  /**
   * Fonction de mutation
   */
  const mutate = useCallback(async (variables: TVariables): Promise<TData> => {
    try {
      setLoading(true);
      setError(null);

      const result = await mutationFn(variables);
      
      if (!mountedRef.current) return result;

      setData(result);

      // Callback de succès
      if (finalConfig.onSuccess) {
        finalConfig.onSuccess(result);
      }

      return result;

    } catch (err: any) {
      if (!mountedRef.current) throw err;

      const appError = globalErrorHandler.handleError(err, {
        context: 'useMutation',
        mutationFn: mutationFn.name,
        variables
      });

      setError(appError.userMessage || appError.message);

      // Callback d'erreur
      if (finalConfig.onError) {
        finalConfig.onError(appError);
      }

      throw appError;

    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [mutationFn, finalConfig]);

  /**
   * Fonction de reset
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  // Effet de nettoyage
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    mutate,
    data,
    loading,
    error,
    reset
  };
}

// ========================================
// HOOKS SPÉCIALISÉS POUR L'API
// ========================================

/**
 * Hook pour les requêtes GET avec cache automatique
 */
export function useGet<T>(
  endpoint: string,
  params?: Record<string, any>,
  config: Partial<HookConfig> = {}
): DataHook<T> {
  const fetchFn = useCallback(async () => {
    return apiService.get<T>(endpoint, params, {
      enableCache: config.enableCache !== false,
      cacheTime: config.cacheTime
    });
  }, [endpoint, JSON.stringify(params)]);

  return useApi<T>(fetchFn, [endpoint, params], config);
}

/**
 * Hook pour les requêtes GET paginées
 */
export function usePagination<T>(
  endpoint: string,
  initialParams: { page?: number; limit?: number; [key: string]: any } = {},
  config: Partial<HookConfig> = {}
) {
  const [params, setParams] = useState(initialParams);
  
  const fetchFn = useCallback(async () => {
    return apiService.getPaginated<T>(endpoint, params);
  }, [endpoint, JSON.stringify(params)]);

  const result = useApi(fetchFn, [endpoint, params], config);

  const nextPage = useCallback(() => {
    setParams(prev => ({
      ...prev,
      page: (prev.page || 1) + 1
    }));
  }, []);

  const prevPage = useCallback(() => {
    setParams(prev => ({
      ...prev,
      page: Math.max((prev.page || 1) - 1, 1)
    }));
  }, []);

  const setPage = useCallback((page: number) => {
    setParams(prev => ({
      ...prev,
      page: Math.max(page, 1)
    }));
  }, []);

  const setFilters = useCallback((filters: Record<string, any>) => {
    setParams(prev => ({
      ...prev,
      ...filters,
      page: 1 // Reset à la première page lors du filtrage
    }));
  }, []);

  return {
    ...result,
    params,
    nextPage,
    prevPage,
    setPage,
    setFilters
  };
}

/**
 * Hook pour les mutations POST
 */
export function usePost<TData, TVariables = any>(
  endpoint: string,
  config: Partial<HookConfig> = {}
): MutationHook<TData, TVariables> {
  const mutationFn = useCallback(async (variables: TVariables) => {
    return apiService.post<TData>(endpoint, variables);
  }, [endpoint]);

  return useMutation<TData, TVariables>(mutationFn, config);
}

/**
 * Hook pour les mutations PUT
 */
export function usePut<TData, TVariables = any>(
  endpoint: string,
  config: Partial<HookConfig> = {}
): MutationHook<TData, TVariables> {
  const mutationFn = useCallback(async (variables: TVariables) => {
    return apiService.put<TData>(endpoint, variables);
  }, [endpoint]);

  return useMutation<TData, TVariables>(mutationFn, config);
}

/**
 * Hook pour les mutations PATCH
 */
export function usePatch<TData, TVariables = any>(
  endpoint: string,
  config: Partial<HookConfig> = {}
): MutationHook<TData, TVariables> {
  const mutationFn = useCallback(async (variables: TVariables) => {
    return apiService.patch<TData>(endpoint, variables);
  }, [endpoint]);

  return useMutation<TData, TVariables>(mutationFn, config);
}

/**
 * Hook pour les mutations DELETE
 */
export function useDelete<TData = void>(
  config: Partial<HookConfig> = {}
): MutationHook<TData, { endpoint: string; id: number | string }> {
  const mutationFn = useCallback(async ({ endpoint, id }: { endpoint: string; id: number | string }) => {
    return apiService.delete(endpoint, id) as Promise<TData>;
  }, []);

  return useMutation<TData, { endpoint: string; id: number | string }>(mutationFn, config);
}

/**
 * Hook pour les uploads de fichiers
 */
export function useUpload<TData>(
  endpoint: string,
  config: Partial<HookConfig & { onProgress?: (progress: number) => void }> = {}
): MutationHook<TData, File> {
  const mutationFn = useCallback(async (file: File) => {
    return apiService.uploadFile<TData>(endpoint, file, config.onProgress);
  }, [endpoint, config.onProgress]);

  return useMutation<TData, File>(mutationFn, config);
}

// ========================================
// HOOKS UTILITAIRES
// ========================================

/**
 * Hook pour gérer l'état de santé de l'API
 */
export function useApiHealth() {
  return useGet('/health', undefined, {
    refetchInterval: 30000, // Vérifier toutes les 30 secondes
    enableCache: false,
    throwOnError: false
  });
}

/**
 * Hook pour les opérations optimistes
 */
export function useOptimistic<T, TVariables>(
  mutationFn: (variables: TVariables) => Promise<T>,
  optimisticFn: (variables: TVariables) => T,
  config: Partial<HookConfig> = {}
) {
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [isOptimistic, setIsOptimistic] = useState<boolean>(false);

  const mutation = useMutation<T, TVariables>(
    async (variables: TVariables) => {
      try {
        // Appliquer la mise à jour optimiste
        if (config.enableOptimisticUpdates !== false) {
          const optimistic = optimisticFn(variables);
          setOptimisticData(optimistic);
          setIsOptimistic(true);
        }

        // Effectuer la vraie mutation
        const result = await mutationFn(variables);
        
        // Remplacer les données optimistes par les vraies données
        setOptimisticData(result);
        setIsOptimistic(false);
        
        return result;
      } catch (error) {
        // Annuler la mise à jour optimiste en cas d'erreur
        setOptimisticData(null);
        setIsOptimistic(false);
        throw error;
      }
    },
    config
  );

  return {
    ...mutation,
    optimisticData,
    isOptimistic,
    clearOptimistic: () => {
      setOptimisticData(null);
      setIsOptimistic(false);
    }
  };
}

/**
 * Hook pour la gestion des états de chargement multiples
 */
export function useLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);

  const isLoading = useCallback((key: string): boolean => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback((): boolean => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const clearLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    clearLoading,
    loadingStates
  };
}

/**
 * Hook pour le debouncing des appels API
 */
export function useDebouncedApi<T>(
  fetchFn: () => Promise<T>,
  delay: number = 300,
  deps: any[] = [],
  config: Partial<HookConfig> = {}
): DataHook<T> {
  const [debouncedDeps, setDebouncedDeps] = useState(deps);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedDeps(deps);
    }, delay);

    return () => clearTimeout(timeout);
  }, [deps, delay]);

  return useApi<T>(fetchFn, debouncedDeps, config);
}
