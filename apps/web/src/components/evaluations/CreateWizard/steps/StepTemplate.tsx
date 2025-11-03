// ========================================
// STEP TEMPLATE - ÉTAPE CHOIX DE MODÈLE
// ========================================

import React, { useState, useMemo } from 'react';
import { TemplateGallery } from '../templates/TemplateGallery';
import { getPopularTemplates, getRecentTemplates } from '../templates/templateData';
import type { WizardStepProps } from '../EvaluationWizard';
import type { EvaluationTemplate } from '../templates/templateData';

/**
 * Première étape : choix du template
 */
export const StepTemplate: React.FC<WizardStepProps> = ({
  onDataChange,
  onValidationChange,
  onNext
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [selectedTemplate, setSelectedTemplate] = useState<EvaluationTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'popular' | 'recent' | 'all'>('popular');

  // ========================================
  // DONNÉES TEMPLATES
  // ========================================

  const popularTemplates = useMemo(() => getPopularTemplates(6), []);
  const recentTemplates = useMemo(() => {
    // TODO: Récupérer les templates récemment utilisés depuis localStorage
    const recentIds = JSON.parse(localStorage.getItem('recent_templates') || '[]');
    return getRecentTemplates(recentIds);
  }, []);

  // ========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const handleTemplateSelect = (template: EvaluationTemplate) => {
    setSelectedTemplate(template);
    onDataChange(template.data);
    onValidationChange(true);
    
    // Sauvegarder dans les récents
    const recentIds = JSON.parse(localStorage.getItem('recent_templates') || '[]');
    const updatedRecents = [template.id, ...recentIds.filter((id: string) => id !== template.id)].slice(0, 10);
    localStorage.setItem('recent_templates', JSON.stringify(updatedRecents));
    
    // Passer automatiquement à l'étape suivante après un délai
    setTimeout(() => {
      onNext?.();
    }, 500);
  };

  const handleStartFromScratch = () => {
    setSelectedTemplate(null);
    onDataChange({});
    onValidationChange(true);
    onNext?.();
  };

  // ========================================
  // VALIDATION
  // ========================================

  React.useEffect(() => {
    onValidationChange(true); // Cette étape est toujours valide
  }, [onValidationChange]);

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choisir un modèle d'évaluation
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Gagnez du temps en utilisant un modèle prédéfini adapté à votre matière et niveau, 
          ou commencez avec une évaluation vierge.
        </p>
      </div>

      {/* Option pour commencer sans template */}
      <div className="flex justify-center">
        <button
          onClick={handleStartFromScratch}
          className="inline-flex items-center px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors bg-white"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Créer sans modèle
        </button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-50 text-gray-500">ou choisir un modèle</span>
        </div>
      </div>

      {/* Sélecteur de vue */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setViewMode('popular')}
            className={`px-4 py-2 text-sm font-medium border rounded-l-lg transition-colors ${
              viewMode === 'popular'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="mr-2">🔥</span>
            Populaires
          </button>
          
          {recentTemplates.length > 0 && (
            <button
              type="button"
              onClick={() => setViewMode('recent')}
              className={`px-4 py-2 text-sm font-medium border-t border-b transition-colors ${
                viewMode === 'recent'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">🕒</span>
              Récents ({recentTemplates.length})
            </button>
          )}
          
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 text-sm font-medium border rounded-r-lg transition-colors ${
              viewMode === 'all'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="mr-2">📚</span>
            Tous les modèles
          </button>
        </div>
      </div>

      {/* Templates populaires */}
      {viewMode === 'popular' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Modèles les plus utilisés
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => handleTemplateSelect(template)}
                isSelected={selectedTemplate?.id === template.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Templates récents */}
      {viewMode === 'recent' && recentTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Modèles récemment utilisés
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => handleTemplateSelect(template)}
                isSelected={selectedTemplate?.id === template.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Galerie complète */}
      {viewMode === 'all' && (
        <TemplateGallery
          onSelect={handleTemplateSelect}
          selectedTemplate={selectedTemplate}
        />
      )}

      {/* Template sélectionné */}
      {selectedTemplate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">{selectedTemplate.icon}</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-900">
                Modèle sélectionné: {selectedTemplate.name}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                {selectedTemplate.description}
              </p>
            </div>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="text-blue-400 hover:text-blue-600 transition-colors"
              title="Désélectionner"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Composant card pour template individuel
 */
interface TemplateCardProps {
  template: EvaluationTemplate;
  onClick: () => void;
  isSelected?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onClick, isSelected = false }) => {
  const categoryColors = {
    mathematiques: 'border-blue-200 bg-blue-50 text-blue-900',
    francais: 'border-green-200 bg-green-50 text-green-900',
    sciences: 'border-purple-200 bg-purple-50 text-purple-900',
    histoire_geo: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    general: 'border-gray-200 bg-gray-50 text-gray-900'
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md hover:scale-105 ${
        isSelected 
          ? 'border-blue-500 bg-blue-100 shadow-lg' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-start">
        <span className="text-2xl mr-3 flex-shrink-0">{template.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
            {template.name}
          </h3>
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {template.description}
          </p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${categoryColors[template.category]}`}>
              {template.category}
            </span>
            {template.level !== 'all' && (
              <span className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-100 text-gray-700">
                {template.level}
              </span>
            )}
          </div>

          {/* Popularité */}
          <div className="flex items-center">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3 h-3 ${
                    i < template.popularity ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default StepTemplate;
