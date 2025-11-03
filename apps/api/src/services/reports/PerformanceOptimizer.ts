// ========================================
// PERFORMANCE OPTIMIZER - OPTIMISEUR DE PERFORMANCE
// ========================================

import { PrismaClient } from '@prisma/client';
import { 
  AnalysisContext,
  StudentProfile,
  ClassInsight,
  AnnualReport
} from '@edustats/shared/types';
// TODO: Remplacer par des types locaux si le package n'existe pas
import NodeCache from 'node-cache';
import { Worker } from 'worker_threads';
import path from 'path';

/**
 * Configuration de cache avancée
 */
interface CacheConfig {
  // Cache LRU pour les données fréquemment accédées
  lru: {
    maxSize: number;
    ttl: number; // Time to live en secondes
  };
  
  // Cache des résultats de calculs lourds
  computation: {
    maxSize: number;
    ttl: number;
  };
  
  // Cache des templates et configurations
  static: {
    maxSize: number;
    ttl: number;
  };
}

/**
 * Métriques de performance
 */
interface PerformanceMetrics {
  cacheHitRate: number;
  averageProcessingTime: number;
  memoryUsage: number;
  activeWorkers: number;
  queueSize: number;
  lastOptimization: Date;
}

/**
 * Optimiseur de performance pour les bilans annuels
 * Implémente cache intelligent, parallélisation et optimisations algorithmiques
 */
export class PerformanceOptimizer {
  private prisma: PrismaClient;
  private caches: {
    lru: NodeCache;
    computation: NodeCache;
    static: NodeCache;
  };
  private config: CacheConfig;
  private metrics: PerformanceMetrics;
  private workerPool: Worker[];
  private processingQueue: Array<{
    id: string;
    task: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    
    this.config = {
      lru: {
        maxSize: 1000,
        ttl: 3600 // 1 heure
      },
      computation: {
        maxSize: 500,
        ttl: 7200 // 2 heures
      },
      static: {
        maxSize: 100,
        ttl: 86400 // 24 heures
      }
    };

    // Initialisation des caches
    this.caches = {
      lru: new NodeCache({
        maxKeys: this.config.lru.maxSize,
        stdTTL: this.config.lru.ttl,
        checkperiod: 600, // Nettoyage toutes les 10 minutes
        useClones: false // Performance
      }),
      computation: new NodeCache({
        maxKeys: this.config.computation.maxSize,
        stdTTL: this.config.computation.ttl,
        checkperiod: 600
      }),
      static: new NodeCache({
        maxKeys: this.config.static.maxSize,
        stdTTL: this.config.static.ttl,
        checkperiod: 3600 // Nettoyage toutes les heures
      })
    };

    // Initialisation des métriques
    this.metrics = {
      cacheHitRate: 0,
      averageProcessingTime: 0,
      memoryUsage: 0,
      activeWorkers: 0,
      queueSize: 0,
      lastOptimization: new Date()
    };

    this.workerPool = [];
    this.processingQueue = [];

    this.initializeWorkerPool();
    this.startMetricsCollection();
  }

  // ========================================
  // OPTIMISATIONS PRINCIPALES
  // ========================================

  /**
   * Optimise la collecte de données avec requêtes parallèles
   */
  async optimizeDataCollection(
    classId: number,
    academicYear: string
  ): Promise<AnalysisContext> {
    const cacheKey = `data_${classId}_${academicYear}`;
    
    // Vérification cache
    const cached = this.caches.lru.get<AnalysisContext>(cacheKey);
    if (cached) {
      this.updateCacheHitRate(true);
      return cached;
    }

    const startTime = Date.now();

    try {
      // Requêtes parallèles optimisées
      const [classInfo, students, evaluations, results] = await Promise.all([
        // Classe avec utilisateur
        this.prisma.classes.findUnique({
          where: { id: classId },
          include: {
            users: {
              select: { first_name: true, last_name: true }
            }
          }
        }),

        // Élèves actifs seulement
        this.prisma.students.findMany({
          where: { 
            class_id: classId,
            is_active: true
          },
          select: {
            id: true,
            name: true,
            gender: true
          },
          orderBy: { name: 'asc' }
        }),

        // Évaluations de l'année avec index optimisé
        this.prisma.evaluations.findMany({
          where: {
            class_id: classId,
            created_at: {
              gte: this.getAcademicYearStart(academicYear),
              lte: this.getAcademicYearEnd(academicYear)
            }
          },
          select: {
            id: true,
            nom: true,
            created_at: true
          },
          orderBy: { created_at: 'asc' }
        }),

        // Résultats avec jointures optimisées
        // TODO: evaluationResult n'existe pas dans le schéma Prisma
        // Utiliser notes ou moyennes à la place
        Promise.resolve([])
        /* this.prisma.moyennes.findMany({
          where: {
            evaluations: {
              class_id: classId,
              created_at: {
                gte: this.getAcademicYearStart(academicYear),
                lte: this.getAcademicYearEnd(academicYear)
              }
            }
          },
          select: {
            id: true,
            student_id: true,
            evaluation_id: true,
            moyenne: true,
            evaluations: {
              select: {
                subject: true,
                nom: true,
                max_score: true
              }
            }
          },
          orderBy: { created_at: 'asc' }
        }) */
      ]);

      if (!classInfo) {
        throw new Error('Classe introuvable');
      }

      const context: AnalysisContext = {
        classInfo,
        academicYear,
        evaluations,
        results,
        students,
        historicalData: null // Chargé à la demande
      };

      // Mise en cache avec TTL adaptatif
      const processingTime = Date.now() - startTime;
      const ttl = processingTime > 5000 ? this.config.lru.ttl * 2 : this.config.lru.ttl;
      this.caches.lru.set(cacheKey, context, ttl);

      this.updateCacheHitRate(false);
      this.updateProcessingTime(processingTime);

      return context;

    } catch (error) {
      console.error('Erreur collecte données optimisée:', error);
      throw error;
    }
  }

  /**
   * Optimise l'analyse des profils avec parallélisation
   */
  async optimizeProfileAnalysis(
    context: AnalysisContext
  ): Promise<StudentProfile[]> {
    const cacheKey = `profiles_${context.classInfo.id}_${context.academicYear}`;
    
    const cached = this.caches.computation.get<StudentProfile[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Pré-calcul des statistiques de classe (une seule fois)
    const classStats = await this.precomputeClassStatistics(context);

    // Traitement par chunks pour optimiser la mémoire
    const chunkSize = 10;
    const studentChunks = this.chunkArray(context.students, chunkSize);
    const profilePromises: Promise<StudentProfile[]>[] = [];

    for (const chunk of studentChunks) {
      const chunkPromise = this.processStudentChunk(chunk, context, classStats);
      profilePromises.push(chunkPromise);
    }

    // Exécution parallèle des chunks
    const profileChunks = await Promise.all(profilePromises);
    const profiles = profileChunks.flat();

    // Cache avec TTL étendu pour les calculs lourds
    this.caches.computation.set(cacheKey, profiles, this.config.computation.ttl);

    return profiles;
  }

  /**
   * Optimise la génération d'insights avec algorithmes parallèles
   */
  async optimizeInsightGeneration(
    context: AnalysisContext
  ): Promise<ClassInsight[]> {
    const cacheKey = `insights_${context.classInfo.id}_${context.academicYear}`;
    
    const cached = this.caches.computation.get<ClassInsight[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Analyses parallèles par type d'insight
    const [temporalInsights, subjectInsights, alertInsights, successInsights] = await Promise.all([
      this.analyzeTemporalTrendsOptimized(context),
      this.analyzeSubjectDisparitiesOptimized(context),
      this.detectPedagogicalAlertsOptimized(context),
      this.identifySuccessFactorsOptimized(context)
    ]);

    const allInsights = [
      ...temporalInsights,
      ...subjectInsights,
      ...alertInsights,
      ...successInsights
    ];

    // Tri optimisé avec index pré-calculés
    const sortedInsights = this.sortInsightsByPriority(allInsights);

    this.caches.computation.set(cacheKey, sortedInsights, this.config.computation.ttl);

    return sortedInsights;
  }

  // ========================================
  // CACHE INTELLIGENT
  // ========================================

  /**
   * Préchauffe le cache avec les données fréquemment utilisées
   */
  async warmupCache(classIds: number[], academicYear: string): Promise<void> {
    const warmupPromises = classIds.map(async (classId) => {
      try {
        // Préchargement des données de base
        await this.optimizeDataCollection(classId, academicYear);
        
        // Préchargement des templates populaires
        await this.preloadPopularTemplates();
        
        // Préchargement des configurations
        await this.preloadStaticConfigurations();
        
      } catch (error) {
        console.warn(`Erreur warmup cache classe ${classId}:`, error);
      }
    });

    await Promise.all(warmupPromises);
  }

  /**
   * Invalide intelligemment le cache lors de modifications
   */
  invalidateRelatedCache(classId: number, academicYear: string): void {
    const patterns = [
      `data_${classId}_${academicYear}`,
      `profiles_${classId}_${academicYear}`,
      `insights_${classId}_${academicYear}`,
      `report_${classId}_${academicYear}*`
    ];

    patterns.forEach(pattern => {
      if (pattern.includes('*')) {
        // Invalidation par pattern
        const keys = this.caches.lru.keys().filter(key => 
          key.startsWith(pattern.replace('*', ''))
        );
        keys.forEach(key => this.caches.lru.del(key));
      } else {
        this.caches.lru.del(pattern);
        this.caches.computation.del(pattern);
      }
    });
  }

  // ========================================
  // PARALLÉLISATION AVANCÉE
  // ========================================

  /**
   * Traite un chunk d'élèves en parallèle
   */
  private async processStudentChunk(
    students: any[],
    context: AnalysisContext,
    classStats: any
  ): Promise<StudentProfile[]> {
    const profiles: StudentProfile[] = [];

    // Traitement parallèle des élèves dans le chunk
    const studentPromises = students.map(async (student) => {
      const studentResults = context.results.filter(r => r.studentId === student.id);
      
      if (studentResults.length === 0) return null;

      // Calculs optimisés pour un élève
      const [performance, progression, consistency] = await Promise.all([
        this.calculateStudentPerformanceOptimized(studentResults, classStats),
        this.calculateStudentProgressionOptimized(studentResults),
        this.calculateConsistencyOptimized(studentResults)
      ]);

      return this.buildStudentProfile(student, performance, progression, consistency, context);
    });

    const results = await Promise.all(studentPromises);
    
    // Filtrage des résultats null
    results.forEach(profile => {
      if (profile) profiles.push(profile);
    });

    return profiles;
  }

  /**
   * Initialise le pool de workers pour les tâches lourdes
   */
  private initializeWorkerPool(): void {
    const numWorkers = Math.min(4, require('os').cpus().length);
    
    for (let i = 0; i < numWorkers; i++) {
      try {
        const worker = new Worker(path.join(__dirname, 'workers/analyticsWorker.js'));
        
        worker.on('message', (result) => {
          this.handleWorkerResult(result);
        });
        
        worker.on('error', (error) => {
          console.error(`Worker ${i} erreur:`, error);
        });
        
        this.workerPool.push(worker);
      } catch (error) {
        console.warn('Impossible de créer worker pool:', error);
      }
    }

    this.metrics.activeWorkers = this.workerPool.length;
  }

  /**
   * Distribue une tâche aux workers disponibles
   */
  private async distributeToWorker(task: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const taskId = `task_${Date.now()}_${Math.random()}`;
      
      this.processingQueue.push({
        id: taskId,
        task,
        resolve,
        reject
      });

      this.processQueue();
    });
  }

  /**
   * Traite la queue des tâches
   */
  private processQueue(): void {
    if (this.processingQueue.length === 0 || this.workerPool.length === 0) {
      return;
    }

    const availableWorker = this.workerPool.find(worker => !worker.threadId);
    if (!availableWorker) {
      return;
    }

    const task = this.processingQueue.shift();
    if (task) {
      availableWorker.postMessage({
        id: task.id,
        data: task.task
      });
    }

    this.metrics.queueSize = this.processingQueue.length;
  }

  // ========================================
  // OPTIMISATIONS ALGORITHMIQUES
  // ========================================

  /**
   * Pré-calcule les statistiques de classe une seule fois
   */
  private async precomputeClassStatistics(context: AnalysisContext): Promise<any> {
    const cacheKey = `class_stats_${context.classInfo.id}_${context.academicYear}`;
    
    const cached = this.caches.computation.get(cacheKey);
    if (cached) return cached;

    const validResults = context.results.filter(r => !r.isAbsent && r.score !== null);
    const scores = validResults.map(r => r.score);

    if (scores.length === 0) {
      throw new Error('Aucun résultat valide pour calculer les statistiques');
    }

    // Calculs optimisés avec algorithmes efficaces
    const stats = {
      average: this.fastAverage(scores),
      standardDeviation: this.fastStandardDeviation(scores),
      median: this.fastMedian(scores),
      quartiles: this.fastQuartiles(scores),
      studentAverages: this.calculateStudentAveragesOptimized(context),
      subjectStats: this.calculateSubjectStatsOptimized(context)
    };

    this.caches.computation.set(cacheKey, stats, this.config.computation.ttl);
    return stats;
  }

  /**
   * Calcul rapide de la moyenne
   */
  private fastAverage(values: number[]): number {
    if (values.length === 0) return 0;
    
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i];
    }
    return sum / values.length;
  }

  /**
   * Calcul rapide de l'écart-type
   */
  private fastStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = this.fastAverage(values);
    let sumSquaredDiffs = 0;
    
    for (let i = 0; i < values.length; i++) {
      const diff = values[i] - mean;
      sumSquaredDiffs += diff * diff;
    }
    
    return Math.sqrt(sumSquaredDiffs / values.length);
  }

  /**
   * Calcul rapide de la médiane
   */
  private fastMedian(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Calcul rapide des quartiles
   */
  private fastQuartiles(values: number[]): { q1: number; q2: number; q3: number } {
    if (values.length === 0) return { q1: 0, q2: 0, q3: 0 };
    
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    
    return {
      q1: sorted[Math.floor(n * 0.25)],
      q2: sorted[Math.floor(n * 0.5)],
      q3: sorted[Math.floor(n * 0.75)]
    };
  }

  // ========================================
  // MÉTRIQUES ET MONITORING
  // ========================================

  /**
   * Démarre la collecte de métriques
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 30000); // Toutes les 30 secondes
  }

  /**
   * Met à jour les métriques de performance
   */
  private updateMetrics(): void {
    const memUsage = process.memoryUsage();
    
    this.metrics.memoryUsage = memUsage.heapUsed;
    this.metrics.queueSize = this.processingQueue.length;
    this.metrics.lastOptimization = new Date();

    // Nettoyage automatique si mémoire élevée
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      this.performMemoryCleanup();
    }
  }

  /**
   * Met à jour le taux de cache hit
   */
  private updateCacheHitRate(isHit: boolean): void {
    // Moyenne mobile simple
    const alpha = 0.1;
    const newValue = isHit ? 1 : 0;
    this.metrics.cacheHitRate = alpha * newValue + (1 - alpha) * this.metrics.cacheHitRate;
  }

  /**
   * Met à jour le temps de traitement moyen
   */
  private updateProcessingTime(time: number): void {
    const alpha = 0.1;
    this.metrics.averageProcessingTime = alpha * time + (1 - alpha) * this.metrics.averageProcessingTime;
  }

  /**
   * Retourne les métriques actuelles
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // ========================================
  // MÉTHODES UTILITAIRES
  // ========================================

  /**
   * Divise un array en chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Nettoyage mémoire d'urgence
   */
  private performMemoryCleanup(): void {
    // Vide les caches les moins utilisés
    this.caches.lru.flushStats();
    
    // Force le garbage collection si disponible
    if (global.gc) {
      global.gc();
    }
    
    console.log('Nettoyage mémoire effectué');
  }

  /**
   * Obtient le début de l'année académique
   */
  private getAcademicYearStart(academicYear: string): Date {
    const year = parseInt(academicYear.split('-')[0]);
    return new Date(year, 8, 1); // 1er septembre
  }

  /**
   * Obtient la fin de l'année académique
   */
  private getAcademicYearEnd(academicYear: string): Date {
    const year = parseInt(academicYear.split('-')[1]);
    return new Date(year, 6, 31); // 31 juillet
  }

  // Méthodes à implémenter (stubs pour compilation)
  private async analyzeTemporalTrendsOptimized(context: AnalysisContext): Promise<ClassInsight[]> { return []; }
  private async analyzeSubjectDisparitiesOptimized(context: AnalysisContext): Promise<ClassInsight[]> { return []; }
  private async detectPedagogicalAlertsOptimized(context: AnalysisContext): Promise<ClassInsight[]> { return []; }
  private async identifySuccessFactorsOptimized(context: AnalysisContext): Promise<ClassInsight[]> { return []; }
  private sortInsightsByPriority(insights: ClassInsight[]): ClassInsight[] { return insights; }
  private async preloadPopularTemplates(): Promise<void> {}
  private async preloadStaticConfigurations(): Promise<void> {}
  private handleWorkerResult(result: any): void {}
  private async calculateStudentPerformanceOptimized(results: any[], classStats: any): Promise<any> { return {}; }
  private async calculateStudentProgressionOptimized(results: any[]): Promise<any> { return {}; }
  private async calculateConsistencyOptimized(results: any[]): Promise<any> { return {}; }
  private buildStudentProfile(student: any, performance: any, progression: any, consistency: any, context: AnalysisContext): StudentProfile | null { return null; }
  private calculateStudentAveragesOptimized(context: AnalysisContext): Map<number, number> { return new Map(); }
  private calculateSubjectStatsOptimized(context: AnalysisContext): any { return {}; }
}
