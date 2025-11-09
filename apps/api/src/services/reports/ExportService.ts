// ========================================
// EXPORT SERVICE - SERVICE D'EXPORT PROFESSIONNEL
// ========================================

import { promises as fs } from 'fs';
import path from 'path';
import { 
  AnnualReport,
  ReportExportOptions,
  ReportExportResult,
  ReportTemplate,
  ClassInsight,
  StudentAnalysis
} from '@edustats/shared/types';
// Import TypeScript moderne de pdfkit
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { createObjectCsvWriter } from 'csv-writer';

// Type pour représenter une instance de PDFDocument
// TypeScript 5.3.3 exige qu'on distingue valeur et type pour les classes importées
type PDFDoc = InstanceType<typeof PDFDocument>;

/**
 * Configuration pour l'export PDF
 */
interface PDFConfig {
  pageSize: 'A4' | 'LETTER';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  fonts: {
    regular: string;
    bold: string;
    italic: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    lightGray: string;
  };
}

/**
 * Service d'export multi-formats pour les bilans annuels
 */
export class ExportService {
  private readonly exportDir: string;
  private readonly tempDir: string;
  private readonly pdfConfig: PDFConfig;

  constructor() {
    this.exportDir = process.env.EXPORT_DIR || path.join(process.cwd(), 'exports');
    this.tempDir = process.env.TEMP_DIR || path.join(process.cwd(), 'temp');
    
    this.pdfConfig = {
      pageSize: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      },
      fonts: {
        regular: 'Helvetica',
        bold: 'Helvetica-Bold',
        italic: 'Helvetica-Oblique'
      },
      colors: {
        primary: '#1f2937',
        secondary: '#374151',
        accent: '#3b82f6',
        text: '#111827',
        lightGray: '#f3f4f6'
      }
    };

    this.ensureDirectories();
  }

  // ========================================
  // EXPORT PRINCIPAL
  // ========================================

  /**
   * Exporte un rapport dans le format demandé
   */
  async exportReport(
    report: AnnualReport,
    options: ReportExportOptions
  ): Promise<ReportExportResult> {
    try {
      const startTime = Date.now();
      
      // Validation des options
      this.validateExportOptions(options);
      
      let result: ReportExportResult;
      
      switch (options.format) {
        case 'pdf':
          result = await this.exportToPDF(report, options);
          break;
        case 'docx':
          result = await this.exportToDocx(report, options);
          break;
        case 'html':
          result = await this.exportToHTML(report, options);
          break;
        case 'json':
          result = await this.exportToJSON(report, options);
          break;
        case 'csv':
          result = await this.exportToCSV(report, options);
          break;
        default:
          throw new Error(`Format d'export non supporté: ${options.format}`);
      }
      
      // Ajout des métadonnées
      result.generatedAt = new Date();
      result.format = options.format;
      
      // Gestion de l'expiration
      if (options.format !== 'json') {
        result.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours
      }
      
      return result;
      
    } catch (error) {
      console.error('Erreur export rapport:', error);
      return {
        success: false,
        filename: '',
        fileSize: 0,
        format: options.format,
        generatedAt: new Date()
      };
    }
  }

  // ========================================
  // EXPORT PDF PROFESSIONNEL
  // ========================================

  /**
   * Génère un PDF professionnel avec mise en page avancée
   */
  private async exportToPDF(
    report: AnnualReport,
    options: ReportExportOptions
  ): Promise<ReportExportResult> {
    
    const filename = `bilan_annuel_${report.classId}_${report.academicYear}_${Date.now()}.pdf`;
    const filePath = path.join(this.exportDir, filename);
    
    // Création du document PDF
    const doc = new PDFDocument({
      size: this.pdfConfig.pageSize,
      margins: this.pdfConfig.margins,
      info: {
        Title: `Bilan Annuel - ${report.metadata.className}`,
        Author: report.metadata.teacher,
        Subject: `Bilan annuel ${report.academicYear}`,
        Keywords: 'bilan, annuel, éducation, EduStats',
        Creator: 'EduStats - Système de Bilans Intelligents'
      }
    });
    
    // Stream vers fichier
    const stream = doc.pipe(require('fs').createWriteStream(filePath));
    
    try {
      // 1. Page de couverture
      await this.generateCoverPage(doc, report);
      
      // 2. Sommaire
      doc.addPage();
      await this.generateTableOfContents(doc, report);
      
      // 3. Synthèse exécutive
      doc.addPage();
      await this.generateExecutiveSummary(doc, report);
      
      // 4. Statistiques de classe
      if (options.includeCharts) {
        doc.addPage();
        await this.generateClassStatistics(doc, report);
      }
      
      // 5. Profils d'élèves
      doc.addPage();
      await this.generateStudentProfiles(doc, report);
      
      // 6. Insights et analyses
      doc.addPage();
      await this.generateInsights(doc, report);
      
      // 7. Recommandations pédagogiques
      doc.addPage();
      await this.generateRecommendations(doc, report);
      
      // 8. Données détaillées (si demandées)
      if (options.includeRawData) {
        doc.addPage();
        await this.generateDetailedData(doc, report);
      }
      
      // 9. Annexes
      doc.addPage();
      await this.generateAppendices(doc, report);
      
      // Finalisation
      doc.end();
      
      // Attendre la fin de l'écriture
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });
      
      // Vérification de la taille du fichier
      const stats = await fs.stat(filePath);
      
      return {
        success: true,
        filename,
        filePath,
        fileSize: stats.size,
        format: 'pdf',
        generatedAt: new Date()
      };
      
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      throw error;
    }
  }

  /**
   * Génère la page de couverture
   */
  private async generateCoverPage(doc: PDFDoc, report: AnnualReport): Promise<void> {
    const { margins } = this.pdfConfig;
    const pageWidth = doc.page.width - margins.left - margins.right;
    
    // Logo et en-tête
    doc.fontSize(24)
       .fillColor(this.pdfConfig.colors.primary)
       .text('EduStats', margins.left, margins.top, { align: 'center' });
    
    doc.fontSize(16)
       .fillColor(this.pdfConfig.colors.secondary)
       .text('Système de Bilans Intelligents', margins.left, margins.top + 30, { align: 'center' });
    
    // Titre principal
    doc.fontSize(32)
       .fillColor(this.pdfConfig.colors.primary)
       .text('BILAN ANNUEL', margins.left, margins.top + 120, { 
         align: 'center',
         width: pageWidth
       });
    
    // Informations de la classe
    const classInfoY = margins.top + 200;
    doc.fontSize(18)
       .fillColor(this.pdfConfig.colors.text)
       .text(`Classe: ${report.metadata.className}`, margins.left, classInfoY, { align: 'center' });
    
    doc.fontSize(16)
       .text(`Niveau: ${report.classSummary.averagePerformance.toFixed(1)}/20`, margins.left, classInfoY + 30, { align: 'center' });
    
    doc.text(`Année scolaire: ${report.academicYear}`, margins.left, classInfoY + 60, { align: 'center' });
    
    // Informations enseignant
    const teacherInfoY = margins.top + 320;
    doc.fontSize(14)
       .fillColor(this.pdfConfig.colors.secondary)
       .text(`Enseignant: ${report.metadata.teacher}`, margins.left, teacherInfoY, { align: 'center' });
    
    // Statistiques clés en encadré
    const statsY = margins.top + 380;
    const statsBoxHeight = 120;
    
    doc.rect(margins.left + 50, statsY, pageWidth - 100, statsBoxHeight)
       .fillAndStroke(this.pdfConfig.colors.lightGray, this.pdfConfig.colors.accent);
    
    doc.fontSize(12)
       .fillColor(this.pdfConfig.colors.text)
       .text('STATISTIQUES CLÉS', margins.left + 70, statsY + 15, { align: 'center', width: pageWidth - 140 });
    
    const stats = [
      `${report.metadata.totalStudents} élèves analysés`,
      `${report.metadata.totalEvaluations} évaluations traitées`,
      `${report.insights.length} insights détectés`,
      `${report.pedagogicalRecommendations.suggestedActions.length} recommandations générées`
    ];
    
    stats.forEach((stat, index) => {
      doc.text(`• ${stat}`, margins.left + 70, statsY + 40 + (index * 15), { 
        width: pageWidth - 140 
      });
    });
    
    // Date de génération
    doc.fontSize(10)
       .fillColor(this.pdfConfig.colors.secondary)
       .text(`Généré le ${report.generatedAt.toLocaleDateString('fr-FR')}`, 
             margins.left, doc.page.height - margins.bottom - 20, { align: 'center' });
  }

  /**
   * Génère le sommaire
   */
  private async generateTableOfContents(doc: PDFDoc, report: AnnualReport): Promise<void> {
    doc.fontSize(20)
       .fillColor(this.pdfConfig.colors.primary)
       .text('SOMMAIRE', this.pdfConfig.margins.left, this.pdfConfig.margins.top);
    
    const tocItems = [
      { title: '1. Synthèse Exécutive', page: 3 },
      { title: '2. Statistiques de Classe', page: 4 },
      { title: '3. Profils d\'Élèves', page: 5 },
      { title: '4. Insights et Analyses', page: 6 },
      { title: '5. Recommandations Pédagogiques', page: 7 },
      { title: '6. Données Détaillées', page: 8 },
      { title: '7. Annexes', page: 9 }
    ];
    
    let currentY = this.pdfConfig.margins.top + 50;
    
    tocItems.forEach(item => {
      doc.fontSize(12)
         .fillColor(this.pdfConfig.colors.text)
         .text(item.title, this.pdfConfig.margins.left, currentY);
      
      doc.text(item.page.toString(), doc.page.width - this.pdfConfig.margins.right - 30, currentY);
      
      currentY += 25;
    });
  }

  /**
   * Génère la synthèse exécutive
   */
  private async generateExecutiveSummary(doc: PDFDoc, report: AnnualReport): Promise<void> {
    doc.fontSize(20)
       .fillColor(this.pdfConfig.colors.primary)
       .text('SYNTHÈSE EXÉCUTIVE', this.pdfConfig.margins.left, this.pdfConfig.margins.top);
    
    let currentY = this.pdfConfig.margins.top + 40;
    
    // Métriques clés
    doc.fontSize(14)
       .fillColor(this.pdfConfig.colors.secondary)
       .text('Métriques Clés de Performance', this.pdfConfig.margins.left, currentY);
    
    currentY += 30;
    
    const keyMetrics = [
      { label: 'Moyenne générale de classe', value: `${report.classSummary.averagePerformance.toFixed(1)}/20` },
      { label: 'Taux de réussite', value: `${report.classSummary.keyMetrics.successRate.toFixed(1)}%` },
      { label: 'Taux de participation', value: `${report.classSummary.keyMetrics.participationRate.toFixed(1)}%` },
      { label: 'Index de consistance', value: `${report.classSummary.keyMetrics.consistencyIndex.toFixed(2)}` }
    ];
    
    keyMetrics.forEach(metric => {
      doc.fontSize(11)
         .fillColor(this.pdfConfig.colors.text)
         .text(`• ${metric.label}: `, this.pdfConfig.margins.left, currentY);
      
      doc.fillColor(this.pdfConfig.colors.accent)
         .text(metric.value, this.pdfConfig.margins.left + 200, currentY);
      
      currentY += 20;
    });
    
    // Points forts
    currentY += 20;
    doc.fontSize(14)
       .fillColor(this.pdfConfig.colors.secondary)
       .text('Points Forts Identifiés', this.pdfConfig.margins.left, currentY);
    
    currentY += 25;
    
    report.pedagogicalRecommendations.strengths.slice(0, 3).forEach(strength => {
      doc.fontSize(11)
         .fillColor(this.pdfConfig.colors.text)
         .text(`✓ ${strength}`, this.pdfConfig.margins.left, currentY, {
           width: doc.page.width - this.pdfConfig.margins.left - this.pdfConfig.margins.right
         });
      currentY += 20;
    });
    
    // Domaines d'amélioration
    currentY += 20;
    doc.fontSize(14)
       .fillColor(this.pdfConfig.colors.secondary)
       .text('Domaines d\'Amélioration', this.pdfConfig.margins.left, currentY);
    
    currentY += 25;
    
    report.pedagogicalRecommendations.areasForImprovement.slice(0, 3).forEach(area => {
      doc.fontSize(11)
         .fillColor(this.pdfConfig.colors.text)
         .text(`→ ${area}`, this.pdfConfig.margins.left, currentY, {
           width: doc.page.width - this.pdfConfig.margins.left - this.pdfConfig.margins.right
         });
      currentY += 20;
    });
  }

  /**
   * Génère les statistiques de classe avec graphiques
   */
  private async generateClassStatistics(doc: PDFDoc, report: AnnualReport): Promise<void> {
    doc.fontSize(20)
       .fillColor(this.pdfConfig.colors.primary)
       .text('STATISTIQUES DE CLASSE', this.pdfConfig.margins.left, this.pdfConfig.margins.top);
    
    let currentY = this.pdfConfig.margins.top + 50;
    
    // Distribution des performances
    doc.fontSize(14)
       .fillColor(this.pdfConfig.colors.secondary)
       .text('Distribution des Performances', this.pdfConfig.margins.left, currentY);
    
    currentY += 30;
    
    // Graphique en barres simple (ASCII art pour PDF)
    const distribution = report.classSummary.distributionAnalysis;
    const maxValue = Math.max(
      distribution.excellentStudents,
      distribution.goodStudents,
      distribution.averageStudents,
      distribution.strugglingStudents
    );
    
    const categories = [
      { label: 'Excellent (16-20)', value: distribution.excellentStudents, color: '#10b981' },
      { label: 'Bon (14-16)', value: distribution.goodStudents, color: '#3b82f6' },
      { label: 'Moyen (10-14)', value: distribution.averageStudents, color: '#f59e0b' },
      { label: 'Difficulté (<10)', value: distribution.strugglingStudents, color: '#ef4444' }
    ];
    
    categories.forEach((category, index) => {
      const barWidth = maxValue > 0 ? (category.value / maxValue) * 200 : 0;
      
      // Label
      doc.fontSize(10)
         .fillColor(this.pdfConfig.colors.text)
         .text(category.label, this.pdfConfig.margins.left, currentY);
      
      // Barre
      doc.rect(this.pdfConfig.margins.left + 120, currentY - 2, barWidth, 12)
         .fill(category.color);
      
      // Valeur
      doc.fillColor(this.pdfConfig.colors.text)
         .text(category.value.toString(), this.pdfConfig.margins.left + 330, currentY);
      
      currentY += 25;
    });
  }

  /**
   * Génère les profils d'élèves
   */
  private async generateStudentProfiles(doc: PDFDoc, report: AnnualReport): Promise<void> {
    doc.fontSize(20)
       .fillColor(this.pdfConfig.colors.primary)
       .text('PROFILS D\'ÉLÈVES', this.pdfConfig.margins.left, this.pdfConfig.margins.top);
    
    let currentY = this.pdfConfig.margins.top + 50;
    
    // Analyse des profils
    const profileCounts = this.analyzeProfileDistribution(report.studentAnalyses);
    
    Object.entries(profileCounts).forEach(([profileType, count]) => {
      if (count > 0) {
        doc.fontSize(12)
           .fillColor(this.pdfConfig.colors.text)
           .text(`${this.getProfileLabel(profileType)}: ${count} élève(s)`, 
                 this.pdfConfig.margins.left, currentY);
        currentY += 20;
      }
    });
    
    // Élèves nécessitant une attention particulière
    currentY += 20;
    doc.fontSize(14)
       .fillColor(this.pdfConfig.colors.secondary)
       .text('Élèves Nécessitant une Attention Particulière', this.pdfConfig.margins.left, currentY);
    
    currentY += 25;
    
    const priorityStudents = report.pedagogicalRecommendations.individualSupport
      .filter(support => support.priority === 'high')
      .slice(0, 5);
    
    priorityStudents.forEach(support => {
      doc.fontSize(11)
         .fillColor(this.pdfConfig.colors.text)
         .text(`• ${support.studentName}`, this.pdfConfig.margins.left, currentY);
      
      support.recommendations.slice(0, 2).forEach(rec => {
        doc.fontSize(9)
           .fillColor(this.pdfConfig.colors.secondary)
           .text(`  - ${rec}`, this.pdfConfig.margins.left + 15, currentY + 15, {
             width: doc.page.width - this.pdfConfig.margins.left - this.pdfConfig.margins.right - 15
           });
        currentY += 15;
      });
      
      currentY += 25;
    });
  }

  /**
   * Génère les insights détectés
   */
  private async generateInsights(doc: PDFDoc, report: AnnualReport): Promise<void> {
    doc.fontSize(20)
       .fillColor(this.pdfConfig.colors.primary)
       .text('INSIGHTS ET ANALYSES', this.pdfConfig.margins.left, this.pdfConfig.margins.top);
    
    let currentY = this.pdfConfig.margins.top + 50;
    
    // Insights prioritaires
    const priorityInsights = report.insights
      .filter(insight => insight.priority === 'high')
      .slice(0, 5);
    
    priorityInsights.forEach(insight => {
      // Titre de l'insight
      doc.fontSize(12)
         .fillColor(this.pdfConfig.colors.accent)
         .text(`🔍 ${insight.title}`, this.pdfConfig.margins.left, currentY);
      
      currentY += 20;
      
      // Description
      doc.fontSize(10)
         .fillColor(this.pdfConfig.colors.text)
         .text(insight.description, this.pdfConfig.margins.left + 15, currentY, {
           width: doc.page.width - this.pdfConfig.margins.left - this.pdfConfig.margins.right - 15
         });
      
      currentY += 35;
    });
  }

  /**
   * Génère les recommandations pédagogiques
   */
  private async generateRecommendations(doc: PDFDoc, report: AnnualReport): Promise<void> {
    doc.fontSize(20)
       .fillColor(this.pdfConfig.colors.primary)
       .text('RECOMMANDATIONS PÉDAGOGIQUES', this.pdfConfig.margins.left, this.pdfConfig.margins.top);
    
    let currentY = this.pdfConfig.margins.top + 50;
    
    // Actions suggérées prioritaires
    const topActions = report.pedagogicalRecommendations.suggestedActions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 8);
    
    topActions.forEach((action, index) => {
      // Numérotation et action
      doc.fontSize(11)
         .fillColor(this.pdfConfig.colors.accent)
         .text(`${index + 1}. ${action.action}`, this.pdfConfig.margins.left, currentY, {
           width: doc.page.width - this.pdfConfig.margins.left - this.pdfConfig.margins.right
         });
      
      currentY += 20;
      
      // Rationale
      doc.fontSize(9)
         .fillColor(this.pdfConfig.colors.secondary)
         .text(`Justification: ${action.rationale}`, this.pdfConfig.margins.left + 15, currentY, {
           width: doc.page.width - this.pdfConfig.margins.left - this.pdfConfig.margins.right - 15
         });
      
      currentY += 15;
      
      // Impact attendu
      doc.fillColor(this.pdfConfig.colors.text)
         .text(`Impact: ${action.expectedImpact}`, this.pdfConfig.margins.left + 15, currentY, {
           width: doc.page.width - this.pdfConfig.margins.left - this.pdfConfig.margins.right - 15
         });
      
      currentY += 25;
    });
    
    // Focus pour l'année suivante
    if (report.pedagogicalRecommendations.nextYearFocus.length > 0) {
      currentY += 20;
      doc.fontSize(14)
         .fillColor(this.pdfConfig.colors.secondary)
         .text('Focus pour l\'Année Suivante', this.pdfConfig.margins.left, currentY);
      
      currentY += 25;
      
      report.pedagogicalRecommendations.nextYearFocus.forEach(focus => {
        doc.fontSize(10)
           .fillColor(this.pdfConfig.colors.text)
           .text(`→ ${focus}`, this.pdfConfig.margins.left, currentY, {
             width: doc.page.width - this.pdfConfig.margins.left - this.pdfConfig.margins.right
           });
        currentY += 18;
      });
    }
  }

  // ========================================
  // AUTRES FORMATS D'EXPORT
  // ========================================

  /**
   * Export au format Excel
   */
  private async exportToDocx(report: AnnualReport, options: ReportExportOptions): Promise<ReportExportResult> {
    const filename = `bilan_annuel_${report.classId}_${report.academicYear}_${Date.now()}.xlsx`;
    const filePath = path.join(this.exportDir, filename);
    
    // Création du workbook
    const workbook = XLSX.utils.book_new();
    
    // Feuille synthèse
    const summaryData = [
      ['BILAN ANNUEL - SYNTHÈSE'],
      ['Classe', report.metadata.className],
      ['Année', report.academicYear],
      ['Enseignant', report.metadata.teacher],
      [''],
      ['MÉTRIQUES CLÉS'],
      ['Moyenne générale', report.classSummary.averagePerformance.toFixed(2)],
      ['Taux de réussite (%)', report.classSummary.keyMetrics.successRate.toFixed(1)],
      ['Taux de participation (%)', report.classSummary.keyMetrics.participationRate.toFixed(1)],
      ['Index de consistance', report.classSummary.keyMetrics.consistencyIndex.toFixed(2)]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Synthèse');
    
    // Feuille profils d'élèves
    const profilesData = [
      ['Élève', 'Profil', 'Moyenne', 'Rang', 'Progression', 'Recommandations']
    ];
    
    report.studentAnalyses.forEach(analysis => {
      profilesData.push([
        `${analysis.student.firstName} ${analysis.student.lastName}`,
        this.getProfileLabel(analysis.profile.type),
        analysis.performance.overallAverage.toFixed(2),
        analysis.performance.classRank.toString(),
        analysis.progression.progressionRate.toFixed(1) + '%',
        analysis.recommendations.slice(0, 2).join('; ')
      ]);
    });
    
    const profilesSheet = XLSX.utils.aoa_to_sheet(profilesData);
    XLSX.utils.book_append_sheet(workbook, profilesSheet, 'Profils Élèves');
    
    // Sauvegarde
    XLSX.writeFile(workbook, filePath);
    
    const stats = await fs.stat(filePath);
    
    return {
      success: true,
      filename,
      filePath,
      fileSize: stats.size,
      format: 'docx',
      generatedAt: new Date()
    };
  }

  /**
   * Export au format HTML
   */
  private async exportToHTML(report: AnnualReport, options: ReportExportOptions): Promise<ReportExportResult> {
    const filename = `bilan_annuel_${report.classId}_${report.academicYear}_${Date.now()}.html`;
    const filePath = path.join(this.exportDir, filename);
    
    const html = this.generateHTMLReport(report, options);
    await fs.writeFile(filePath, html, 'utf8');
    
    const stats = await fs.stat(filePath);
    
    return {
      success: true,
      filename,
      filePath,
      fileSize: stats.size,
      format: 'html',
      generatedAt: new Date()
    };
  }

  /**
   * Export au format JSON
   */
  private async exportToJSON(report: AnnualReport, options: ReportExportOptions): Promise<ReportExportResult> {
    const filename = `bilan_annuel_${report.classId}_${report.academicYear}_${Date.now()}.json`;
    const filePath = path.join(this.exportDir, filename);
    
    const jsonData = {
      ...report,
      exportOptions: options,
      exportedAt: new Date()
    };
    
    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
    
    const stats = await fs.stat(filePath);
    
    return {
      success: true,
      filename,
      filePath,
      fileSize: stats.size,
      format: 'json',
      generatedAt: new Date()
    };
  }

  /**
   * Export au format CSV
   */
  private async exportToCSV(report: AnnualReport, options: ReportExportOptions): Promise<ReportExportResult> {
    const filename = `bilan_annuel_${report.classId}_${report.academicYear}_${Date.now()}.csv`;
    const filePath = path.join(this.exportDir, filename);
    
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'student', title: 'Élève' },
        { id: 'profile', title: 'Profil' },
        { id: 'average', title: 'Moyenne' },
        { id: 'rank', title: 'Rang' },
        { id: 'progression', title: 'Progression (%)' },
        { id: 'strengths', title: 'Points forts' },
        { id: 'challenges', title: 'Défis' }
      ]
    });
    
    const records = report.studentAnalyses.map(analysis => ({
      student: `${analysis.student.firstName} ${analysis.student.lastName}`,
      profile: this.getProfileLabel(analysis.profile.type),
      average: analysis.performance.overallAverage.toFixed(2),
      rank: analysis.performance.classRank,
      progression: analysis.progression.progressionRate.toFixed(1),
      strengths: analysis.profile.strengths.join('; '),
      challenges: analysis.profile.challenges.join('; ')
    }));
    
    await csvWriter.writeRecords(records);
    
    const stats = await fs.stat(filePath);
    
    return {
      success: true,
      filename,
      filePath,
      fileSize: stats.size,
      format: 'csv',
      generatedAt: new Date()
    };
  }

  // ========================================
  // MÉTHODES UTILITAIRES
  // ========================================

  /**
   * Valide les options d'export
   */
  private validateExportOptions(options: ReportExportOptions): void {
    const supportedFormats = ['pdf', 'docx', 'html', 'json', 'csv'];
    
    if (!supportedFormats.includes(options.format)) {
      throw new Error(`Format non supporté: ${options.format}`);
    }
    
    if (options.quality && !['draft', 'standard', 'high'].includes(options.quality)) {
      throw new Error(`Qualité non supportée: ${options.quality}`);
    }
  }

  /**
   * Assure l'existence des répertoires
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.exportDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Erreur création répertoires:', error);
    }
  }

  /**
   * Génère le rapport HTML
   */
  private generateHTMLReport(report: AnnualReport, options: ReportExportOptions): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bilan Annuel - ${report.metadata.className}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
        .section { margin: 30px 0; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #f3f4f6; border-radius: 8px; }
        .student { margin: 15px 0; padding: 10px; border-left: 4px solid #3b82f6; }
        .recommendation { margin: 10px 0; padding: 10px; background: #fef3c7; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>BILAN ANNUEL</h1>
        <h2>${report.metadata.className} - ${report.academicYear}</h2>
        <p>Enseignant: ${report.metadata.teacher}</p>
    </div>
    
    <div class="section">
        <h3>Métriques Clés</h3>
        <div class="metric">
            <strong>Moyenne:</strong> ${report.classSummary.averagePerformance.toFixed(1)}/20
        </div>
        <div class="metric">
            <strong>Réussite:</strong> ${report.classSummary.keyMetrics.successRate.toFixed(1)}%
        </div>
        <div class="metric">
            <strong>Participation:</strong> ${report.classSummary.keyMetrics.participationRate.toFixed(1)}%
        </div>
    </div>
    
    <div class="section">
        <h3>Recommandations Principales</h3>
        ${report.pedagogicalRecommendations.suggestedActions.slice(0, 5).map(action => 
          `<div class="recommendation">
             <strong>${action.action}</strong><br>
             <small>${action.rationale}</small>
           </div>`
        ).join('')}
    </div>
    
    <div class="section">
        <h3>Profils d'Élèves</h3>
        ${report.studentAnalyses.slice(0, 10).map(analysis => 
          `<div class="student">
             <strong>${analysis.student.firstName} ${analysis.student.lastName}</strong> - 
             ${this.getProfileLabel(analysis.profile.type)}<br>
             <small>Moyenne: ${analysis.performance.overallAverage.toFixed(1)}/20 | 
             Rang: ${analysis.performance.classRank}</small>
           </div>`
        ).join('')}
    </div>
    
    <footer style="margin-top: 50px; text-align: center; color: #666;">
        <p>Généré par EduStats le ${report.generatedAt.toLocaleDateString('fr-FR')}</p>
    </footer>
</body>
</html>`;
  }

  /**
   * Analyse la distribution des profils
   */
  private analyzeProfileDistribution(analyses: StudentAnalysis[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    analyses.forEach(analysis => {
      const profileType = analysis.profile.type;
      distribution[profileType] = (distribution[profileType] || 0) + 1;
    });
    
    return distribution;
  }

  /**
   * Obtient le label français d'un profil
   */
  private getProfileLabel(profileType: string): string {
    const labels: Record<string, string> = {
      'high_achiever': 'Élève Excellent',
      'consistent_performer': 'Performeur Régulier',
      'improving_student': 'Élève en Progression',
      'struggling_student': 'Élève en Difficulté',
      'inconsistent_performer': 'Performeur Irrégulier',
      'exceptional_case': 'Cas Exceptionnel'
    };
    
    return labels[profileType] || profileType;
  }

  /**
   * Génère les données détaillées (si demandées)
   */
  private async generateDetailedData(doc: PDFDoc, report: AnnualReport): Promise<void> {
    doc.fontSize(20)
       .fillColor(this.pdfConfig.colors.primary)
       .text('DONNÉES DÉTAILLÉES', this.pdfConfig.margins.left, this.pdfConfig.margins.top);
    
    // Note sur les données brutes
    doc.fontSize(10)
       .fillColor(this.pdfConfig.colors.secondary)
       .text('Cette section contient les données brutes utilisées pour l\'analyse. ' +
             'Ces informations sont destinées à l\'archivage et aux analyses complémentaires.',
             this.pdfConfig.margins.left, this.pdfConfig.margins.top + 30, {
               width: doc.page.width - this.pdfConfig.margins.left - this.pdfConfig.margins.right
             });
  }

  /**
   * Génère les annexes
   */
  private async generateAppendices(doc: PDFDoc, report: AnnualReport): Promise<void> {
    doc.fontSize(20)
       .fillColor(this.pdfConfig.colors.primary)
       .text('ANNEXES', this.pdfConfig.margins.left, this.pdfConfig.margins.top);
    
    let currentY = this.pdfConfig.margins.top + 40;
    
    // Méthodologie
    doc.fontSize(14)
       .fillColor(this.pdfConfig.colors.secondary)
       .text('Méthodologie d\'Analyse', this.pdfConfig.margins.left, currentY);
    
    currentY += 25;
    
    const methodology = [
      'Classification automatique des profils d\'élèves basée sur 6 catégories',
      'Analyse de régression linéaire pour les tendances temporelles',
      'Détection de patterns par algorithmes d\'apprentissage automatique',
      'Recommandations générées par moteur d\'intelligence artificielle pédagogique'
    ];
    
    methodology.forEach(method => {
      doc.fontSize(10)
         .fillColor(this.pdfConfig.colors.text)
         .text(`• ${method}`, this.pdfConfig.margins.left, currentY, {
           width: doc.page.width - this.pdfConfig.margins.left - this.pdfConfig.margins.right
         });
      currentY += 18;
    });
    
    // Informations techniques
    currentY += 20;
    doc.fontSize(14)
       .fillColor(this.pdfConfig.colors.secondary)
       .text('Informations Techniques', this.pdfConfig.margins.left, currentY);
    
    currentY += 25;
    
    const technicalInfo = [
      `Algorithmes utilisés: ${report.generationMetrics.algorithmsUsed.join(', ')}`,
      `Points de données analysés: ${report.generationMetrics.dataPoints}`,
      `Score de confiance global: ${(report.generationMetrics.confidenceScore * 100).toFixed(1)}%`,
      `Temps de traitement: ${(report.generationMetrics.processingTime / 1000).toFixed(2)} secondes`
    ];
    
    technicalInfo.forEach(info => {
      doc.fontSize(9)
         .fillColor(this.pdfConfig.colors.text)
         .text(`• ${info}`, this.pdfConfig.margins.left, currentY);
      currentY += 15;
    });
  }
}
