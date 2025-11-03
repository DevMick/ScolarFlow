// ========================================
// STATISTICS SERVICES - INDEX PRINCIPAL
// ========================================

export { StatisticsEngine } from './StatisticsEngine';
export { ConfigurationService } from './ConfigurationService';

// Réexport des types pour faciliter l'importation
export type {
  StatisticConfiguration,
  StatisticResult,
  CreateStatisticConfigurationData,
  UpdateStatisticConfigurationData,
  StatisticCategory,
  CalculationType,
  MetricType,
  GroupByOption,
  AggregationMethod,
  ChartType,
  LayoutType,
  ColorScheme
} from '@edustats/shared/types/statistics';
