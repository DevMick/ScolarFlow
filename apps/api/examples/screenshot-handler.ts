// Exemple de gestion des captures d'écran avec stockage binaire
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export class ScreenshotHandler {
  
  /**
   * Sauvegarder une capture d'écran dans la base de données
   */
  static async saveScreenshot(
    userId: number, 
    imagePath: string, 
    mimeType: string = 'image/jpeg'
  ) {
    try {
      // Lire le fichier image
      const imageBuffer = fs.readFileSync(imagePath);
      
      // Créer le paiement avec la capture
      const paiement = await prisma.paiement.create({
        data: {
          userId,
          screenshot: imageBuffer,
          screenshotType: mimeType,
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
   * Récupérer une capture d'écran depuis la base de données
   */
  static async getScreenshot(paiementId: number) {
    try {
      const paiement = await prisma.paiement.findUnique({
        where: { id: paiementId },
        select: {
          id: true,
          screenshot: true,
          screenshotType: true,
          isPaid: true,
          datePaiement: true
        }
      });
      
      if (!paiement || !paiement.screenshot) {
        return null;
      }
      
      // Convertir en base64 pour l'affichage
      const base64 = paiement.screenshot.toString('base64');
      const dataUrl = `data:${paiement.screenshotType};base64,${base64}`;
      
      return {
        ...paiement,
        dataUrl,
        size: paiement.screenshot.length
      };
      
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
      throw error;
    }
  }
  
  /**
   * Sauvegarder une capture d'écran depuis un Buffer (upload direct)
   */
  static async saveScreenshotFromBuffer(
    userId: number,
    imageBuffer: Buffer,
    mimeType: string
  ) {
    try {
      const paiement = await prisma.paiement.create({
        data: {
          userId,
          screenshot: imageBuffer,
          screenshotType: mimeType,
          isPaid: false
        }
      });
      
      return paiement;
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du buffer:', error);
      throw error;
    }
  }
  
  /**
   * Lister tous les paiements avec captures d'écran
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
          screenshotType: true,
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
   * Supprimer une capture d'écran
   */
  static async deleteScreenshot(paiementId: number) {
    try {
      const paiement = await prisma.paiement.update({
        where: { id: paiementId },
        data: {
          screenshot: null,
          screenshotType: null
        }
      });
      
      return paiement;
      
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }
  
  /**
   * Obtenir les statistiques des captures d'écran
   */
  static async getScreenshotStats(userId?: number) {
    try {
      const where = userId ? { userId } : {};
      
      const stats = await prisma.paiement.groupBy({
        by: ['screenshotType'],
        where: {
          ...where,
          screenshot: { not: null }
        },
        _count: {
          id: true
        }
      });
      
      const total = await prisma.paiement.count({
        where: {
          ...where,
          screenshot: { not: null }
        }
      });
      
      return {
        total,
        byType: stats,
        totalSize: await this.getTotalScreenshotSize(where)
      };
      
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }
  
  /**
   * Calculer la taille totale des captures d'écran
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
}

// Exemple d'utilisation
export async function exampleUsage() {
  try {
    // 1. Sauvegarder une capture d'écran depuis un fichier
    const paiement1 = await ScreenshotHandler.saveScreenshot(
      1, 
      './uploads/screenshot.jpg', 
      'image/jpeg'
    );
    
    // 2. Récupérer la capture d'écran
    const screenshot = await ScreenshotHandler.getScreenshot(paiement1.id);
    console.log('Capture récupérée:', screenshot?.dataUrl);
    
    // 3. Lister les paiements avec captures
    const paiements = await ScreenshotHandler.getPaiementsWithScreenshots(1);
    console.log('Paiements avec captures:', paiements);
    
    // 4. Obtenir les statistiques
    const stats = await ScreenshotHandler.getScreenshotStats(1);
    console.log('Statistiques:', stats);
    
  } catch (error) {
    console.error('Erreur dans l\'exemple:', error);
  }
}
