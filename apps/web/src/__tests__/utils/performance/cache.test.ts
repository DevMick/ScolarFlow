// ========================================
// PERFORMANCE CACHE TESTS - TESTS DU SYSTÈME DE CACHE
// ========================================

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { 
  PerformanceCache, 
  generateStatsKey, 
  generateChartKey, 
  generateApiKey 
} from '../../../utils/performance/cache';

// Mock de setTimeout et clearTimeout pour les tests
jest.useFakeTimers();

describe('PerformanceCache', () => {
  let cache: PerformanceCache<any>;

  beforeEach(() => {
    cache = new PerformanceCache({
      maxSize: 1, // 1MB pour les tests
      defaultTTL: 5000, // 5 secondes
      evictionStrategy: 'lru',
      cleanupInterval: 1000,
      enableCompression: false
    });
  });

  afterEach(() => {
    cache.destroy();
    jest.clearAllTimers();
  });

  describe('Opérations de base', () => {
    it('devrait stocker et récupérer des données', () => {
      const testData = { id: 1, name: 'Test' };
      
      cache.set('test-key', testData);
      const retrieved = cache.get('test-key');
      
      expect(retrieved).toEqual(testData);
    });

    it('devrait retourner null pour une clé inexistante', () => {
      const result = cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('devrait vérifier l\'existence d\'une clé', () => {
      cache.set('test-key', { data: 'test' });
      
      expect(cache.has('test-key')).toBe(true);
      expect(cache.has('non-existent')).toBe(false);
    });

    it('devrait supprimer une entrée', () => {
      cache.set('test-key', { data: 'test' });
      expect(cache.has('test-key')).toBe(true);
      
      const deleted = cache.delete('test-key');
      expect(deleted).toBe(true);
      expect(cache.has('test-key')).toBe(false);
    });

    it('devrait vider tout le cache', () => {
      cache.set('key1', { data: 'test1' });
      cache.set('key2', { data: 'test2' });
      
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(true);
      
      cache.clear();
      
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('TTL et expiration', () => {
    it('devrait expirer les entrées après le TTL', () => {
      cache.set('test-key', { data: 'test' }, 1000); // 1 seconde
      
      expect(cache.get('test-key')).not.toBeNull();
      
      // Avancer le temps de 1.5 secondes
      jest.advanceTimersByTime(1500);
      
      expect(cache.get('test-key')).toBeNull();
    });

    it('devrait utiliser le TTL par défaut', () => {
      cache.set('test-key', { data: 'test' });
      
      expect(cache.get('test-key')).not.toBeNull();
      
      // Avancer le temps de 6 secondes (TTL par défaut = 5s)
      jest.advanceTimersByTime(6000);
      
      expect(cache.get('test-key')).toBeNull();
    });

    it('devrait nettoyer automatiquement les entrées expirées', () => {
      cache.set('key1', { data: 'test1' }, 500);
      cache.set('key2', { data: 'test2' }, 2000);
      
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(true);
      
      // Avancer le temps pour déclencher le nettoyage
      jest.advanceTimersByTime(1000); // Déclenche le cleanup
      jest.advanceTimersByTime(1); // Permet l'exécution du cleanup
      
      expect(cache.has('key1')).toBe(false); // Expiré
      expect(cache.has('key2')).toBe(true);  // Encore valide
    });
  });

  describe('Statistiques', () => {
    it('devrait suivre les hits et misses', () => {
      cache.set('test-key', { data: 'test' });
      
      // Hit
      cache.get('test-key');
      
      // Miss
      cache.get('non-existent');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('devrait suivre la taille du cache', () => {
      const testData = { data: 'test' };
      cache.set('test-key', testData);
      
      const stats = cache.getStats();
      expect(stats.entryCount).toBe(1);
      expect(stats.currentSize).toBeGreaterThan(0);
    });

    it('devrait suivre les évictions', () => {
      // Créer un cache avec une taille très petite
      const smallCache = new PerformanceCache({
        maxSize: 0.001, // 1KB
        defaultTTL: 5000,
        evictionStrategy: 'lru',
        cleanupInterval: 1000,
        enableCompression: false
      });

      // Ajouter des données qui dépassent la limite
      const largeData = { data: 'x'.repeat(1000) }; // ~1KB
      smallCache.set('key1', largeData);
      smallCache.set('key2', largeData); // Devrait déclencher une éviction

      const stats = smallCache.getStats();
      expect(stats.evictions).toBeGreaterThan(0);
      
      smallCache.destroy();
    });
  });

  describe('Stratégies d\'éviction', () => {
    let smallCache: PerformanceCache<any>;

    beforeEach(() => {
      smallCache = new PerformanceCache({
        maxSize: 0.001, // 1KB
        defaultTTL: 5000,
        evictionStrategy: 'lru',
        cleanupInterval: 1000,
        enableCompression: false
      });
    });

    afterEach(() => {
      smallCache.destroy();
    });

    it('devrait utiliser la stratégie LRU', () => {
      const data = { data: 'x'.repeat(200) }; // ~200 bytes
      
      smallCache.set('key1', data);
      smallCache.set('key2', data);
      
      // Accéder à key1 pour le rendre plus récent
      smallCache.get('key1');
      
      // Ajouter key3 qui devrait évincer key2 (moins récemment utilisé)
      smallCache.set('key3', data);
      
      expect(smallCache.has('key1')).toBe(true);  // Récemment utilisé
      expect(smallCache.has('key3')).toBe(true);  // Nouveau
      // key2 pourrait être évincé selon la taille
    });

    it('devrait utiliser la stratégie LFU', () => {
      const lfuCache = new PerformanceCache({
        maxSize: 0.001,
        defaultTTL: 5000,
        evictionStrategy: 'lfu',
        cleanupInterval: 1000,
        enableCompression: false
      });

      const data = { data: 'x'.repeat(200) };
      
      lfuCache.set('key1', data);
      lfuCache.set('key2', data);
      
      // Accéder plusieurs fois à key1
      lfuCache.get('key1');
      lfuCache.get('key1');
      lfuCache.get('key2'); // Une seule fois
      
      // Ajouter key3 qui devrait évincer key2 (moins fréquemment utilisé)
      lfuCache.set('key3', data);
      
      expect(lfuCache.has('key1')).toBe(true); // Plus fréquemment utilisé
      
      lfuCache.destroy();
    });
  });

  describe('Méthodes avancées', () => {
    it('devrait implémenter getOrSet', async () => {
      const factory = jest.fn().mockResolvedValue({ computed: 'value' });
      
      // Première fois - devrait appeler la factory
      const result1 = await cache.getOrSet('test-key', factory);
      expect(factory).toHaveBeenCalledTimes(1);
      expect(result1).toEqual({ computed: 'value' });
      
      // Deuxième fois - devrait utiliser le cache
      const result2 = await cache.getOrSet('test-key', factory);
      expect(factory).toHaveBeenCalledTimes(1); // Pas d'appel supplémentaire
      expect(result2).toEqual({ computed: 'value' });
    });

    it('devrait implémenter setIfNotExists', () => {
      const data1 = { value: 1 };
      const data2 = { value: 2 };
      
      // Première fois - devrait réussir
      const set1 = cache.setIfNotExists('test-key', data1);
      expect(set1).toBe(true);
      expect(cache.get('test-key')).toEqual(data1);
      
      // Deuxième fois - devrait échouer
      const set2 = cache.setIfNotExists('test-key', data2);
      expect(set2).toBe(false);
      expect(cache.get('test-key')).toEqual(data1); // Inchangé
    });

    it('devrait implémenter getMultiple', () => {
      cache.set('key1', { value: 1 });
      cache.set('key2', { value: 2 });
      cache.set('key3', { value: 3 });
      
      const results = cache.getMultiple(['key1', 'key2', 'non-existent']);
      
      expect(results.size).toBe(2);
      expect(results.get('key1')).toEqual({ value: 1 });
      expect(results.get('key2')).toEqual({ value: 2 });
      expect(results.has('non-existent')).toBe(false);
    });

    it('devrait implémenter setMultiple', () => {
      const entries = new Map([
        ['key1', { value: 1 }],
        ['key2', { value: 2 }],
        ['key3', { value: 3 }]
      ]);
      
      cache.setMultiple(entries);
      
      expect(cache.get('key1')).toEqual({ value: 1 });
      expect(cache.get('key2')).toEqual({ value: 2 });
      expect(cache.get('key3')).toEqual({ value: 3 });
    });

    it('devrait implémenter preload', async () => {
      const factory = jest.fn()
        .mockResolvedValueOnce({ id: 1, data: 'data1' })
        .mockResolvedValueOnce({ id: 2, data: 'data2' })
        .mockResolvedValueOnce({ id: 3, data: 'data3' });
      
      await cache.preload(['key1', 'key2', 'key3'], factory);
      
      expect(factory).toHaveBeenCalledTimes(3);
      expect(cache.get('key1')).toEqual({ id: 1, data: 'data1' });
      expect(cache.get('key2')).toEqual({ id: 2, data: 'data2' });
      expect(cache.get('key3')).toEqual({ id: 3, data: 'data3' });
    });

    it('ne devrait pas preload les clés déjà en cache', async () => {
      cache.set('key1', { existing: 'data' });
      
      const factory = jest.fn()
        .mockResolvedValueOnce({ id: 2, data: 'data2' });
      
      await cache.preload(['key1', 'key2'], factory);
      
      expect(factory).toHaveBeenCalledTimes(1); // Seulement pour key2
      expect(factory).toHaveBeenCalledWith('key2');
      expect(cache.get('key1')).toEqual({ existing: 'data' }); // Inchangé
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de factory dans getOrSet', async () => {
      const factory = jest.fn().mockRejectedValue(new Error('Factory error'));
      
      await expect(cache.getOrSet('test-key', factory)).rejects.toThrow('Factory error');
      
      // La clé ne devrait pas être mise en cache en cas d'erreur
      expect(cache.has('test-key')).toBe(false);
    });

    it('devrait gérer les erreurs de factory dans preload', async () => {
      const factory = jest.fn()
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Factory error'));
      
      // Ne devrait pas lever d'erreur globale
      await expect(cache.preload(['key1', 'key2'], factory)).resolves.toBeUndefined();
      
      // key1 devrait être en cache, key2 non
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });
  });
});

describe('Fonctions utilitaires de génération de clés', () => {
  describe('generateStatsKey', () => {
    it('devrait générer une clé cohérente pour les mêmes paramètres', () => {
      const params = { classId: 1, dateRange: ['2024-01-01', '2024-01-31'] };
      
      const key1 = generateStatsKey('config-123', params);
      const key2 = generateStatsKey('config-123', params);
      
      expect(key1).toBe(key2);
      expect(key1).toContain('stats:config-123:');
    });

    it('devrait générer des clés différentes pour des paramètres différents', () => {
      const params1 = { classId: 1, dateRange: ['2024-01-01', '2024-01-31'] };
      const params2 = { classId: 2, dateRange: ['2024-01-01', '2024-01-31'] };
      
      const key1 = generateStatsKey('config-123', params1);
      const key2 = generateStatsKey('config-123', params2);
      
      expect(key1).not.toBe(key2);
    });

    it('devrait être insensible à l\'ordre des paramètres', () => {
      const params1 = { a: 1, b: 2, c: 3 };
      const params2 = { c: 3, a: 1, b: 2 };
      
      const key1 = generateStatsKey('config-123', params1);
      const key2 = generateStatsKey('config-123', params2);
      
      expect(key1).toBe(key2);
    });
  });

  describe('generateChartKey', () => {
    it('devrait générer une clé pour les graphiques', () => {
      const options = { width: 800, height: 400, theme: 'light' };
      
      const key = generateChartKey('result-456', 'bar', options);
      
      expect(key).toContain('chart:result-456:bar:');
      expect(typeof key).toBe('string');
    });

    it('devrait générer des clés différentes pour des options différentes', () => {
      const options1 = { width: 800, height: 400 };
      const options2 = { width: 1200, height: 600 };
      
      const key1 = generateChartKey('result-456', 'bar', options1);
      const key2 = generateChartKey('result-456', 'bar', options2);
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('generateApiKey', () => {
    it('devrait générer une clé pour les appels API', () => {
      const params = { page: 1, limit: 20, filter: 'active' };
      
      const key = generateApiKey('/api/users', params);
      
      expect(key).toContain('api:/api/users:');
      expect(typeof key).toBe('string');
    });

    it('devrait gérer les paramètres vides', () => {
      const key = generateApiKey('/api/users', {});
      
      expect(key).toContain('api:/api/users:');
      expect(typeof key).toBe('string');
    });
  });
});

describe('Intégration et performance', () => {
  it('devrait gérer un grand nombre d\'opérations rapidement', () => {
    const cache = new PerformanceCache({
      maxSize: 10, // 10MB
      defaultTTL: 60000,
      evictionStrategy: 'lru',
      cleanupInterval: 5000,
      enableCompression: false
    });

    const startTime = performance.now();
    
    // Ajouter 1000 entrées
    for (let i = 0; i < 1000; i++) {
      cache.set(`key-${i}`, { id: i, data: `data-${i}` });
    }
    
    // Lire 1000 entrées
    for (let i = 0; i < 1000; i++) {
      cache.get(`key-${i}`);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(100); // Moins de 100ms
    
    const stats = cache.getStats();
    expect(stats.hits).toBe(1000);
    expect(stats.entryCount).toBe(1000);
    
    cache.destroy();
  });

  it('devrait maintenir de bonnes performances avec éviction', () => {
    const cache = new PerformanceCache({
      maxSize: 0.1, // 100KB seulement
      defaultTTL: 60000,
      evictionStrategy: 'lru',
      cleanupInterval: 5000,
      enableCompression: false
    });

    const startTime = performance.now();
    
    // Ajouter plus de données que la limite
    for (let i = 0; i < 200; i++) {
      const largeData = { id: i, data: 'x'.repeat(1000) }; // ~1KB chacun
      cache.set(`key-${i}`, largeData);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(500); // Moins de 500ms même avec éviction
    
    const stats = cache.getStats();
    expect(stats.evictions).toBeGreaterThan(0);
    expect(stats.entryCount).toBeLessThan(200); // Certaines entrées ont été évincées
    
    cache.destroy();
  });
});
