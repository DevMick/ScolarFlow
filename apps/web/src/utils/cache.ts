// ========================================
// CACHE INTELLIGENT - GESTION MÉMOIRE FRONTEND
// ========================================

import React from 'react';
import type { CacheEntry } from '../types';

/**
 * Interface pour la configuration du cache
 */
interface CacheConfig {
  defaultTtl: number;
  maxSize: number;
  cleanupInterval: number;
  enablePersistence: boolean;
  storageKey: string;
}

/**
 * Stratégies d'invalidation du cache
 */
export enum InvalidationStrategy {
  TTL = 'ttl', // Time To Live
  LRU = 'lru', // Least Recently Used
  MANUAL = 'manual', // Invalidation manuelle uniquement
  TAGS = 'tags' // Invalidation par tags
}

/**
 * Interface pour les entrées de cache avec métadonnées
 */
interface CacheEntryWithMeta<T = any> extends CacheEntry<T> {
  accessCount: number;
  lastAccess: number;
  tags: Set<string>;
  dependencies: Set<string>;
}

/**
 * Événements de cache pour debugging et monitoring
 */
export enum CacheEvent {
  HIT = 'hit',
  MISS = 'miss',
  SET = 'set',
  INVALIDATE = 'invalidate',
  CLEANUP = 'cleanup',
  EVICT = 'evict'
}

/**
 * Classe de cache intelligent avec gestion TTL et invalidation
 */
export class IntelligentCache {
  private cache = new Map<string, CacheEntryWithMeta>();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private listeners = new Map<CacheEvent, Set<Function>>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0,
    evictions: 0
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTtl: 5 * 60 * 1000, // 5 minutes par défaut
      maxSize: 1000, // Limite d'entrées
      cleanupInterval: 60 * 1000, // Nettoyage chaque minute
      enablePersistence: false, // Pas de persistance par défaut
      storageKey: 'edustats_cache',
      ...config
    };

    this.startCleanupTimer();
    this.loadFromStorage();
  }

  /**
   * Récupère une entrée du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.emit(CacheEvent.MISS, { key });
      return null;
    }

    // Vérifier si l'entrée a expiré
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      this.emit(CacheEvent.MISS, { key, reason: 'expired' });
      return null;
    }

    // Mettre à jour les statistiques d'accès
    entry.accessCount++;
    entry.lastAccess = Date.now();
    
    this.stats.hits++;
    this.emit(CacheEvent.HIT, { key, data: entry.data });
    
    return entry.data as T;
  }

  /**
   * Stocke une entrée dans le cache
   */
  set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      tags?: string[];
      dependencies?: string[];
    } = {}
  ): void {
    const now = Date.now();
    const ttl = options.ttl ?? this.config.defaultTtl;
    
    // Vérifier la limite de taille et évictions si nécessaire
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntryWithMeta<T> = {
      data,
      timestamp: now,
      ttl,
      key,
      accessCount: 0,
      lastAccess: now,
      tags: new Set(options.tags || []),
      dependencies: new Set(options.dependencies || [])
    };

    this.cache.set(key, entry);
    this.stats.sets++;
    this.emit(CacheEvent.SET, { key, data, ttl });

    // Sauvegarder en localStorage si activé
    if (this.config.enablePersistence) {
      this.saveToStorage();
    }
  }

  /**
   * Invalide une ou plusieurs entrées
   */
  invalidate(pattern: string | string[]): number {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    let invalidatedCount = 0;

    for (const key of this.cache.keys()) {
      for (const p of patterns) {
        if (this.matchesPattern(key, p)) {
          this.cache.delete(key);
          invalidatedCount++;
          this.emit(CacheEvent.INVALIDATE, { key, pattern: p });
          break;
        }
      }
    }

    this.stats.invalidations += invalidatedCount;
    
    if (this.config.enablePersistence && invalidatedCount > 0) {
      this.saveToStorage();
    }

    return invalidatedCount;
  }

  /**
   * Invalide par tags
   */
  invalidateByTags(tags: string[]): number {
    let invalidatedCount = 0;
    const tagsSet = new Set(tags);

    for (const [key, entry] of this.cache) {
      // Vérifier si l'entrée a au moins un tag en commun
      const hasMatchingTag = [...entry.tags].some(tag => tagsSet.has(tag));
      
      if (hasMatchingTag) {
        this.cache.delete(key);
        invalidatedCount++;
        this.emit(CacheEvent.INVALIDATE, { key, tags });
      }
    }

    this.stats.invalidations += invalidatedCount;
    return invalidatedCount;
  }

  /**
   * Invalide les dépendances d'une clé
   */
  invalidateDependencies(key: string): number {
    let invalidatedCount = 0;

    for (const [entryKey, entry] of this.cache) {
      if (entry.dependencies.has(key)) {
        this.cache.delete(entryKey);
        invalidatedCount++;
        this.emit(CacheEvent.INVALIDATE, { key: entryKey, dependency: key });
      }
    }

    return invalidatedCount;
  }

  /**
   * Vide complètement le cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.invalidations += size;
    this.emit(CacheEvent.INVALIDATE, { pattern: '*', count: size });

    if (this.config.enablePersistence) {
      this.clearStorage();
    }
  }

  /**
   * Récupère les statistiques du cache
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      size: this.cache.size,
      maxSize: this.config.maxSize,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Ajoute un listener pour les événements de cache
   */
  on(event: CacheEvent, listener: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(listener);
    
    // Retourne une fonction de cleanup
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  /**
   * Liste toutes les clés du cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Vérifie si une clé existe dans le cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Récupère la taille actuelle du cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Nettoie le cache et arrête les timers
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.clear();
    this.listeners.clear();
  }

  // ========================================
  // MÉTHODES PRIVÉES
  // ========================================

  private isExpired(entry: CacheEntryWithMeta): boolean {
    return Date.now() > (entry.timestamp + entry.ttl);
  }

  private matchesPattern(key: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(key);
    }
    return key.includes(pattern);
  }

  private evictLeastRecentlyUsed(): void {
    let lruKey: string | null = null;
    let lruAccess = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccess < lruAccess) {
        lruAccess = entry.lastAccess;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
      this.emit(CacheEvent.EVICT, { key: lruKey, reason: 'lru' });
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.emit(CacheEvent.CLEANUP, { count: cleanedCount, timestamp: now });
      
      if (this.config.enablePersistence) {
        this.saveToStorage();
      }
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private emit(event: CacheEvent, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.warn('Erreur dans listener de cache:', error);
        }
      });
    }
  }

  private estimateMemoryUsage(): number {
    // Estimation approximative de l'utilisation mémoire
    let totalSize = 0;
    
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry).length * 2; // UTF-16
    }
    
    return totalSize;
  }

  private saveToStorage(): void {
    if (!this.config.enablePersistence) return;
    
    try {
      const data = Array.from(this.cache.entries()).map(([key, entry]) => ([
        key,
        {
          ...entry,
          tags: Array.from(entry.tags),
          dependencies: Array.from(entry.dependencies)
        }
      ]));
      
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Impossible de sauvegarder le cache:', error);
    }
  }

  private loadFromStorage(): void {
    if (!this.config.enablePersistence) return;
    
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (!stored) return;
      
      const data = JSON.parse(stored);
      const now = Date.now();
      
      for (const [key, entry] of data) {
        // Vérifier si l'entrée n'a pas expiré
        if (now <= (entry.timestamp + entry.ttl)) {
          this.cache.set(key, {
            ...entry,
            tags: new Set(entry.tags),
            dependencies: new Set(entry.dependencies)
          });
        }
      }
    } catch (error) {
      console.warn('Impossible de charger le cache depuis le storage:', error);
      this.clearStorage();
    }
  }

  private clearStorage(): void {
    try {
      localStorage.removeItem(this.config.storageKey);
    } catch (error) {
      console.warn('Impossible de vider le cache du storage:', error);
    }
  }
}

// ========================================
// INSTANCE GLOBALE ET UTILITAIRES
// ========================================

/**
 * Instance globale du cache pour l'application
 */
export const globalCache = new IntelligentCache({
  defaultTtl: 5 * 60 * 1000, // 5 minutes
  maxSize: 500,
  cleanupInterval: 60 * 1000, // 1 minute
  enablePersistence: true,
  storageKey: 'edustats_cache'
});

/**
 * Clés de cache prédéfinies pour l'application
 */
export const CACHE_KEYS = {
  // Évaluations
  EVALUATIONS: (classId: number) => `evaluations:class:${classId}`,
  EVALUATION: (id: number) => `evaluation:${id}`,
  EVALUATION_TYPES: () => 'evaluation:types',
  EVALUATION_SUBJECTS: () => 'evaluation:subjects',
  EVALUATION_CONFIG: () => 'evaluation:config',
  
  // Résultats
  RESULTS: (evaluationId: number) => `results:evaluation:${evaluationId}`,
  RESULT: (evaluationId: number, studentId: number) => `result:${evaluationId}:${studentId}`,
  RESULT_HISTORY: (evaluationId: number, studentId: number) => `result:history:${evaluationId}:${studentId}`,
  
  // Calculs et statistiques
  STATISTICS: (evaluationId: number) => `statistics:${evaluationId}`,
  FULL_STATISTICS: (evaluationId: number) => `statistics:full:${evaluationId}`,
  RANKING: (evaluationId: number) => `ranking:${evaluationId}`,
  DISTRIBUTION: (evaluationId: number) => `distribution:${evaluationId}`,
  REPORT: (evaluationId: number) => `report:${evaluationId}`,
  ANOMALIES: (evaluationId: number) => `anomalies:${evaluationId}`,
  
  // Classes et élèves
  CLASSES: () => 'classes',
  CLASS: (id: number) => `class:${id}`,
  STUDENTS: (classId: number) => `students:class:${classId}`,
  STUDENT: (id: number) => `student:${id}`,
  
  // Métadonnées
  USER_PROFILE: () => 'user:profile',
  SETTINGS: () => 'settings'
} as const;

/**
 * Tags de cache pour invalidation groupée
 */
export const CACHE_TAGS = {
  EVALUATIONS: 'evaluations',
  RESULTS: 'results',
  CALCULATIONS: 'calculations',
  CLASSES: 'classes',
  STUDENTS: 'students',
  USER: 'user'
} as const;

/**
 * Utilitaires de cache spécialisés
 */
export const cacheUtils = {
  /**
   * Invalide toutes les données liées à une classe
   */
  invalidateClass: (classId: number): number => {
    return globalCache.invalidate([
      CACHE_KEYS.EVALUATIONS(classId),
      CACHE_KEYS.STUDENTS(classId),
      `*:class:${classId}*`
    ]);
  },

  /**
   * Invalide toutes les données liées à une évaluation
   */
  invalidateEvaluation: (evaluationId: number): number => {
    return globalCache.invalidate([
      CACHE_KEYS.EVALUATION(evaluationId),
      CACHE_KEYS.RESULTS(evaluationId),
      CACHE_KEYS.STATISTICS(evaluationId),
      CACHE_KEYS.RANKING(evaluationId),
      `*:${evaluationId}*`
    ]);
  },

  /**
   * Invalide le cache utilisateur
   */
  invalidateUser: (): number => {
    return globalCache.invalidateByTags([CACHE_TAGS.USER]);
  },

  /**
   * Précharge les données essentielles
   */
  preload: async (classIds: number[]) => {
    // Cette fonction pourrait être étendue pour précharger des données
    console.log('Préchargement des données pour les classes:', classIds);
  },

  /**
   * Récupère les statistiques détaillées du cache
   */
  getDetailedStats: () => {
    const stats = globalCache.getStats();
    const keys = globalCache.keys();
    
    const keysByType = keys.reduce((acc, key) => {
      const type = key.split(':')[0];
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      ...stats,
      keysByType,
      totalKeys: keys.length
    };
  }
};

/**
 * Hook React pour surveiller les statistiques du cache
 */
export const useCacheStats = () => {
  const [stats, setStats] = React.useState(globalCache.getStats());
  
  React.useEffect(() => {
    const updateStats = () => setStats(globalCache.getStats());
    
    const unsubscribers = [
      globalCache.on(CacheEvent.HIT, updateStats),
      globalCache.on(CacheEvent.MISS, updateStats),
      globalCache.on(CacheEvent.SET, updateStats),
      globalCache.on(CacheEvent.INVALIDATE, updateStats)
    ];
    
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);
  
  return stats;
};

// Export par défaut
export default globalCache;
