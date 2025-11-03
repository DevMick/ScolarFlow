// ========================================
// EXPORT SERVICE - SERVICE D'EXPORT TABLEAUX
// ========================================

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
// TODO: @edustats/shared/types n'existe pas
// Types locaux temporaires
type TableData = any;
type TableExportOptions = any;
type TableExportResult = any;
type CustomTable = any;
import { ServiceError } from '../../utils/errors';

/**
 * Service pour l'export des tableaux
 */
export class ExportService {
  private prisma: PrismaClient;
  private readonly EXPORT_DIR = path.join(process.cwd(), 'exports');

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.ensureExportDirectory();
  }

  /**
   * Exporte un tableau dans le format spécifié
   */
  async exportTable(
    tableData: TableData,
    table: CustomTable,
    options: TableExportOptions
  ): Promise<TableExportResult> {
    const startTime = Date.now();

    try {
      let result: TableExportResult;

      switch (options.format) {
        case 'excel':
          result = await this.exportToExcel(tableData, table, options);
          break;
        case 'csv':
          result = await this.exportToCSV(tableData, table, options);
          break;
        case 'pdf':
          result = await this.exportToPDF(tableData, table, options);
          break;
        case 'html':
          result = await this.exportToHTML(tableData, table, options);
          break;
        default:
          throw new ServiceError(`Format d'export non supporté: ${options.format}`);
      }

      const processingTime = Date.now() - startTime;
      result.metadata = {
        ...result.metadata,
        processingTime,
        exportedAt: new Date()
      };

      return result;
    } catch (error) {
      throw new ServiceError('Erreur lors de l\'export du tableau', error);
    }
  }

  /**
   * Exporte vers Excel
   */
  private async exportToExcel(
    tableData: TableData,
    table: CustomTable,
    options: TableExportOptions
  ): Promise<TableExportResult> {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Préparer les données
      const data: any[][] = [];
      
      // En-têtes
      if (options.includeHeaders) {
        data.push(tableData.headers);
      }

      // Données
      tableData.rows.forEach(row => {
        const rowData = row.cells.map(cell => {
          if (options.includeFormulas && cell.metadata?.formula) {
            return `=${cell.metadata.formula}`;
          }
          return cell.value;
        });
        data.push(rowData);
      });

      // Créer la feuille
      const worksheet = XLSX.utils.aoa_to_sheet(data);

      // Appliquer le formatage si demandé
      if (options.includeFormatting) {
        this.applyExcelFormatting(worksheet, table.config, tableData);
      }

      // Ajouter la feuille au classeur
      XLSX.utils.book_append_sheet(workbook, worksheet, table.name);

      // Générer le fichier
      const filename = options.filename || `${table.name}_${Date.now()}.xlsx`;
      const filepath = path.join(this.EXPORT_DIR, filename);
      
      XLSX.writeFile(workbook, filepath);

      const stats = fs.statSync(filepath);

      return {
        success: true,
        filename,
        downloadUrl: `/exports/${filename}`,
        size: stats.size,
        format: 'excel',
        metadata: {
          exportedAt: new Date()
        }
      };
    } catch (error) {
      throw new ServiceError('Erreur lors de l\'export Excel', error);
    }
  }

  /**
   * Exporte vers CSV
   */
  private async exportToCSV(
    tableData: TableData,
    table: CustomTable,
    options: TableExportOptions
  ): Promise<TableExportResult> {
    try {
      const lines: string[] = [];
      const separator = ';'; // Utiliser ; pour la compatibilité française

      // En-têtes
      if (options.includeHeaders) {
        lines.push(tableData.headers.map(header => this.escapeCsvValue(header)).join(separator));
      }

      // Données
      tableData.rows.forEach(row => {
        const rowData = row.cells.map(cell => {
          let value = cell.formattedValue || '';
          
          // Pour CSV, on préfère les valeurs formatées
          if (typeof cell.value === 'number' && !isNaN(cell.value)) {
            value = cell.value.toString().replace('.', ','); // Format français
          }
          
          return this.escapeCsvValue(value);
        });
        lines.push(rowData.join(separator));
      });

      const csvContent = lines.join('\n');
      const filename = options.filename || `${table.name}_${Date.now()}.csv`;
      const filepath = path.join(this.EXPORT_DIR, filename);

      // Ajouter BOM pour UTF-8 (compatibilité Excel)
      const bom = '\uFEFF';
      fs.writeFileSync(filepath, bom + csvContent, 'utf8');

      const stats = fs.statSync(filepath);

      return {
        success: true,
        filename,
        downloadUrl: `/exports/${filename}`,
        size: stats.size,
        format: 'csv',
        metadata: {
          exportedAt: new Date()
        }
      };
    } catch (error) {
      throw new ServiceError('Erreur lors de l\'export CSV', error);
    }
  }

  /**
   * Exporte vers PDF
   */
  private async exportToPDF(
    tableData: TableData,
    table: CustomTable,
    options: TableExportOptions
  ): Promise<TableExportResult> {
    try {
      // Pour le PDF, nous générons d'abord du HTML puis le convertissons
      const htmlContent = this.generateHTMLTable(tableData, table, options);
      
      // Ici, vous pourriez utiliser puppeteer ou une autre bibliothèque pour générer le PDF
      // Pour l'instant, nous sauvegardons le HTML
      const filename = options.filename || `${table.name}_${Date.now()}.html`;
      const filepath = path.join(this.EXPORT_DIR, filename);

      fs.writeFileSync(filepath, htmlContent, 'utf8');

      const stats = fs.statSync(filepath);

      return {
        success: true,
        filename,
        downloadUrl: `/exports/${filename}`,
        size: stats.size,
        format: 'html', // Temporairement HTML au lieu de PDF
        warnings: ['Export PDF non encore implémenté, fichier HTML généré'],
        metadata: {
          exportedAt: new Date()
        }
      };
    } catch (error) {
      throw new ServiceError('Erreur lors de l\'export PDF', error);
    }
  }

  /**
   * Exporte vers HTML
   */
  private async exportToHTML(
    tableData: TableData,
    table: CustomTable,
    options: TableExportOptions
  ): Promise<TableExportResult> {
    try {
      const htmlContent = this.generateHTMLTable(tableData, table, options);
      const filename = options.filename || `${table.name}_${Date.now()}.html`;
      const filepath = path.join(this.EXPORT_DIR, filename);

      fs.writeFileSync(filepath, htmlContent, 'utf8');

      const stats = fs.statSync(filepath);

      return {
        success: true,
        filename,
        downloadUrl: `/exports/${filename}`,
        size: stats.size,
        format: 'html',
        metadata: {
          exportedAt: new Date()
        }
      };
    } catch (error) {
      throw new ServiceError('Erreur lors de l\'export HTML', error);
    }
  }

  /**
   * Génère le contenu HTML du tableau
   */
  private generateHTMLTable(
    tableData: TableData,
    table: CustomTable,
    options: TableExportOptions
  ): string {
    const styles = this.generateTableCSS(table.config, options);
    
    let html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${table.name}</title>
    <style>${styles}</style>
</head>
<body>
    <div class="container">
        <header>
            ${options.customStyles?.headerLogo ? `<img src="${options.customStyles.headerLogo}" alt="Logo" class="logo">` : ''}
            <h1>${table.name}</h1>
            ${table.description ? `<p class="description">${table.description}</p>` : ''}
            <p class="export-info">Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        </header>
        
        <main>
            <table class="data-table">`;

    // En-têtes
    if (options.includeHeaders) {
      html += '<thead><tr>';
      tableData.headers.forEach(header => {
        html += `<th>${this.escapeHtml(header)}</th>`;
      });
      html += '</tr></thead>';
    }

    // Corps du tableau
    html += '<tbody>';
    tableData.rows.forEach((row, rowIndex) => {
      const rowClass = rowIndex % 2 === 0 ? 'even' : 'odd';
      html += `<tr class="${rowClass}">`;
      
      row.cells.forEach(cell => {
        const cellStyle = this.convertStyleToCSS(cell.style);
        html += `<td style="${cellStyle}">${this.escapeHtml(cell.formattedValue)}</td>`;
      });
      
      html += '</tr>';
    });
    html += '</tbody></table>';

    // Résumé
    if (tableData.summary) {
      html += `
        <div class="summary">
            <h3>Résumé</h3>
            <p>Nombre d'élèves: ${tableData.summary.totalRows}</p>
            <p>Calculé le: ${tableData.summary.calculatedAt.toLocaleDateString('fr-FR')}</p>
            ${tableData.summary.hasErrors ? `<p class="errors">Erreurs détectées: ${tableData.summary.errors?.length || 0}</p>` : ''}
        </div>`;
    }

    html += `
        </main>
        
        <footer>
            ${options.customStyles?.footerText || 'Généré par EduStats'}
            ${options.customStyles?.watermark ? `<div class="watermark">${options.customStyles.watermark}</div>` : ''}
        </footer>
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * Génère le CSS pour le tableau
   */
  private generateTableCSS(config: any, options: TableExportOptions): string {
    return `
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
        }
        
        .logo {
            max-height: 60px;
            margin-bottom: 10px;
        }
        
        h1 {
            color: #1f2937;
            margin: 10px 0;
        }
        
        .description {
            color: #6b7280;
            font-style: italic;
        }
        
        .export-info {
            color: #9ca3af;
            font-size: 0.9em;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        .data-table th {
            background-color: ${config.styling?.headerStyle?.backgroundColor || '#f3f4f6'};
            color: ${config.styling?.headerStyle?.textColor || '#1f2937'};
            font-weight: ${config.styling?.headerStyle?.fontWeight || 'bold'};
            padding: 12px 8px;
            text-align: ${config.styling?.headerStyle?.textAlign || 'center'};
            border: 1px solid #d1d5db;
        }
        
        .data-table td {
            padding: 8px;
            border: 1px solid #d1d5db;
            text-align: left;
        }
        
        .data-table tr.even {
            background-color: ${config.styling?.alternateRowColors ? (config.styling?.alternateRowColor || '#f9fafb') : 'transparent'};
        }
        
        .summary {
            margin-top: 30px;
            padding: 20px;
            background-color: #f8fafc;
            border-radius: 6px;
            border-left: 4px solid #3b82f6;
        }
        
        .summary h3 {
            margin-top: 0;
            color: #1f2937;
        }
        
        .errors {
            color: #dc2626;
            font-weight: bold;
        }
        
        footer {
            margin-top: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 0.9em;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            position: relative;
        }
        
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 3em;
            color: rgba(0,0,0,0.1);
            z-index: -1;
            pointer-events: none;
        }
        
        @media print {
            body { background-color: white; }
            .container { box-shadow: none; }
            .watermark { display: none; }
        }
    `;
  }

  /**
   * Applique le formatage Excel
   */
  private applyExcelFormatting(worksheet: any, config: any, tableData: TableData): void {
    // Ici, vous pourriez appliquer des styles Excel spécifiques
    // XLSX.js a des limitations pour le formatage, mais on peut faire quelques ajustements
    
    // Définir la largeur des colonnes
    const colWidths = config.columns?.map((col: any) => ({
      wch: col.formatting?.width ? col.formatting.width / 8 : 15
    })) || [];
    
    if (colWidths.length > 0) {
      worksheet['!cols'] = colWidths;
    }
  }

  /**
   * Échappe une valeur pour CSV
   */
  private escapeCsvValue(value: string): string {
    if (value.includes(';') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Échappe le HTML
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Convertit un style React en CSS
   */
  private convertStyleToCSS(style?: React.CSSProperties): string {
    if (!style) return '';
    
    return Object.entries(style)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .join('; ');
  }

  /**
   * Assure que le répertoire d'export existe
   */
  private ensureExportDirectory(): void {
    if (!fs.existsSync(this.EXPORT_DIR)) {
      fs.mkdirSync(this.EXPORT_DIR, { recursive: true });
    }
  }

  /**
   * Nettoie les anciens fichiers d'export
   */
  async cleanupOldExports(maxAgeHours = 24): Promise<void> {
    try {
      const files = fs.readdirSync(this.EXPORT_DIR);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        const filepath = path.join(this.EXPORT_DIR, file);
        const stats = fs.statSync(filepath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filepath);
        }
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des exports:', error);
    }
  }
}
