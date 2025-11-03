// ========================================
// OPTIMIZED API HOOK - HOOK API HAUTE PERFORMANCE
// ========================================

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { apiCache, generateApiKey } from '../utils/performance/cache';
import { useDebounce, BatchProcessor } from '../utils/performance/debounce';
import { toast } from 'react-hot-toast';

/**
 * Options pour le hook API optimisé
 */
interface OptimizedApiOptions {
  /** Activer le cache */
  enableCache?: boolean;
  /** TTL du cache en millisecondes */
  cacheTTL?: number;
  /** Délai de debounce pour les requêtes */
  debounceDelay?: number;
  /** Nombre de tentatives en cas d'échec */
  retryCount?: number;
  /** Délai entre les tentatives */
  retryDelay?: number;
  /** Activer la déduplication des requêtes */
  enableDeduplication?: boolean;
  /** Activer le batching des requêtes */
  enableBatching?: boolean;
  /** Taille du batch */
  batchSize?: number;
  /** Délai du batch */
  batchDelay?: number;
  /** Callback d'erreur personnalisé */
  onError?: (error: Error) => void;
  /** Callback de succès personnalisé */
  onSuccess?: (data: any) => void;
  /** Transformation des données */
  transform?: (data: any) => any;
}

/**
 * État de la requête API
 */
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastFetch: number | null;
  fromCache: boolean;
}

/**
 * Gestionnaire de déduplication des requêtes
 */
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear(key?: string) {
    if (key) {
      this.pendingRequests.delete(key);
    } else {
      this.pendingRequests.clear();
    }
  }
}

/**
 * Instance globale du déduplicateur
 */
const requestDeduplicator = new RequestDeduplicator();

/**
 * Gestionnaire de retry avec backoff exponentiel
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Backoff exponentiel avec jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

/**
 * Hook API optimisé avec cache, déduplication et batching
 */
export function useOptimizedApi<T = any>(
  endpoint: string,
  params: Record<string, any> = {},
  options: OptimizedApiOptions = {}
) {
  const {
    enableCache = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    debounceDelay = 300,
    retryCount = 3,
    retryDelay = 1000,
    enableDeduplication = true,
    enableBatching = false,
    batchSize = 10,
    batchDelay = 100,
    onError,
    onSuccess,
    transform
  } = options;

  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null,
    fromCache: false
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // ========================================
  // CLÉS DE CACHE ET DÉDUPLICATION
  // ========================================

  const cacheKey = useMemo(() => {
    return generateApiKey(endpoint, params);
  }, [endpoint, params]);

  const requestKey = useMemo(() => {
    return `${endpoint}:${JSON.stringify(params)}`;
  }, [endpoint, params]);

  // ========================================
  // FONCTION DE REQUÊTE PRINCIPALE
  // ========================================

  const fetchData = useCallback(async (
    forceRefresh: boolean = false
  ): Promise<T | null> => {
    // Vérifier le cache d'abord
    if (enableCache && !forceRefresh) {
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            data: transform ? transform(cachedData) : cachedData,
            loading: false,
            error: null,
            fromCache: true,
            lastFetch: Date.now()
          }));
        }
        return cachedData;
      }
    }

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (mountedRef.current) {
      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
        fromCache: false
      }));
    }

    try {
      const requestFn = async () => {
        const response = await fetch(`/api${endpoint}?${new URLSearchParams(params)}`, {
          signal: abortControllerRef.current?.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      };

      let data: T;

      if (enableDeduplication) {
        data = await requestDeduplicator.deduplicate(requestKey, () =>
          retryWithBackoff(requestFn, retryCount, retryDelay)
        );
      } else {
        data = await retryWithBackoff(requestFn, retryCount, retryDelay);
      }

      // Transformer les données si nécessaire
      const transformedData = transform ? transform(data) : data;

      // Mettre en cache
      if (enableCache) {
        apiCache.set(cacheKey, data, cacheTTL);
      }

      if (mountedRef.current) {
        setState({
          data: transformedData,
          loading: false,
          error: null,
          lastFetch: Date.now(),
          fromCache: false
        });

        onSuccess?.(transformedData);
      }

      return transformedData;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null; // Requête annulée
      }

      const apiError = error instanceof Error ? error : new Error('Erreur API inconnue');

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: apiError,
          fromCache: false
        }));

        onError?.(apiError);
      }

      throw apiError;
    }
  }, [
    endpoint,
    params,
    cacheKey,
    requestKey,
    enableCache,
    cacheTTL,
    enableDeduplication,
    retryCount,
    retryDelay,
    transform,
    onSuccess,
    onError
  ]);

  // ========================================
  // FONCTION DEBOUNCED
  // ========================================

  const debouncedFetch = useDebounce(fetchData, {
    delay: debounceDelay,
    immediate: false
  });

  // ========================================
  // FONCTIONS PUBLIQUES
  // ========================================

  const refetch = useCallback((forceRefresh: boolean = false) => {
    return fetchData(forceRefresh);
  }, [fetchData]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    debouncedFetch.cancel();
  }, [debouncedFetch]);

  const invalidateCache = useCallback(() => {
    apiCache.delete(cacheKey);
  }, [cacheKey]);

  // ========================================
  // EFFETS
  // ========================================

  // Fetch initial
  useEffect(() => {
    debouncedFetch();
  }, [debouncedFetch]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cancel();
    };
  }, [cancel]);

  // ========================================
  // VALEURS DE RETOUR
  // ========================================

  return {
    ...state,
    refetch,
    refresh,
    cancel,
    invalidateCache,
    isStale: state.lastFetch ? Date.now() - state.lastFetch > cacheTTL : true
  };
}

/**
 * Hook pour les mutations API optimisées
 */
export function useOptimizedMutation<TData = any, TVariables = any>(
  endpoint: string,
  options: OptimizedApiOptions & {
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    invalidateKeys?: string[];
  } = {}
) {
  const {
    method = 'POST',
    retryCount = 1,
    retryDelay = 1000,
    invalidateKeys = [],
    onError,
    onSuccess,
    transform
  } = options;

  const [state, setState] = useState<{
    loading: boolean;
    error: Error | null;
    data: TData | null;
  }>({
    loading: false,
    error: null,
    data: null
  });

  const mutate = useCallback(async (variables: TVariables): Promise<TData> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const requestFn = async () => {
        const response = await fetch(`/api${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(variables),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      };

      const data = await retryWithBackoff(requestFn, retryCount, retryDelay);
      const transformedData = transform ? transform(data) : data;

      // Invalider les clés de cache spécifiées
      invalidateKeys.forEach(key => {
        apiCache.delete(key);
      });

      setState({
        loading: false,
        error: null,
        data: transformedData
      });

      onSuccess?.(transformedData);
      return transformedData;

    } catch (error) {
      const apiError = error instanceof Error ? error : new Error('Erreur mutation API');
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: apiError
      }));

      onError?.(apiError);
      throw apiError;
    }
  }, [endpoint, method, retryCount, retryDelay, invalidateKeys, transform, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      data: null
    });
  }, []);

  return {
    ...state,
    mutate,
    reset
  };
}

/**
 * Hook pour le batching de requêtes
 */
export function useBatchedApi<TInput, TOutput>(
  processor: (items: TInput[]) => Promise<TOutput[]>,
  options: {
    batchSize?: number;
    delay?: number;
    enableCache?: boolean;
    cacheTTL?: number;
  } = {}
) {
  const {
    batchSize = 10,
    delay = 100,
    enableCache = true,
    cacheTTL = 5 * 60 * 1000
  } = options;

  const batchProcessorRef = useRef<BatchProcessor<TInput, TOutput>>();

  if (!batchProcessorRef.current) {
    batchProcessorRef.current = new BatchProcessor(
      async (items: TInput[]) => {
        const results = await processor(items);
        
        // Mettre en cache les résultats si activé
        if (enableCache) {
          results.forEach((result, index) => {
            const key = `batch:${JSON.stringify(items[index])}`;
            apiCache.set(key, result, cacheTTL);
          });
        }
        
        return results;
      },
      batchSize,
      delay
    );
  }

  const addToBatch = useCallback(async (item: TInput): Promise<TOutput> => {
    // Vérifier le cache d'abord
    if (enableCache) {
      const key = `batch:${JSON.stringify(item)}`;
      const cached = apiCache.get(key);
      if (cached) {
        return cached;
      }
    }

    return batchProcessorRef.current!.add(item);
  }, [enableCache]);

  const flush = useCallback(async () => {
    return batchProcessorRef.current!.flush();
  }, []);

  useEffect(() => {
    return () => {
      batchProcessorRef.current?.flush();
    };
  }, []);

  return {
    addToBatch,
    flush
  };
}

/**
 * Hook pour la pagination optimisée
 */
export function useOptimizedPagination<T>(
  endpoint: string,
  options: OptimizedApiOptions & {
    pageSize?: number;
    initialPage?: number;
  } = {}
) {
  const { pageSize = 20, initialPage = 1, ...apiOptions } = options;
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [allData, setAllData] = useState<T[]>([]);

  const params = useMemo(() => ({
    page: currentPage,
    limit: pageSize
  }), [currentPage, pageSize]);

  const { data, loading, error, refetch } = useOptimizedApi<{
    items: T[];
    total: number;
    hasMore: boolean;
  }>(endpoint, params, apiOptions);

  // Accumuler les données pour la pagination infinie
  useEffect(() => {
    if (data?.items) {
      setAllData(prev => {
        if (currentPage === 1) {
          return data.items;
        }
        return [...prev, ...data.items];
      });
    }
  }, [data, currentPage]);

  const loadMore = useCallback(() => {
    if (data?.hasMore && !loading) {
      setCurrentPage(prev => prev + 1);
    }
  }, [data?.hasMore, loading]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setAllData([]);
  }, []);

  return {
    data: allData,
    currentPage,
    totalItems: data?.total || 0,
    hasMore: data?.hasMore || false,
    loading,
    error,
    loadMore,
    reset,
    refetch
  };
}

export default useOptimizedApi;
