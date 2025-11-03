// ========================================
// STATISTICS TYPES - TYPES STATISTIQUES AVANCÉS
// ========================================

/**
 * Catégories de configurations statistiques
 */
export enum StatisticCategory {
  Performance = 'performance',
  Progression = 'progression',
  Comparison = 'comparison',
  Custom = 'custom'
}

/**
 * Types de calculs statistiques
 */
export enum CalculationType {
  Basic = 'basic',
  Comparative = 'comparative',
  Temporal = 'temporal',
  Predictive = 'predictive'
}

/**
 * Types de métriques calculées
 */
export type MetricType = 
  | 'average'
  | 'median'
  | 'mode'
  | 'min'
  | 'max'
  | 'standardDeviation'
  | 'variance'
  | 'percentiles'
  | 'quartiles'
  | 'iqr'
  | 'skewness'
  | 'kurtosis'
  | 'correlation'
  | 'regression'
  | 'trend';

/**
 * Options de regroupement des données
 */
export type GroupByOption = 
  | 'student'
  | 'evaluation'
  | 'subject'
  | 'class'
  | 'month'
  | 'week';

/**
 * Méthodes d'agrégation
 */
export type AggregationMethod = 
  | 'sum'
  | 'average'
  | 'min'
  | 'max'
  | 'count';

/**
 * Types de graphiques
 */
export enum ChartType {
  Bar = 'bar',
  Line = 'line',
  Pie = 'pie',
  Radar = 'radar',
  Scatter = 'scatter',
  Heatmap = 'heatmap'
}

/**
 * Types de mise en page
 */
export enum LayoutType {
  Single = 'single',
  Grid = 'grid',
  Dashboard = 'dashboard'
}

/**
 * Schémas de couleurs prédéfinis
 */
export enum ColorScheme {
  Blue = 'blue',
  Green = 'green',
  Purple = 'purple',
  Orange = 'orange',
  Rainbow = 'rainbow',
  Monochrome = 'monochrome'
}

/**
 * Configuration des sources de données
 */
export interface DataSourceConfig {
  evaluationIds: number[];
  classIds: number[];
  dateRange: [Date, Date];
  subjectFilters: string[];
  typeFilters: string[];
  studentGroups?: string[];
  excludeAbsent: boolean;
  excludeIncomplete: boolean;
}

/**
 * Configuration des calculs
 */
export interface CalculationConfig {
  type: CalculationType;
  metrics: MetricType[];
  groupBy: GroupByOption;
  aggregation: AggregationMethod;
}

/**
 * Configuration de la visualisation
 */
export interface VisualizationConfig {
  chartType: ChartType;
  multiSeries: boolean;
  colors: string[];
  layout: LayoutType;
  annotations: boolean;
  colorScheme: ColorScheme;
  showLegend: boolean;
  showGrid: boolean;
}

/**
 * Configuration statistique complète
 */
export interface StatisticConfiguration {
  id: string;
  userId: number;
  name: string;
  description?: string;
  category: StatisticCategory;
  
  // Configuration des données
  dataSources: DataSourceConfig;
  
  // Configuration des calculs
  calculations: CalculationConfig;
  
  // Configuration de l'affichage
  visualization: VisualizationConfig;
  
  // Métadonnées
  isTemplate: boolean;
  isPublic: boolean;
  tags: string[];
  
  // Cache
  lastResult?: any;
  lastGenerated?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Point de données pour graphiques
 */
export interface ChartDataPoint {
  label?: string;
  value: number;
  x?: number;
  y?: number;
  metadata?: any;
}

/**
 * Dataset pour graphiques
 */
export interface ChartDataset {
  label: string;
  data: ChartDataPoint[];
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
}

/**
 * Résumé des résultats statistiques
 */
export interface StatisticSummary {
  totalDataPoints: number;
  timeRange: [Date, Date];
  calculatedAt: Date;
  processingTime: number;
}

/**
 * Métriques statistiques globales
 */
export interface StatisticMetrics {
  average: number;
  median: number;
  standardDeviation: number;
  min: number;
  max: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  count: number;
}

/**
 * Métriques par groupe
 */
export interface GroupedStatisticMetrics {
  [groupKey: string]: StatisticMetrics & {
    percentage: number;
  };
}

/**
 * Insight automatique
 */
export interface StatisticInsight {
  type: 'trend' | 'outlier' | 'correlation' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Résultat statistique complet
 */
export interface StatisticResult {
  id: string;
  configId: string;
  configuration: StatisticConfiguration;
  
  // Données calculées
  datasets: ChartDataset[];
  
  // Métadonnées des résultats
  summary: StatisticSummary;
  
  // Statistiques descriptives
  statistics: {
    global: StatisticMetrics;
    byGroup?: GroupedStatisticMetrics;
  };
  
  // Insights automatiques
  insights: StatisticInsight[];
  
  // Métadonnées techniques
  processingTime: number;
  dataPointsCount: number;
  cacheKey: string;
  
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Données pour créer une configuration
 */
export interface CreateStatisticConfigurationData {
  name: string;
  description?: string;
  category: StatisticCategory;
  dataSources: DataSourceConfig;
  calculations: CalculationConfig;
  visualization: VisualizationConfig;
  isTemplate?: boolean;
  isPublic?: boolean;
  tags?: string[];
}

/**
 * Données pour modifier une configuration
 */
export interface UpdateStatisticConfigurationData extends Partial<CreateStatisticConfigurationData> {
  id: string;
}

/**
 * Résultat de validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

/**
 * Configurations par défaut
 */
export const DEFAULT_VISUALIZATION_CONFIG: VisualizationConfig = {
  chartType: ChartType.Bar,
  multiSeries: false,
  colors: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'],
  layout: LayoutType.Single,
  annotations: false,
  colorScheme: ColorScheme.Blue,
  showLegend: true,
  showGrid: true
};

export const DEFAULT_CALCULATION_CONFIG: CalculationConfig = {
  type: CalculationType.Basic,
  metrics: ['average', 'median', 'standardDeviation'],
  groupBy: 'evaluation',
  aggregation: 'average'
};

/**
 * Templates prédéfinis
 */
export const statisticsTemplates: Omit<StatisticConfiguration, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Performance par Matière',
    description: 'Analyse comparative des résultats par matière pour identifier les points forts et axes d\'amélioration',
    category: StatisticCategory.Performance,
    dataSources: {
      evaluationIds: [],
      classIds: [],
      dateRange: [new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), new Date()],
      subjectFilters: [],
      typeFilters: ['Controle', 'Devoir'],
      excludeAbsent: true,
      excludeIncomplete: false
    },
    calculations: {
      type: CalculationType.Comparative,
      metrics: ['average', 'standardDeviation', 'percentiles'],
      groupBy: 'subject',
      aggregation: 'average'
    },
    visualization: {
      chartType: ChartType.Bar,
      multiSeries: false,
      colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'],
      layout: LayoutType.Single,
      annotations: true,
      colorScheme: ColorScheme.Blue,
      showLegend: true,
      showGrid: true
    },
    isTemplate: true,
    isPublic: true,
    tags: ['performance', 'matières', 'comparative', 'enseignant']
  },
  
  {
    name: 'Progression Temporelle',
    description: 'Suivi de l\'évolution des performances dans le temps avec détection de tendances et prédictions',
    category: StatisticCategory.Progression,
    dataSources: {
      evaluationIds: [],
      classIds: [],
      dateRange: [new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), new Date()],
      subjectFilters: [],
      typeFilters: [],
      excludeAbsent: true,
      excludeIncomplete: false
    },
    calculations: {
      type: CalculationType.Temporal,
      metrics: ['average', 'trend', 'correlation'],
      groupBy: 'month',
      aggregation: 'average'
    },
    visualization: {
      chartType: ChartType.Line,
      multiSeries: true,
      colors: ['#3B82F6', '#10B981'],
      layout: LayoutType.Single,
      annotations: true,
      colorScheme: ColorScheme.Green,
      showLegend: true,
      showGrid: true
    },
    isTemplate: true,
    isPublic: true,
    tags: ['progression', 'temporel', 'évolution', 'prédiction']
  },
  
  {
    name: 'Comparaison de Classes',
    description: 'Comparaison statistique des performances entre différentes classes avec tests de significativité',
    category: StatisticCategory.Comparison,
    dataSources: {
      evaluationIds: [],
      classIds: [],
      dateRange: [new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), new Date()],
      subjectFilters: [],
      typeFilters: [],
      excludeAbsent: true,
      excludeIncomplete: false
    },
    calculations: {
      type: CalculationType.Comparative,
      metrics: ['average', 'median', 'standardDeviation', 'percentiles'],
      groupBy: 'class',
      aggregation: 'average'
    },
    visualization: {
      chartType: ChartType.Radar,
      multiSeries: true,
      colors: ['#3B82F6', '#8B5CF6', '#F59E0B'],
      layout: LayoutType.Grid,
      annotations: false,
      colorScheme: ColorScheme.Rainbow,
      showLegend: true,
      showGrid: true
    },
    isTemplate: true,
    isPublic: true,
    tags: ['comparaison', 'classes', 'radar', 'statistiques']
  }
];

export default {
  StatisticCategory,
  CalculationType,
  ChartType,
  LayoutType,
  ColorScheme,
  DEFAULT_VISUALIZATION_CONFIG,
  DEFAULT_CALCULATION_CONFIG,
  statisticsTemplates
};