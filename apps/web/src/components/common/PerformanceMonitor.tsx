// ========================================
// PERFORMANCE MONITOR - MONITEUR DE PERFORMANCE
// ========================================

import React, { useState, useEffect, useRef } from 'react';
import { 
  ChartBarIcon, 
  ClockIcon, 
  CpuChipIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { performanceManager } from '../../utils/performance/debounce';
import { getCacheReport } from '../../utils/performance/cache';
import { cn } from '../../utils/classNames';

/**
 * Métriques de performance système
 */
interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  timing: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
  };
  network: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  fps: number;
  renderTime: number;
}

/**
 * Props du composant PerformanceMonitor
 */
interface PerformanceMonitorProps {
  /** Afficher le moniteur par défaut */
  visible?: boolean;
  /** Position du moniteur */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Mode compact */
  compact?: boolean;
  /** Intervalle de mise à jour en millisecondes */
  updateInterval?: number;
  /** Activer l'enregistrement des métriques */
  enableLogging?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Composant de monitoring des performances en temps réel
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  visible = false,
  position = 'bottom-right',
  compact = false,
  updateInterval = 1000,
  enableLogging = false,
  className
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [isVisible, setIsVisible] = useState(visible);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [history, setHistory] = useState<SystemMetrics[]>([]);

  const intervalRef = useRef<NodeJS.Timeout>();
  const fpsCounterRef = useRef({ frames: 0, lastTime: 0, fps: 0 });

  // ========================================
  // COLLECTE DES MÉTRIQUES
  // ========================================

  const collectSystemMetrics = (): SystemMetrics => {
    // Métriques mémoire
    const memory = (performance as any).memory || {};
    const memoryMetrics = {
      used: memory.usedJSHeapSize || 0,
      total: memory.totalJSHeapSize || 0,
      percentage: memory.totalJSHeapSize 
        ? (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100 
        : 0
    };

    // Métriques de timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const timingMetrics = {
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
      loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
      firstPaint: 0,
      firstContentfulPaint: 0
    };

    // First Paint et First Contentful Paint
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach(entry => {
      if (entry.name === 'first-paint') {
        timingMetrics.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        timingMetrics.firstContentfulPaint = entry.startTime;
      }
    });

    // Métriques réseau
    const connection = (navigator as any).connection || {};
    const networkMetrics = {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0
    };

    // FPS et temps de rendu
    const renderTime = performance.now();

    return {
      memory: memoryMetrics,
      timing: timingMetrics,
      network: networkMetrics,
      fps: fpsCounterRef.current.fps,
      renderTime
    };
  };

  const updateFPS = () => {
    const now = performance.now();
    fpsCounterRef.current.frames++;

    if (now >= fpsCounterRef.current.lastTime + 1000) {
      fpsCounterRef.current.fps = Math.round(
        (fpsCounterRef.current.frames * 1000) / (now - fpsCounterRef.current.lastTime)
      );
      fpsCounterRef.current.frames = 0;
      fpsCounterRef.current.lastTime = now;
    }

    requestAnimationFrame(updateFPS);
  };

  // ========================================
  // EFFETS
  // ========================================

  useEffect(() => {
    // Démarrer le compteur FPS
    updateFPS();

    // Démarrer la collecte de métriques
    const updateMetrics = () => {
      const newMetrics = collectSystemMetrics();
      setMetrics(newMetrics);

      // Historique (garder les 60 dernières mesures)
      setHistory(prev => {
        const newHistory = [...prev, newMetrics];
        return newHistory.slice(-60);
      });

      // Stats de performance
      setPerformanceStats(performanceManager.getStats());

      // Stats de cache
      setCacheStats(getCacheReport());

      // Logging si activé
      if (enableLogging) {
        console.log('Performance Metrics:', {
          system: newMetrics,
          performance: performanceManager.getStats(),
          cache: getCacheReport()
        });
      }
    };

    intervalRef.current = setInterval(updateMetrics, updateInterval);
    updateMetrics(); // Première mesure immédiate

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateInterval, enableLogging]);

  // ========================================
  // UTILITAIRES D'AFFICHAGE
  // ========================================

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceColor = (value: number, thresholds: [number, number]): string => {
    if (value <= thresholds[0]) return 'text-green-600';
    if (value <= thresholds[1]) return 'text-yellow-600';
    return 'text-red-600';
  };

  // ========================================
  // RENDU
  // ========================================

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={cn(
          'fixed z-50 p-2 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors',
          position === 'top-left' && 'top-4 left-4',
          position === 'top-right' && 'top-4 right-4',
          position === 'bottom-left' && 'bottom-4 left-4',
          position === 'bottom-right' && 'bottom-4 right-4',
          className
        )}
        title="Afficher le moniteur de performance"
      >
        <ChartBarIcon className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed z-50 bg-black bg-opacity-90 text-white rounded-lg shadow-xl border border-gray-700',
        position === 'top-left' && 'top-4 left-4',
        position === 'top-right' && 'top-4 right-4',
        position === 'bottom-left' && 'bottom-4 left-4',
        position === 'bottom-right' && 'bottom-4 right-4',
        isExpanded ? 'w-80' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center">
          <CpuChipIcon className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Performance</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title={isExpanded ? "Réduire" : "Développer"}
          >
            {isExpanded ? (
              <EyeSlashIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
          
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Fermer"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-3 space-y-3">
        {/* Métriques système compactes */}
        {metrics && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>FPS: {metrics.fps}</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              <span>Mem: {metrics.memory.percentage.toFixed(1)}%</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              <span>Net: {metrics.network.effectiveType}</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
              <span>RTT: {metrics.network.rtt}ms</span>
            </div>
          </div>
        )}

        {/* Détails étendus */}
        {isExpanded && metrics && (
          <div className="space-y-3 text-xs">
            {/* Mémoire */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-300">Mémoire JS</span>
                <span className={getPerformanceColor(metrics.memory.percentage, [70, 85])}>
                  {formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div
                  className={cn(
                    'h-1 rounded-full transition-all duration-300',
                    metrics.memory.percentage <= 70 ? 'bg-green-500' :
                    metrics.memory.percentage <= 85 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${Math.min(metrics.memory.percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Timing */}
            <div>
              <span className="text-gray-300 block mb-1">Timing</span>
              <div className="grid grid-cols-2 gap-1">
                <div>FCP: {formatTime(metrics.timing.firstContentfulPaint)}</div>
                <div>DOM: {formatTime(metrics.timing.domContentLoaded)}</div>
              </div>
            </div>

            {/* Cache Stats */}
            {cacheStats && (
              <div>
                <span className="text-gray-300 block mb-1">Cache</span>
                <div className="grid grid-cols-2 gap-1">
                  <div>Stats: {cacheStats.statistics.hitRate.toFixed(2)}</div>
                  <div>API: {cacheStats.api.hitRate.toFixed(2)}</div>
                </div>
              </div>
            )}

            {/* Performance Operations */}
            {performanceStats && Object.keys(performanceStats).length > 0 && (
              <div>
                <span className="text-gray-300 block mb-1">Opérations</span>
                <div className="max-h-20 overflow-y-auto">
                  {Object.entries(performanceStats).slice(0, 3).map(([name, stats]: [string, any]) => (
                    <div key={name} className="flex justify-between">
                      <span className="truncate mr-2">{name.split('.').pop()}</span>
                      <span className={getPerformanceColor(stats.averageTime, [100, 500])}>
                        {stats.averageTime.toFixed(1)}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mini graphique FPS */}
            {history.length > 10 && (
              <div>
                <span className="text-gray-300 block mb-1">FPS History</span>
                <div className="flex items-end h-8 space-x-px">
                  {history.slice(-20).map((metric, index) => (
                    <div
                      key={index}
                      className={cn(
                        'w-1 transition-all duration-300',
                        metric.fps >= 50 ? 'bg-green-500' :
                        metric.fps >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                      )}
                      style={{ height: `${(metric.fps / 60) * 100}%` }}
                      title={`${metric.fps} FPS`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions rapides */}
        {isExpanded && (
          <div className="flex justify-between pt-2 border-t border-gray-700">
            <button
              onClick={() => {
                performanceManager.reset();
                setHistory([]);
              }}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Reset Stats
            </button>
            
            <button
              onClick={() => {
                const report = {
                  system: metrics,
                  performance: performanceStats,
                  cache: cacheStats,
                  timestamp: new Date().toISOString()
                };
                console.log('Performance Report:', report);
                navigator.clipboard?.writeText(JSON.stringify(report, null, 2));
              }}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Copy Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Hook pour activer/désactiver le moniteur de performance
 */
export const usePerformanceMonitor = (enabled: boolean = false) => {
  const [isEnabled, setIsEnabled] = useState(enabled);

  useEffect(() => {
    if (isEnabled) {
      // Activer les mesures de performance
      if ('performance' in window && 'mark' in performance) {
        performance.mark('performance-monitor-start');
      }
    }

    return () => {
      if (isEnabled && 'performance' in window && 'mark' in performance) {
        performance.mark('performance-monitor-end');
        performance.measure(
          'performance-monitor-session',
          'performance-monitor-start',
          'performance-monitor-end'
        );
      }
    };
  }, [isEnabled]);

  return {
    isEnabled,
    enable: () => setIsEnabled(true),
    disable: () => setIsEnabled(false),
    toggle: () => setIsEnabled(prev => !prev)
  };
};

export default PerformanceMonitor;
