// ========================================
// TABLES CONTROLLER - CONTRÔLEUR TABLEAUX PERSONNALISÉS
// ========================================

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  CustomTableService, 
  TemplateService, 
  ExportService 
} from '../services/tables';
import { 
  CreateCustomTableData, 
  UpdateCustomTableData,
  TableExportOptions
} from '@edustats/shared/types';
import { AuthenticatedRequest } from '../types/express';

const prisma = new PrismaClient();
const customTableService = new CustomTableService(prisma);
const templateService = new TemplateService(prisma);
const exportService = new ExportService(prisma);

/**
 * Crée un nouveau tableau personnalisé
 */
export const createCustomTable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const tableData: CreateCustomTableData = req.body;

    const table = await customTableService.createTable(userId, tableData);

    res.status(201).json({
      success: true,
      message: 'Tableau créé avec succès',
      data: table
    });
  } catch (error) {
    console.error('Erreur création tableau:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la création du tableau'
    });
  }
};

/**
 * Obtient tous les tableaux de l'utilisateur
 */
export const getCustomTables = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      category,
      classId,
      isTemplate,
      search,
      page = '1',
      limit = '20'
    } = req.query;

    const options = {
      category: category as any,
      classId: classId ? parseInt(classId as string) : undefined,
      isTemplate: isTemplate === 'true' ? true : isTemplate === 'false' ? false : undefined,
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await customTableService.getTablesByUser(userId, options);

    res.json({
      success: true,
      data: result.tables,
      pagination: {
        page: options.page,
        limit: options.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / options.limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération tableaux:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tableaux'
    });
  }
};

/**
 * Obtient un tableau par ID
 */
export const getCustomTableById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { tableId } = req.params;

    const table = await customTableService.getTableById(userId, tableId);

    res.json({
      success: true,
      data: table
    });
  } catch (error) {
    console.error('Erreur récupération tableau:', error);
    const statusCode = error instanceof Error && error.message.includes('non trouvé') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la récupération du tableau'
    });
  }
};

/**
 * Met à jour un tableau
 */
export const updateCustomTable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { tableId } = req.params;
    const updateData: UpdateCustomTableData = req.body;

    const table = await customTableService.updateTable(userId, tableId, updateData);

    res.json({
      success: true,
      message: 'Tableau mis à jour avec succès',
      data: table
    });
  } catch (error) {
    console.error('Erreur mise à jour tableau:', error);
    const statusCode = error instanceof Error && error.message.includes('non trouvé') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du tableau'
    });
  }
};

/**
 * Supprime un tableau
 */
export const deleteCustomTable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { tableId } = req.params;

    await customTableService.deleteTable(userId, tableId);

    res.json({
      success: true,
      message: 'Tableau supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression tableau:', error);
    const statusCode = error instanceof Error && error.message.includes('non trouvé') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la suppression du tableau'
    });
  }
};

/**
 * Génère les données d'un tableau
 */
export const generateTableData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { tableId } = req.params;

    const tableData = await customTableService.generateTableData(userId, tableId);

    res.json({
      success: true,
      data: tableData
    });
  } catch (error) {
    console.error('Erreur génération données tableau:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la génération des données'
    });
  }
};

/**
 * Duplique un tableau
 */
export const duplicateCustomTable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { tableId } = req.params;
    const { newName } = req.body;

    const duplicatedTable = await customTableService.duplicateTable(userId, tableId, newName);

    res.status(201).json({
      success: true,
      message: 'Tableau dupliqué avec succès',
      data: duplicatedTable
    });
  } catch (error) {
    console.error('Erreur duplication tableau:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la duplication du tableau'
    });
  }
};

/**
 * Exporte un tableau
 */
export const exportCustomTable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { tableId } = req.params;
    const exportOptions: TableExportOptions = req.body;

    // Récupérer le tableau et ses données
    const table = await customTableService.getTableById(userId, tableId);
    const tableData = await customTableService.generateTableData(userId, tableId);

    // Exporter
    const exportResult = await exportService.exportTable(tableData, table, exportOptions);

    res.json({
      success: true,
      message: 'Export généré avec succès',
      data: exportResult
    });
  } catch (error) {
    console.error('Erreur export tableau:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de l\'export du tableau'
    });
  }
};

// ========================================
// CONTRÔLEURS TEMPLATES
// ========================================

/**
 * Obtient tous les templates disponibles
 */
export const getTemplates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      category,
      isOfficial,
      search,
      page = '1',
      limit = '20'
    } = req.query;

    const options = {
      category: category as any,
      isOfficial: isOfficial === 'true' ? true : isOfficial === 'false' ? false : undefined,
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await templateService.getTemplates(userId, options);

    res.json({
      success: true,
      data: result.templates,
      pagination: {
        page: options.page,
        limit: options.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / options.limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération templates:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des templates'
    });
  }
};

/**
 * Obtient un template par ID
 */
export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;

    const template = await templateService.getTemplateById(templateId);

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Erreur récupération template:', error);
    const statusCode = error instanceof Error && error.message.includes('non trouvé') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la récupération du template'
    });
  }
};

/**
 * Utilise un template pour créer un tableau
 */
export const useTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { templateId } = req.params;
    const { customizations } = req.body;

    const templateConfig = await templateService.useTemplate(templateId);

    // Appliquer les personnalisations si fournies
    const finalConfig = customizations ? { ...templateConfig, ...customizations } : templateConfig;

    res.json({
      success: true,
      message: 'Template appliqué avec succès',
      data: finalConfig
    });
  } catch (error) {
    console.error('Erreur utilisation template:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de l\'utilisation du template'
    });
  }
};

/**
 * Crée un template à partir d'un tableau
 */
export const createTemplateFromTable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { tableId } = req.params;
    const templateData = req.body;

    const template = await templateService.createTemplateFromTable(userId, tableId, templateData);

    res.status(201).json({
      success: true,
      message: 'Template créé avec succès',
      data: template
    });
  } catch (error) {
    console.error('Erreur création template:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la création du template'
    });
  }
};

/**
 * Obtient les templates populaires
 */
export const getPopularTemplates = async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query;

    const templates = await templateService.getPopularTemplates(parseInt(limit as string));

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Erreur récupération templates populaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des templates populaires'
    });
  }
};

/**
 * Obtient les templates par catégorie
 */
export const getTemplatesByCategory = async (req: Request, res: Response) => {
  try {
    const templatesByCategory = await templateService.getTemplatesByCategory();

    res.json({
      success: true,
      data: templatesByCategory
    });
  } catch (error) {
    console.error('Erreur récupération templates par catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des templates par catégorie'
    });
  }
};

/**
 * Obtient les statistiques des templates
 */
export const getTemplateStats = async (req: Request, res: Response) => {
  try {
    const stats = await templateService.getTemplateStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur récupération statistiques templates:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};
