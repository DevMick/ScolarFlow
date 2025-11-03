// ========================================
// TESTS INTÉGRATION BILANS ANNUELS - PHASE 7
// ========================================

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { 
  AnnualReportService,
  AnalyticsEngine,
  RecommendationEngine,
  ExportService,
  ArchiveService,
  PerformanceOptimizer
} from '../../services/reports';
import { StatisticsEngine } from '../../services/statistics/StatisticsEngine';
import { EvaluationService } from '../../services/EvaluationService';
import { 
  AnnualReport,
  ReportGenerationOptions,
  ReportExportOptions,
  StudentProfileType,
  InsightType,
  Priority
} from '@edustats/shared/types';

/**
 * Données de test pour une année scolaire complète
 */
interface TestDataSet {
  user: any;
  class: any;
  students: any[];
  evaluations: any[];
  results: any[];
}

describe('Bilans Annuels - Tests d\'Intégration Complets', () => {
  let prisma: PrismaClient;
  let annualReportService: AnnualReportService;
  let analyticsEngine: AnalyticsEngine;
  let recommendationEngine: RecommendationEngine;
  let exportService: ExportService;
  let archiveService: ArchiveService;
  let performanceOptimizer: PerformanceOptimizer;
  let statisticsEngine: StatisticsEngine;
  let evaluationService: EvaluationService;
  let testData: TestDataSet;

  // ========================================
  // CONFIGURATION DES TESTS
  // ========================================

  beforeAll(async () => {
    // Initialisation de la base de données de test
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
        }
      }
    });

    // Initialisation des services
    statisticsEngine = new StatisticsEngine(prisma);
    evaluationService = new EvaluationService(prisma);
    
    annualReportService = new AnnualReportService(
      prisma,
      statisticsEngine,
      evaluationService
    );
    
    analyticsEngine = new AnalyticsEngine();
    recommendationEngine = new RecommendationEngine();
    exportService = new ExportService();
    archiveService = new ArchiveService(prisma);
    performanceOptimizer = new PerformanceOptimizer(prisma);

    // Création des données de test
    await createTestData();
  });

  afterAll(async () => {
    // Nettoyage des données de test
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset des caches entre les tests
    jest.clearAllMocks();
  });

  // ========================================
  // TESTS ANALYTICS ENGINE
  // ========================================

  describe('AnalyticsEngine - Classification d\'Élèves', () => {
    test('devrait classifier correctement les profils d\'élèves', async () => {
      const context = await createAnalysisContext();
      const result = await analyticsEngine.analyzeClass(context);

      expect(result.profiles).toBeDefined();
      expect(result.profiles.length).toBe(testData.students.length);

      // Vérification des types de profils
      const profileTypes = result.profiles.map(p => p.type);
      expect(profileTypes).toContain(StudentProfileType.HighAchiever);
      expect(profileTypes).toContain(StudentProfileType.ConsistentPerformer);
      expect(profileTypes).toContain(StudentProfileType.ImprovingStudent);

      // Vérification de la confiance
      result.profiles.forEach(profile => {
        expect(profile.confidence).toBeGreaterThan(0);
        expect(profile.confidence).toBeLessThanOrEqual(1);
        expect(profile.characteristics.length).toBeGreaterThan(0);
      });
    });

    test('devrait détecter des insights pédagogiques pertinents', async () => {
      const context = await createAnalysisContext();
      const result = await analyticsEngine.analyzeClass(context);

      expect(result.insights).toBeDefined();
      expect(result.insights.length).toBeGreaterThan(0);

      // Vérification des types d'insights
      const insightTypes = result.insights.map(i => i.type);
      expect(insightTypes).toContain(InsightType.ClassTrend);
      expect(insightTypes).toContain(InsightType.PedagogicalAlert);

      // Vérification de la priorité
      const highPriorityInsights = result.insights.filter(i => i.priority === Priority.High);
      expect(highPriorityInsights.length).toBeGreaterThanOrEqual(0);
    });

    test('devrait calculer des métriques de performance correctes', async () => {
      const context = await createAnalysisContext();
      const result = await analyticsEngine.analyzeClass(context);

      expect(result.processingMetrics).toBeDefined();
      expect(result.processingMetrics.processingTime).toBeGreaterThan(0);
      expect(result.processingMetrics.dataQuality).toBeGreaterThan(0);
      expect(result.processingMetrics.confidenceScore).toBeGreaterThan(0);
      expect(result.processingMetrics.algorithmsUsed.length).toBeGreaterThan(0);
    });
  });

  // ========================================
  // TESTS RECOMMENDATION ENGINE
  // ========================================

  describe('RecommendationEngine - Recommandations Pédagogiques', () => {
    test('devrait générer des recommandations contextualisées', async () => {
      const context = await createAnalysisContext();
      const analyticsResult = await analyticsEngine.analyzeClass(context);
      
      const recommendations = await recommendationEngine.generateClassRecommendations(
        context,
        analyticsResult.profiles,
        analyticsResult.insights
      );

      expect(recommendations.strengths.length).toBeGreaterThan(0);
      expect(recommendations.areasForImprovement.length).toBeGreaterThan(0);
      expect(recommendations.suggestedActions.length).toBeGreaterThan(0);
      expect(recommendations.nextYearFocus.length).toBeGreaterThan(0);

      // Vérification de la qualité des recommandations
      recommendations.suggestedActions.forEach(action => {
        expect(action.action).toBeDefined();
        expect(action.rationale).toBeDefined();
        expect(action.expectedImpact).toBeDefined();
        expect(action.priority).toBeGreaterThan(0);
        expect(action.priority).toBeLessThanOrEqual(10);
      });
    });

    test('devrait prioriser correctement les recommandations', async () => {
      const context = await createAnalysisContext();
      const analyticsResult = await analyticsEngine.analyzeClass(context);
      
      const recommendations = await recommendationEngine.generateClassRecommendations(
        context,
        analyticsResult.profiles,
        analyticsResult.insights
      );

      const priorities = recommendations.suggestedActions.map(a => a.priority);
      const sortedPriorities = [...priorities].sort((a, b) => b - a);
      
      expect(priorities).toEqual(sortedPriorities);
    });

    test('devrait générer du support individualisé pour élèves en difficulté', async () => {
      const context = await createAnalysisContext();
      const analyticsResult = await analyticsEngine.analyzeClass(context);
      
      const recommendations = await recommendationEngine.generateClassRecommendations(
        context,
        analyticsResult.profiles,
        analyticsResult.insights
      );

      const strugglingStudents = analyticsResult.profiles.filter(
        p => p.type === StudentProfileType.StrugglingStudent
      );

      if (strugglingStudents.length > 0) {
        expect(recommendations.individualSupport.length).toBeGreaterThan(0);
        
        recommendations.individualSupport.forEach(support => {
          expect(support.studentId).toBeDefined();
          expect(support.recommendations.length).toBeGreaterThan(0);
          expect(support.priority).toBeDefined();
        });
      }
    });
  });

  // ========================================
  // TESTS ANNUAL REPORT SERVICE
  // ========================================

  describe('AnnualReportService - Génération Complète', () => {
    test('devrait générer un rapport complet en moins de 30 secondes', async () => {
      const startTime = Date.now();
      
      const options: ReportGenerationOptions = {
        includeCharts: true,
        includeRawData: true,
        language: 'fr'
      };

      const result = await annualReportService.generateReport(
        testData.user.id,
        testData.class.id,
        '2024-2025',
        options
      );

      const processingTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
      expect(processingTime).toBeLessThan(30000); // 30 secondes
      expect(result.processingTime).toBeLessThan(30000);
    });

    test('devrait valider la qualité des données avant génération', async () => {
      // Test avec données insuffisantes
      const emptyClass = await createEmptyClass();
      
      const result = await annualReportService.generateReport(
        testData.user.id,
        emptyClass.id,
        '2024-2025'
      );

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors[0]).toContain('insuffisantes');
    });

    test('devrait utiliser le cache pour améliorer les performances', async () => {
      // Première génération
      const start1 = Date.now();
      const result1 = await annualReportService.generateReport(
        testData.user.id,
        testData.class.id,
        '2024-2025'
      );
      const time1 = Date.now() - start1;

      // Deuxième génération (devrait utiliser le cache)
      const start2 = Date.now();
      const result2 = await annualReportService.generateReport(
        testData.user.id,
        testData.class.id,
        '2024-2025'
      );
      const time2 = Date.now() - start2;

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result2.cacheUsed).toBe(true);
      expect(time2).toBeLessThan(time1 * 0.5); // Au moins 50% plus rapide
    });

    test('devrait générer toutes les sections requises', async () => {
      const result = await annualReportService.generateReport(
        testData.user.id,
        testData.class.id,
        '2024-2025'
      );

      expect(result.success).toBe(true);
      const report = result.report!;

      // Vérification des sections obligatoires
      expect(report.metadata).toBeDefined();
      expect(report.classSummary).toBeDefined();
      expect(report.studentAnalyses).toBeDefined();
      expect(report.insights).toBeDefined();
      expect(report.pedagogicalRecommendations).toBeDefined();
      expect(report.generationMetrics).toBeDefined();

      // Vérification du contenu
      expect(report.metadata.totalStudents).toBeGreaterThan(0);
      expect(report.studentAnalyses.length).toBe(report.metadata.totalStudents);
      expect(report.classSummary.averagePerformance).toBeGreaterThan(0);
    });
  });

  // ========================================
  // TESTS EXPORT SERVICE
  // ========================================

  describe('ExportService - Export Multi-Formats', () => {
    let testReport: AnnualReport;

    beforeEach(async () => {
      const result = await annualReportService.generateReport(
        testData.user.id,
        testData.class.id,
        '2024-2025'
      );
      testReport = result.report!;
    });

    test('devrait exporter en PDF avec succès', async () => {
      const options: ReportExportOptions = {
        format: 'pdf',
        includeCharts: true,
        quality: 'high'
      };

      const result = await exportService.exportReport(testReport, options);

      expect(result.success).toBe(true);
      expect(result.filename).toContain('.pdf');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.format).toBe('pdf');
    });

    test('devrait exporter en Excel avec données structurées', async () => {
      const options: ReportExportOptions = {
        format: 'docx',
        includeRawData: true
      };

      const result = await exportService.exportReport(testReport, options);

      expect(result.success).toBe(true);
      expect(result.filename).toContain('.xlsx');
      expect(result.fileSize).toBeGreaterThan(0);
    });

    test('devrait exporter en CSV pour analyse externe', async () => {
      const options: ReportExportOptions = {
        format: 'csv',
        includeRawData: true
      };

      const result = await exportService.exportReport(testReport, options);

      expect(result.success).toBe(true);
      expect(result.filename).toContain('.csv');
      expect(result.fileSize).toBeGreaterThan(0);
    });

    test('devrait gérer les erreurs d\'export gracieusement', async () => {
      const options: ReportExportOptions = {
        format: 'pdf',
        password: 'test123',
        compression: true
      };

      // Test avec rapport invalide
      const invalidReport = { ...testReport, metadata: null } as any;
      
      const result = await exportService.exportReport(invalidReport, options);

      expect(result.success).toBe(false);
    });
  });

  // ========================================
  // TESTS ARCHIVE SERVICE
  // ========================================

  describe('ArchiveService - Archivage Intelligent', () => {
    let testReport: AnnualReport;

    beforeEach(async () => {
      const result = await annualReportService.generateReport(
        testData.user.id,
        testData.class.id,
        '2024-2025'
      );
      testReport = result.report!;
    });

    test('devrait archiver un rapport avec intégrité', async () => {
      // Sauvegarde du rapport en base d'abord
      const savedReport = await prisma.annualReport.create({
        data: {
          classId: testReport.classId,
          academicYear: testReport.academicYear,
          reportData: testReport as any,
          status: 'final'
        }
      });

      const archive = await archiveService.archiveReport(savedReport.id.toString());

      expect(archive.id).toBeDefined();
      expect(archive.classId).toBe(testReport.classId);
      expect(archive.academicYear).toBe(testReport.academicYear);
      expect(archive.summaryData).toBeDefined();
      expect(archive.checksum).toBeDefined();
    });

    test('devrait restaurer un rapport depuis archive', async () => {
      // Création et archivage
      const savedReport = await prisma.annualReport.create({
        data: {
          classId: testReport.classId,
          academicYear: testReport.academicYear,
          reportData: testReport as any,
          status: 'final'
        }
      });

      const archive = await archiveService.archiveReport(savedReport.id.toString());
      
      // Restauration
      const restoredReport = await archiveService.restoreReport(archive.id);

      expect(restoredReport.id).toBeDefined();
      expect(restoredReport.classId).toBe(testReport.classId);
      expect(restoredReport.status).toBe('archived');
    });

    test('devrait effectuer une recherche avancée dans les archives', async () => {
      const searchQuery = {
        searchTerm: 'excellent',
        performanceRange: [15, 20] as [number, number],
        academicYears: ['2024-2025']
      };

      const results = await archiveService.searchArchives(searchQuery);

      expect(Array.isArray(results)).toBe(true);
      // Les résultats dépendent des données de test
    });

    test('devrait générer des statistiques d\'archivage', async () => {
      const stats = await archiveService.getArchiveStats();

      expect(stats.totalArchives).toBeGreaterThanOrEqual(0);
      expect(stats.totalSize).toBeGreaterThanOrEqual(0);
      expect(stats.archivesByYear).toBeDefined();
      expect(stats.compressionRatio).toBeGreaterThan(0);
    });
  });

  // ========================================
  // TESTS PERFORMANCE
  // ========================================

  describe('PerformanceOptimizer - Optimisations', () => {
    test('devrait optimiser la collecte de données', async () => {
      const startTime = Date.now();
      
      const context = await performanceOptimizer.optimizeDataCollection(
        testData.class.id,
        '2024-2025'
      );

      const processingTime = Date.now() - startTime;

      expect(context).toBeDefined();
      expect(context.students.length).toBeGreaterThan(0);
      expect(context.evaluations.length).toBeGreaterThan(0);
      expect(context.results.length).toBeGreaterThan(0);
      expect(processingTime).toBeLessThan(5000); // 5 secondes max
    });

    test('devrait utiliser le cache efficacement', async () => {
      // Premier appel
      const start1 = Date.now();
      await performanceOptimizer.optimizeDataCollection(testData.class.id, '2024-2025');
      const time1 = Date.now() - start1;

      // Deuxième appel (cache hit)
      const start2 = Date.now();
      await performanceOptimizer.optimizeDataCollection(testData.class.id, '2024-2025');
      const time2 = Date.now() - start2;

      expect(time2).toBeLessThan(time1 * 0.3); // Au moins 70% plus rapide
    });

    test('devrait fournir des métriques de performance', async () => {
      await performanceOptimizer.optimizeDataCollection(testData.class.id, '2024-2025');
      
      const metrics = performanceOptimizer.getMetrics();

      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(metrics.averageProcessingTime).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeGreaterThan(0);
      expect(metrics.lastOptimization).toBeInstanceOf(Date);
    });
  });

  // ========================================
  // TESTS DE CHARGE
  // ========================================

  describe('Tests de Charge et Stress', () => {
    test('devrait gérer plusieurs générations simultanées', async () => {
      const concurrentGenerations = 5;
      const promises: Promise<any>[] = [];

      for (let i = 0; i < concurrentGenerations; i++) {
        const promise = annualReportService.generateReport(
          testData.user.id,
          testData.class.id,
          '2024-2025'
        );
        promises.push(promise);
      }

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.processingTime).toBeLessThan(45000); // 45s max sous charge
      });
    });

    test('devrait maintenir les performances avec de gros volumes', async () => {
      // Test avec une classe de 50 élèves et 100 évaluations
      const largeClass = await createLargeTestClass(50, 100);
      
      const startTime = Date.now();
      const result = await annualReportService.generateReport(
        testData.user.id,
        largeClass.id,
        '2024-2025'
      );
      const processingTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(60000); // 60s max pour gros volume
      expect(result.report!.studentAnalyses.length).toBe(50);
    });
  });

  // ========================================
  // FONCTIONS UTILITAIRES DE TEST
  // ========================================

  /**
   * Crée un jeu de données de test complet
   */
  async function createTestData(): Promise<void> {
    // Création utilisateur
    testData = {} as TestDataSet;
    
    testData.user = await prisma.user.create({
      data: {
        email: 'test.teacher@edustats.fr',
        passwordHash: 'hashed_password',
        firstName: 'Marie',
        lastName: 'Dupont'
      }
    });

    // Création classe
    testData.class = await prisma.class.create({
      data: {
        userId: testData.user.id,
        name: 'CM2 A',
        level: 'CM2',
        academicYear: '2024-2025',
        studentCount: 25
      }
    });

    // Création élèves
    testData.students = [];
    for (let i = 1; i <= 25; i++) {
      const student = await prisma.student.create({
        data: {
          classId: testData.class.id,
          firstName: `Élève${i}`,
          lastName: `Test${i}`,
          dateOfBirth: new Date(2014, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
        }
      });
      testData.students.push(student);
    }

    // Création évaluations
    testData.evaluations = [];
    const subjects = ['Mathématiques', 'Français', 'Sciences', 'Histoire'];
    
    for (let i = 1; i <= 20; i++) {
      const evaluation = await prisma.evaluation.create({
        data: {
          classId: testData.class.id,
          title: `Évaluation ${i}`,
          subject: subjects[i % subjects.length],
          maxScore: 20,
          evaluationType: 'FORMATIVE',
          createdAt: new Date(2024, Math.floor(i / 3), (i * 7) % 28 + 1)
        }
      });
      testData.evaluations.push(evaluation);
    }

    // Création résultats avec patterns réalistes
    testData.results = [];
    for (const evaluation of testData.evaluations) {
      for (const student of testData.students) {
        // Simulation de profils d'élèves variés
        let baseScore = 10 + Math.random() * 8; // Base entre 10 et 18
        
        // Ajout de patterns selon l'élève
        if (student.firstName.includes('1') || student.firstName.includes('2')) {
          baseScore = Math.min(20, baseScore + 2); // Élèves excellents
        } else if (student.firstName.includes('24') || student.firstName.includes('25')) {
          baseScore = Math.max(5, baseScore - 4); // Élèves en difficulté
        }

        const result = await prisma.evaluationResult.create({
          data: {
            studentId: student.id,
            evaluationId: evaluation.id,
            score: Math.round(baseScore * 10) / 10,
            isAbsent: Math.random() < 0.05, // 5% d'absentéisme
            evaluatedAt: evaluation.createdAt
          }
        });
        testData.results.push(result);
      }
    }
  }

  /**
   * Crée un contexte d'analyse pour les tests
   */
  async function createAnalysisContext() {
    return {
      classInfo: testData.class,
      academicYear: '2024-2025',
      evaluations: testData.evaluations,
      results: testData.results,
      students: testData.students,
      historicalData: null
    };
  }

  /**
   * Crée une classe vide pour tester la validation
   */
  async function createEmptyClass() {
    return await prisma.class.create({
      data: {
        userId: testData.user.id,
        name: 'Classe Vide',
        level: 'CP',
        academicYear: '2024-2025',
        studentCount: 0
      }
    });
  }

  /**
   * Crée une classe avec beaucoup d'élèves pour les tests de performance
   */
  async function createLargeTestClass(studentCount: number, evaluationCount: number) {
    const largeClass = await prisma.class.create({
      data: {
        userId: testData.user.id,
        name: 'Grande Classe',
        level: 'CM2',
        academicYear: '2024-2025',
        studentCount
      }
    });

    // Création des élèves
    const students = [];
    for (let i = 1; i <= studentCount; i++) {
      const student = await prisma.student.create({
        data: {
          classId: largeClass.id,
          firstName: `ÉlèveL${i}`,
          lastName: `TestL${i}`
        }
      });
      students.push(student);
    }

    // Création des évaluations
    const evaluations = [];
    for (let i = 1; i <= evaluationCount; i++) {
      const evaluation = await prisma.evaluation.create({
        data: {
          classId: largeClass.id,
          title: `ÉvalL ${i}`,
          subject: 'Mathématiques',
          maxScore: 20,
          evaluationType: 'FORMATIVE'
        }
      });
      evaluations.push(evaluation);
    }

    // Création des résultats
    for (const evaluation of evaluations) {
      for (const student of students) {
        await prisma.evaluationResult.create({
          data: {
            studentId: student.id,
            evaluationId: evaluation.id,
            score: Math.round((10 + Math.random() * 8) * 10) / 10,
            isAbsent: Math.random() < 0.03,
            evaluatedAt: evaluation.createdAt
          }
        });
      }
    }

    return largeClass;
  }

  /**
   * Nettoie toutes les données de test
   */
  async function cleanupTestData(): Promise<void> {
    if (!testData?.user?.id) return;

    try {
      // Suppression en cascade via les relations Prisma
      await prisma.user.delete({
        where: { id: testData.user.id }
      });
    } catch (error) {
      console.warn('Erreur nettoyage données test:', error);
    }
  }
});
