// ========================================
// REPORT GENERATOR - GÉNÉRATEUR DE BILANS ANNUELS
// ========================================

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CloudArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  ReportTemplate,
  ReportGenerationOptions,
  AnnualReport,
  ReportTarget,
  ReportSection
} from '@edustats/shared/types';
import { useAnnualReports, useReportTemplates } from '../../hooks/useAnnualReports';
import { useClasses } from '../../hooks/useClasses';
import { cn } from '../../utils/classNames';
import { toast } from 'react-hot-toast';

/**
 * Props du composant ReportGenerator
 */
interface ReportGeneratorProps {
  /** Classe sélectionnée par défaut */
  defaultClassId?: number;
  /** Année académique par défaut */
  defaultAcademicYear?: string;
  /** Callback lors de la génération réussie */
  onReportGenerated?: (report: AnnualReport) => void;
  /** Callback de fermeture */
  onClose?: () => void;
}

/**
 * Interface wizard pour la génération de bilans annuels
 */
export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  defaultClassId,
  defaultAcademicYear,
  onReportGenerated,
  onClose
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedClass, setSelectedClass] = useState<number | undefined>(defaultClassId);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(
    defaultAcademicYear || '2024-2025'
  );
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [customOptions, setCustomOptions] = useState<ReportGenerationOptions>({});
  const [generatedReport, setGeneratedReport] = useState<AnnualReport | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // ========================================
  // HOOKS
  // ========================================

  const { 
    generateReport, 
    loading: reportLoading, 
    error: reportError,
    generationProgress 
  } = useAnnualReports();
  
  const { 
    getTemplates, 
    loading: templatesLoading 
  } = useReportTemplates();
  
  const { classes } = useClasses();

  const [templates, setTemplates] = useState<ReportTemplate[]>([]);

  // ========================================
  // CHARGEMENT DES TEMPLATES
  // ========================================

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const result = await getTemplates({ isOfficial: true });
      setTemplates(result.templates);
      
      // Sélectionner le template par défaut (administratif complet)
      const defaultTemplate = result.templates.find(t => t.target === ReportTarget.Administration);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des templates');
    }
  };

  // ========================================
  // VALIDATION DES ÉTAPES
  // ========================================

  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];
    
    switch (currentStep) {
      case 0: // Sélection classe et année
        if (!selectedClass) errors.push('Veuillez sélectionner une classe');
        if (!selectedAcademicYear) errors.push('Veuillez sélectionner une année académique');
        break;
        
      case 1: // Sélection template
        if (!selectedTemplate) errors.push('Veuillez sélectionner un template');
        break;
        
      case 2: // Personnalisation
        // Validation optionnelle des options personnalisées
        break;
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // ========================================
  // GESTION DES ÉTAPES
  // ========================================

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleGenerate = async () => {
    if (!selectedClass || !selectedAcademicYear) {
      toast.error('Informations manquantes pour la génération');
      return;
    }

    try {
      setCurrentStep(3); // Étape génération
      
      const options: ReportGenerationOptions = {
        templateId: selectedTemplate?.id,
        ...customOptions
      };
      
      const report = await generateReport(
        selectedClass,
        selectedAcademicYear,
        options,
        (progress) => {
          // Le progrès est géré par le hook
        }
      );
      
      setGeneratedReport(report);
      setCurrentStep(4); // Étape résultats
      onReportGenerated?.(report);
      
    } catch (error) {
      toast.error('Erreur lors de la génération du rapport');
      console.error('Erreur génération:', error);
    }
  };

  // ========================================
  // DÉFINITION DES ÉTAPES
  // ========================================

  const steps = [
    {
      id: 'selection',
      title: 'Sélection',
      description: 'Choisissez la classe et l\'année',
      icon: AcademicCapIcon,
      component: renderSelectionStep
    },
    {
      id: 'template',
      title: 'Template',
      description: 'Sélectionnez le type de rapport',
      icon: DocumentTextIcon,
      component: renderTemplateStep
    },
    {
      id: 'customization',
      title: 'Personnalisation',
      description: 'Configurez les options',
      icon: ChartBarIcon,
      component: renderCustomizationStep
    },
    {
      id: 'generation',
      title: 'Génération',
      description: 'Création du rapport',
      icon: CloudArrowDownIcon,
      component: renderGenerationStep
    },
    {
      id: 'results',
      title: 'Résultats',
      description: 'Rapport généré',
      icon: CheckCircleIcon,
      component: renderResultsStep
    }
  ];

  // ========================================
  // RENDU DES ÉTAPES
  // ========================================

  function renderSelectionStep() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Informations de base
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sélection de classe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Classe
              </label>
              <select
                value={selectedClass || ''}
                onChange={(e) => setSelectedClass(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner une classe</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - {cls.level} ({cls.studentCount} élèves)
                  </option>
                ))}
              </select>
            </div>

            {/* Sélection d'année */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Année académique
              </label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
                <option value="2022-2023">2022-2023</option>
              </select>
            </div>
          </div>
        </div>

        {/* Informations sur la classe sélectionnée */}
        {selectedClass && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Classe sélectionnée</h4>
            {(() => {
              const selectedClassInfo = classes.find(c => c.id === selectedClass);
              return selectedClassInfo ? (
                <div className="text-sm text-blue-800">
                  <p><strong>Nom :</strong> {selectedClassInfo.name}</p>
                  <p><strong>Niveau :</strong> {selectedClassInfo.level}</p>
                  <p><strong>Élèves :</strong> {selectedClassInfo.studentCount}</p>
                  <p><strong>Description :</strong> {selectedClassInfo.description || 'Aucune'}</p>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Erreurs de validation */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <h4 className="font-medium text-red-800">Erreurs de validation</h4>
            </div>
            <ul className="mt-2 text-sm text-red-700">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  function renderTemplateStep() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Sélection du template
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Choisissez le type de rapport selon votre objectif
          </p>
        </div>

        {templatesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-32 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(template => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={cn(
                  'border-2 rounded-lg p-4 cursor-pointer transition-all',
                  selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    
                    <div className="mt-3">
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getTargetBadgeColor(template.target)
                      )}>
                        {getTargetLabel(template.target)}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      {template.sections.length} sections • {template.usageCount} utilisations
                    </div>
                  </div>
                  
                  {selectedTemplate?.id === template.id && (
                    <CheckCircleIcon className="h-6 w-6 text-blue-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Aperçu du template sélectionné */}
        {selectedTemplate && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Aperçu du template</h4>
            <div className="space-y-2">
              {selectedTemplate.sections.map((section: ReportSection, index) => (
                <div key={section.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{index + 1}. {section.title}</span>
                  <div className="flex items-center space-x-2">
                    {section.required && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Obligatoire
                      </span>
                    )}
                    {section.customizable && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Personnalisable
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderCustomizationStep() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Options de personnalisation
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Configurez les options selon vos besoins
          </p>
        </div>

        <div className="space-y-6">
          {/* Options d'inclusion */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Contenu à inclure</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={customOptions.includeCharts !== false}
                  onChange={(e) => setCustomOptions(prev => ({
                    ...prev,
                    includeCharts: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Inclure les graphiques et visualisations
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={customOptions.includeRawData === true}
                  onChange={(e) => setCustomOptions(prev => ({
                    ...prev,
                    includeRawData: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Inclure les données brutes (pour archivage)
                </span>
              </label>
            </div>
          </div>

          {/* Période personnalisée */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Période d'analyse</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  onChange={(e) => {
                    const startDate = e.target.value ? new Date(e.target.value) : undefined;
                    setCustomOptions(prev => ({
                      ...prev,
                      dateRange: startDate ? [startDate, prev.dateRange?.[1] || new Date()] : undefined
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  onChange={(e) => {
                    const endDate = e.target.value ? new Date(e.target.value) : undefined;
                    setCustomOptions(prev => ({
                      ...prev,
                      dateRange: endDate ? [prev.dateRange?.[0] || new Date(), endDate] : undefined
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Domaines d'intérêt */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Domaines d'intérêt</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Mathématiques', 'Français', 'Sciences', 'Histoire', 'Géographie', 'Arts'].map(subject => (
                <label key={subject} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={customOptions.focusAreas?.includes(subject) || false}
                    onChange={(e) => {
                      setCustomOptions(prev => ({
                        ...prev,
                        focusAreas: e.target.checked
                          ? [...(prev.focusAreas || []), subject]
                          : (prev.focusAreas || []).filter(s => s !== subject)
                      }));
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{subject}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderGenerationStep() {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <CloudArrowDownIcon className="h-16 w-16 text-blue-500 mx-auto mb-6" />
          
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Génération en cours...
          </h3>
          
          <p className="text-gray-600 mb-8">
            Analyse des données et création de votre bilan annuel personnalisé
          </p>
          
          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${generationProgress}%` }}
            ></div>
          </div>
          
          <p className="text-sm text-gray-500">
            {generationProgress}% terminé
          </p>
          
          {/* Messages de progression */}
          <div className="mt-6 text-sm text-gray-600">
            {generationProgress < 20 && "Collecte des données d'évaluation..."}
            {generationProgress >= 20 && generationProgress < 40 && "Analyse des profils d'élèves..."}
            {generationProgress >= 40 && generationProgress < 60 && "Détection des insights pédagogiques..."}
            {generationProgress >= 60 && generationProgress < 80 && "Génération des recommandations..."}
            {generationProgress >= 80 && generationProgress < 100 && "Finalisation du rapport..."}
            {generationProgress === 100 && "Rapport généré avec succès !"}
          </div>
        </div>
      </div>
    );
  }

  function renderResultsStep() {
    if (!generatedReport) return null;

    return (
      <div className="text-center py-8">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-6" />
        
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Rapport généré avec succès !
        </h3>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-green-800">Élèves analysés</div>
              <div className="text-green-600">{generatedReport.metadata.totalStudents}</div>
            </div>
            <div>
              <div className="font-medium text-green-800">Évaluations</div>
              <div className="text-green-600">{generatedReport.metadata.totalEvaluations}</div>
            </div>
            <div>
              <div className="font-medium text-green-800">Insights détectés</div>
              <div className="text-green-600">{generatedReport.insights.length}</div>
            </div>
            <div>
              <div className="font-medium text-green-800">Temps de génération</div>
              <div className="text-green-600">{(generatedReport.metadata.generationTime / 1000).toFixed(1)}s</div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => {
              // Logique pour voir le rapport
              console.log('Voir le rapport:', generatedReport);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voir le rapport
          </button>
          
          <button
            onClick={() => {
              // Logique pour exporter
              console.log('Exporter le rapport:', generatedReport);
            }}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Exporter en PDF
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // FONCTIONS UTILITAIRES
  // ========================================

  const getTargetBadgeColor = (target: string) => {
    switch (target) {
      case ReportTarget.Administration:
        return 'bg-blue-100 text-blue-800';
      case ReportTarget.NextTeacher:
        return 'bg-green-100 text-green-800';
      case ReportTarget.Parents:
        return 'bg-purple-100 text-purple-800';
      case ReportTarget.Archive:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTargetLabel = (target: string) => {
    switch (target) {
      case ReportTarget.Administration:
        return 'Administration';
      case ReportTarget.NextTeacher:
        return 'Enseignant suivant';
      case ReportTarget.Parents:
        return 'Parents';
      case ReportTarget.Archive:
        return 'Archive';
      default:
        return 'Autre';
    }
  };

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header avec progression */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Générateur de Bilan Annuel
          </h1>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Indicateur de progression */}
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                index <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              )}>
                {index < currentStep ? (
                  <CheckCircleIcon className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  'w-12 h-1 mx-2',
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                )} />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-2">
          <h2 className="text-lg font-medium text-gray-900">
            {steps[currentStep].title}
          </h2>
          <p className="text-sm text-gray-600">
            {steps[currentStep].description}
          </p>
        </div>
      </div>

      {/* Contenu de l'étape */}
      <div className="px-6 py-8">
        {steps[currentStep].component()}
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
        <button
          onClick={handlePreviousStep}
          disabled={currentStep === 0}
          className={cn(
            'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors',
            currentStep === 0
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <ChevronLeftIcon className="h-4 w-4 mr-2" />
          Précédent
        </button>

        <div className="flex space-x-3">
          {currentStep < 3 && (
            <button
              onClick={handleNextStep}
              disabled={!validateCurrentStep()}
              className={cn(
                'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors',
                validateCurrentStep()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              )}
            >
              {currentStep === 2 ? 'Générer' : 'Suivant'}
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </button>
          )}
          
          {currentStep === 2 && (
            <button
              onClick={handleGenerate}
              disabled={reportLoading || !validateCurrentStep()}
              className={cn(
                'flex items-center px-6 py-2 text-sm font-medium rounded-md transition-colors',
                !reportLoading && validateCurrentStep()
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              )}
            >
              <CloudArrowDownIcon className="h-4 w-4 mr-2" />
              {reportLoading ? 'Génération...' : 'Générer le Bilan'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
