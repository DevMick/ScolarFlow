// ========================================
// PDF GENERATOR - GÉNÉRATEUR PDF AVEC GRAPHIQUES INTÉGRÉS
// ========================================

import React, { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AdvancedChart } from '../visualizations/AdvancedChart';
import type { StatisticResult } from '@edustats/shared/types';
import { toast } from 'react-hot-toast';

/**
 * Options de génération PDF
 */
interface PDFGenerationOptions {
  title: string;
  author: string;
  includeCharts: boolean;
  includeData: boolean;
  includeInsights: boolean;
  isAnonymous: boolean;
  format: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
  quality: 'standard' | 'high';
}

/**
 * Props du composant PDFGenerator
 */
interface PDFGeneratorProps {
  /** Résultats statistiques */
  results: StatisticResult[];
  /** Options de génération */
  options: PDFGenerationOptions;
  /** Callback de progression */
  onProgress?: (progress: number) => void;
  /** Callback de fin */
  onComplete?: (success: boolean) => void;
}

/**
 * Composant de génération PDF avec graphiques haute qualité
 */
export const PDFGenerator: React.FC<PDFGeneratorProps> = ({
  results,
  options,
  onProgress,
  onComplete
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const chartsContainerRef = useRef<HTMLDivElement>(null);

  // ========================================
  // GÉNÉRATION PDF PRINCIPALE
  // ========================================

  const generatePDF = async (): Promise<void> => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    onProgress?.(0);

    try {
      // Configuration PDF
      const pdf = new jsPDF({
        orientation: options.orientation,
        unit: 'mm',
        format: options.format
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;

      let currentPage = 1;
      let currentY = margin;

      // Page de couverture
      onProgress?.(10);
      currentY = await addCoverPage(pdf, pageWidth, pageHeight, margin);
      
      // Résumé exécutif
      if (results.length > 0) {
        pdf.addPage();
        currentPage++;
        onProgress?.(20);
        currentY = await addExecutiveSummary(pdf, results[0], contentWidth, margin);
      }

      // Graphiques (si demandés)
      if (options.includeCharts && results.length > 0) {
        onProgress?.(30);
        await addChartsPages(pdf, results, pageWidth, pageHeight, margin);
        currentPage += results.length;
      }

      // Données détaillées (si demandées)
      if (options.includeData) {
        onProgress?.(70);
        pdf.addPage();
        currentPage++;
        await addDataTables(pdf, results, contentWidth, margin);
      }

      // Insights et recommandations (si demandés)
      if (options.includeInsights) {
        onProgress?.(85);
        pdf.addPage();
        currentPage++;
        await addInsightsSection(pdf, results, contentWidth, margin);
      }

      // Finalisation
      onProgress?.(95);
      addMetadata(pdf);
      
      // Sauvegarde
      const filename = `${options.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
      
      onProgress?.(100);
      toast.success('Rapport PDF généré avec succès !');
      onComplete?.(true);

    } catch (error: any) {
      console.error('Erreur génération PDF:', error);
      toast.error(`Erreur lors de la génération: ${error.message}`);
      onComplete?.(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // ========================================
  // FONCTIONS DE GÉNÉRATION DE SECTIONS
  // ========================================

  const addCoverPage = async (
    pdf: jsPDF,
    pageWidth: number,
    pageHeight: number,
    margin: number
  ): Promise<number> => {
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;

    // Titre principal
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.text(options.title, centerX, centerY - 60, { align: 'center' });

    // Sous-titre
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Rapport d\'Analyse Statistique', centerX, centerY - 35, { align: 'center' });

    // Informations
    pdf.setFontSize(12);
    pdf.text(`Auteur: ${options.author}`, centerX, centerY - 10, { align: 'center' });
    pdf.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, centerX, centerY + 5, { align: 'center' });
    pdf.text(`Analyses incluses: ${results.length}`, centerX, centerY + 20, { align: 'center' });

    // Logo ou décoration (optionnel)
    pdf.setFontSize(48);
    pdf.text('📊', centerX, centerY + 60, { align: 'center' });

    // Footer
    pdf.setFontSize(10);
    pdf.text('Généré par ScolarFlow', centerX, pageHeight - margin, { align: 'center' });

    return pageHeight - margin;
  };

  const addExecutiveSummary = async (
    pdf: jsPDF,
    primaryResult: StatisticResult,
    contentWidth: number,
    margin: number
  ): Promise<number> => {
    let currentY = margin;

    // Titre
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Résumé Exécutif', margin, currentY);
    currentY += 20;

    // Configuration de l'analyse
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Configuration de l\'Analyse', margin, currentY);
    currentY += 10;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const configText = [
      `Nom: ${primaryResult.configuration.name}`,
      `Type: ${primaryResult.configuration.calculations.type}`,
      `Période: ${new Date(primaryResult.summary.timeRange[0]).toLocaleDateString('fr-FR')} - ${new Date(primaryResult.summary.timeRange[1]).toLocaleDateString('fr-FR')}`,
      `Points de données: ${primaryResult.summary.totalDataPoints}`,
      `Temps de traitement: ${primaryResult.summary.processingTime}ms`
    ];

    configText.forEach(line => {
      pdf.text(line, margin, currentY);
      currentY += 6;
    });

    currentY += 10;

    // Statistiques clés
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Statistiques Clés', margin, currentY);
    currentY += 10;

    const stats = primaryResult.statistics.global;
    if (stats) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      const statsText = [
        `Moyenne: ${stats.average?.toFixed(2) || 'N/A'}`,
        `Médiane: ${stats.median?.toFixed(2) || 'N/A'}`,
        `Écart-type: ${stats.standardDeviation?.toFixed(2) || 'N/A'}`,
        `Minimum: ${stats.min?.toFixed(2) || 'N/A'}`,
        `Maximum: ${stats.max?.toFixed(2) || 'N/A'}`,
        `Tendance: ${stats.trend === 'increasing' ? 'En hausse' : stats.trend === 'decreasing' ? 'En baisse' : 'Stable'}`
      ];

      statsText.forEach(line => {
        pdf.text(line, margin, currentY);
        currentY += 6;
      });
    }

    currentY += 10;

    // Points saillants
    if (primaryResult.insights.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Points Saillants', margin, currentY);
      currentY += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      primaryResult.insights.slice(0, 3).forEach((insight, index) => {
        pdf.text(`${index + 1}. ${insight.title}`, margin, currentY);
        currentY += 6;
        
        const descLines = pdf.splitTextToSize(insight.description, contentWidth - 10);
        pdf.text(descLines, margin + 5, currentY);
        currentY += descLines.length * 5 + 5;
      });
    }

    return currentY;
  };

  const addChartsPages = async (
    pdf: jsPDF,
    results: StatisticResult[],
    pageWidth: number,
    pageHeight: number,
    margin: number
  ): Promise<void> => {
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      
      pdf.addPage();
      let currentY = margin;

      // Titre de la page
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(result.configuration.name, margin, currentY);
      currentY += 15;

      // Description
      if (result.configuration.description) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(result.configuration.description, pageWidth - 2 * margin);
        pdf.text(descLines, margin, currentY);
        currentY += descLines.length * 5 + 10;
      }

      // Générer le graphique
      try {
        const chartCanvas = await generateChartImage(result);
        if (chartCanvas) {
          const imgData = chartCanvas.toDataURL('image/png');
          const imgWidth = pageWidth - 2 * margin;
          const imgHeight = (chartCanvas.height * imgWidth) / chartCanvas.width;
          
          // Vérifier si l'image tient sur la page
          if (currentY + imgHeight > pageHeight - margin) {
            pdf.addPage();
            currentY = margin;
          }
          
          pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 10;
        }
      } catch (error) {
        console.error('Erreur génération graphique:', error);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'italic');
        pdf.text('Erreur lors de la génération du graphique', margin, currentY);
        currentY += 15;
      }

      // Statistiques du graphique
      if (result.statistics.global) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Statistiques', margin, currentY);
        currentY += 8;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const stats = result.statistics.global;
        const statsGrid = [
          [`Moyenne: ${stats.average?.toFixed(2) || 'N/A'}`, `Médiane: ${stats.median?.toFixed(2) || 'N/A'}`],
          [`Écart-type: ${stats.standardDeviation?.toFixed(2) || 'N/A'}`, `Étendue: ${stats.max && stats.min ? (stats.max - stats.min).toFixed(2) : 'N/A'}`]
        ];

        statsGrid.forEach(row => {
          pdf.text(row[0], margin, currentY);
          pdf.text(row[1], margin + (pageWidth - 2 * margin) / 2, currentY);
          currentY += 6;
        });
      }
    }
  };

  const addDataTables = async (
    pdf: jsPDF,
    results: StatisticResult[],
    contentWidth: number,
    margin: number
  ): Promise<number> => {
    let currentY = margin;

    // Titre
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Données Détaillées', margin, currentY);
    currentY += 20;

    results.forEach((result, resultIndex) => {
      // Nom de l'analyse
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${resultIndex + 1}. ${result.configuration.name}`, margin, currentY);
      currentY += 10;

      // Tableau des données
      if (result.datasets.length > 0) {
        const dataset = result.datasets[0];
        const data = dataset.data.slice(0, 15); // Limiter à 15 lignes

        // En-têtes
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Label', margin, currentY);
        pdf.text('Valeur', margin + 80, currentY);
        pdf.text('Métadonnées', margin + 140, currentY);
        currentY += 8;

        // Ligne de séparation
        pdf.line(margin, currentY, margin + contentWidth, currentY);
        currentY += 5;

        // Données
        pdf.setFont('helvetica', 'normal');
        data.forEach(point => {
          const label = options.isAnonymous ? 'Anonyme' : (point.label || 'N/A');
          pdf.text(label.substring(0, 20), margin, currentY);
          pdf.text(point.value.toFixed(2), margin + 80, currentY);
          pdf.text(point.metadata ? 'Oui' : 'Non', margin + 140, currentY);
          currentY += 6;
        });

        currentY += 10;
      }
    });

    return currentY;
  };

  const addInsightsSection = async (
    pdf: jsPDF,
    results: StatisticResult[],
    contentWidth: number,
    margin: number
  ): Promise<number> => {
    let currentY = margin;

    // Titre
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Insights et Recommandations', margin, currentY);
    currentY += 20;

    results.forEach((result, resultIndex) => {
      if (result.insights.length > 0) {
        // Nom de l'analyse
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${resultIndex + 1}. ${result.configuration.name}`, margin, currentY);
        currentY += 12;

        result.insights.forEach((insight, insightIndex) => {
          // Titre de l'insight
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${insightIndex + 1}. ${insight.title}`, margin + 5, currentY);
          currentY += 8;

          // Description
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const descLines = pdf.splitTextToSize(insight.description, contentWidth - 15);
          pdf.text(descLines, margin + 10, currentY);
          currentY += descLines.length * 5 + 3;

          // Métadonnées
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'italic');
          pdf.text(
            `Confiance: ${Math.round(insight.confidence * 100)}% | Priorité: ${insight.priority}`,
            margin + 10,
            currentY
          );
          currentY += 8;
        });

        currentY += 5;
      }
    });

    return currentY;
  };

  const addMetadata = (pdf: jsPDF): void => {
    pdf.setProperties({
      title: options.title,
      author: options.author,
      subject: 'Rapport d\'analyse statistique ScolarFlow',
      keywords: 'statistiques, éducation, analyse, rapport',
      creator: 'ScolarFlow PDF Generator',
      producer: 'ScolarFlow'
    });
  };

  // ========================================
  // GÉNÉRATION D'IMAGES DE GRAPHIQUES
  // ========================================

  const generateChartImage = async (result: StatisticResult): Promise<HTMLCanvasElement | null> => {
    return new Promise((resolve) => {
      // Créer un conteneur temporaire
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '800px';
      tempContainer.style.height = '400px';
      tempContainer.style.backgroundColor = 'white';
      document.body.appendChild(tempContainer);

      // Créer un canvas temporaire pour le graphique
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 400;
      canvas.style.width = '800px';
      canvas.style.height = '400px';
      tempContainer.appendChild(canvas);

      // Simuler la génération du graphique
      // En réalité, il faudrait rendre le composant AdvancedChart ici
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Fond blanc
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 800, 400);

        // Titre
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(result.configuration.name, 400, 30);

        // Graphique simple (placeholder)
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const data = result.datasets[0]?.data || [];
        const maxValue = Math.max(...data.map(d => d.value));
        const minValue = Math.min(...data.map(d => d.value));
        const range = maxValue - minValue || 1;

        data.slice(0, 10).forEach((point, index) => {
          const x = 100 + (index * 60);
          const y = 350 - ((point.value - minValue) / range) * 250;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          
          // Points
          ctx.fillStyle = '#3B82F6';
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fill();
        });
        
        ctx.stroke();

        // Axes
        ctx.strokeStyle = '#6B7280';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(80, 350);
        ctx.lineTo(720, 350);
        ctx.moveTo(80, 350);
        ctx.lineTo(80, 80);
        ctx.stroke();
      }

      // Nettoyer et retourner
      setTimeout(() => {
        document.body.removeChild(tempContainer);
        resolve(canvas);
      }, 100);
    });
  };

  // ========================================
  // RENDU DU COMPOSANT
  // ========================================

  return (
    <div className="hidden">
      {/* Conteneur caché pour les graphiques */}
      <div ref={chartsContainerRef} className="absolute -left-[9999px]">
        {results.map((result, index) => (
          <div key={index} className="w-[800px] h-[400px] bg-white">
            <AdvancedChart
              result={result}
              anonymous={options.isAnonymous}
              className="w-full h-full"
            />
          </div>
        ))}
      </div>
      
      {/* Bouton de génération (caché, contrôlé par le parent) */}
      <button
        onClick={generatePDF}
        disabled={isGenerating}
        className="hidden"
      >
        Générer PDF
      </button>
    </div>
  );
};

export default PDFGenerator;
