// ========================================
// VALIDATION TABLEAUX PERSONNALISÉS - SCHÉMAS ZOD
// ========================================

import { z } from 'zod';
import { 
  TableCategory, 
  ColumnType, 
  FormulaResultType, 
  ConditionOperator, 
  TextAlignment 
} from '../types/tables';

// ========================================
// SCHÉMAS DE BASE
// ========================================

/**
 * Schéma pour les conditions de formatage
 */
export const conditionalFormatSchema = z.object({
  id: z.string().min(1, 'ID de condition requis'),
  condition: z.object({
    operator: z.nativeEnum(ConditionOperator, {
      errorMap: () => ({ message: 'Opérateur de condition invalide' })
    }),
    value: z.any(),
    value2: z.any().optional()
  }),
  style: z.object({
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    fontWeight: z.enum(['normal', 'bold']).optional(),
    fontStyle: z.enum(['normal', 'italic']).optional(),
    border: z.string().optional(),
    icon: z.string().optional()
  })
});

/**
 * Schéma pour le formatage des colonnes
 */
export const columnFormattingSchema = z.object({
  width: z.number().min(50).max(500).optional(),
  alignment: z.nativeEnum(TextAlignment, {
    errorMap: () => ({ message: 'Alignement invalide' })
  }),
  numberFormat: z.string().optional(),
  conditionalFormatting: z.array(conditionalFormatSchema).optional()
});

/**
 * Schéma pour les formules
 */
export const formulaSchema = z.object({
  expression: z.string().min(1, 'Expression de formule requise').max(1000, 'Expression trop longue'),
  variables: z.array(z.string()).default([]),
  resultType: z.nativeEnum(FormulaResultType, {
    errorMap: () => ({ message: 'Type de résultat invalide' })
  })
});

/**
 * Schéma pour les sources de données
 */
export const columnSourceSchema = z.object({
  field: z.string().optional(),
  evaluationId: z.number().optional(),
  staticValue: z.string().optional()
});

/**
 * Schéma pour une colonne de tableau
 */
export const tableColumnSchema = z.object({
  id: z.string().min(1, 'ID de colonne requis'),
  label: z.string().min(1, 'Label de colonne requis').max(100, 'Label trop long'),
  type: z.nativeEnum(ColumnType, {
    errorMap: () => ({ message: 'Type de colonne invalide' })
  }),
  source: columnSourceSchema.optional(),
  formula: formulaSchema.optional(),
  formatting: columnFormattingSchema,
  sortable: z.boolean().default(true),
  filterable: z.boolean().default(true),
  exportable: z.boolean().default(true)
}).refine((data) => {
  // Validation conditionnelle selon le type
  if (data.type === ColumnType.Formula && !data.formula) {
    return false;
  }
  if (data.type === ColumnType.Static && !data.source?.staticValue) {
    return false;
  }
  if (data.type === ColumnType.EvaluationScore && !data.source?.evaluationId) {
    return false;
  }
  if (data.type === ColumnType.StudentInfo && !data.source?.field) {
    return false;
  }
  return true;
}, {
  message: 'Configuration de colonne invalide selon le type'
});

/**
 * Schéma pour la configuration des lignes
 */
export const tableRowConfigSchema = z.object({
  groupBy: z.string().optional(),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  showTotals: z.boolean().optional(),
  showAverages: z.boolean().optional()
});

/**
 * Schéma pour le style du tableau
 */
export const tableStylingSchema = z.object({
  headerStyle: z.object({
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    fontWeight: z.enum(['normal', 'bold']).optional(),
    fontSize: z.number().min(8).max(24).optional(),
    textAlign: z.nativeEnum(TextAlignment).optional()
  }).optional(),
  bodyStyle: z.object({
    fontSize: z.number().min(8).max(24).optional(),
    fontFamily: z.string().optional()
  }).optional(),
  alternateRowColors: z.boolean().optional(),
  alternateRowColor: z.string().optional(),
  showBorders: z.boolean().optional(),
  borderColor: z.string().optional(),
  borderWidth: z.number().min(0).max(5).optional(),
  showGridLines: z.boolean().optional(),
  gridLineColor: z.string().optional(),
  padding: z.number().min(0).max(20).optional(),
  margin: z.number().min(0).max(50).optional()
});

/**
 * Schéma pour les filtres du tableau
 */
export const tableFiltersSchema = z.object({
  enabled: z.boolean(),
  filters: z.array(z.object({
    columnId: z.string(),
    operator: z.nativeEnum(ConditionOperator),
    value: z.any(),
    value2: z.any().optional()
  }))
});

/**
 * Schéma pour le tri du tableau
 */
export const tableSortingSchema = z.object({
  enabled: z.boolean(),
  defaultSort: z.object({
    columnId: z.string(),
    direction: z.enum(['asc', 'desc'])
  }).optional(),
  multiSort: z.boolean().optional()
});

/**
 * Schéma pour la configuration complète d'un tableau
 */
export const customTableConfigSchema = z.object({
  columns: z.array(tableColumnSchema)
    .min(1, 'Au moins une colonne est requise')
    .max(50, 'Maximum 50 colonnes autorisées'),
  rows: tableRowConfigSchema,
  styling: tableStylingSchema,
  filters: tableFiltersSchema,
  sorting: tableSortingSchema
});

// ========================================
// SCHÉMAS POUR LES OPÉRATIONS CRUD
// ========================================

/**
 * Schéma pour créer un tableau personnalisé
 */
export const createCustomTableSchema = z.object({
  name: z.string()
    .min(1, 'Le nom du tableau est requis')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .trim(),
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  category: z.nativeEnum(TableCategory, {
    errorMap: () => ({ message: 'Catégorie invalide' })
  }),
  classId: z.number().positive('ID de classe invalide').optional(),
  config: customTableConfigSchema,
  isTemplate: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags').default([])
});

/**
 * Schéma pour mettre à jour un tableau personnalisé
 */
export const updateCustomTableSchema = z.object({
  name: z.string()
    .min(1, 'Le nom du tableau est requis')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  category: z.nativeEnum(TableCategory).optional(),
  config: customTableConfigSchema.partial().optional(),
  isTemplate: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags').optional()
});

/**
 * Schéma pour créer un template
 */
export const createTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Le nom du template est requis')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .trim(),
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  category: z.nativeEnum(TableCategory, {
    errorMap: () => ({ message: 'Catégorie invalide' })
  }),
  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags').default([])
});

/**
 * Schéma pour les options d'export
 */
export const exportTableSchema = z.object({
  format: z.enum(['pdf', 'excel', 'csv', 'html'], {
    errorMap: () => ({ message: 'Format d\'export invalide' })
  }),
  filename: z.string().max(255).optional(),
  includeHeaders: z.boolean().default(true),
  includeFormatting: z.boolean().default(true),
  includeFormulas: z.boolean().default(false),
  pageOrientation: z.enum(['portrait', 'landscape']).default('portrait'),
  paperSize: z.enum(['A4', 'A3', 'Letter']).default('A4'),
  margins: z.object({
    top: z.number().min(0).max(50),
    right: z.number().min(0).max(50),
    bottom: z.number().min(0).max(50),
    left: z.number().min(0).max(50)
  }).optional(),
  customStyles: z.object({
    headerLogo: z.string().url().optional(),
    footerText: z.string().max(200).optional(),
    watermark: z.string().max(100).optional()
  }).optional()
});

/**
 * Schéma pour dupliquer un tableau
 */
export const duplicateTableSchema = z.object({
  newName: z.string()
    .min(1, 'Le nouveau nom est requis')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .trim()
    .optional()
});

/**
 * Schéma pour utiliser un template
 */
export const useTemplateSchema = z.object({
  customizations: z.object({
    name: z.string().max(200).optional(),
    classId: z.number().positive().optional(),
    config: customTableConfigSchema.partial().optional()
  }).optional()
});

// ========================================
// SCHÉMAS POUR LES FORMULES
// ========================================

/**
 * Schéma pour valider une expression de formule
 */
export const validateFormulaSchema = z.object({
  expression: z.string().min(1, 'Expression requise').max(1000, 'Expression trop longue'),
  variables: z.record(z.any()).default({}),
  context: z.object({
    studentId: z.number().optional(),
    classId: z.number().optional(),
    evaluationIds: z.array(z.number()).optional()
  }).optional()
});

/**
 * Schéma pour créer une formule personnalisée
 */
export const createCustomFormulaSchema = z.object({
  name: z.string()
    .min(1, 'Nom de formule requis')
    .max(100, 'Nom trop long')
    .trim(),
  description: z.string()
    .max(500, 'Description trop longue')
    .optional(),
  expression: z.string()
    .min(1, 'Expression requise')
    .max(1000, 'Expression trop longue'),
  category: z.string().max(50).default('custom'),
  variables: z.array(z.string()).default([]),
  resultType: z.nativeEnum(FormulaResultType),
  isPublic: z.boolean().default(false)
});

// ========================================
// MESSAGES D'ERREUR PERSONNALISÉS
// ========================================

export const TABLE_VALIDATION_MESSAGES = {
  // Messages généraux
  REQUIRED: 'Ce champ est requis',
  TOO_LONG: 'Valeur trop longue',
  TOO_SHORT: 'Valeur trop courte',
  INVALID_FORMAT: 'Format invalide',
  
  // Messages spécifiques aux tableaux
  TABLE_NAME_REQUIRED: 'Le nom du tableau est requis',
  TABLE_NAME_TOO_LONG: 'Le nom du tableau ne peut pas dépasser 200 caractères',
  COLUMNS_REQUIRED: 'Au moins une colonne est requise',
  TOO_MANY_COLUMNS: 'Maximum 50 colonnes autorisées',
  COLUMN_LABEL_REQUIRED: 'Le label de la colonne est requis',
  FORMULA_EXPRESSION_REQUIRED: 'Expression de formule requise pour les colonnes calculées',
  STATIC_VALUE_REQUIRED: 'Valeur statique requise pour les colonnes statiques',
  EVALUATION_ID_REQUIRED: 'ID d\'évaluation requis pour les colonnes de notes',
  STUDENT_FIELD_REQUIRED: 'Champ élève requis pour les colonnes d\'information',
  
  // Messages d'export
  EXPORT_FORMAT_INVALID: 'Format d\'export invalide',
  FILENAME_TOO_LONG: 'Nom de fichier trop long',
  
  // Messages de formules
  FORMULA_TOO_LONG: 'Expression de formule trop longue (max 1000 caractères)',
  FORMULA_INVALID: 'Expression de formule invalide',
  VARIABLES_INVALID: 'Variables de formule invalides'
} as const;
