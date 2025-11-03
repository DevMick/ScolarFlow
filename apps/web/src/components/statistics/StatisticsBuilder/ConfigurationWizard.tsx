// ========================================
// CONFIGURATION WIZARD - ASSISTANT DE CRÉATION
// ========================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { DataSourceStep } from './steps/DataSourceStep';
import { AnalysisTypeStep } from './steps/AnalysisTypeStep';
import { VisualizationStep } from './steps/VisualizationStep';
import { PreviewStep } from './steps/PreviewStep';
import { WizardProgress } from './components/WizardProgress';
import { WizardNavigation } from './components/WizardNavigation';
import { AdvancedChart } from '../Visualizations/AdvancedChart';
import { useStatisticsApi } from '../../../hooks/useStatisticsApi';
import type {
  StatisticConfiguration,
  CreateStatisticConfigurationData,
  StatisticResult,
  StatisticCategory,
  CalculationType,
  ChartType,
  GroupByOption,
  MetricType,
  AggregationMethod,
  DEFAULT_VISUALIZATION_CONFIG,
  DEFAULT_CALCULATION_CONFIG
} from '@edustats/shared/statistics';
import { cn } from '../../../utils/classNames';
import { toast } from 'react-hot-toast';
import { debounce } from 'lodash';

/**
 * Interface pour les étapes du wizard
 */
interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<WizardStepProps>;
  validation: (data: Partial<CreateStatisticConfigurationData>) => ValidationResult;
  isOptional?: boolean;
}

/**
 * Props partagées entre les étapes
 */
export interface WizardStepProps {
  data: Partial<CreateStatisticConfigurationData>;
  validationErrors: Record<string, string[]>;
  onDataChange: (data: Partial<CreateStatisticConfigurationData>) => void;
  onValidationChange?: (errors: Record<string, string[]>) => void;
}

/**
 * Résultat de validation
 */
interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

/**
 * Props du composant ConfigurationWizard
 */
interface ConfigurationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigurationCreated?: (config: StatisticConfiguration) => void;
  initialData?: Partial<CreateStatisticConfigurationData>;
  templateId?: string;
}

/**
 * Assistant de création de configuration statistique
 */
export const ConfigurationWizard: React.FC<ConfigurationWizardProps> = ({
  isOpen,
  onClose,
  onConfigurationCreated,
  initialData,
  templateId
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<CreateStatisticConfigurationData>>({
    name: '',
    category: StatisticCategory.Custom,
    dataSources: {
      classIds: [],
      dateRange: [
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 mois avant
        new Date()
      ],
      subjectFilters: [],
      typeFilters: [],
      excludeAbsent: false,
      excludeIncomplete: false
    },
    calculations: { ...DEFAULT_CALCULATION_CONFIG },
    visualization: { ...DEFAULT_VISUALIZATION_CONFIG },
    isTemplate: false,
    isPublic: false,
    tags: []
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [previewData, setPreviewData] = useState<StatisticResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ========================================
  // HOOKS API
  // ========================================

  const {
    createConfiguration,
    createFromTemplate,
    generatePreview,
    loading: apiLoading
  } = useStatisticsApi();

  // ========================================
  // DÉFINITION DES ÉTAPES
  // ========================================

  const wizardSteps = useMemo((): WizardStep[] => [
    {
      id: 'datasource',
      title: 'Sources de données',
      description: 'Sélectionnez les classes, périodes et filtres',
      component: DataSourceStep,
      validation: validateDataSourceStep
    },
    {
      id: 'analysis',
      title: 'Type d\'analyse',
      description: 'Choisissez les métriques et méthodes de calcul',
      component: AnalysisTypeStep,
      validation: validateAnalysisStep
    },
    {
      id: 'visualization',
      title: 'Visualisation',
      description: 'Configurez l\'affichage des graphiques',
      component: VisualizationStep,
      validation: validateVisualizationStep
    },
    {
      id: 'preview',
      title: 'Aperçu et finalisation',
      description: 'Vérifiez et sauvegardez votre configuration',
      component: PreviewStep,
      validation: validateCompleteConfiguration
    }
  ], []);

  // ========================================
  // FONCTIONS DE VALIDATION
  // ========================================

  function validateDataSourceStep(data: Partial<CreateStatisticConfigurationData>): ValidationResult {
    const errors: Record<string, string[]> = {};

    if (!data.dataSources?.classIds || data.dataSources.classIds.length === 0) {
      errors['dataSources.classIds'] = ['Au moins une classe doit être sélectionnée'];
    }

    if (!data.dataSources?.dateRange || !data.dataSources.dateRange[0] || !data.dataSources.dateRange[1]) {
      errors['dataSources.dateRange'] = ['Une période doit être définie'];
    }

    if (data.dataSources?.dateRange && data.dataSources.dateRange[0] > data.dataSources.dateRange[1]) {
      errors['dataSources.dateRange'] = ['La date de début doit être antérieure à la date de fin'];
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  function validateAnalysisStep(data: Partial<CreateStatisticConfigurationData>): ValidationResult {
    const errors: Record<string, string[]> = {};

    if (!data.calculations?.metrics || data.calculations.metrics.length === 0) {
      errors['calculations.metrics'] = ['Au moins une métrique doit être sélectionnée'];
    }

    if (!data.calculations?.type) {
      errors['calculations.type'] = ['Le type d\'analyse doit être sélectionné'];
    }

    if (!data.calculations?.groupBy) {
      errors['calculations.groupBy'] = ['Le critère de regroupement doit être sélectionné'];
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  function validateVisualizationStep(data: Partial<CreateStatisticConfigurationData>): ValidationResult {
    const errors: Record<string, string[]> = {};

    if (!data.visualization?.chartType) {
      errors['visualization.chartType'] = ['Le type de graphique doit être sélectionné'];
    }

    if (!data.visualization?.colors || data.visualization.colors.length === 0) {
      errors['visualization.colors'] = ['Au moins une couleur doit être définie'];
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  function validateCompleteConfiguration(data: Partial<CreateStatisticConfigurationData>): ValidationResult {
    const errors: Record<string, string[]> = {};

    if (!data.name || data.name.trim().length < 3) {
      errors['name'] = ['Le nom doit contenir au moins 3 caractères'];
    }

    if (!data.category) {
      errors['category'] = ['La catégorie doit être sélectionnée'];
    }

    // Valider toutes les étapes précédentes
    const dataSourceValidation = validateDataSourceStep(data);
    const analysisValidation = validateAnalysisStep(data);
    const visualizationValidation = validateVisualizationStep(data);

    Object.assign(errors, dataSourceValidation.errors, analysisValidation.errors, visualizationValidation.errors);

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // ========================================
  // GESTION DES DONNÉES
  // ========================================

  const updateFormData = useCallback((updates: Partial<CreateStatisticConfigurationData>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      
      // Fusion intelligente des objets imbriqués
      if (updates.dataSources && prev.dataSources) {
        newData.dataSources = { ...prev.dataSources, ...updates.dataSources };
      }
      if (updates.calculations && prev.calculations) {
        newData.calculations = { ...prev.calculations, ...updates.calculations };
      }
      if (updates.visualization && prev.visualization) {
        newData.visualization = { ...prev.visualization, ...updates.visualization };
      }

      return newData;
    });
  }, []);

  // ========================================
  // PREVIEW AUTOMATIQUE
  // ========================================

  const generatePreviewDebounced = useMemo(
    () => debounce(async (data: Partial<CreateStatisticConfigurationData>) => {
      if (!data.dataSources?.classIds?.length || !data.calculations?.type) {
        return;
      }

      try {
        const preview = await generatePreview(data as any);
        setPreviewData(preview);
      } catch (error) {
        console.error('Erreur génération preview:', error);
        setPreviewData(null);
      }
    }, 1000),
    [generatePreview]
  );

  useEffect(() => {
    if (currentStep >= 1) { // À partir de l'étape 2
      generatePreviewDebounced(formData);
    }
    return () => generatePreviewDebounced.cancel();
  }, [formData, currentStep, generatePreviewDebounced]);

  // ========================================
  // NAVIGATION DU WIZARD
  // ========================================

  const canGoNext = useMemo(() => {
    const currentStepValidation = wizardSteps[currentStep].validation;
    const validationResult = currentStepValidation(formData);
    return validationResult.isValid;
  }, [formData, currentStep, wizardSteps]);

  const handleNext = useCallback(() => {
    const currentStepValidation = wizardSteps[currentStep].validation;
    const validationResult = currentStepValidation(formData);
    
    if (!validationResult.isValid) {
      setValidationErrors(validationResult.errors);
      toast.error('Veuillez corriger les erreurs avant de continuer');
      return;
    }

    setValidationErrors({});
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, formData, wizardSteps]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleGoToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < wizardSteps.length) {
      setCurrentStep(stepIndex);
    }
  }, [wizardSteps.length]);

  // ========================================
  // SOUMISSION
  // ========================================

  const handleSubmit = useCallback(async () => {
    const finalValidation = validateCompleteConfiguration(formData);
    
    if (!finalValidation.isValid) {
      setValidationErrors(finalValidation.errors);
      toast.error('Veuillez corriger les erreurs avant de soumettre');
      return;
    }

    setIsSubmitting(true);

    try {
      let createdConfig: StatisticConfiguration | null = null;

      if (templateId) {
        createdConfig = await createFromTemplate(templateId, formData);
      } else {
        createdConfig = await createConfiguration(formData as CreateStatisticConfigurationData);
      }

      if (createdConfig) {
        toast.success('Configuration créée avec succès !');
        onConfigurationCreated?.(createdConfig);
        onClose();
      }
    } catch (error: any) {
      console.error('Erreur soumission:', error);
      toast.error('Erreur lors de la création de la configuration');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, templateId, createFromTemplate, createConfiguration, onConfigurationCreated, onClose]);

  // ========================================
  // INITIALISATION
  // ========================================

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setValidationErrors({});
      setPreviewData(null);
      
      if (initialData) {
        setFormData(prev => ({ ...prev, ...initialData }));
      }
    }
  }, [isOpen, initialData]);

  // ========================================
  // RENDU
  // ========================================

  const CurrentStepComponent = wizardSteps[currentStep].component;

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                      {templateId ? 'Créer depuis un template' : 'Nouvel assistant statistique'}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-600">
                      Configurez vos analyses personnalisées en quelques étapes
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Contenu principal */}
                <div className="flex h-[600px]">
                  {/* Panneau de configuration */}
                  <div className="flex-1 flex flex-col">
                    {/* Progress */}
                    <div className="p-6 border-b border-gray-200">
                      <WizardProgress
                        currentStep={currentStep}
                        steps={wizardSteps}
                        onStepClick={handleGoToStep}
                        canGoNext={canGoNext}
                      />
                    </div>

                    {/* Étape actuelle */}
                    <div className="flex-1 p-6 overflow-y-auto">
                      <div className="mb-6">
                        <h2 className="text-lg font-medium text-gray-900">
                          {wizardSteps[currentStep].title}
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                          {wizardSteps[currentStep].description}
                        </p>
                      </div>

                      <CurrentStepComponent
                        data={formData}
                        validationErrors={validationErrors}
                        onDataChange={updateFormData}
                        onValidationChange={setValidationErrors}
                      />
                    </div>

                    {/* Navigation */}
                    <div className="p-6 border-t border-gray-200">
                      <WizardNavigation
                        currentStep={currentStep}
                        totalSteps={wizardSteps.length}
                        canGoNext={canGoNext}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        loading={apiLoading}
                      />
                    </div>
                  </div>

                  {/* Panneau de preview */}
                  <div className="w-96 border-l border-gray-200 bg-gray-50 flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-white">
                      <h3 className="font-medium text-gray-900">Aperçu temps réel</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Prévisualisation de vos statistiques
                      </p>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto">
                      {previewData ? (
                        <div className="space-y-4">
                          {/* Graphique preview */}
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <AdvancedChart
                              data={previewData.datasets}
                              type={formData.visualization?.chartType || ChartType.Bar}
                              options={{ responsive: true, maintainAspectRatio: false }}
                              height={200}
                            />
                          </div>

                          {/* Statistiques rapides */}
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="font-medium text-gray-900 mb-3">Statistiques</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Points de données:</span>
                                <span className="font-medium">{previewData.summary.totalDataPoints}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Moyenne:</span>
                                <span className="font-medium">{previewData.statistics.global.average.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Écart-type:</span>
                                <span className="font-medium">{previewData.statistics.global.standardDeviation.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Insights */}
                          {previewData.insights.length > 0 && (
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <h4 className="font-medium text-gray-900 mb-3">Insights</h4>
                              <div className="space-y-2">
                                {previewData.insights.slice(0, 2).map((insight, index) => (
                                  <div key={index} className="text-sm p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                                    <p className="font-medium text-blue-900">{insight.title}</p>
                                    <p className="text-blue-700 text-xs mt-1">{insight.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <div className="text-4xl mb-4">📊</div>
                            <p className="text-sm">
                              {currentStep === 0 
                                ? 'Sélectionnez vos données pour voir l\'aperçu'
                                : apiLoading 
                                  ? 'Génération de l\'aperçu...'
                                  : 'Aperçu indisponible'
                              }
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ConfigurationWizard;
