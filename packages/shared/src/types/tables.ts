// ========================================
// TYPES TABLEAUX PERSONNALISÉS - EDUSTATS
// ========================================

/**
 * Catégories de tableaux personnalisés
 */
export enum TableCategory {
  Bulletin = 'bulletin',
  ConseilClasse = 'conseil_classe',
  Bilan = 'bilan',
  Communication = 'communication',
  Custom = 'custom'
}

/**
 * Types de colonnes disponibles
 */
export enum ColumnType {
  StudentInfo = 'student_info',
  EvaluationScore = 'evaluation_score',
  Calculated = 'calculated',
  Static = 'static',
  Formula = 'formula'
}

/**
 * Types de résultats de formules
 */
export enum FormulaResultType {
  Number = 'number',
  Text = 'text',
  Boolean = 'boolean',
  Date = 'date'
}

/**
 * Opérateurs de conditions
 */
export enum ConditionOperator {
  GreaterThan = '>',
  LessThan = '<',
  Equal = '=',
  NotEqual = '!=',
  GreaterThanOrEqual = '>=',
  LessThanOrEqual = '<=',
  Contains = 'contains',
  Between = 'between',
  StartsWith = 'starts_with',
  EndsWith = 'ends_with'
}

/**
 * Alignements de texte
 */
export enum TextAlignment {
  Left = 'left',
  Center = 'center',
  Right = 'right'
}

/**
 * Interface pour une condition de formatage conditionnel
 */
export interface ConditionalFormat {
  id: string;
  condition: {
    operator: ConditionOperator;
    value: any;
    value2?: any; // Pour 'between'
  };
  style: {
    backgroundColor?: string;
    textColor?: string;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    border?: string;
    icon?: string;
  };
}

/**
 * Configuration d'une colonne de tableau
 */
export interface TableColumn {
  id: string;
  label: string;
  type: ColumnType;
  
  // Configuration selon le type
  source?: {
    field?: string;           // Pour student_info (firstName, lastName, etc.)
    evaluationId?: number;    // Pour evaluation_score
    staticValue?: string;     // Pour static
  };
  
  // Pour colonnes calculées
  formula?: {
    expression: string;       // Expression de calcul
    variables: string[];      // Variables utilisées
    resultType: FormulaResultType;
  };
  
  // Mise en forme
  formatting: {
    width?: number;
    alignment: TextAlignment;
    numberFormat?: string;    // "0.00", "0%", etc.
    conditionalFormatting?: ConditionalFormat[];
  };
  
  // Comportement
  sortable: boolean;
  filterable: boolean;
  exportable: boolean;
}

/**
 * Configuration des lignes du tableau
 */
export interface TableRowConfig {
  groupBy?: string;         // Grouper par champ
  sortBy?: string;          // Tri par défaut
  sortDirection?: 'asc' | 'desc';
  showTotals?: boolean;     // Afficher ligne de totaux
  showAverages?: boolean;   // Afficher ligne de moyennes
}

/**
 * Style du tableau
 */
export interface TableStyling {
  headerStyle?: {
    backgroundColor?: string;
    textColor?: string;
    fontWeight?: 'normal' | 'bold';
    fontSize?: number;
    textAlign?: TextAlignment;
  };
  bodyStyle?: {
    fontSize?: number;
    fontFamily?: string;
  };
  alternateRowColors?: boolean;
  alternateRowColor?: string;
  showBorders?: boolean;
  borderColor?: string;
  borderWidth?: number;
  showGridLines?: boolean;
  gridLineColor?: string;
  padding?: number;
  margin?: number;
}

/**
 * Filtres du tableau
 */
export interface TableFilters {
  enabled: boolean;
  filters: Array<{
    columnId: string;
    operator: ConditionOperator;
    value: any;
    value2?: any;
  }>;
}

/**
 * Tri du tableau
 */
export interface TableSorting {
  enabled: boolean;
  defaultSort?: {
    columnId: string;
    direction: 'asc' | 'desc';
  };
  multiSort?: boolean;
}

/**
 * Configuration complète d'un tableau personnalisé
 */
export interface CustomTableConfig {
  columns: TableColumn[];
  rows: TableRowConfig;
  styling: TableStyling;
  filters: TableFilters;
  sorting: TableSorting;
}

/**
 * Tableau personnalisé complet
 */
export interface CustomTable {
  id: string;
  userId: number;
  classId?: number;
  name: string;
  description?: string;
  category: TableCategory;
  
  // Configuration du tableau
  config: CustomTableConfig;
  
  // Données calculées (cache)
  computedData?: TableData;
  
  // Métadonnées
  isTemplate: boolean;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cellule de données du tableau
 */
export interface TableCell {
  value: any;
  formattedValue: string;
  style?: Record<string, any>;
  metadata?: {
    formula?: string;
    error?: string;
    isCalculated?: boolean;
    dependencies?: string[];
  };
}

/**
 * Ligne de données du tableau
 */
export interface TableRow {
  studentId: number;
  cells: TableCell[];
  metadata?: {
    isGroupHeader?: boolean;
    groupValue?: string;
    isTotalRow?: boolean;
    isAverageRow?: boolean;
  };
}

/**
 * Données complètes du tableau
 */
export interface TableData {
  headers: string[];
  rows: TableRow[];
  summary?: {
    totalRows: number;
    calculatedAt: Date;
    hasErrors: boolean;
    errors?: string[];
    warnings?: string[];
    processingTime?: number;
  };
}

/**
 * Template de tableau
 */
export interface CustomTableTemplate {
  id: string;
  name: string;
  description?: string;
  category: TableCategory;
  config: Partial<CustomTableConfig>;
  isOfficial: boolean;
  createdBy?: number;
  usageCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fonction de formule
 */
export interface FormulaFunction {
  name: string;
  description: string;
  syntax: string;
  category: 'math' | 'statistical' | 'logical' | 'text' | 'date' | 'custom';
  parameters: Array<{
    name: string;
    type: 'number' | 'text' | 'boolean' | 'array' | 'any';
    required: boolean;
    description: string;
  }>;
  example: string;
  implementation?: (args: any[]) => any;
}

/**
 * Variable de formule
 */
export interface FormulaVariable {
  name: string;
  description: string;
  type: 'student' | 'evaluation' | 'calculated' | 'system';
  dataType: FormulaResultType;
  example: any;
  getValue?: (context: any) => any;
}

/**
 * Résultat d'évaluation de formule
 */
export interface FormulaResult {
  value: any;
  type: FormulaResultType;
  errors: string[];
  warnings: string[];
  dependencies?: string[];
  processingTime?: number;
}

/**
 * Formule personnalisée sauvegardée
 */
export interface CustomFormula {
  id: string;
  name: string;
  description?: string;
  expression: string;
  category: string;
  variables: string[];
  resultType: FormulaResultType;
  createdBy: number;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
}

/**
 * Contexte d'évaluation de formule
 */
export interface FormulaContext {
  studentId?: number;
  classId?: number;
  evaluationIds?: number[];
  variables: Record<string, any>;
  functions: Record<string, FormulaFunction>;
  metadata?: {
    currentRow?: number;
    totalRows?: number;
    calculationDate?: Date;
  };
}

/**
 * Options d'export de tableau
 */
export interface TableExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'html';
  filename?: string;
  includeHeaders: boolean;
  includeFormatting: boolean;
  includeFormulas: boolean;
  pageOrientation?: 'portrait' | 'landscape';
  paperSize?: 'A4' | 'A3' | 'Letter';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  customStyles?: {
    headerLogo?: string;
    footerText?: string;
    watermark?: string;
  };
}

/**
 * Résultat d'export
 */
export interface TableExportResult {
  success: boolean;
  filename: string;
  downloadUrl?: string;
  size?: number;
  format: string;
  error?: string;
  warnings?: string[];
  metadata?: {
    pageCount?: number;
    processingTime?: number;
    exportedAt: Date;
  };
}

/**
 * Données pour création de tableau
 */
export interface CreateCustomTableData {
  name: string;
  description?: string;
  category: TableCategory;
  classId?: number;
  config: CustomTableConfig;
  isTemplate?: boolean;
  isPublic?: boolean;
  tags?: string[];
}

/**
 * Données pour mise à jour de tableau
 */
export interface UpdateCustomTableData {
  name?: string;
  description?: string;
  category?: TableCategory;
  config?: Partial<CustomTableConfig>;
  isTemplate?: boolean;
  isPublic?: boolean;
  tags?: string[];
}

/**
 * Données pour création de template
 */
export interface CreateTableTemplateData {
  name: string;
  description?: string;
  category: TableCategory;
  config: Partial<CustomTableConfig>;
  tags?: string[];
}

/**
 * Statistiques d'utilisation des tableaux
 */
export interface TableUsageStats {
  totalTables: number;
  tablesByCategory: Record<TableCategory, number>;
  mostUsedTemplates: Array<{
    templateId: string;
    name: string;
    usageCount: number;
  }>;
  averageColumnsPerTable: number;
  mostUsedFormulas: Array<{
    expression: string;
    usageCount: number;
  }>;
}

// ========================================
// CONSTANTES ET VALEURS PAR DÉFAUT
// ========================================

/**
 * Configuration par défaut d'une colonne
 */
export const DEFAULT_COLUMN_CONFIG: Partial<TableColumn> = {
  formatting: {
    width: 100,
    alignment: TextAlignment.Left
  },
  sortable: true,
  filterable: true,
  exportable: true
};

/**
 * Style par défaut du tableau
 */
export const DEFAULT_TABLE_STYLING: TableStyling = {
  headerStyle: {
    backgroundColor: '#f3f4f6',
    textColor: '#1f2937',
    fontWeight: 'bold',
    textAlign: TextAlignment.Center
  },
  alternateRowColors: true,
  alternateRowColor: '#f9fafb',
  showBorders: true,
  borderColor: '#e5e7eb',
  borderWidth: 1,
  showGridLines: false,
  padding: 8
};

/**
 * Configuration par défaut des filtres
 */
export const DEFAULT_TABLE_FILTERS: TableFilters = {
  enabled: true,
  filters: []
};

/**
 * Configuration par défaut du tri
 */
export const DEFAULT_TABLE_SORTING: TableSorting = {
  enabled: true,
  multiSort: false
};

/**
 * Configuration par défaut d'un tableau
 */
export const DEFAULT_TABLE_CONFIG: CustomTableConfig = {
  columns: [],
  rows: {},
  styling: DEFAULT_TABLE_STYLING,
  filters: DEFAULT_TABLE_FILTERS,
  sorting: DEFAULT_TABLE_SORTING
};

/**
 * Formats de nombres prédéfinis
 */
export const NUMBER_FORMATS = {
  INTEGER: '0',
  ONE_DECIMAL: '0.0',
  TWO_DECIMALS: '0.00',
  PERCENTAGE: '0%',
  PERCENTAGE_ONE_DECIMAL: '0.0%',
  CURRENCY_EUR: '0.00 €',
  SCIENTIFIC: '0.00E+00'
} as const;

/**
 * Champs d'information élève disponibles
 */
export const STUDENT_INFO_FIELDS = {
  firstName: 'Prénom',
  lastName: 'Nom',
  fullName: 'Nom complet',
  dateOfBirth: 'Date de naissance',
  age: 'Âge',
  gender: 'Genre',
  studentNumber: 'Numéro élève',
  className: 'Classe'
} as const;

/**
 * Catégories de fonctions de formules
 */
export const FORMULA_CATEGORIES = {
  math: 'Mathématiques',
  statistical: 'Statistiques',
  logical: 'Logique',
  text: 'Texte',
  date: 'Date/Heure',
  custom: 'Personnalisées'
} as const;
