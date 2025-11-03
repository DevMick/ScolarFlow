// ========================================
// CONFIGURATION WIZARD - ASSISTANT DE CRÉATION DE STATISTIQUES
// ========================================

import React, { useState, useEffect, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DataSourceStep } from './wizard/DataSourceStep';
import { AnalysisTypeStep } from './wizard/AnalysisTypeStep';
import { VisualizationStep } from './wizard/VisualizationStep';
import { PreviewStep } from './wizard/PreviewStep';
import { WizardProgress } from './wizard/WizardProgress';
import { WizardNavigation } from './wizard/WizardNavigation';
import { useStatisticsApi } from '../../hooks/useStatisticsApi';
import type {
  StatisticConfiguration,
  CreateStatisticConfigurationData,
  StatisticResult,
  StatisticCategory,
  CalculationType,
  ChartType,
  LayoutType,
  ColorScheme,
  DEFAULT_VISUALIZATION_CONFIG,
  DEFAULT_CALCULATION_CONFIG
} from '@edustats/shared/types';
import { cn } from '../../utils/classNames';
import { toast } from 'react-hot-toast';
import { debounce } from 'lodash';

/**
 * Interface pour les étapes du wizard
 */
interface WizardStep {
  id: string;
  title: string;
  description: string;
  isOptional?: boolean;
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
    category: StatisticCategory.Performance,
    dataSources: {
      evaluationIds: [],
      classIds: [],
      dateRange: [
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 mois avant
        new Date()
      ],
      subjectFilters: [],
      typeFilters: [],
      excludeAbsent: true,
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

  const wizardSteps: WizardStep[] = [
    {
      id: 'datasource',
      title: 'Sources de données',
      description: 'Sélectionnez les classes, périodes et filtres'
    },
    {
      id: 'analysis',
      title: 'Type d\'analyse',
      description: 'Choisissez les métriques et méthodes de calcul'
    },
    {
      id: 'visualization',
      title: 'Visualisation',
      description: 'Configurez l\'affichage des graphiques'
    },
    {
      id: 'preview',
      title: 'Aperçu et finalisation',
      description: 'Vérifiez et sauvegardez votre configuration'
    }
  ];

  // ========================================
  // FONCTIONS DE VALIDATION
  // ========================================

  const validateStep = useCallback((stepIndex: number): boolean => {
    const errors: Record<string, string[]> = {};

    switch (stepIndex) {
      case 0: // Data Sources
        if (!formData.dataSources?.classIds || formData.dataSources.classIds.length === 0) {
          errors['dataSources.classIds'] = ['Au moins une classe doit être sélectionnée'];
        }
        if (!formData.dataSources?.dateRange || !formData.dataSources.dateRange[0] || !formData.dataSources.dateRange[1]) {
          errors['dataSources.dateRange'] = ['Une période doit être définie'];
        }
        break;

      case 1: // Analysis
        if (!formData.calculations?.metrics || formData.calculations.metrics.length === 0) {
          errors['calculations.metrics'] = ['Au moins une métrique doit être sélectionnée'];
        }
        if (!formData.calculations?.type) {
          errors['calculations.type'] = ['Le type d\'analyse doit être sélectionné'];
        }
        break;

      case 2: // Visualization
        if (!formData.visualization?.chartType) {
          errors['visualization.chartType'] = ['Le type de graphique doit être sélectionné'];
        }
        break;

      case 3: // Preview
        if (!formData.name || formData.name.trim().length < 3) {
          errors['name'] = ['Le nom doit contenir au moins 3 caractères'];
        }
        if (!formData.category) {
          errors['category'] = ['La catégorie doit être sélectionnée'];
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // ========================================
  // GESTION DES DONNÉES
  // ========================================

  const updateFormData = useCallback((updates: Partial<CreateStatisticConfigurationData>) => {
    setFormData(prev => {
      const newData = { ...prev };
      
      // Fusion intelligente des objets imbriqués
      Object.keys(updates).forEach(key => {
        if (key === 'dataSources' && updates.dataSources && prev.dataSources) {
          newData.dataSources = { ...prev.dataSources, ...updates.dataSources };
        } else if (key === 'calculations' && updates.calculations && prev.calculations) {
          newData.calculations = { ...prev.calculations, ...updates.calculations };
        } else if (key === 'visualization' && updates.visualization && prev.visualization) {
          newData.visualization = { ...prev.visualization, ...updates.visualization };
        } else {
          (newData as any)[key] = (updates as any)[key];
        }
      });

      return newData;
    });
  }, []);

  // ========================================
  // PREVIEW AUTOMATIQUE
  // ========================================

  const generatePreviewDebounced = useCallback(
    debounce(async (data: Partial<CreateStatisticConfigurationData>) => {
      if (!data.dataSources?.classIds?.length || !data.calculations?.type) {
        return;
      }

      try {
        const preview = await generatePreview(data as CreateStatisticConfigurationData);
        setPreviewData(preview);
      } catch (error) {
        console.error('Erreur génération preview:', error);
        setPreviewData(null);
      }
    }, 1000),
    [generatePreview]
  );

  useEffect(() => {
    if (currentStep >= 1 && validateStep(0)) {
      generatePreviewDebounced(formData);
    }
    return () => generatePreviewDebounced.cancel();
  }, [formData, currentStep, generatePreviewDebounced, validateStep]);

  // ========================================
  // NAVIGATION DU WIZARD
  // ========================================

  const canGoNext = useCallback(() => {
    return validateStep(currentStep);
  }, [currentStep, validateStep]);

  const handleNext = useCallback(() => {
    if (!validateStep(currentStep)) {
      toast.error('Veuillez corriger les erreurs avant de continuer');
      return;
    }

    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setValidationErrors({});
    }
  }, [currentStep, wizardSteps.length, validateStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setValidationErrors({});
    }
  }, [currentStep]);

  const handleGoToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < wizardSteps.length) {
      // Valider toutes les étapes précédentes
      let canJump = true;
      for (let i = 0; i < stepIndex; i++) {
        if (!validateStep(i)) {
          canJump = false;
          break;
        }
      }

      if (canJump || stepIndex <= currentStep) {
        setCurrentStep(stepIndex);
        setValidationErrors({});
      } else {
        toast.error('Veuillez compléter les étapes précédentes');
      }
    }
  }, [currentStep, wizardSteps.length, validateStep]);

  // ========================================
  // SOUMISSION
  // ========================================

  const handleSubmit = useCallback(async () => {
    if (!validateStep(3)) {
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
  }, [formData, templateId, createFromTemplate, createConfiguration, onConfigurationCreated, onClose, validateStep]);

  // ========================================
  // INITIALISATION
  // ========================================

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setValidationErrors({});
      setPreviewData(null);
      
      if (initialData) {
        setFormData(prev => ({
          ...prev,
          ...initialData,
          dataSources: { ...prev.dataSources, ...initialData.dataSources },
          calculations: { ...prev.calculations, ...initialData.calculations },
          visualization: { ...prev.visualization, ...initialData.visualization }
        }));
      }
    }
  }, [isOpen, initialData]);

  // ========================================
  // RENDU CONDITIONNEL
  // ========================================

  if (!isOpen) return null;

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        {/* Modal */}
        <div className="relative w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {templateId ? 'Créer depuis un template' : 'Nouvel assistant statistique'}
              </h3>
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
                  canGoNext={canGoNext()}
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

                {/* Rendu de l'étape */}
                {currentStep === 0 && (
                  <DataSourceStep
                    data={formData}
                    validationErrors={validationErrors}
                    onDataChange={updateFormData}
                  />
                )}
                {currentStep === 1 && (
                  <AnalysisTypeStep
                    data={formData}
                    validationErrors={validationErrors}
                    onDataChange={updateFormData}
                  />
                )}
                {currentStep === 2 && (
                  <VisualizationStep
                    data={formData}
                    validationErrors={validationErrors}
                    onDataChange={updateFormData}
                  />
                )}
                {currentStep === 3 && (
                  <PreviewStep
                    data={formData}
                    validationErrors={validationErrors}
                    onDataChange={updateFormData}
                    previewData={previewData}
                  />
                )}
              </div>

              {/* Navigation */}
              <div className="p-6 border-t border-gray-200">
                <WizardNavigation
                  currentStep={currentStep}
                  totalSteps={wizardSteps.length}
                  canGoNext={canGoNext()}
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
                    {/* Preview basique pour l'instant */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="font-medium text-gray-900 mb-4">Données à analyser</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Points de données:</span>
                          <span className="font-medium">{previewData.summary.totalDataPoints}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Période:</span>
                          <span className="font-medium">
                            {new Date(previewData.summary.timeRange[0]).toLocaleDateString('fr-FR')} - {new Date(previewData.summary.timeRange[1]).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {previewData.statistics.global && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Moyenne:</span>
                              <span className="font-medium">{previewData.statistics.global.average.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Écart-type:</span>
                              <span className="font-medium">{previewData.statistics.global.standardDeviation.toFixed(1)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Insights */}
                    {previewData.insights && previewData.insights.length > 0 && (
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
        </div>
      </div>
    </div>
  );
};

export default ConfigurationWizard;
