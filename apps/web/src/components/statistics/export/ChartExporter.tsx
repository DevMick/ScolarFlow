// ========================================
// CHART EXPORTER - EXPORT DE GRAPHIQUES
// ========================================

import React, { useState, useRef } from 'react';
import { 
  ArrowDownTrayIcon, 
  DocumentIcon, 
  PhotoIcon,
  TableCellsIcon,
  Cog6ToothIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { ReportGenerator } from './ReportGenerator';
import type { StatisticResult } from '@edustats/shared/types';
import { cn } from '../../../utils/classNames';
import { toast } from 'react-hot-toast';

/**
 * Formats d'export disponibles
 */
type ExportFormat = 'png' | 'jpeg' | 'pdf' | 'svg' | 'csv' | 'json';

/**
 * Options d'export
 */
interface ExportOptions {
  format: ExportFormat;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  includeMetadata: boolean;
  includeInsights: boolean;
  paperSize?: 'a4' | 'a3' | 'letter';
  orientation?: 'portrait' | 'landscape';
  title?: string;
  subtitle?: string;
}

/**
 * Props du composant ChartExporter
 */
interface ChartExporterProps {
  /** Résultat statistique à exporter */
  result: StatisticResult;
  /** Résultats additionnels pour les rapports */
  allResults?: StatisticResult[];
  /** Référence vers l'élément à exporter */
  chartRef: React.RefObject<HTMLElement>;
  /** Nom de fichier par défaut */
  defaultFilename?: string;
  /** Options d'export par défaut */
  defaultOptions?: Partial<ExportOptions>;
  /** Activer le générateur de rapports avancés */
  enableAdvancedReports?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Composant d'export pour les graphiques
 */
export const ChartExporter: React.FC<ChartExporterProps> = ({
  result,
  allResults,
  chartRef,
  defaultFilename,
  defaultOptions = {},
  enableAdvancedReports = true,
  className
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 'high',
    includeMetadata: true,
    includeInsights: false,
    paperSize: 'a4',
    orientation: 'landscape',
    title: result.configuration.name,
    subtitle: result.configuration.description,
    ...defaultOptions
  });

  // ========================================
  // CONFIGURATION DES FORMATS
  // ========================================

  const formatConfigs = {
    png: {
      label: 'PNG',
      description: 'Image haute qualité',
      icon: PhotoIcon,
      mimeType: 'image/png'
    },
    jpeg: {
      label: 'JPEG',
      description: 'Image compressée',
      icon: PhotoIcon,
      mimeType: 'image/jpeg'
    },
    pdf: {
      label: 'PDF',
      description: 'Document imprimable',
      icon: DocumentIcon,
      mimeType: 'application/pdf'
    },
    csv: {
      label: 'CSV',
      description: 'Données tabulaires',
      icon: TableCellsIcon,
      mimeType: 'text/csv'
    },
    json: {
      label: 'JSON',
      description: 'Données brutes',
      icon: Cog6ToothIcon,
      mimeType: 'application/json'
    }
  };

  const qualitySettings = {
    low: { scale: 1, quality: 0.3 },
    medium: { scale: 1.5, quality: 0.7 },
    high: { scale: 2, quality: 0.9 },
    ultra: { scale: 3, quality: 1.0 }
  };

  // ========================================
  // FONCTIONS D'EXPORT
  // ========================================

  const generateFilename = (format: ExportFormat): string => {
    const baseName = defaultFilename || 
      result.configuration.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${baseName}_${timestamp}.${format}`;
  };

  const exportAsImage = async (format: 'png' | 'jpeg'): Promise<void> => {
    if (!chartRef.current) {
      throw new Error('Référence au graphique non trouvée');
    }

    const { scale, quality } = qualitySettings[exportOptions.quality];
    
    const canvas = await html2canvas(chartRef.current, {
      scale,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: true,
      useCORS: true,
      width: chartRef.current.offsetWidth,
      height: chartRef.current.offsetHeight
    });

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            saveAs(blob, generateFilename(format));
            resolve();
          } else {
            reject(new Error('Impossible de générer l\'image'));
          }
        },
        formatConfigs[format].mimeType,
        quality
      );
    });
  };

  const exportAsPDF = async (): Promise<void> => {
    if (!chartRef.current) {
      throw new Error('Référence au graphique non trouvée');
    }

    const { scale } = qualitySettings[exportOptions.quality];
    
    const canvas = await html2canvas(chartRef.current, {
      scale,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: true,
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: exportOptions.orientation,
      unit: 'mm',
      format: exportOptions.paperSize
    });

    // Dimensions de la page
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Marges
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    const contentHeight = pageHeight - 2 * margin;

    // Calculer les dimensions de l'image
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(contentWidth / imgWidth, contentHeight / imgHeight);
    
    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;
    
    // Position centrée
    const x = (pageWidth - finalWidth) / 2;
    const y = margin;

    // Ajouter le titre si fourni
    if (exportOptions.title) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(exportOptions.title, pageWidth / 2, margin / 2, { align: 'center' });
    }

    // Ajouter le sous-titre si fourni
    if (exportOptions.subtitle) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(exportOptions.subtitle, pageWidth / 2, margin / 2 + 10, { align: 'center' });
    }

    // Ajouter l'image
    pdf.addImage(imgData, 'PNG', x, y + (exportOptions.title || exportOptions.subtitle ? 15 : 0), finalWidth, finalHeight);

    // Ajouter les métadonnées si demandées
    if (exportOptions.includeMetadata) {
      const metadataY = y + finalHeight + 20;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text(`Généré le: ${new Date(result.summary.calculatedAt).toLocaleString('fr-FR')}`, margin, metadataY);
      pdf.text(`Points de données: ${result.summary.totalDataPoints}`, margin, metadataY + 5);
      pdf.text(`Temps de traitement: ${result.summary.processingTime}ms`, margin, metadataY + 10);
    }

    // Ajouter les insights si demandés
    if (exportOptions.includeInsights && result.insights.length > 0) {
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Insights automatiques', margin, margin);
      
      let currentY = margin + 15;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      result.insights.forEach((insight, index) => {
        if (currentY > pageHeight - 30) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}. ${insight.title}`, margin, currentY);
        currentY += 7;
        
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(insight.description, contentWidth);
        pdf.text(lines, margin, currentY);
        currentY += lines.length * 5 + 5;
      });
    }

    pdf.save(generateFilename('pdf'));
  };

  const exportAsCSV = (): void => {
    const data = result.datasets[0]?.data || [];
    const headers = ['Label', 'Valeur', 'Métadonnées'];
    
    const csvContent = [
      headers.join(','),
      ...data.map(point => [
        `"${point.label || ''}"`,
        point.value,
        `"${point.metadata ? JSON.stringify(point.metadata) : ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, generateFilename('csv'));
  };

  const exportAsJSON = (): void => {
    const exportData = {
      configuration: result.configuration,
      summary: result.summary,
      statistics: result.statistics,
      datasets: result.datasets,
      ...(exportOptions.includeInsights && { insights: result.insights }),
      ...(exportOptions.includeMetadata && {
        metadata: {
          exportedAt: new Date().toISOString(),
          exportOptions
        }
      })
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    saveAs(blob, generateFilename('json'));
  };

  // ========================================
  // GESTION DE L'EXPORT
  // ========================================

  const handleExport = async (): Promise<void> => {
    setIsExporting(true);
    
    try {
      switch (exportOptions.format) {
        case 'png':
        case 'jpeg':
          await exportAsImage(exportOptions.format);
          break;
        case 'pdf':
          await exportAsPDF();
          break;
        case 'csv':
          exportAsCSV();
          break;
        case 'json':
          exportAsJSON();
          break;
        default:
          throw new Error(`Format ${exportOptions.format} non supporté`);
      }
      
      toast.success(`Export ${exportOptions.format.toUpperCase()} réussi !`);
    } catch (error: any) {
      console.error('Erreur export:', error);
      toast.error(`Erreur lors de l'export: ${error.message}`);
    } finally {
      setIsExporting(false);
      setShowOptions(false);
    }
  };

  const handleQuickExport = async (format: ExportFormat): Promise<void> => {
    setExportOptions(prev => ({ ...prev, format }));
    
    // Export immédiat avec les options par défaut
    const tempOptions = { ...exportOptions, format };
    setIsExporting(true);
    
    try {
      switch (format) {
        case 'png':
          await exportAsImage('png');
          break;
        case 'pdf':
          await exportAsPDF();
          break;
        case 'csv':
          exportAsCSV();
          break;
        default:
          throw new Error(`Format ${format} non supporté pour l'export rapide`);
      }
      
      toast.success(`Export ${format.toUpperCase()} réussi !`);
    } catch (error: any) {
      console.error('Erreur export rapide:', error);
      toast.error(`Erreur lors de l'export: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className={cn('relative', className)}>
      {/* Bouton principal */}
      <div className="flex items-center space-x-2">
        {/* Export rapide */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleQuickExport('png')}
            disabled={isExporting}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors disabled:opacity-50"
            title="Export PNG rapide"
          >
            <PhotoIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleQuickExport('pdf')}
            disabled={isExporting}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors disabled:opacity-50"
            title="Export PDF rapide"
          >
            <DocumentIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleQuickExport('csv')}
            disabled={isExporting}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors disabled:opacity-50"
            title="Export CSV rapide"
          >
            <TableCellsIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Options avancées */}
        <button
          onClick={() => setShowOptions(!showOptions)}
          disabled={isExporting}
          className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Export...
            </>
          ) : (
            <>
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Exporter
            </>
          )}
        </button>

        {/* Générateur de rapports avancés */}
        {enableAdvancedReports && allResults && allResults.length > 0 && (
          <ReportGenerator
            results={allResults}
            primaryResult={result}
            className="ml-2"
          />
        )}
      </div>

      {/* Modal d'options */}
      {showOptions && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <h3 className="font-medium text-gray-900 mb-4">Options d'export</h3>
          
          {/* Format */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(formatConfigs).map(([format, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={format}
                    onClick={() => setExportOptions(prev => ({ ...prev, format: format as ExportFormat }))}
                    className={cn(
                      'flex items-center p-2 border rounded text-left transition-colors',
                      exportOptions.format === format
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-300 hover:border-gray-400'
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <div>
                      <div className="text-sm font-medium">{config.label}</div>
                      <div className="text-xs text-gray-500">{config.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Qualité */}
          {['png', 'jpeg', 'pdf'].includes(exportOptions.format) && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Qualité</label>
              <select
                value={exportOptions.quality}
                onChange={(e) => setExportOptions(prev => ({ ...prev, quality: e.target.value as any }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="low">Basse (rapide)</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="ultra">Ultra (lent)</option>
              </select>
            </div>
          )}

          {/* Options PDF */}
          {exportOptions.format === 'pdf' && (
            <div className="mb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taille de page</label>
                <select
                  value={exportOptions.paperSize}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, paperSize: e.target.value as any }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="a4">A4</option>
                  <option value="a3">A3</option>
                  <option value="letter">Letter</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
                <select
                  value={exportOptions.orientation}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, orientation: e.target.value as any }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="landscape">Paysage</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>
            </div>
          )}

          {/* Options générales */}
          <div className="mb-4 space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeMetadata}
                onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                className="form-checkbox h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Inclure les métadonnées</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeInsights}
                onChange={(e) => setExportOptions(prev => ({ ...prev, includeInsights: e.target.checked }))}
                className="form-checkbox h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Inclure les insights</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowOptions(false)}
              className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-3 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Exporter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartExporter;
