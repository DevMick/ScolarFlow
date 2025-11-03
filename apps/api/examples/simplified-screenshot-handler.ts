// Gestionnaire simplifié des captures d'écran (sans screenshot_type)
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

export class SimplifiedScreenshotHandler {
  
  /**
   * Détecter le type MIME d'un buffer d'image
   */
  private static detectMimeType(buffer: Buffer): string {
    // Détection basée sur les magic bytes
    if (buffer.length < 4) return 'application/octet-stream';
    
    // JPEG
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg';
    }
    
    // PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'image/png';
    }
    
    // GIF
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'image/gif';
    }
    
    // WebP
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      return 'image/webp';
    }
    
    // Par défaut
    return 'application/octet-stream';
  }
  
  /**
   * Sauvegarder une capture d'écran
   */
  static async saveScreenshot(userId: number, imageBuffer: Buffer) {
    try {
      const paiement = await prisma.paiement.create({
        data: {
          userId,
          screenshot: imageBuffer,
          isPaid: false
        }
      });
      
      console.log(`Capture d'écran sauvegardée pour le paiement ID: ${paiement.id}`);
      return paiement;
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw error;
    }
  }
  
  /**
   * Récupérer une capture d'écran avec détection automatique du type
   */
  static async getScreenshot(paiementId: number) {
    try {
      const paiement = await prisma.paiement.findUnique({
        where: { id: paiementId },
        select: {
          id: true,
          screenshot: true,
          isPaid: true,
          datePaiement: true
        }
      });
      
      if (!paiement || !paiement.screenshot) {
        return null;
      }
      
      // Détection automatique du type MIME
      const mimeType = this.detectMimeType(paiement.screenshot);
      
      // Convertir en base64 pour l'affichage
      const base64 = paiement.screenshot.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;
      
      return {
        ...paiement,
        dataUrl,
        mimeType,
        size: paiement.screenshot.length
      };
      
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
      throw error;
    }
  }
  
  /**
   * Sauvegarder depuis un fichier
   */
  static async saveScreenshotFromFile(userId: number, filePath: string) {
    try {
      const imageBuffer = fs.readFileSync(filePath);
      return await this.saveScreenshot(userId, imageBuffer);
      
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
      throw error;
    }
  }
  
  /**
   * Sauvegarder depuis un upload (base64)
   */
  static async saveScreenshotFromBase64(userId: number, base64Data: string) {
    try {
      // Supprimer le préfixe data:image/...;base64, si présent
      const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      const imageBuffer = Buffer.from(base64, 'base64');
      
      return await this.saveScreenshot(userId, imageBuffer);
      
    } catch (error) {
      console.error('Erreur lors de la conversion base64:', error);
      throw error;
    }
  }
  
  /**
   * Lister les paiements avec captures d'écran
   */
  static async getPaiementsWithScreenshots(userId?: number) {
    try {
      const where = userId ? { userId } : {};
      
      const paiements = await prisma.paiement.findMany({
        where: {
          ...where,
          screenshot: { not: null }
        },
        select: {
          id: true,
          userId: true,
          datePaiement: true,
          isPaid: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return paiements;
      
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements:', error);
      throw error;
    }
  }
  
  /**
   * Obtenir les statistiques des captures
   */
  static async getScreenshotStats(userId?: number) {
    try {
      const where = userId ? { userId } : {};
      
      const total = await prisma.paiement.count({
        where: {
          ...where,
          screenshot: { not: null }
        }
      });
      
      const totalSize = await this.getTotalScreenshotSize(where);
      
      return {
        total,
        totalSize,
        averageSize: total > 0 ? Math.round(totalSize / total) : 0
      };
      
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }
  
  /**
   * Calculer la taille totale des captures
   */
  private static async getTotalScreenshotSize(where: any) {
    try {
      const paiements = await prisma.paiement.findMany({
        where: {
          ...where,
          screenshot: { not: null }
        },
        select: { screenshot: true }
      });
      
      return paiements.reduce((total, paiement) => {
        return total + (paiement.screenshot?.length || 0);
      }, 0);
      
    } catch (error) {
      console.error('Erreur lors du calcul de la taille:', error);
      return 0;
    }
  }
  
  /**
   * Supprimer une capture d'écran
   */
  static async deleteScreenshot(paiementId: number) {
    try {
      const paiement = await prisma.paiement.update({
        where: { id: paiementId },
        data: {
          screenshot: null
        }
      });
      
      return paiement;
      
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }
}

// Exemple d'utilisation
export async function exampleUsage() {
  try {
    // 1. Sauvegarder depuis un fichier
    const paiement1 = await SimplifiedScreenshotHandler.saveScreenshotFromFile(
      1, 
      './uploads/screenshot.jpg'
    );
    
    // 2. Sauvegarder depuis base64 (upload web)
    const paiement2 = await SimplifiedScreenshotHandler.saveScreenshotFromBase64(
      1,
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...'
    );
    
    // 3. Récupérer avec détection automatique du type
    const screenshot = await SimplifiedScreenshotHandler.getScreenshot(paiement1.id);
    console.log('Type détecté:', screenshot?.mimeType);
    console.log('Image prête:', screenshot?.dataUrl);
    
    // 4. Statistiques
    const stats = await SimplifiedScreenshotHandler.getScreenshotStats(1);
    console.log('Statistiques:', stats);
    
  } catch (error) {
    console.error('Erreur dans l\'exemple:', error);
  }
}
