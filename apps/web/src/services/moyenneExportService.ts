import { apiService } from './api';

export interface MoyennesExportResult {
  success: boolean;
  data?: {
    filename: string;
    filepath: string;
    fileSize: number;
    format: string;
    downloadUrl: string;
  };
  message?: string;
  error?: string;
}

export class MoyenneExportService {
  /**
   * Exporte les moyennes d'une évaluation au format Word
   */
  static async exportMoyennesToWord(
    classId: number,
    evaluationId: number
  ): Promise<MoyennesExportResult> {
    try {
      const response = await apiService.post(
        `/exports/moyennes/${classId}/${evaluationId}/word`
      );

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message
        };
      } else {
        return {
          success: false,
          error: response.error || 'Erreur lors de l\'export Word'
        };
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'export Word des moyennes:', error);
      
      if (error.response?.data?.error) {
        return {
          success: false,
          error: error.response.data.error
        };
      }
      
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      };
    }
  }

  /**
   * Exporte les moyennes d'une évaluation au format PDF
   */
  static async exportMoyennesToPDF(
    classId: number,
    evaluationId: number
  ): Promise<MoyennesExportResult> {
    try {
      const response = await apiService.post(
        `/exports/moyennes/${classId}/${evaluationId}`
      );

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message
        };
      } else {
        return {
          success: false,
          error: response.error || 'Erreur lors de l\'export'
        };
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'export des moyennes:', error);
      
      if (error.response?.data?.error) {
        return {
          success: false,
          error: error.response.data.error
        };
      }
      
      return {
        success: false,
        error: 'Erreur de connexion au serveur'
      };
    }
  }

  /**
   * Télécharge un fichier d'export
   */
  static async downloadExport(filename: string): Promise<void> {
    try {
      // Utiliser la méthode download du apiService
      await apiService.download(`/exports/download/${filename}`, filename);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      throw new Error('Erreur lors du téléchargement du fichier');
    }
  }

  /**
   * Exporte et télécharge directement les moyennes en PDF
   */
  static async exportAndDownload(
    classId: number,
    evaluationId: number
  ): Promise<void> {
    try {
      // Exporter les moyennes
      const exportResult = await this.exportMoyennesToPDF(classId, evaluationId);
      
      if (!exportResult.success || !exportResult.data) {
        throw new Error(exportResult.error || 'Erreur lors de l\'export');
      }

      // Télécharger le fichier
      await this.downloadExport(exportResult.data.filename);
    } catch (error) {
      console.error('Erreur lors de l\'export et téléchargement:', error);
      throw error;
    }
  }

  /**
   * Exporte et télécharge directement les moyennes en Word
   */
  static async exportAndDownloadWord(
    classId: number,
    evaluationId: number
  ): Promise<void> {
    try {
      // Exporter les moyennes
      const exportResult = await this.exportMoyennesToWord(classId, evaluationId);
      
      if (!exportResult.success || !exportResult.data) {
        throw new Error(exportResult.error || 'Erreur lors de l\'export Word');
      }

      // Télécharger le fichier
      await this.downloadExport(exportResult.data.filename);
    } catch (error) {
      console.error('Erreur lors de l\'export et téléchargement Word:', error);
      throw error;
    }
  }

  /**
   * Exporte le bilan annuel au format Word
   */
  static async exportBilanAnnuelToWord(exportData: any): Promise<Blob> {
    try {
      // Utiliser fetch avec la baseURL de l'API
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      // Utiliser uniquement sessionStorage (pas de persistance entre sessions)
      const token = sessionStorage.getItem('auth_token');
      
      const response = await fetch(`${baseURL}/export/bilan-annuel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du document');
      }

      return await response.blob();
    } catch (error) {
      console.error('Erreur lors de l\'export du bilan annuel:', error);
      throw error;
    }
  }

  /**
   * Formate la taille du fichier
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
