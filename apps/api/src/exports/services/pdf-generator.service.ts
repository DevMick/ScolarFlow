import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { EvaluationPDFData, PDFExportResult } from '../dto/pdf-export.dto';
import { Logger } from '../../utils/logger';
import '../templates/helpers';

export class PdfGeneratorService {
  private browser: puppeteer.Browser | null = null;

  constructor() {
    this.initializeBrowser();
  }

  private async initializeBrowser() {
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      Logger.info('Puppeteer browser initialized successfully');
    } catch (error) {
      Logger.error('Failed to initialize Puppeteer browser:', error);
      throw error;
    }
  }

  /**
   * MÉTHODE PRINCIPALE : Génère le bulletin PDF complet avec Puppeteer
   */
  async generateBulletinPDF(data: EvaluationPDFData): Promise<PDFExportResult> {
    if (!this.browser) {
      await this.initializeBrowser();
    }

    try {
      const page = await this.browser!.newPage();
      
      // Configuration de la page
      await page.setViewport({ width: 1200, height: 800 });
      
      // Générer le HTML avec le template
      const html = await this.generateHTML(data);
      
      // Charger le HTML dans la page
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Générer le PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(),
        footerTemplate: this.getFooterTemplate()
      });

      await page.close();

      // Sauvegarder le fichier
      const filename = this.generateFilename(data);
      const filepath = path.join(process.cwd(), 'uploads', 'exports', filename);
      
      // Créer le dossier s'il n'existe pas
      const uploadsDir = path.dirname(filepath);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      fs.writeFileSync(filepath, pdfBuffer);

      Logger.info(`PDF generated successfully: ${filename}`);

      return {
        success: true,
        filename,
        filepath,
        fileSize: pdfBuffer.length,
        format: 'PDF',
        downloadUrl: `/api/exports/download/${filename}`
      };

    } catch (error) {
      Logger.error('Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  private async generateHTML(data: EvaluationPDFData): Promise<string> {
    // Chemin vers le template
    const templatePath = path.join(process.cwd(), 'src', 'exports', 'templates', 'bulletin.hbs');
    
    // Lire le template
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    
    // Compiler le template Handlebars
    const template = handlebars.compile(templateSource);
    
    // Préparer les données pour le template
    const templateData = {
      ...data,
      generatedAt: new Date().toLocaleString('fr-FR'),
      pageTitle: `Bulletin de Notes - ${data.evaluationData.nom}`
    };

    // Rendre le template avec les données
    return template(templateData);
  }

  private generateFilename(data: EvaluationPDFData): string {
    const className = data.classData.name.replace(/[^a-zA-Z0-9]/g, '_');
    const evaluationName = data.evaluationData.nom.replace(/[^a-zA-Z0-9]/g, '_');
    const date = new Date().toISOString().split('T')[0];
    
    return `bulletin_${className}_${evaluationName}_${date}.pdf`;
  }

  private getHeaderTemplate(): string {
    return `
      <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
      </div>
    `;
  }

  private getFooterTemplate(): string {
    return `
      <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
        <span>Page <span class="pageNumber"></span> sur <span class="totalPages"></span></span>
      </div>
    `;
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      Logger.info('Puppeteer browser closed');
    }
  }
}
