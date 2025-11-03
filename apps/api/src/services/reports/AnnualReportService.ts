// ========================================
// ANNUAL REPORT SERVICE - SERVICE PRINCIPAL BILANS ANNUELS
// ========================================

import { PrismaClient } from '@prisma/client';
import { 
  AnnualReport,
  ReportGenerationOptions,
  ReportGenerationResult,
  AnalysisContext,
  ReportTemplate,
  ClassSummary,
  StudentAnalysis,
  ReportMetadata,
  GroupedRecommendations,
  DEFAULT_REPORT_CONFIG
} from '@edustats/shared/types';
// TODO: Remplacer par des types locaux si le package n'existe pas
import { AnalyticsEngine } from './AnalyticsEngine';
import { RecommendationEngine } from './RecommendationEngine';
import { StatisticsEngine } from '../statistics/StatisticsEngine';
import { EvaluationService } from '../EvaluationService';

/**
 * Service principal pour la génération de bilans annuels complets
 * Orchestre tous les moteurs d'analyse pour créer des rapports intelligents
 */
export class AnnualReportService {
  private prisma: PrismaClient;
  private analyticsEngine: AnalyticsEngine;
  private recommendationEngine: RecommendationEngine;
  private statisticsEngine: StatisticsEngine;
  private evaluationService: EvaluationService;
  private cache: Map<string, any> = new Map();

  constructor(
    prisma: PrismaClient,
    statisticsEngine: StatisticsEngine,
    evaluationService: EvaluationService
  ) {
    this.prisma = prisma;
    this.statisticsEngine = statisticsEngine;
    this.evaluationService = evaluationService;
    this.analyticsEngine = new AnalyticsEngine();
    this.recommendationEngine = new RecommendationEngine();
  }

  // ========================================
  // GÉNÉRATION DE RAPPORT PRINCIPAL
  // ========================================

  /**
   * Génère un bilan annuel complet pour une classe
   */
  async generateReport(
    userId: number,
    classId: number,
    academicYear: string,
    options: ReportGenerationOptions = {}
  ): Promise<ReportGenerationResult> {
    const startTime = Date.now();
    
    try {
      // 1. Validation des permissions
      await this.validatePermissions(userId, classId);
      
      // 2. Vérification du cache
      const cacheKey = `report_${classId}_${academicYear}_${JSON.stringify(options)}`;
      if (DEFAULT_REPORT_CONFIG.cacheEnabled && this.cache.has(cacheKey)) {
        const cachedReport = this.cache.get(cacheKey);
        if (Date.now() - cachedReport.timestamp < DEFAULT_REPORT_CONFIG.cacheDuration) {
          return {
            success: true,
            report: cachedReport.report,
            errors: [],
            warnings: ['Rapport généré depuis le cache'],
            processingTime: Date.now() - startTime,
            cacheUsed: true
          };
        }
      }
      
      // 3. Collecte des données
      const context = await this.collectAnalysisData(classId, academicYear, options);
      
      // 4. Validation de la qualité des données
      const dataQualityCheck = this.validateDataQuality(context);
      if (!dataQualityCheck.sufficient) {
        return {
          success: false,
          errors: [`Données insuffisantes: ${dataQualityCheck.reason}`],
          warnings: [],
          processingTime: Date.now() - startTime,
          cacheUsed: false
        };
      }
      
      // 5. Chargement du template
      const template = options.templateId 
        ? await this.loadTemplate(options.templateId)
        : await this.getDefaultTemplate();
      
      // 6. Génération des analyses
      const analyticsResult = await this.analyticsEngine.analyzeClass(context);
      
      // 7. Génération des recommandations
      const recommendations = await this.recommendationEngine.generateClassRecommendations(
        context,
        analyticsResult.profiles,
        analyticsResult.insights
      );
      
      // 8. Construction du rapport
      const report = await this.buildReport(
        context,
        analyticsResult,
        recommendations,
        template,
        options
      );
      
      // 9. Sauvegarde en base
      await this.saveReport(report);
      
      // 10. Mise en cache
      if (DEFAULT_REPORT_CONFIG.cacheEnabled) {
        this.cache.set(cacheKey, {
          report,
          timestamp: Date.now()
        });
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        report,
        errors: [],
        warnings: this.generateWarnings(context, analyticsResult),
        processingTime,
        cacheUsed: false
      };
      
    } catch (error) {
      console.error('Erreur génération rapport:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
        warnings: [],
        processingTime: Date.now() - startTime,
        cacheUsed: false
      };
    }
  }

  // ========================================
  // COLLECTE ET VALIDATION DES DONNÉES
  // ========================================

  /**
   * Collecte toutes les données nécessaires pour l'analyse
   */
  private async collectAnalysisData(
    classId: number,
    academicYear: string,
    options: ReportGenerationOptions
  ): Promise<AnalysisContext> {
    
    // Informations de la classe
    const classInfo = await this.prisma.classes.findUnique({
      where: { id: classId },
      include: {
        users: {
          select: { first_name: true, last_name: true }
        }
      }
    });
    
    if (!classInfo) {
      throw new Error('Classe introuvable');
    }
    
    // Élèves de la classe
    const students = await this.prisma.students.findMany({
      where: { 
        class_id: classId,
        is_active: true
      },
      orderBy: { name: 'asc' }
    });
    
    // Évaluations de l'année
    const evaluations = await this.prisma.evaluations.findMany({
      where: {
        class_id: classId,
        created_at: {
          gte: this.getAcademicYearStart(academicYear),
          lte: this.getAcademicYearEnd(academicYear)
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    // Résultats d'évaluations
    const results = await this.prisma.evaluationResult.findMany({
      where: {
        evaluation: {
          classId,
          createdAt: {
            gte: this.getAcademicYearStart(academicYear),
            lte: this.getAcademicYearEnd(academicYear)
          }
        },
        ...(options.excludeStudents && {
          studentId: { notIn: options.excludeStudents }
        })
      },
      include: {
        evaluation: {
          select: { subject: true, title: true, maxScore: true }
        }
      },
      orderBy: { evaluatedAt: 'asc' }
    });
    
    // Données historiques (si disponibles)
    const historicalData = await this.collectHistoricalData(classId, academicYear);
    
    return {
      classInfo,
      academicYear,
      evaluations,
      results,
      students,
      historicalData
    };
  }

  /**
   * Valide la qualité et suffisance des données
   */
  private validateDataQuality(context: AnalysisContext): { sufficient: boolean; reason?: string } {
    // Vérification du nombre d'élèves
    if (context.students.length === 0) {
      return { sufficient: false, reason: 'Aucun élève dans la classe' };
    }
    
    // Vérification du nombre d'évaluations
    if (context.evaluations.length < 3) {
      return { sufficient: false, reason: 'Moins de 3 évaluations dans l\'année' };
    }
    
    // Vérification du nombre de résultats
    if (context.results.length < context.students.length * 2) {
      return { sufficient: false, reason: 'Données d\'évaluation insuffisantes' };
    }
    
    // Vérification de la période couverte
    const dates = context.results.map(r => new Date(r.evaluatedAt).getTime());
    const timeSpan = (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24);
    if (timeSpan < 90) { // Moins de 3 mois
      return { sufficient: false, reason: 'Période d\'évaluation trop courte' };
    }
    
    return { sufficient: true };
  }

  // ========================================
  // CONSTRUCTION DU RAPPORT
  // ========================================

  /**
   * Construit le rapport final à partir de toutes les analyses
   */
  private async buildReport(
    context: AnalysisContext,
    analyticsResult: any,
    recommendations: GroupedRecommendations,
    template: ReportTemplate,
    options: ReportGenerationOptions
  ): Promise<AnnualReport> {
    
    // Métadonnées du rapport
    const metadata: ReportMetadata = {
      className: context.classInfo.name,
      level: context.classInfo.level,
      teacher: `${context.classInfo.user.firstName} ${context.classInfo.user.lastName}`,
      totalStudents: context.students.length,
      totalEvaluations: context.evaluations.length,
      dateRange: [
        this.getAcademicYearStart(context.academicYear),
        this.getAcademicYearEnd(context.academicYear)
      ],
      generationTime: analyticsResult.processingMetrics.processingTime,
      templateUsed: template.name,
      customizations: options.customSections?.map(s => s.title) || []
    };
    
    // Synthèse de classe
    const classSummary = await this.buildClassSummary(context, analyticsResult);
    
    // Analyses par élève
    const studentAnalyses = await this.buildStudentAnalyses(
      context, 
      analyticsResult.profiles
    );
    
    // Construction du rapport final
    const report: AnnualReport = {
      id: `report_${context.classInfo.id}_${context.academicYear}_${Date.now()}`,
      classId: context.classInfo.id,
      academicYear: context.academicYear,
      generatedAt: new Date(),
      status: 'final',
      metadata,
      classSummary,
      studentAnalyses,
      insights: analyticsResult.insights,
      pedagogicalRecommendations: recommendations,
      template,
      customSections: options.customSections,
      rawData: {
        evaluations: context.evaluations,
        results: context.results,
        statistics: analyticsResult,
        classInfo: context.classInfo
      },
      generationMetrics: {
        processingTime: analyticsResult.processingMetrics.processingTime,
        dataPoints: context.results.length,
        algorithmsUsed: analyticsResult.processingMetrics.algorithmsUsed,
        confidenceScore: analyticsResult.processingMetrics.confidenceScore
      }
    };
    
    return report;
  }

  /**
   * Construit la synthèse globale de classe
   */
  private async buildClassSummary(context: AnalysisContext, analyticsResult: any): Promise<ClassSummary> {
    // Calculs statistiques de base
    const validResults = context.results.filter(r => !r.isAbsent && r.score !== null);
    const scores = validResults.map(r => r.score);
    const averagePerformance = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Analyse de progression temporelle
    const progressionTrend = this.determineProgressionTrend(validResults);
    
    // Performances par matière
    const subjectPerformances = await this.calculateSubjectPerformances(context);
    
    // Métriques clés
    const keyMetrics = {
      successRate: (validResults.filter(r => r.score >= 10).length / validResults.length) * 100,
      absenteeismRate: ((context.results.length - validResults.length) / context.results.length) * 100,
      participationRate: (validResults.length / context.results.length) * 100,
      improvementRate: this.calculateImprovementRate(validResults),
      consistencyIndex: this.calculateConsistencyIndex(context.students, validResults)
    };
    
    // Analyse de distribution
    const distributionAnalysis = {
      excellentStudents: this.countStudentsByRange(context.students, validResults, 16, 20),
      goodStudents: this.countStudentsByRange(context.students, validResults, 14, 16),
      averageStudents: this.countStudentsByRange(context.students, validResults, 10, 14),
      strugglingStudents: this.countStudentsByRange(context.students, validResults, 0, 10)
    };
    
    // Analyse temporelle
    const temporalAnalysis = await this.performTemporalAnalysis(validResults);
    
    return {
      averagePerformance,
      progressionTrend,
      subjectPerformances,
      keyMetrics,
      distributionAnalysis,
      temporalAnalysis
    };
  }

  /**
   * Construit les analyses individuelles des élèves
   */
  private async buildStudentAnalyses(
    context: AnalysisContext,
    profiles: any[]
  ): Promise<StudentAnalysis[]> {
    const analyses: StudentAnalysis[] = [];
    
    for (const student of context.students) {
      const profile = profiles.find(p => p.studentId === student.id);
      if (!profile) continue;
      
      const studentResults = context.results.filter(r => r.studentId === student.id);
      
      // Recommandations individuelles
      const recommendations = await this.recommendationEngine.generateStudentRecommendations(
        profile,
        profile.performanceData,
        profile.progressionData
      );
      
      // Prédictions pour l'année suivante
      const nextYearPredictions = {
        expectedLevel: this.predictNextYearLevel(profile, studentResults),
        riskFactors: this.identifyRiskFactors(profile, studentResults),
        supportNeeds: this.identifySupportNeeds(profile, studentResults)
      };
      
      analyses.push({
        student,
        profile,
        performance: profile.performanceData,
        progression: profile.progressionData,
        recommendations,
        nextYearPredictions
      });
    }
    
    return analyses.sort((a, b) => a.student.lastName.localeCompare(b.student.lastName));
  }

  // ========================================
  // MÉTHODES UTILITAIRES
  // ========================================

  /**
   * Valide les permissions d'accès à la classe
   */
  private async validatePermissions(userId: number, classId: number): Promise<void> {
    const classInfo = await this.prisma.classes.findFirst({
      where: {
        id: classId,
        user_id: userId
      }
    });
    
    if (!classInfo) {
      throw new Error('Accès non autorisé à cette classe');
    }
  }

  /**
   * Charge un template de rapport
   */
  private async loadTemplate(templateId: string): Promise<ReportTemplate> {
    const template = await this.prisma.reportTemplate.findUnique({
      where: { id: parseInt(templateId) }
    });
    
    if (!template) {
      throw new Error('Template de rapport introuvable');
    }
    
    return {
      id: template.id.toString(),
      name: template.name,
      description: template.description || '',
      target: template.target as any,
      config: template.config as any,
      sections: template.sections as any,
      formatting: template.formatting as any,
      isOfficial: template.isOfficial,
      createdBy: template.createdBy || undefined,
      usageCount: template.usageCount,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    };
  }

  /**
   * Retourne le template par défaut
   */
  private async getDefaultTemplate(): Promise<ReportTemplate> {
    return this.loadTemplate('1'); // Template administratif complet
  }

  /**
   * Sauvegarde le rapport en base de données
   */
  private async saveReport(report: AnnualReport): Promise<void> {
    await this.prisma.annualReport.upsert({
      where: {
        classId_academicYear: {
          classId: report.classId,
          academicYear: report.academicYear
        }
      },
      update: {
        reportData: report as any,
        reportConfig: report.template?.config || {},
        insights: report.insights,
        recommendations: report.pedagogicalRecommendations,
        generationTime: report.generationMetrics.processingTime,
        status: report.status,
        updatedAt: new Date()
      },
      create: {
        classId: report.classId,
        academicYear: report.academicYear,
        reportData: report as any,
        reportConfig: report.template?.config || {},
        insights: report.insights,
        recommendations: report.pedagogicalRecommendations,
        generationTime: report.generationMetrics.processingTime,
        templateId: report.template ? parseInt(report.template.id) : null,
        status: report.status
      }
    });
  }

  /**
   * Génère des avertissements basés sur l'analyse
   */
  private generateWarnings(context: AnalysisContext, analyticsResult: any): string[] {
    const warnings: string[] = [];
    
    if (analyticsResult.processingMetrics.dataQuality < 0.7) {
      warnings.push('Qualité des données limitée - résultats à interpréter avec prudence');
    }
    
    if (analyticsResult.processingMetrics.confidenceScore < 0.6) {
      warnings.push('Niveau de confiance faible sur certaines analyses');
    }
    
    if (context.results.length < context.students.length * 5) {
      warnings.push('Nombre d\'évaluations limité - analyses moins précises');
    }
    
    return warnings;
  }

  // Méthodes utilitaires supplémentaires...
  private getAcademicYearStart(academicYear: string): Date {
    const year = parseInt(academicYear.split('-')[0]);
    return new Date(year, 8, 1); // 1er septembre
  }

  private getAcademicYearEnd(academicYear: string): Date {
    const year = parseInt(academicYear.split('-')[1]);
    return new Date(year, 6, 31); // 31 juillet
  }

  private async collectHistoricalData(classId: number, academicYear: string): Promise<any> {
    // Collecte des données historiques si disponibles
    return null;
  }

  private determineProgressionTrend(results: any[]): any {
    // Détermine la tendance de progression
    return 'stable';
  }

  private async calculateSubjectPerformances(context: AnalysisContext): Promise<any[]> {
    // Calcule les performances par matière
    return [];
  }

  private calculateImprovementRate(results: any[]): number {
    // Calcule le taux d'amélioration
    return 0;
  }

  private calculateConsistencyIndex(students: any[], results: any[]): number {
    // Calcule l'index de consistance
    return 0;
  }

  private countStudentsByRange(students: any[], results: any[], min: number, max: number): number {
    // Compte les élèves dans une tranche de notes
    return 0;
  }

  private async performTemporalAnalysis(results: any[]): Promise<any> {
    // Effectue l'analyse temporelle
    return {
      bestPeriod: 'Trimestre 2',
      worstPeriod: 'Trimestre 1',
      mostImprovement: 'Trimestre 3',
      seasonalPatterns: []
    };
  }

  private predictNextYearLevel(profile: any, results: any[]): string {
    // Prédit le niveau pour l'année suivante
    return 'Niveau attendu';
  }

  private identifyRiskFactors(profile: any, results: any[]): string[] {
    // Identifie les facteurs de risque
    return [];
  }

  private identifySupportNeeds(profile: any, results: any[]): string[] {
    // Identifie les besoins de support
    return [];
  }
}
