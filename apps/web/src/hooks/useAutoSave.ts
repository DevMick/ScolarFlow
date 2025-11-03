// ========================================
// HOOK AUTO-SAUVEGARDE - TRANSPARENT ET FIABLE
// ========================================

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Configuration pour l'auto-sauvegarde
 */
interface AutoSaveConfig {
  delay?: number; // Délai en ms avant sauvegarde
  enabled?: boolean; // Activer/désactiver l'auto-save
  maxRetries?: number; // Nombre max de tentatives
  retryDelay?: number; // Délai entre les tentatives
  batchSize?: number; // Taille max du batch
  onSuccess?: (data: any) => void; // Callback succès
  onError?: (error: Error) => void; // Callback erreur
  onRetry?: (attempt: number, error: Error) => void; // Callback retry
}

/**
 * Interface de retour du hook
 */
interface AutoSaveResult {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  saveNow: () => Promise<void>;
  clearError: () => void;
  resetLastSaved: () => void;
}

/**
 * Hook pour auto-sauvegarde intelligente avec debounce et retry
 */
export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  config: AutoSaveConfig = {}
): AutoSaveResult {
  const {
    delay = 2000,
    enabled = true,
    maxRetries = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    onRetry
  } = config;

  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ========================================
  // REFS POUR GESTION ASYNCHRONE
  // ========================================

  const saveTimeoutRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const lastDataRef = useRef<T>(data);
  const retryCountRef = useRef<number>(0);
  const isUnmountedRef = useRef<boolean>(false);
  const savePromiseRef = useRef<Promise<void> | null>(null);

  // ========================================
  // FONCTION DE SAUVEGARDE AVEC RETRY
  // ========================================

  const performSave = useCallback(async (dataToSave: T, retryAttempt: number = 0): Promise<void> => {
    if (isUnmountedRef.current) return;

    try {
      setIsSaving(true);
      setError(null);

      await saveFn(dataToSave);

      if (isUnmountedRef.current) return;

      setLastSaved(new Date());
      retryCountRef.current = 0;

      if (onSuccess) {
        onSuccess(dataToSave);
      }

    } catch (err) {
      if (isUnmountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Erreur de sauvegarde inconnue';
      
      // Tentative de retry si autorisé
      if (retryAttempt < maxRetries) {
        retryCountRef.current = retryAttempt + 1;
        
        if (onRetry) {
          onRetry(retryAttempt + 1, err as Error);
        }

        // Programmer le retry avec backoff exponentiel
        const nextRetryDelay = retryDelay * Math.pow(2, retryAttempt);
        
        retryTimeoutRef.current = setTimeout(() => {
          if (!isUnmountedRef.current) {
            performSave(dataToSave, retryAttempt + 1);
          }
        }, nextRetryDelay);

        return;
      }

      // Échec définitif après tous les retries
      setError(errorMessage);
      retryCountRef.current = 0;

      if (onError) {
        onError(err as Error);
      }
    } finally {
      if (!isUnmountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [saveFn, maxRetries, retryDelay, onSuccess, onError, onRetry]);

  // ========================================
  // FONCTION DE SAUVEGARDE DEBOUNCÉE
  // ========================================

  const debouncedSave = useCallback((dataToSave: T) => {
    // Annuler la sauvegarde en attente
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Annuler les retries en cours
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // Ne pas sauvegarder si désactivé ou si aucun changement
    if (!enabled || JSON.stringify(dataToSave) === JSON.stringify(lastDataRef.current)) {
      return;
    }

    // Programmer la nouvelle sauvegarde
    saveTimeoutRef.current = setTimeout(() => {
      if (!isUnmountedRef.current) {
        savePromiseRef.current = performSave(dataToSave);
        lastDataRef.current = dataToSave;
      }
    }, delay);
  }, [enabled, delay, performSave]);

  // ========================================
  // SAUVEGARDE MANUELLE
  // ========================================

  const saveNow = useCallback(async (): Promise<void> => {
    // Annuler la sauvegarde programmée
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Annuler les retries
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Attendre la sauvegarde en cours si elle existe
    if (savePromiseRef.current) {
      await savePromiseRef.current;
    }

    // Effectuer la sauvegarde immédiate
    if (enabled && data) {
      savePromiseRef.current = performSave(data);
      lastDataRef.current = data;
      await savePromiseRef.current;
    }
  }, [enabled, data, performSave]);

  // ========================================
  // UTILITAIRES
  // ========================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetLastSaved = useCallback(() => {
    setLastSaved(null);
  }, []);

  // ========================================
  // EFFETS
  // ========================================

  // Effet principal pour déclencher l'auto-save
  useEffect(() => {
    if (data && enabled) {
      debouncedSave(data);
    }
  }, [data, enabled, debouncedSave]);

  // Effet pour sauvegarder lors du démontage
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;

      // Nettoyer les timeouts
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      // Note: On ne peut pas attendre la sauvegarde ici car useEffect cleanup est synchrone
      // La sauvegarde en cours continuera en arrière-plan si possible
    };
  }, []);

  // Effet pour sauvegarder avant déchargement de la page
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (isSaving || (saveTimeoutRef.current && enabled)) {
        e.preventDefault();
        e.returnValue = 'Des modifications non sauvegardées pourraient être perdues.';
        
        // Tenter une sauvegarde synchrone rapide
        try {
          await saveNow();
        } catch (error) {
          console.error('Erreur lors de la sauvegarde avant fermeture:', error);
        }
        
        return e.returnValue;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && enabled) {
        // Page en arrière-plan, sauvegarder immédiatement
        saveNow().catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSaving, enabled, saveNow]);

  // ========================================
  // RÉSULTAT
  // ========================================

  return {
    isSaving,
    lastSaved,
    error,
    saveNow,
    clearError,
    resetLastSaved
  };
}

/**
 * Hook pour auto-sauvegarde avec queue de modifications
 */
export function useAutoSaveQueue<T>(
  saveFn: (items: T[]) => Promise<void>,
  config: AutoSaveConfig & { 
    maxQueueSize?: number;
    flushInterval?: number;
  } = {}
) {
  const {
    maxQueueSize = 100,
    flushInterval = 5000,
    ...autoSaveConfig
  } = config;

  const [queue, setQueue] = useState<T[]>([]);
  const queueRef = useRef<T[]>([]);
  const flushTimeoutRef = useRef<number | null>(null);

  // Fonction pour vider la queue
  const flushQueue = useCallback(async (): Promise<void> => {
    if (queueRef.current.length === 0) return;

    const itemsToSave = [...queueRef.current];
    queueRef.current = [];
    setQueue([]);

    await saveFn(itemsToSave);
  }, [saveFn]);

  // Auto-save de la queue
  const autoSaveResult = useAutoSave(
    queue.length > 0 ? queue : null,
    flushQueue,
    autoSaveConfig
  );

  // Ajouter un élément à la queue
  const addToQueue = useCallback((item: T) => {
    queueRef.current.push(item);
    setQueue([...queueRef.current]);

    // Flush automatique si queue trop grande
    if (queueRef.current.length >= maxQueueSize) {
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      flushQueue();
    } else {
      // Programmer un flush automatique
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      flushTimeoutRef.current = setTimeout(flushQueue, flushInterval);
    }
  }, [maxQueueSize, flushInterval, flushQueue]);

  // Nettoyer la queue
  const clearQueue = useCallback(() => {
    queueRef.current = [];
    setQueue([]);
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...autoSaveResult,
    addToQueue,
    clearQueue,
    queueSize: queue.length,
    flushNow: flushQueue
  };
}

/**
 * Hook pour auto-sauvegarde avec gestion d'état optimiste
 */
export function useOptimisticAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<T>,
  config: AutoSaveConfig = {}
) {
  const [optimisticData, setOptimisticData] = useState<T>(data);
  const [serverData, setServerData] = useState<T>(data);

  const autoSaveResult = useAutoSave(
    data,
    async (dataToSave: T) => {
      try {
        const savedData = await saveFn(dataToSave);
        setServerData(savedData);
      } catch (error) {
        // Rollback optimiste en cas d'erreur
        setOptimisticData(serverData);
        throw error;
      }
    },
    {
      ...config,
      onSuccess: () => {
        config.onSuccess?.();
      }
    }
  );

  // Mettre à jour les données optimistes
  const updateOptimistic = useCallback((newData: T) => {
    setOptimisticData(newData);
  }, []);

  useEffect(() => {
    setOptimisticData(data);
  }, [data]);

  return {
    ...autoSaveResult,
    optimisticData,
    serverData,
    updateOptimistic,
    hasUnsynced: JSON.stringify(optimisticData) !== JSON.stringify(serverData)
  };
}

export default useAutoSave;
