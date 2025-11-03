// ========================================
// STATISTICS SERVICES - INDEX PRINCIPAL
// ========================================

export { StatisticsEngine } from './StatisticsEngine';
export { ConfigurationService } from './ConfigurationService';

// Réexport des types pour faciliter l'importation
// TODO: @edustats/shared/types/statistics n'existe pas
// Types exportés temporaires
export type StatisticConfiguration = any;
export type StatisticResult = any;
export type CreateStatisticConfigurationData = any;
export type UpdateStatisticConfigurationData = any;
export type StatisticCategory = any;
export type CalculationType = any;
export type MetricType = any;
export type GroupByOption = any;
export type AggregationMethod = any;
export type ChartType = any;
export type LayoutType = any;
export type ColorScheme = any;
