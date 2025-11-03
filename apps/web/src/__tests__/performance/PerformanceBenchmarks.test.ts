// ========================================
// PERFORMANCE BENCHMARKS - TESTS DE PERFORMANCE
// ========================================

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PerformanceCache } from '../../utils/performance/cache';
import { debounce, throttle, BatchProcessor } from '../../utils/performance/debounce';
import { VirtualizedList } from '../../components/common/VirtualizedList';
import { render } from '@testing-library/react';
import React from 'react';

// Configuration des seuils de performance
const PERFORMANCE_THRESHOLDS = {
  CACHE_OPERATION: 10, // ms
  DEBOUNCE_OVERHEAD: 5, // ms
  VIRTUALIZATION_RENDER: 100, // ms
  LARGE_DATASET_PROCESSING: 500, // ms
  BATCH_PROCESSING: 200, // ms
};

describe('Performance Benchmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cache Performance', () => {
    it('devrait effectuer des opérations de cache rapidement', () => {
      const cache = new PerformanceCache({
        maxSize: 10,
        defaultTTL: 60000,
        evictionStrategy: 'lru',
        cleanupInterval: 5000,
        enableCompression: false
      });

      const testData = { id: 1, data: 'test data' };
      
      // Test d'écriture
      const writeStart = performance.now();
      for (let i = 0; i < 1000; i++) {
        cache.set(`key-${i}`, { ...testData, id: i });
      }
      const writeEnd = performance.now();
      const writeTime = writeEnd - writeStart;
      
      expect(writeTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CACHE_OPERATION * 100);
      
      // Test de lecture
      const readStart = performance.now();
      for (let i = 0; i < 1000; i++) {
        cache.get(`key-${i}`);
      }
      const readEnd = performance.now();
      const readTime = readEnd - readStart;
      
      expect(readTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CACHE_OPERATION * 50);
      
      // Vérifier les statistiques
      const stats = cache.getStats();
      expect(stats.hits).toBe(1000);
      expect(stats.hitRate).toBe(1);
      
      cache.destroy();
    });

    it('devrait gérer efficacement l\'éviction avec de gros volumes', () => {
      const cache = new PerformanceCache({
        maxSize: 1, // 1MB seulement
        defaultTTL: 60000,
        evictionStrategy: 'lru',
        cleanupInterval: 5000,
        enableCompression: false
      });

      const largeData = { data: 'x'.repeat(1000) }; // ~1KB
      
      const start = performance.now();
      
      // Ajouter plus de données que la limite
      for (let i = 0; i < 2000; i++) {
        cache.set(`key-${i}`, { ...largeData, id: i });
      }
      
      const end = performance.now();
      const totalTime = end - start;
      
      // Même avec éviction, devrait rester rapide
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_DATASET_PROCESSING);
      
      const stats = cache.getStats();
      expect(stats.evictions).toBeGreaterThan(0);
      expect(stats.entryCount).toBeLessThan(2000);
      
      cache.destroy();
    });

    it('devrait optimiser les opérations getOrSet', async () => {
      const cache = new PerformanceCache({
        maxSize: 10,
        defaultTTL: 60000,
        evictionStrategy: 'lru',
        cleanupInterval: 5000,
        enableCompression: false
      });

      const expensiveOperation = jest.fn().mockImplementation(async (key: string) => {
        // Simuler une opération coûteuse
        await new Promise(resolve => setTimeout(resolve, 10));
        return { computed: `value-${key}` };
      });

      const start = performance.now();
      
      // Première série d'appels - devrait appeler la fonction
      const promises1 = Array.from({ length: 100 }, (_, i) => 
        cache.getOrSet(`key-${i}`, () => expensiveOperation(`key-${i}`))
      );
      await Promise.all(promises1);
      
      // Deuxième série d'appels - devrait utiliser le cache
      const promises2 = Array.from({ length: 100 }, (_, i) => 
        cache.getOrSet(`key-${i}`, () => expensiveOperation(`key-${i}`))
      );
      await Promise.all(promises2);
      
      const end = performance.now();
      const totalTime = end - start;
      
      // La deuxième série devrait être beaucoup plus rapide
      expect(expensiveOperation).toHaveBeenCalledTimes(100); // Seulement la première série
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_DATASET_PROCESSING * 3);
      
      cache.destroy();
    });
  });

  describe('Debounce/Throttle Performance', () => {
    it('devrait avoir un overhead minimal pour debounce', async () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, { delay: 100 });
      
      const start = performance.now();
      
      // Appeler la fonction debounced 1000 fois rapidement
      for (let i = 0; i < 1000; i++) {
        debouncedFn(i);
      }
      
      const end = performance.now();
      const overhead = end - start;
      
      expect(overhead).toBeLessThan(PERFORMANCE_THRESHOLDS.DEBOUNCE_OVERHEAD * 100);
      
      // Attendre que le debounce se déclenche
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Devrait n'avoir été appelé qu'une fois
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith(999); // Dernier appel
    });

    it('devrait optimiser throttle pour les événements fréquents', async () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, { delay: 50, leading: true, trailing: true });
      
      const start = performance.now();
      
      // Simuler des événements très fréquents
      const interval = setInterval(() => {
        throttledFn(Date.now());
      }, 1);
      
      // Laisser tourner pendant 200ms
      await new Promise(resolve => setTimeout(resolve, 200));
      clearInterval(interval);
      
      const end = performance.now();
      const totalTime = end - start;
      
      expect(totalTime).toBeLessThan(250); // Proche de 200ms + overhead
      
      // Devrait avoir limité les appels
      expect(mockFn.mock.calls.length).toBeLessThan(10); // Beaucoup moins que ~200 appels
      expect(mockFn.mock.calls.length).toBeGreaterThan(2); // Mais plus d'un
    });
  });

  describe('Batch Processing Performance', () => {
    it('devrait traiter efficacement les lots', async () => {
      const batchProcessor = jest.fn().mockImplementation(async (items: number[]) => {
        // Simuler un traitement par lot
        await new Promise(resolve => setTimeout(resolve, 10));
        return items.map(item => item * 2);
      });

      const processor = new BatchProcessor(batchProcessor, 50, 100);
      
      const start = performance.now();
      
      // Ajouter 1000 éléments
      const promises = Array.from({ length: 1000 }, (_, i) => 
        processor.add(i)
      );
      
      const results = await Promise.all(promises);
      
      const end = performance.now();
      const totalTime = end - start;
      
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_PROCESSING * 2);
      
      // Vérifier les résultats
      expect(results).toHaveLength(1000);
      expect(results[0]).toBe(0);
      expect(results[999]).toBe(1998);
      
      // Devrait avoir traité en lots (1000 / 50 = 20 lots)
      expect(batchProcessor).toHaveBeenCalledTimes(20);
    });

    it('devrait optimiser le flush des lots restants', async () => {
      const batchProcessor = jest.fn().mockImplementation(async (items: number[]) => {
        return items.map(item => item * 2);
      });

      const processor = new BatchProcessor(batchProcessor, 100, 1000); // Délai long
      
      const start = performance.now();
      
      // Ajouter seulement 50 éléments (moins que la taille du lot)
      const promises = Array.from({ length: 50 }, (_, i) => 
        processor.add(i)
      );
      
      // Forcer le flush
      await processor.flush();
      const results = await Promise.all(promises);
      
      const end = performance.now();
      const totalTime = end - start;
      
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_PROCESSING);
      expect(results).toHaveLength(50);
      expect(batchProcessor).toHaveBeenCalledTimes(1);
    });
  });

  describe('Virtualization Performance', () => {
    interface TestItem {
      id: number;
      data: string;
    }

    const createLargeDataset = (size: number): TestItem[] => {
      return Array.from({ length: size }, (_, index) => ({
        id: index,
        data: `Item ${index} - ${'x'.repeat(100)}` // Données plus volumineuses
      }));
    };

    it('devrait rendre efficacement de grandes listes', () => {
      const largeDataset = createLargeDataset(10000);
      
      const renderItem = jest.fn((item: TestItem, index: number, style: React.CSSProperties) => (
        <div key={item.id} style={style}>
          {item.data}
        </div>
      ));

      const start = performance.now();
      
      const { container } = render(
        <VirtualizedList
          items={largeDataset}
          itemHeight={50}
          height={400}
          renderItem={renderItem}
          overscan={5}
        />
      );
      
      const end = performance.now();
      const renderTime = end - start;
      
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.VIRTUALIZATION_RENDER);
      
      // Devrait n'avoir rendu qu'une partie des éléments
      const visibleItems = Math.ceil(400 / 50) + 5 * 2; // hauteur / itemHeight + overscan
      expect(renderItem).toHaveBeenCalledTimes(visibleItems);
      
      // Vérifier que le conteneur est rendu
      expect(container.firstChild).toBeInTheDocument();
    });

    it('devrait maintenir les performances lors du scroll', () => {
      const largeDataset = createLargeDataset(5000);
      
      const renderItem = jest.fn((item: TestItem, index: number, style: React.CSSProperties) => (
        <div key={item.id} style={style}>
          {item.data}
        </div>
      ));

      const onScroll = jest.fn();

      const { container } = render(
        <VirtualizedList
          items={largeDataset}
          itemHeight={50}
          height={400}
          renderItem={renderItem}
          onScroll={onScroll}
          overscan={3}
        />
      );

      const scrollContainer = container.firstChild as HTMLElement;
      
      const start = performance.now();
      
      // Simuler plusieurs événements de scroll
      for (let i = 0; i < 100; i++) {
        const scrollEvent = new Event('scroll');
        Object.defineProperty(scrollEvent, 'target', {
          value: {
            scrollTop: i * 10,
            scrollLeft: 0
          }
        });
        scrollContainer.dispatchEvent(scrollEvent);
      }
      
      const end = performance.now();
      const scrollTime = end - start;
      
      expect(scrollTime).toBeLessThan(PERFORMANCE_THRESHOLDS.VIRTUALIZATION_RENDER);
      expect(onScroll).toHaveBeenCalledTimes(100);
    });
  });

  describe('Large Dataset Processing', () => {
    it('devrait traiter efficacement de gros volumes de données statistiques', () => {
      // Simuler le traitement de 10,000 résultats d'évaluation
      const largeDataset = Array.from({ length: 10000 }, (_, index) => ({
        id: index + 1,
        studentId: (index % 500) + 1, // 500 étudiants
        score: Math.floor(Math.random() * 20) + 1,
        isAbsent: Math.random() < 0.05, // 5% d'absents
        evaluationId: Math.floor(index / 500) + 1, // 20 évaluations
        createdAt: new Date(2024, 0, 1 + Math.floor(index / 500))
      }));

      const start = performance.now();
      
      // Filtrage
      const validResults = largeDataset.filter(result => !result.isAbsent && result.score !== null);
      
      // Calculs statistiques
      const scores = validResults.map(result => result.score);
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      const sortedScores = [...scores].sort((a, b) => a - b);
      const median = sortedScores.length % 2 === 0
        ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
        : sortedScores[Math.floor(sortedScores.length / 2)];
      
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
      const standardDeviation = Math.sqrt(variance);
      
      // Regroupement par étudiant
      const studentGroups = validResults.reduce((groups, result) => {
        const key = result.studentId.toString();
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(result);
        return groups;
      }, {} as Record<string, typeof validResults>);
      
      // Calcul des moyennes par étudiant
      const studentAverages = Object.entries(studentGroups).map(([studentId, results]) => ({
        studentId: parseInt(studentId),
        average: results.reduce((sum, result) => sum + result.score, 0) / results.length,
        count: results.length
      }));
      
      const end = performance.now();
      const processingTime = end - start;
      
      expect(processingTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_DATASET_PROCESSING);
      
      // Vérifier les résultats
      expect(validResults.length).toBeGreaterThan(9000); // ~95% de présents
      expect(average).toBeGreaterThan(0);
      expect(median).toBeGreaterThan(0);
      expect(standardDeviation).toBeGreaterThan(0);
      expect(studentAverages).toHaveLength(500);
      
      console.log(`Processed ${largeDataset.length} records in ${processingTime.toFixed(2)}ms`);
      console.log(`Average: ${average.toFixed(2)}, Median: ${median.toFixed(2)}, StdDev: ${standardDeviation.toFixed(2)}`);
    });

    it('devrait optimiser les calculs de percentiles sur de gros datasets', () => {
      const largeScoreArray = Array.from({ length: 50000 }, () => Math.floor(Math.random() * 20) + 1);
      
      const calculatePercentile = (values: number[], percentile: number): number => {
        const sorted = [...values].sort((a, b) => a - b);
        const index = (percentile / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;
        
        if (upper >= sorted.length) return sorted[sorted.length - 1];
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
      };

      const start = performance.now();
      
      const p25 = calculatePercentile(largeScoreArray, 25);
      const p50 = calculatePercentile(largeScoreArray, 50);
      const p75 = calculatePercentile(largeScoreArray, 75);
      const p90 = calculatePercentile(largeScoreArray, 90);
      
      const end = performance.now();
      const calculationTime = end - start;
      
      expect(calculationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_DATASET_PROCESSING);
      
      // Vérifier la cohérence des percentiles
      expect(p25).toBeLessThanOrEqual(p50);
      expect(p50).toBeLessThanOrEqual(p75);
      expect(p75).toBeLessThanOrEqual(p90);
      
      console.log(`Calculated percentiles for ${largeScoreArray.length} values in ${calculationTime.toFixed(2)}ms`);
      console.log(`P25: ${p25}, P50: ${p50}, P75: ${p75}, P90: ${p90}`);
    });
  });

  describe('Memory Usage Optimization', () => {
    it('devrait gérer efficacement la mémoire avec de gros caches', () => {
      const cache = new PerformanceCache({
        maxSize: 50, // 50MB
        defaultTTL: 60000,
        evictionStrategy: 'lru',
        cleanupInterval: 5000,
        enableCompression: false
      });

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Ajouter beaucoup de données
      for (let i = 0; i < 10000; i++) {
        const largeObject = {
          id: i,
          data: Array.from({ length: 1000 }, (_, j) => `item-${i}-${j}`),
          metadata: {
            created: new Date(),
            tags: Array.from({ length: 10 }, (_, k) => `tag-${k}`)
          }
        };
        cache.set(`large-key-${i}`, largeObject);
      }
      
      const afterAddMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = afterAddMemory - initialMemory;
      
      // Nettoyer le cache
      cache.clear();
      
      const afterClearMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryAfterClear = afterClearMemory - initialMemory;
      
      // La mémoire devrait être libérée après le nettoyage
      expect(memoryAfterClear).toBeLessThan(memoryIncrease * 0.5);
      
      const stats = cache.getStats();
      expect(stats.entryCount).toBe(0);
      expect(stats.currentSize).toBe(0);
      
      cache.destroy();
      
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Memory after clear: ${(memoryAfterClear / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('devrait gérer efficacement les opérations concurrentes', async () => {
      const cache = new PerformanceCache({
        maxSize: 10,
        defaultTTL: 60000,
        evictionStrategy: 'lru',
        cleanupInterval: 5000,
        enableCompression: false
      });

      const expensiveOperation = async (key: string) => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        return { computed: `value-${key}`, timestamp: Date.now() };
      };

      const start = performance.now();
      
      // Lancer 100 opérations concurrentes
      const promises = Array.from({ length: 100 }, (_, i) => 
        cache.getOrSet(`concurrent-key-${i % 10}`, () => expensiveOperation(`concurrent-key-${i % 10}`))
      );
      
      const results = await Promise.all(promises);
      
      const end = performance.now();
      const totalTime = end - start;
      
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.LARGE_DATASET_PROCESSING * 2);
      expect(results).toHaveLength(100);
      
      // Vérifier que les opérations dupliquées ont été déduplicées
      const uniqueTimestamps = new Set(results.map(r => r.timestamp));
      expect(uniqueTimestamps.size).toBeLessThanOrEqual(10); // Maximum 10 clés uniques
      
      cache.destroy();
      
      console.log(`Completed 100 concurrent operations in ${totalTime.toFixed(2)}ms`);
      console.log(`Unique operations: ${uniqueTimestamps.size}`);
    });
  });
});
