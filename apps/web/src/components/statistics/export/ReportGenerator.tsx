// ========================================
// REPORT GENERATOR - GÉNÉRATEUR DE RAPPORTS PDF AVANCÉS
// ========================================

import React, { useState, useRef } from 'react';
import { 
  DocumentTextIcon, 
  Cog6ToothIcon, 
  EyeIcon,
  ArrowDownTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { AdvancedChart } from '../visualizations/AdvancedChart';
import type { StatisticResult } from '@edustats/shared/types';
import { cn } from '../../../utils/classNames';
import { toast } from 'react-hot-toast';

/**
 * Templates de rapport prédéfinis
 */
const REPORT_TEMPLATES = [
  {
    id: 'executive_summary',
    title: 'Résumé exécutif',
    description: 'Rapport concis pour la direction avec graphiques clés',
    pages: ['cover', 'summary', 'charts', 'insights'],
    icon: '📋'
  },
  {
    id: 'detailed_analysis',
    title: 'Analyse détaillée',
    description: 'Rapport complet avec toutes les données et analyses',
    pages: ['cover', 'summary', 'charts', 'data_tables', 'insights', 'methodology'],
    icon: '📊'
  },
  {
    id: 'parent_report',
    title: 'Rapport parents',
    description: 'Format adapté pour la communication avec les parents',
    pages: ['cover', 'summary', 'charts', 'recommendations'],
    icon: '👨‍👩‍👧‍👦'
  },
  {
    id: 'academic_report',
    title: 'Rapport académique',
    description: 'Format scientifique avec méthodologie et références',
    pages: ['cover', 'abstract', 'methodology', 'charts', 'data_tables', 'insights', 'conclusion'],
    icon: '🎓'
  }
];

/**
 * Sections de rapport disponibles
 */
const REPORT_SECTIONS = {
  cover: { title: 'Page de couverture', description: 'Titre, auteur, date' },
  abstract: { title: 'Résumé', description: 'Résumé exécutif de l\'analyse' },
  summary: { title: 'Synthèse', description: 'Points clés et résultats principaux' },
  methodology: { title: 'Méthodologie', description: 'Méthodes et paramètres utilisés' },
  charts: { title: 'Graphiques', description: 'Visualisations des données' },
  data_tables: { title: 'Tableaux de données', description: 'Données brutes et calculées' },
  insights: { title: 'Insights', description: 'Analyses automatiques et recommandations' },
  recommendations: { title: 'Recommandations', description: 'Actions suggérées' },
  conclusion: { title: 'Conclusion', description: 'Synthèse et perspectives' }
};

/**
 * Options de style pour le rapport
 */
interface ReportStyle {
  theme: 'professional' | 'modern' | 'academic' | 'colorful';
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: 'blue' | 'green' | 'purple' | 'monochrome';
  includeHeader: boolean;
  includeFooter: boolean;
  includePageNumbers: boolean;
  logoUrl?: string;
}

/**
 * Configuration du rapport
 */
interface ReportConfig {
  template: string;
  title: string;
  subtitle?: string;
  author: string;
  organization?: string;
  sections: string[];
  style: ReportStyle;
  includeRawData: boolean;
  includeMethodology: boolean;
  isAnonymous: boolean;
}

/**
 * Props du composant ReportGenerator
 */
interface ReportGeneratorProps {
  /** Résultats statistiques à inclure */
  results: StatisticResult[];
  /** Résultat principal */
  primaryResult: StatisticResult;
  /** Callback de fermeture */
  onClose?: () => void;
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Composant de génération de rapports PDF avancés
 */
export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  results,
  primaryResult,
  onClose,
  className
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [config, setConfig] = useState<ReportConfig>({
    template: 'detailed_analysis',
    title: primaryResult.configuration.name,
    subtitle: primaryResult.configuration.description,
    author: 'Enseignant ScolarFlow',
    organization: 'Établissement Scolaire',
    sections: ['cover', 'summary', 'charts', 'insights'],
    style: {
      theme: 'professional',
      fontSize: 'medium',
      colorScheme: 'blue',
      includeHeader: true,
      includeFooter: true,
      includePageNumbers: true
    },
    includeRawData: false,
    includeMethodology: true,
    isAnonymous: false
  });

  const previewRef = useRef<HTMLDivElement>(null);

  // ========================================
  // ÉTAPES DU WIZARD
  // ========================================

  const wizardSteps = [
    { id: 'template', title: 'Template', description: 'Choisir le type de rapport' },
    { id: 'content', title: 'Contenu', description: 'Configurer les sections' },
    { id: 'style', title: 'Style', description: 'Personnaliser l\'apparence' },
    { id: 'preview', title: 'Aperçu', description: 'Vérifier avant génération' }
  ];

  // ========================================
  // GESTION DES ACTIONS
  // ========================================

  const handleTemplateSelect = (templateId: string) => {
    const template = REPORT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setConfig(prev => ({
        ...prev,
        template: templateId,
        sections: [...template.pages]
      }));
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter(s => s !== sectionId)
        : [...prev.sections, sectionId]
    }));
  };

  const handleStyleChange = (styleUpdates: Partial<ReportStyle>) => {
    setConfig(prev => ({
      ...prev,
      style: { ...prev.style, ...styleUpdates }
    }));
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let currentPage = 1;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      // Générer chaque section
      for (const sectionId of config.sections) {
        if (currentPage > 1) {
          pdf.addPage();
        }

        await generateSection(pdf, sectionId, pageWidth, pageHeight, margin);
        currentPage++;
      }

      // Sauvegarder le PDF
      const filename = `${config.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
      
      toast.success('Rapport PDF généré avec succès !');
      setIsOpen(false);
      onClose?.();
      
    } catch (error: any) {
      console.error('Erreur génération rapport:', error);
      toast.error(`Erreur lors de la génération: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSection = async (
    pdf: jsPDF, 
    sectionId: string, 
    pageWidth: number, 
    pageHeight: number, 
    margin: number
  ) => {
    const contentWidth = pageWidth - 2 * margin;
    let currentY = margin;

    // Header si activé
    if (config.style.includeHeader) {
      currentY = addHeader(pdf, pageWidth, margin, currentY);
    }

    // Contenu de la section
    switch (sectionId) {
      case 'cover':
        currentY = await addCoverPage(pdf, pageWidth, pageHeight, margin, currentY);
        break;
      case 'summary':
        currentY = await addSummarySection(pdf, contentWidth, margin, currentY);
        break;
      case 'charts':
        currentY = await addChartsSection(pdf, contentWidth, margin, currentY);
        break;
      case 'insights':
        currentY = await addInsightsSection(pdf, contentWidth, margin, currentY);
        break;
      case 'data_tables':
        currentY = await addDataTablesSection(pdf, contentWidth, margin, currentY);
        break;
      case 'methodology':
        currentY = await addMethodologySection(pdf, contentWidth, margin, currentY);
        break;
      default:
        break;
    }

    // Footer si activé
    if (config.style.includeFooter) {
      addFooter(pdf, pageWidth, pageHeight, margin);
    }
  };

  // ========================================
  // FONCTIONS DE GÉNÉRATION DE SECTIONS
  // ========================================

  const addHeader = (pdf: jsPDF, pageWidth: number, margin: number, currentY: number): number => {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(config.organization || 'ScolarFlow', margin, currentY);
    pdf.text(new Date().toLocaleDateString('fr-FR'), pageWidth - margin, currentY, { align: 'right' });
    return currentY + 15;
  };

  const addFooter = (pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number) => {
    const footerY = pageHeight - margin;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    if (config.style.includePageNumbers) {
      const pageNum = pdf.internal.getCurrentPageInfo().pageNumber;
      pdf.text(`Page ${pageNum}`, pageWidth / 2, footerY, { align: 'center' });
    }
    
    pdf.text('Généré par ScolarFlow', pageWidth - margin, footerY, { align: 'right' });
  };

  const addCoverPage = async (
    pdf: jsPDF, 
    pageWidth: number, 
    pageHeight: number, 
    margin: number, 
    currentY: number
  ): Promise<number> => {
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;

    // Titre principal
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(config.title, centerX, centerY - 40, { align: 'center' });

    // Sous-titre
    if (config.subtitle) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text(config.subtitle, centerX, centerY - 20, { align: 'center' });
    }

    // Auteur et organisation
    pdf.setFontSize(12);
    pdf.text(config.author, centerX, centerY + 20, { align: 'center' });
    if (config.organization) {
      pdf.text(config.organization, centerX, centerY + 35, { align: 'center' });
    }

    // Date
    pdf.setFontSize(10);
    pdf.text(new Date().toLocaleDateString('fr-FR'), centerX, centerY + 60, { align: 'center' });

    return pageHeight - margin;
  };

  const addSummarySection = async (
    pdf: jsPDF, 
    contentWidth: number, 
    margin: number, 
    currentY: number
  ): Promise<number> => {
    // Titre de section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Synthèse des Résultats', margin, currentY);
    currentY += 15;

    // Statistiques clés
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const stats = primaryResult.statistics.global;
    const summaryText = [
      `Nombre de points de données analysés: ${primaryResult.summary.totalDataPoints}`,
      `Période d'analyse: ${new Date(primaryResult.summary.timeRange[0]).toLocaleDateString('fr-FR')} - ${new Date(primaryResult.summary.timeRange[1]).toLocaleDateString('fr-FR')}`,
      `Moyenne générale: ${stats?.average?.toFixed(2) || 'N/A'}`,
      `Médiane: ${stats?.median?.toFixed(2) || 'N/A'}`,
      `Écart-type: ${stats?.standardDeviation?.toFixed(2) || 'N/A'}`,
      `Tendance observée: ${stats?.trend === 'increasing' ? 'En hausse' : stats?.trend === 'decreasing' ? 'En baisse' : 'Stable'}`
    ];

    summaryText.forEach(line => {
      pdf.text(line, margin, currentY);
      currentY += 8;
    });

    return currentY + 10;
  };

  const addChartsSection = async (
    pdf: jsPDF, 
    contentWidth: number, 
    margin: number, 
    currentY: number
  ): Promise<number> => {
    // Titre de section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Graphiques et Visualisations', margin, currentY);
    currentY += 20;

    // Pour chaque résultat, générer un graphique
    for (const result of results.slice(0, 3)) { // Limiter à 3 graphiques par page
      try {
        // Créer un élément temporaire pour le graphique
        const tempDiv = document.createElement('div');
        tempDiv.style.width = '800px';
        tempDiv.style.height = '400px';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        // Rendre le graphique (simulation - en réalité il faudrait rendre le composant React)
        // Pour l'instant, on ajoute juste un placeholder
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(result.configuration.name, margin, currentY);
        currentY += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Type: ${result.configuration.visualization.chartType}`, margin, currentY);
        pdf.text(`Métriques: ${result.configuration.calculations.metrics.join(', ')}`, margin, currentY + 5);
        currentY += 25;

        // Nettoyer
        document.body.removeChild(tempDiv);
        
      } catch (error) {
        console.error('Erreur génération graphique:', error);
        pdf.text('Erreur lors de la génération du graphique', margin, currentY);
        currentY += 15;
      }
    }

    return currentY + 10;
  };

  const addInsightsSection = async (
    pdf: jsPDF, 
    contentWidth: number, 
    margin: number, 
    currentY: number
  ): Promise<number> => {
    // Titre de section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Insights et Recommandations', margin, currentY);
    currentY += 15;

    // Ajouter les insights de chaque résultat
    results.forEach((result, index) => {
      if (result.insights.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Analyse ${index + 1}: ${result.configuration.name}`, margin, currentY);
        currentY += 10;

        result.insights.forEach((insight, insightIndex) => {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${insightIndex + 1}. ${insight.title}`, margin, currentY);
          currentY += 8;

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const descLines = pdf.splitTextToSize(insight.description, contentWidth - 10);
          pdf.text(descLines, margin + 5, currentY);
          currentY += descLines.length * 5 + 5;

          // Indicateurs de confiance et priorité
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'italic');
          pdf.text(`Confiance: ${Math.round(insight.confidence * 100)}% | Priorité: ${insight.priority}`, margin + 5, currentY);
          currentY += 10;
        });

        currentY += 5;
      }
    });

    return currentY + 10;
  };

  const addDataTablesSection = async (
    pdf: jsPDF, 
    contentWidth: number, 
    margin: number, 
    currentY: number
  ): Promise<number> => {
    // Titre de section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Données Détaillées', margin, currentY);
    currentY += 15;

    // Tableau des données principales
    const data = primaryResult.datasets[0]?.data.slice(0, 10) || []; // Limiter à 10 lignes
    
    if (data.length > 0) {
      // Headers
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Label', margin, currentY);
      pdf.text('Valeur', margin + 60, currentY);
      pdf.text('Métadonnées', margin + 100, currentY);
      currentY += 8;

      // Ligne de séparation
      pdf.line(margin, currentY, margin + contentWidth, currentY);
      currentY += 5;

      // Données
      pdf.setFont('helvetica', 'normal');
      data.forEach(point => {
        const label = config.isAnonymous ? 'Anonyme' : (point.label || 'N/A');
        pdf.text(label, margin, currentY);
        pdf.text(point.value.toFixed(2), margin + 60, currentY);
        pdf.text(point.metadata ? 'Oui' : 'Non', margin + 100, currentY);
        currentY += 6;
      });
    }

    return currentY + 10;
  };

  const addMethodologySection = async (
    pdf: jsPDF, 
    contentWidth: number, 
    margin: number, 
    currentY: number
  ): Promise<number> => {
    // Titre de section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Méthodologie', margin, currentY);
    currentY += 15;

    // Description de la méthodologie
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const methodologyText = [
      'Configuration de l\'analyse:',
      `- Type d'analyse: ${primaryResult.configuration.calculations.type}`,
      `- Métriques calculées: ${primaryResult.configuration.calculations.metrics.join(', ')}`,
      `- Regroupement: ${primaryResult.configuration.calculations.groupBy}`,
      `- Méthode d'agrégation: ${primaryResult.configuration.calculations.aggregation}`,
      '',
      'Sources de données:',
      `- Classes analysées: ${primaryResult.configuration.dataSources.classIds.length}`,
      `- Période: ${new Date(primaryResult.summary.timeRange[0]).toLocaleDateString('fr-FR')} - ${new Date(primaryResult.summary.timeRange[1]).toLocaleDateString('fr-FR')}`,
      `- Exclusion des absents: ${primaryResult.configuration.dataSources.excludeAbsent ? 'Oui' : 'Non'}`,
      '',
      'Paramètres de visualisation:',
      `- Type de graphique: ${primaryResult.configuration.visualization.chartType}`,
      `- Séries multiples: ${primaryResult.configuration.visualization.multiSeries ? 'Oui' : 'Non'}`,
      `- Annotations: ${primaryResult.configuration.visualization.annotations ? 'Oui' : 'Non'}`
    ];

    methodologyText.forEach(line => {
      if (line === '') {
        currentY += 5;
      } else {
        pdf.text(line, margin, currentY);
        currentY += 6;
      }
    });

    return currentY + 10;
  };

  // ========================================
  // RENDU DES ÉTAPES DU WIZARD
  // ========================================

  const renderTemplateStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Choisir un template de rapport</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_TEMPLATES.map(template => (
          <button
            key={template.id}
            onClick={() => handleTemplateSelect(template.id)}
            className={cn(
              'p-4 border rounded-lg text-left transition-all hover:shadow-md',
              config.template === template.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                : 'border-gray-300 hover:border-gray-400'
            )}
          >
            <div className="flex items-start">
              <div className="text-2xl mr-3">{template.icon}</div>
              <div className="flex-1">
                <h4 className={cn(
                  'font-medium',
                  config.template === template.id ? 'text-blue-900' : 'text-gray-900'
                )}>
                  {template.title}
                </h4>
                <p className={cn(
                  'text-sm mt-1',
                  config.template === template.id ? 'text-blue-700' : 'text-gray-500'
                )}>
                  {template.description}
                </p>
                <div className="text-xs text-gray-500 mt-2">
                  {template.pages.length} section(s)
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderContentStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Informations du rapport</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Auteur</label>
            <input
              type="text"
              value={config.author}
              onChange={(e) => setConfig(prev => ({ ...prev, author: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sous-titre (optionnel)</label>
            <input
              type="text"
              value={config.subtitle || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, subtitle: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sections à inclure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(REPORT_SECTIONS).map(([sectionId, section]) => (
            <label
              key={sectionId}
              className={cn(
                'relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors',
                config.sections.includes(sectionId)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300'
              )}
            >
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                checked={config.sections.includes(sectionId)}
                onChange={() => handleSectionToggle(sectionId)}
              />
              <div className="ml-3 min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {section.title}
                </div>
                <div className="text-xs text-gray-500">
                  {section.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Options avancées</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              checked={config.includeRawData}
              onChange={(e) => setConfig(prev => ({ ...prev, includeRawData: e.target.checked }))}
            />
            <span className="ml-3 text-sm text-gray-700">Inclure les données brutes</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              checked={config.includeMethodology}
              onChange={(e) => setConfig(prev => ({ ...prev, includeMethodology: e.target.checked }))}
            />
            <span className="ml-3 text-sm text-gray-700">Inclure la méthodologie</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              checked={config.isAnonymous}
              onChange={(e) => setConfig(prev => ({ ...prev, isAnonymous: e.target.checked }))}
            />
            <span className="ml-3 text-sm text-gray-700">Mode anonyme (masquer les noms)</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStyleStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Style du rapport</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {(['professional', 'modern', 'academic', 'colorful'] as const).map(theme => (
            <button
              key={theme}
              onClick={() => handleStyleChange({ theme })}
              className={cn(
                'p-3 border rounded-lg text-center transition-colors',
                config.style.theme === theme
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-300 hover:border-gray-400'
              )}
            >
              <div className="text-sm font-medium capitalize">{theme}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Taille de police</label>
            <select
              value={config.style.fontSize}
              onChange={(e) => handleStyleChange({ fontSize: e.target.value as any })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="small">Petite</option>
              <option value="medium">Moyenne</option>
              <option value="large">Grande</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Couleurs</label>
            <select
              value={config.style.colorScheme}
              onChange={(e) => handleStyleChange({ colorScheme: e.target.value as any })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="blue">Bleu</option>
              <option value="green">Vert</option>
              <option value="purple">Violet</option>
              <option value="monochrome">Monochrome</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Options de mise en page</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              checked={config.style.includeHeader}
              onChange={(e) => handleStyleChange({ includeHeader: e.target.checked })}
            />
            <span className="ml-3 text-sm text-gray-700">Inclure l'en-tête</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              checked={config.style.includeFooter}
              onChange={(e) => handleStyleChange({ includeFooter: e.target.checked })}
            />
            <span className="ml-3 text-sm text-gray-700">Inclure le pied de page</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              checked={config.style.includePageNumbers}
              onChange={(e) => handleStyleChange({ includePageNumbers: e.target.checked })}
            />
            <span className="ml-3 text-sm text-gray-700">Numéroter les pages</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Aperçu du rapport</h3>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-900">Template</div>
            <div className="text-gray-600">{REPORT_TEMPLATES.find(t => t.id === config.template)?.title}</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">Sections</div>
            <div className="text-gray-600">{config.sections.length}</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">Style</div>
            <div className="text-gray-600 capitalize">{config.style.theme}</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">Pages estimées</div>
            <div className="text-gray-600">{config.sections.length + 1}</div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Contenu du rapport</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div>Titre: {config.title}</div>
          <div>Auteur: {config.author}</div>
          <div>Analyses incluses: {results.length}</div>
          <div>Mode: {config.isAnonymous ? 'Anonyme' : 'Standard'}</div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-gray-900">Sections incluses:</h4>
        <div className="flex flex-wrap gap-2">
          {config.sections.map(sectionId => (
            <span
              key={sectionId}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {REPORT_SECTIONS[sectionId as keyof typeof REPORT_SECTIONS]?.title}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors',
          className
        )}
      >
        <DocumentTextIcon className="h-4 w-4 mr-2" />
        Générer un rapport PDF
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsOpen(false)} />
        
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <DocumentTextIcon className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Générateur de Rapports PDF
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Créez des rapports professionnels personnalisés
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Progress */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {wizardSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center',
                    index < wizardSteps.length - 1 && 'flex-1'
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                    currentStep === index
                      ? 'bg-green-600 text-white'
                      : currentStep > index
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-500'
                  )}>
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <div className={cn(
                      'text-sm font-medium',
                      currentStep >= index ? 'text-gray-900' : 'text-gray-500'
                    )}>
                      {step.title}
                    </div>
                  </div>
                  {index < wizardSteps.length - 1 && (
                    <div className={cn(
                      'flex-1 h-0.5 mx-4',
                      currentStep > index ? 'bg-green-600' : 'bg-gray-200'
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {currentStep === 0 && renderTemplateStep()}
            {currentStep === 1 && renderContentStep()}
            {currentStep === 2 && renderStyleStep()}
            {currentStep === 3 && renderPreviewStep()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              Étape {currentStep + 1} sur {wizardSteps.length}
            </div>
            
            <div className="flex space-x-3">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Précédent
                </button>
              )}
              
              {currentStep < wizardSteps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Suivant
                </button>
              ) : (
                <button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className={cn(
                    'px-6 py-2 text-sm font-medium rounded-md',
                    isGenerating
                      ? 'text-gray-400 bg-gray-200 cursor-not-allowed'
                      : 'text-white bg-green-600 hover:bg-green-700'
                  )}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2 inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Génération...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2 inline" />
                      Générer le rapport
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
