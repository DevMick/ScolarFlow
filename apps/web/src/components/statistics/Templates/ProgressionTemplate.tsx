// ========================================
// PROGRESSION TEMPLATE - TEMPLATE D'ANALYSE DE PROGRESSION
// ========================================

import React, { useState } from 'react';
import { 
  XMarkIcon, 
  ClockIcon, 
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { useClasses } from '../../../hooks/useClasses';
import type { 
  StatisticConfiguration, 
  CreateStatisticConfigurationData 
} from '@edustats/shared/types';
import { CalculationType, ChartType } from '@edustats/shared/types';
import { cn } from '../../../utils/classNames';

/**
 * Props du composant ProgressionTemplate
 */
interface ProgressionTemplateProps {
  /** Template de base */
  template: StatisticConfiguration;
  /** Callback de fermeture */
  onClose: () => void;
  /** Callback d'utilisation avec personnalisations */
  onUse: (customizations?: Partial<CreateStatisticConfigurationData>) => void;
}

/**
 * Périodes prédéfinies pour l'analyse de progression
 */
const PROGRESSION_PERIODS = [
  {
    id: 'last_month',
    title: 'Dernier mois',
    description: 'Progression sur les 30 derniers jours',
    days: 30,
    icon: '📅'
  },
  {
    id: 'last_trimester',
    title: 'Dernier trimestre',
    description: 'Évolution sur les 3 derniers mois',
    days: 90,
    icon: '📊'
  },
  {
    id: 'semester',
    title: 'Semestre',
    description: 'Progression sur 6 mois',
    days: 180,
    icon: '📈'
  },
  {
    id: 'school_year',
    title: 'Année scolaire',
    description: 'Évolution sur l\'année complète',
    days: 365,
    icon: '🎓'
  },
  {
    id: 'custom',
    title: 'Période personnalisée',
    description: 'Définir une période spécifique',
    days: 0,
    icon: '⚙️'
  }
];

/**
 * Types d'analyse de progression
 */
const PROGRESSION_ANALYSIS_TYPES = [
  {
    id: 'individual_progress',
    title: 'Progression individuelle',
    description: 'Suivi de la progression de chaque élève dans le temps',
    groupBy: 'student' as const,
    chartType: ChartType.Line,
    metrics: ['average', 'trend'],
    icon: '👤'
  },
  {
    id: 'class_evolution',
    title: 'Évolution de classe',
    description: 'Progression globale de la classe avec moyennes mobiles',
    groupBy: 'month' as const,
    chartType: ChartType.Line,
    metrics: ['average', 'median', 'trend'],
    icon: '👥'
  },
  {
    id: 'subject_progression',
    title: 'Progression par matière',
    description: 'Évolution des performances dans chaque matière',
    groupBy: 'subject' as const,
    chartType: ChartType.Line,
    metrics: ['average', 'standardDeviation', 'trend'],
    icon: '📚'
  },
  {
    id: 'weekly_trends',
    title: 'Tendances hebdomadaires',
    description: 'Analyse fine des variations semaine par semaine',
    groupBy: 'week' as const,
    chartType: ChartType.Line,
    metrics: ['average', 'trend', 'correlation'],
    icon: '📊'
  }
];

/**
 * Indicateurs de progression
 */
const PROGRESSION_INDICATORS = [
  {
    id: 'improvement_rate',
    title: 'Taux d\'amélioration',
    description: 'Pourcentage d\'élèves en progression',
    icon: '📈'
  },
  {
    id: 'stability_index',
    title: 'Indice de stabilité',
    description: 'Mesure de la régularité des performances',
    icon: '⚖️'
  },
  {
    id: 'acceleration',
    title: 'Accélération',
    description: 'Vitesse de progression (dérivée seconde)',
    icon: '🚀'
  },
  {
    id: 'prediction',
    title: 'Prédiction',
    description: 'Projection des performances futures',
    icon: '🔮'
  }
];

/**
 * Composant template pour l'analyse de progression
 */
export const ProgressionTemplate: React.FC<ProgressionTemplateProps> = ({
  template,
  onClose,
  onUse
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState(PROGRESSION_PERIODS[1]); // Trimestre par défaut
  const [customDateRange, setCustomDateRange] = useState<[string, string]>([
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    new Date().toISOString().split('T')[0]
  ]);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState(PROGRESSION_ANALYSIS_TYPES[1]); // Évolution de classe
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['improvement_rate']);
  const [customName, setCustomName] = useState(`Progression - ${new Date().toLocaleDateString('fr-FR')}`);
  const [includeAnnotations, setIncludeAnnotations] = useState(true);
  const [smoothingEnabled, setSmoothingEnabled] = useState(true);

  // ========================================
  // HOOKS
  // ========================================

  const { classes } = useClasses();

  // ========================================
  // CALCULS DÉRIVÉS
  // ========================================

  const getDateRange = (): [Date, Date] => {
    if (selectedPeriod.id === 'custom') {
      return [new Date(customDateRange[0]), new Date(customDateRange[1])];
    }
    
    const endDate = new Date();
    const startDate = new Date(Date.now() - selectedPeriod.days * 24 * 60 * 60 * 1000);
    return [startDate, endDate];
  };

  const getAnalysisDuration = (): number => {
    const [start, end] = getDateRange();
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  // ========================================
  // GESTION DES ACTIONS
  // ========================================

  const handleClassToggle = (classId: number) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleIndicatorToggle = (indicatorId: string) => {
    setSelectedIndicators(prev =>
      prev.includes(indicatorId)
        ? prev.filter(id => id !== indicatorId)
        : [...prev, indicatorId]
    );
  };

  const handleUseTemplate = () => {
    const [startDate, endDate] = getDateRange();
    
    // Construire les métriques en fonction des indicateurs sélectionnés
    const baseMetrics = [...selectedAnalysisType.metrics];
    const additionalMetrics: string[] = [];
    
    if (selectedIndicators.includes('improvement_rate')) {
      additionalMetrics.push('percentiles');
    }
    if (selectedIndicators.includes('stability_index')) {
      additionalMetrics.push('standardDeviation', 'variance');
    }
    if (selectedIndicators.includes('acceleration')) {
      additionalMetrics.push('correlation');
    }
    if (selectedIndicators.includes('prediction')) {
      additionalMetrics.push('regression', 'trend');
    }

    const allMetrics = [...new Set([...baseMetrics, ...additionalMetrics])];

    const customizations: Partial<CreateStatisticConfigurationData> = {
      name: customName,
      description: `Analyse de progression ${selectedAnalysisType.title.toLowerCase()} sur ${getAnalysisDuration()} jours`,
      dataSources: {
        ...template.dataSources,
        classIds: selectedClasses,
        dateRange: [startDate, endDate],
        excludeAbsent: true,
        excludeIncomplete: false
      },
      calculations: {
        ...template.calculations,
        type: CalculationType.Temporal,
        metrics: allMetrics as any,
        groupBy: selectedAnalysisType.groupBy,
        aggregation: 'average'
      },
      visualization: {
        ...template.visualization,
        chartType: selectedAnalysisType.chartType,
        multiSeries: selectedClasses.length > 1,
        annotations: includeAnnotations,
        showGrid: true,
        showLegend: true
      },
      tags: [
        'progression',
        'temporel',
        selectedAnalysisType.groupBy,
        ...selectedIndicators,
        ...(smoothingEnabled ? ['lissage'] : [])
      ]
    };

    onUse(customizations);
  };

  const isConfigurationValid = selectedClasses.length > 0 && selectedIndicators.length > 0;

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 text-green-600 rounded-lg mr-4">
            <ClockIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Template Progression
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Analysez l'évolution des performances dans le temps
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Aperçu du template */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">📈 Analyse de progression temporelle</h4>
          <p className="text-sm text-green-800 mb-3">
            Ce template vous permet de suivre l'évolution des performances dans le temps avec des indicateurs avancés de progression.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-green-900">Analyse</div>
              <div className="text-green-700">Temporelle</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-900">Graphique</div>
              <div className="text-green-700">Courbes</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-900">Tendances</div>
              <div className="text-green-700">Automatiques</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-900">Prédictions</div>
              <div className="text-green-700">Optionnelles</div>
            </div>
          </div>
        </div>

        {/* Configuration de base */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Configuration de base
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'analyse
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                placeholder="Nom de votre analyse de progression..."
              />
            </div>
          </div>
        </div>

        {/* Sélection des classes */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <AcademicCapIcon className="h-5 w-5 mr-2 text-gray-400" />
            Classes à analyser
            <span className="text-red-500 ml-1">*</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {classes.map((classe) => (
              <label
                key={classe.id}
                className={cn(
                  'relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors',
                  selectedClasses.includes(classe.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300'
                )}
              >
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-green-600 rounded focus:ring-green-500"
                  checked={selectedClasses.includes(classe.id)}
                  onChange={() => handleClassToggle(classe.id)}
                />
                <div className="ml-3 min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {classe.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {classe.level} - {classe.studentCount || 0} élèves
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Période d'analyse */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <CalendarDaysIcon className="h-5 w-5 mr-2 text-gray-400" />
            Période d'analyse
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {PROGRESSION_PERIODS.map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period)}
                className={cn(
                  'p-4 border rounded-lg text-left transition-all hover:shadow-md',
                  selectedPeriod.id === period.id
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-500'
                    : 'border-gray-300 hover:border-gray-400'
                )}
              >
                <div className="flex items-start">
                  <div className="text-2xl mr-3">{period.icon}</div>
                  <div className="flex-1">
                    <h5 className={cn(
                      'font-medium',
                      selectedPeriod.id === period.id ? 'text-green-900' : 'text-gray-900'
                    )}>
                      {period.title}
                    </h5>
                    <p className={cn(
                      'text-sm mt-1',
                      selectedPeriod.id === period.id ? 'text-green-700' : 'text-gray-500'
                    )}>
                      {period.description}
                    </p>
                    {period.days > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {period.days} jours
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Période personnalisée */}
          {selectedPeriod.id === 'custom' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début
                </label>
                <input
                  type="date"
                  value={customDateRange[0]}
                  onChange={(e) => setCustomDateRange([e.target.value, customDateRange[1]])}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={customDateRange[1]}
                  onChange={(e) => setCustomDateRange([customDateRange[0], e.target.value])}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Type d'analyse */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-gray-400" />
            Type d'analyse de progression
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROGRESSION_ANALYSIS_TYPES.map((analysisType) => (
              <button
                key={analysisType.id}
                onClick={() => setSelectedAnalysisType(analysisType)}
                className={cn(
                  'relative p-4 border rounded-lg text-left transition-all hover:shadow-md',
                  selectedAnalysisType.id === analysisType.id
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-500'
                    : 'border-gray-300 hover:border-gray-400'
                )}
              >
                <div className="flex items-start">
                  <div className="text-2xl mr-3">{analysisType.icon}</div>
                  <div className="flex-1">
                    <h5 className={cn(
                      'font-medium',
                      selectedAnalysisType.id === analysisType.id ? 'text-green-900' : 'text-gray-900'
                    )}>
                      {analysisType.title}
                    </h5>
                    <p className={cn(
                      'text-sm mt-1',
                      selectedAnalysisType.id === analysisType.id ? 'text-green-700' : 'text-gray-500'
                    )}>
                      {analysisType.description}
                    </p>
                    <div className="text-xs text-gray-500 mt-2">
                      Regroupement: {analysisType.groupBy} • Graphique: {analysisType.chartType}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Indicateurs de progression */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Indicateurs de progression
            <span className="text-red-500 ml-1">*</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PROGRESSION_INDICATORS.map((indicator) => (
              <label
                key={indicator.id}
                className={cn(
                  'relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors',
                  selectedIndicators.includes(indicator.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300'
                )}
              >
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-green-600 rounded focus:ring-green-500"
                  checked={selectedIndicators.includes(indicator.id)}
                  onChange={() => handleIndicatorToggle(indicator.id)}
                />
                <div className="ml-3 flex items-center">
                  <div className="text-lg mr-2">{indicator.icon}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {indicator.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {indicator.description}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Options avancées */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Options d'affichage
          </h4>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-green-600 rounded focus:ring-green-500"
                checked={includeAnnotations}
                onChange={(e) => setIncludeAnnotations(e.target.checked)}
              />
              <span className="ml-3 text-sm text-gray-700">
                Inclure les annotations automatiques
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-7">
              Ajoute des marqueurs pour les événements significatifs (pics, chutes, tendances)
            </p>

            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-green-600 rounded focus:ring-green-500"
                checked={smoothingEnabled}
                onChange={(e) => setSmoothingEnabled(e.target.checked)}
              />
              <span className="ml-3 text-sm text-gray-700">
                Activer le lissage des courbes
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-7">
              Applique un lissage pour réduire le bruit et mettre en évidence les tendances
            </p>
          </div>
        </div>

        {/* Aperçu de la configuration */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">📊 Aperçu de l'analyse</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <div>Nom: {customName}</div>
            <div>Classes: {selectedClasses.length} sélectionnée(s)</div>
            <div>Période: {getAnalysisDuration()} jours ({selectedPeriod.title})</div>
            <div>Type: {selectedAnalysisType.title}</div>
            <div>Indicateurs: {selectedIndicators.length} sélectionné(s)</div>
            <div>Graphique: {selectedAnalysisType.chartType} avec {selectedClasses.length > 1 ? 'séries multiples' : 'série unique'}</div>
          </div>
        </div>
      </div>

      {/* Footer avec actions */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          Template: {template.name}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Annuler
          </button>
          
          <button
            onClick={handleUseTemplate}
            disabled={!isConfigurationValid}
            className={cn(
              'px-6 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-500',
              isConfigurationValid
                ? 'text-white bg-green-600 hover:bg-green-700'
                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
            )}
          >
            Créer l'analyse de progression
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressionTemplate;