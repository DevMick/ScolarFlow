// ========================================
// DEBOUNCE & THROTTLE - OPTIMISATION DES PERFORMANCES
// ========================================

/**
 * Options pour le debouncing
 */
interface DebounceOptions {
  /** Délai en millisecondes */
  delay: number;
  /** Exécuter immédiatement au premier appel */
  immediate?: boolean;
  /** Délai maximum avant exécution forcée */
  maxWait?: number;
}

/**
 * Options pour le throttling
 */
interface ThrottleOptions {
  /** Délai en millisecondes */
  delay: number;
  /** Exécuter au début de l'intervalle */
  leading?: boolean;
  /** Exécuter à la fin de l'intervalle */
  trailing?: boolean;
}

/**
 * Fonction debounce avancée avec options
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  options: DebounceOptions
): T & { cancel: () => void; flush: () => void; pending: () => boolean } {
  let timeoutId: NodeJS.Timeout | null = null;
  let maxTimeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: any;
  let result: ReturnType<T>;

  const { delay, immediate = false, maxWait } = options;

  function invokeFunc(time: number) {
    const args = lastArgs!;
    const thisArg = lastThis;

    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, delay);
    return immediate ? invokeFunc(time) : result;
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number) {
    timeoutId = null;

    if (lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined;
    lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    if (maxTimeoutId !== null) {
      clearTimeout(maxTimeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = undefined;
    lastCallTime = 0;
    lastThis = undefined;
    timeoutId = null;
    maxTimeoutId = null;
  }

  function flush() {
    return timeoutId === null ? result : trailingEdge(Date.now());
  }

  function pending() {
    return timeoutId !== null;
  }

  function debounced(this: any, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timeoutId = setTimeout(timerExpired, delay);
        return invokeFunc(lastCallTime);
      }
    }
    if (timeoutId === null) {
      timeoutId = setTimeout(timerExpired, delay);
    }
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced as T & { cancel: () => void; flush: () => void; pending: () => boolean };
}

/**
 * Fonction throttle avancée avec options
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  options: ThrottleOptions
): T & { cancel: () => void; flush: () => void } {
  const { delay, leading = true, trailing = true } = options;

  return debounce(func, {
    delay,
    immediate: leading,
    maxWait: delay
  }) as T & { cancel: () => void; flush: () => void };
}

/**
 * Hook React pour debounce
 */
import { useCallback, useEffect, useRef } from 'react';

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  options: DebounceOptions
): T & { cancel: () => void; flush: () => void; pending: () => boolean } {
  const callbackRef = useRef(callback);
  const debouncedRef = useRef<ReturnType<typeof debounce>>();

  // Mettre à jour la référence du callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Créer la fonction debounced
  if (!debouncedRef.current) {
    debouncedRef.current = debounce(
      (...args: Parameters<T>) => callbackRef.current(...args),
      options
    );
  }

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      debouncedRef.current?.cancel();
    };
  }, []);

  return debouncedRef.current as T & { cancel: () => void; flush: () => void; pending: () => boolean };
}

/**
 * Hook React pour throttle
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  options: ThrottleOptions
): T & { cancel: () => void; flush: () => void } {
  return useDebounce(callback, {
    delay: options.delay,
    immediate: options.leading,
    maxWait: options.delay
  }) as T & { cancel: () => void; flush: () => void };
}

/**
 * Debounce spécialisé pour les recherches
 */
export const createSearchDebounce = <T>(
  searchFunction: (query: string) => Promise<T[]>,
  delay: number = 300
) => {
  return debounce(searchFunction, {
    delay,
    immediate: false,
    maxWait: 1000
  });
};

/**
 * Throttle spécialisé pour les événements de scroll
 */
export const createScrollThrottle = <T extends (...args: any[]) => any>(
  scrollHandler: T,
  delay: number = 16 // ~60fps
) => {
  return throttle(scrollHandler, {
    delay,
    leading: true,
    trailing: true
  });
};

/**
 * Debounce spécialisé pour les sauvegardes automatiques
 */
export const createAutoSaveDebounce = <T>(
  saveFunction: (data: T) => Promise<void>,
  delay: number = 2000
) => {
  return debounce(saveFunction, {
    delay,
    immediate: false,
    maxWait: 10000 // Forcer la sauvegarde après 10s max
  });
};

/**
 * Throttle spécialisé pour les événements de redimensionnement
 */
export const createResizeThrottle = <T extends (...args: any[]) => any>(
  resizeHandler: T,
  delay: number = 100
) => {
  return throttle(resizeHandler, {
    delay,
    leading: false,
    trailing: true
  });
};

// ========================================
// UTILITAIRES DE PERFORMANCE
// ========================================

/**
 * Gestionnaire de performance pour les opérations coûteuses
 */
export class PerformanceManager {
  private operations = new Map<string, {
    count: number;
    totalTime: number;
    lastExecution: number;
    averageTime: number;
  }>();

  /**
   * Mesurer le temps d'exécution d'une opération
   */
  async measure<T>(
    operationName: string,
    operation: () => Promise<T> | T
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      this.recordExecution(operationName, executionTime);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      this.recordExecution(operationName, executionTime);
      throw error;
    }
  }

  private recordExecution(operationName: string, executionTime: number) {
    const existing = this.operations.get(operationName);
    
    if (existing) {
      existing.count++;
      existing.totalTime += executionTime;
      existing.lastExecution = executionTime;
      existing.averageTime = existing.totalTime / existing.count;
    } else {
      this.operations.set(operationName, {
        count: 1,
        totalTime: executionTime,
        lastExecution: executionTime,
        averageTime: executionTime
      });
    }
  }

  /**
   * Obtenir les statistiques de performance
   */
  getStats(operationName?: string) {
    if (operationName) {
      return this.operations.get(operationName);
    }
    
    const stats: Record<string, any> = {};
    this.operations.forEach((value, key) => {
      stats[key] = value;
    });
    
    return stats;
  }

  /**
   * Réinitialiser les statistiques
   */
  reset(operationName?: string) {
    if (operationName) {
      this.operations.delete(operationName);
    } else {
      this.operations.clear();
    }
  }

  /**
   * Obtenir un rapport de performance
   */
  getReport() {
    const operations = Array.from(this.operations.entries())
      .map(([name, stats]) => ({
        name,
        ...stats,
        efficiency: stats.averageTime < 100 ? 'Excellent' : 
                   stats.averageTime < 500 ? 'Bon' : 
                   stats.averageTime < 1000 ? 'Moyen' : 'Lent'
      }))
      .sort((a, b) => b.totalTime - a.totalTime);

    return {
      operations,
      totalOperations: operations.reduce((sum, op) => sum + op.count, 0),
      totalTime: operations.reduce((sum, op) => sum + op.totalTime, 0),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Instance globale du gestionnaire de performance
 */
export const performanceManager = new PerformanceManager();

/**
 * Décorateur pour mesurer automatiquement les performances
 */
export function measurePerformance(operationName?: string) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;
    const name = operationName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (this: any, ...args: Parameters<T>) {
      return performanceManager.measure(name, () => originalMethod.apply(this, args));
    } as T;

    return descriptor;
  };
}

/**
 * Hook pour mesurer les performances de rendu React
 */
export function useRenderPerformance(componentName: string) {
  const renderStartRef = useRef<number>();
  
  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    if (renderStartRef.current) {
      const renderTime = performance.now() - renderStartRef.current;
      performanceManager.measure(`React.${componentName}`, () => Promise.resolve(renderTime));
    }
  });
}

/**
 * Utilitaire pour batching des opérations
 */
export class BatchProcessor<T, R> {
  private batch: T[] = [];
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(
    private processor: (items: T[]) => Promise<R[]>,
    private batchSize: number = 10,
    private delay: number = 100
  ) {}

  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.batch.push(item);
      
      // Associer la promesse à l'élément
      (item as any).__resolve = resolve;
      (item as any).__reject = reject;

      // Traiter immédiatement si le batch est plein
      if (this.batch.length >= this.batchSize) {
        this.processBatch();
      } else {
        // Sinon, programmer le traitement
        this.scheduleProcessing();
      }
    });
  }

  private scheduleProcessing() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    
    this.timeoutId = setTimeout(() => {
      this.processBatch();
    }, this.delay);
  }

  private async processBatch() {
    if (this.batch.length === 0) return;

    const currentBatch = this.batch.splice(0);
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    try {
      const results = await this.processor(currentBatch);
      
      currentBatch.forEach((item, index) => {
        const resolve = (item as any).__resolve;
        if (resolve) {
          resolve(results[index]);
        }
      });
    } catch (error) {
      currentBatch.forEach(item => {
        const reject = (item as any).__reject;
        if (reject) {
          reject(error);
        }
      });
    }
  }

  flush(): Promise<void> {
    return new Promise((resolve) => {
      if (this.batch.length === 0) {
        resolve();
        return;
      }

      const originalLength = this.batch.length;
      this.processBatch().then(() => {
        if (this.batch.length === 0) {
          resolve();
        } else {
          // Récursion si il reste des éléments
          this.flush().then(resolve);
        }
      });
    });
  }
}
