import { Router, Request, Response } from 'express';
import { BilanExportService } from '../services/bilanExportService';

const router: Router = Router();

// Route pour exporter le bilan annuel en Word
router.post('/bilan-annuel', async (req: Request, res: Response) => {
  try {
    const { className, schoolYear, students, stats, userData, classThreshold } = req.body;

    if (!className || !schoolYear || !students || !stats) {
      return res.status(400).json({ 
        success: false, 
        message: 'Données manquantes pour l\'exportation' 
      });
    }

    const exportData = {
      className,
      schoolYear,
      students,
      stats,
      userData,
      classThreshold
    };

    const buffer = await BilanExportService.generateBilanWord(exportData);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="Bilan_Annuel_${className}_${schoolYear}.docx"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error('Erreur lors de l\'export du bilan annuel:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la génération du document' 
    });
  }
});

export default router;
