// ========================================
// PERFORMANCE UTILITIES - INDEX
// ========================================

// Cache système
export {
  PerformanceCache,
  statisticsCache,
  apiCache,
  chartCache,
  generateStatsKey,
  generateChartKey,
  generateApiKey,
  invalidateByPattern,
  getCacheReport
} from './cache';

// Debounce et throttle
export {
  debounce,
  throttle,
  useDebounce,
  useThrottle,
  createSearchDebounce,
  createScrollThrottle,
  createAutoSaveDebounce,
  createResizeThrottle,
  PerformanceManager,
  performanceManager,
  measurePerformance,
  useRenderPerformance,
  BatchProcessor
} from './debounce';

// Types et interfaces
export type {
  DebounceOptions,
  ThrottleOptions
} from './debounce';
