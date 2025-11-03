// ========================================
// PERFORMANCE CACHE - SYSTÈME DE CACHE INTELLIGENT
// ========================================

/**
 * Interface pour les entrées de cache
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

/**
 * Options de configuration du cache
 */
interface CacheOptions {
  /** Taille maximale du cache en MB */
  maxSize: number;
  /** TTL par défaut en millisecondes */
  defaultTTL: number;
  /** Stratégie d'éviction */
  evictionStrategy: 'lru' | 'lfu' | 'ttl';
  /** Intervalle de nettoyage en millisecondes */
  cleanupInterval: number;
  /** Activer la compression */
  enableCompression: boolean;
}

/**
 * Statistiques du cache
 */
interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  currentSize: number;
  entryCount: number;
  hitRate: number;
}

/**
 * Classe de cache haute performance avec éviction intelligente
 */
export class PerformanceCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    currentSize: 0,
    entryCount: 0,
    hitRate: 0
  };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(private options: CacheOptions) {
    this.startCleanupTimer();
  }

  // ========================================
  // MÉTHODES PRINCIPALES
  // ========================================

  /**
   * Récupérer une valeur du cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Vérifier l'expiration
    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Mettre à jour les statistiques d'accès
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.updateHitRate();

    return entry.data;
  }

  /**
   * Stocker une valeur dans le cache
   */
  set(key: string, data: T, ttl?: number): void {
    const size = this.calculateSize(data);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.options.defaultTTL,
      accessCount: 1,
      lastAccessed: Date.now(),
      size
    };

    // Vérifier si on doit faire de la place
    if (this.stats.currentSize + size > this.options.maxSize * 1024 * 1024) {
      this.evict(size);
    }

    // Supprimer l'ancienne entrée si elle existe
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.stats.currentSize -= oldEntry.size;
      this.stats.entryCount--;
    }

    // Ajouter la nouvelle entrée
    this.cache.set(key, entry);
    this.stats.currentSize += size;
    this.stats.entryCount++;
  }

  /**
   * Supprimer une entrée du cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.stats.currentSize -= entry.size;
      this.stats.entryCount--;
      return this.cache.delete(key);
    }
    return false;
  }

  /**
   * Vider le cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      currentSize: 0,
      entryCount: 0,
      hitRate: 0
    };
  }

  /**
   * Vérifier si une clé existe
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Obtenir les statistiques du cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // ========================================
  // MÉTHODES AVANCÉES
  // ========================================

  /**
   * Récupérer ou calculer une valeur (pattern cache-aside)
   */
  async getOrSet<R = T>(
    key: string,
    factory: () => Promise<R>,
    ttl?: number
  ): Promise<R> {
    const cached = this.get(key) as R;
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value as any, ttl);
    return value;
  }

  /**
   * Mise à jour conditionnelle
   */
  setIfNotExists(key: string, data: T, ttl?: number): boolean {
    if (!this.has(key)) {
      this.set(key, data, ttl);
      return true;
    }
    return false;
  }

  /**
   * Récupérer plusieurs valeurs
   */
  getMultiple(keys: string[]): Map<string, T> {
    const result = new Map<string, T>();
    keys.forEach(key => {
      const value = this.get(key);
      if (value !== null) {
        result.set(key, value);
      }
    });
    return result;
  }

  /**
   * Stocker plusieurs valeurs
   */
  setMultiple(entries: Map<string, T>, ttl?: number): void {
    entries.forEach((value, key) => {
      this.set(key, value, ttl);
    });
  }

  /**
   * Précharger des données
   */
  async preload(
    keys: string[],
    factory: (key: string) => Promise<T>,
    ttl?: number
  ): Promise<void> {
    const promises = keys
      .filter(key => !this.has(key))
      .map(async key => {
        try {
          const value = await factory(key);
          this.set(key, value, ttl);
        } catch (error) {
          console.warn(`Erreur préchargement cache pour ${key}:`, error);
        }
      });

    await Promise.all(promises);
  }

  // ========================================
  // MÉTHODES PRIVÉES
  // ========================================

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private calculateSize(data: T): number {
    try {
      // Estimation approximative de la taille en bytes
      const jsonString = JSON.stringify(data);
      return new Blob([jsonString]).size;
    } catch {
      // Fallback pour les objets non sérialisables
      return 1024; // 1KB par défaut
    }
  }

  private evict(requiredSize: number): void {
    const entries = Array.from(this.cache.entries());
    
    switch (this.options.evictionStrategy) {
      case 'lru':
        this.evictLRU(entries, requiredSize);
        break;
      case 'lfu':
        this.evictLFU(entries, requiredSize);
        break;
      case 'ttl':
        this.evictTTL(entries, requiredSize);
        break;
    }
  }

  private evictLRU(entries: [string, CacheEntry<T>][], requiredSize: number): void {
    // Trier par dernière utilisation (plus ancien en premier)
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    let freedSize = 0;
    for (const [key, entry] of entries) {
      if (freedSize >= requiredSize) break;
      
      this.cache.delete(key);
      freedSize += entry.size;
      this.stats.currentSize -= entry.size;
      this.stats.entryCount--;
      this.stats.evictions++;
    }
  }

  private evictLFU(entries: [string, CacheEntry<T>][], requiredSize: number): void {
    // Trier par fréquence d'utilisation (moins utilisé en premier)
    entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
    
    let freedSize = 0;
    for (const [key, entry] of entries) {
      if (freedSize >= requiredSize) break;
      
      this.cache.delete(key);
      freedSize += entry.size;
      this.stats.currentSize -= entry.size;
      this.stats.entryCount--;
      this.stats.evictions++;
    }
  }

  private evictTTL(entries: [string, CacheEntry<T>][], requiredSize: number): void {
    // Trier par temps restant (expire le plus tôt en premier)
    const now = Date.now();
    entries.sort((a, b) => {
      const aTimeLeft = a[1].ttl - (now - a[1].timestamp);
      const bTimeLeft = b[1].ttl - (now - b[1].timestamp);
      return aTimeLeft - bTimeLeft;
    });
    
    let freedSize = 0;
    for (const [key, entry] of entries) {
      if (freedSize >= requiredSize) break;
      
      this.cache.delete(key);
      freedSize += entry.size;
      this.stats.currentSize -= entry.size;
      this.stats.entryCount--;
      this.stats.evictions++;
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
  }

  /**
   * Nettoyer les ressources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// ========================================
// INSTANCES GLOBALES
// ========================================

/**
 * Cache pour les résultats de statistiques
 */
export const statisticsCache = new PerformanceCache({
  maxSize: 50, // 50MB
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  evictionStrategy: 'lru',
  cleanupInterval: 60 * 1000, // 1 minute
  enableCompression: true
});

/**
 * Cache pour les données d'API
 */
export const apiCache = new PerformanceCache({
  maxSize: 20, // 20MB
  defaultTTL: 2 * 60 * 1000, // 2 minutes
  evictionStrategy: 'lru',
  cleanupInterval: 30 * 1000, // 30 secondes
  enableCompression: true
});

/**
 * Cache pour les graphiques rendus
 */
export const chartCache = new PerformanceCache({
  maxSize: 100, // 100MB
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  evictionStrategy: 'lfu',
  cleanupInterval: 2 * 60 * 1000, // 2 minutes
  enableCompression: false // Les images sont déjà compressées
});

// ========================================
// UTILITAIRES DE CACHE
// ========================================

/**
 * Générer une clé de cache pour les statistiques
 */
export const generateStatsKey = (configId: string, params: Record<string, any>): string => {
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  return `stats:${configId}:${btoa(paramString)}`;
};

/**
 * Générer une clé de cache pour les graphiques
 */
export const generateChartKey = (
  resultId: string, 
  chartType: string, 
  options: Record<string, any>
): string => {
  const optionsString = Object.keys(options)
    .sort()
    .map(key => `${key}:${JSON.stringify(options[key])}`)
    .join('|');
  return `chart:${resultId}:${chartType}:${btoa(optionsString)}`;
};

/**
 * Générer une clé de cache pour les API
 */
export const generateApiKey = (endpoint: string, params: Record<string, any>): string => {
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  return `api:${endpoint}:${btoa(paramString)}`;
};

/**
 * Invalidation de cache par pattern
 */
export const invalidateByPattern = (pattern: string): void => {
  const caches = [statisticsCache, apiCache, chartCache];
  
  caches.forEach(cache => {
    const stats = cache.getStats();
    // Note: Cette implémentation nécessiterait d'exposer les clés du cache
    // Pour l'instant, on peut utiliser clear() pour une invalidation complète
    if (pattern === '*') {
      cache.clear();
    }
  });
};

/**
 * Obtenir un rapport de performance des caches
 */
export const getCacheReport = () => {
  return {
    statistics: statisticsCache.getStats(),
    api: apiCache.getStats(),
    chart: chartCache.getStats(),
    timestamp: new Date().toISOString()
  };
};
