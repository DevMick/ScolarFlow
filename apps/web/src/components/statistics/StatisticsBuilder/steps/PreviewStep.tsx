// ========================================
// PREVIEW STEP - APERÇU ET FINALISATION
// ========================================

import React, { useState } from 'react';
import { EyeIcon, TagIcon, ShareIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import type { WizardStepProps } from '../ConfigurationWizard';
import type { StatisticCategory } from '@edustats/shared/statistics';
import { cn } from '../../../../utils/classNames';

/**
 * Catégories disponibles pour la configuration
 */
const CATEGORIES: Array<{
  category: StatisticCategory;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    category: StatisticCategory.Performance,
    title: 'Performance',
    description: 'Analyses des résultats et réussites',
    icon: '🎯'
  },
  {
    category: StatisticCategory.Progression,
    title: 'Progression',
    description: 'Évolution et tendances temporelles',
    icon: '📈'
  },
  {
    category: StatisticCategory.Comparison,
    title: 'Comparaison',
    description: 'Comparaisons entre groupes ou périodes',
    icon: '⚖️'
  },
  {
    category: StatisticCategory.Custom,
    title: 'Personnalisé',
    description: 'Configuration sur mesure',
    icon: '🛠️'
  }
];

/**
 * Tags suggérés pour l'organisation
 */
const SUGGESTED_TAGS = [
  'mathématiques', 'français', 'sciences', 'histoire',
  'CP', 'CE1', 'CE2', 'CM1', 'CM2',
  'trimestre1', 'trimestre2', 'trimestre3',
  'évaluation-continue', 'contrôles',
  'difficultés', 'excellence', 'moyennes'
];

/**
 * Étape d'aperçu et finalisation
 */
export const PreviewStep: React.FC<WizardStepProps> = ({
  data,
  validationErrors,
  onDataChange
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [name, setName] = useState<string>(data.name || '');
  const [description, setDescription] = useState<string>(data.description || '');
  const [selectedCategory, setSelectedCategory] = useState<StatisticCategory>(
    data.category || StatisticCategory.Custom
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(data.tags || []);
  const [customTag, setCustomTag] = useState<string>('');
  const [isTemplate, setIsTemplate] = useState<boolean>(data.isTemplate || false);
  const [isPublic, setIsPublic] = useState<boolean>(data.isPublic || false);

  // ========================================
  // GESTION DES CHANGEMENTS
  // ========================================

  const handleNameChange = (value: string) => {
    setName(value);
    onDataChange({ name: value });
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    onDataChange({ description: value });
  };

  const handleCategoryChange = (category: StatisticCategory) => {
    setSelectedCategory(category);
    onDataChange({ category });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    onDataChange({ tags: newTags });
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      const newTags = [...selectedTags, customTag.trim()];
      setSelectedTags(newTags);
      onDataChange({ tags: newTags });
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    onDataChange({ tags: newTags });
  };

  const handleTemplateChange = (value: boolean) => {
    setIsTemplate(value);
    onDataChange({ isTemplate: value });
  };

  const handlePublicChange = (value: boolean) => {
    setIsPublic(value);
    onDataChange({ isPublic: value });
  };

  // ========================================
  // UTILITAIRES POUR L'APERÇU
  // ========================================

  const getSelectedClassesCount = () => {
    return data.dataSources?.classIds?.length || 0;
  };

  const getSelectedMetricsCount = () => {
    return data.calculations?.metrics?.length || 0;
  };

  const getDateRangeDisplay = () => {
    if (!data.dataSources?.dateRange) return 'Non définie';
    const [start, end] = data.dataSources.dateRange;
    return `Du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}`;
  };

  const getChartTypeDisplay = () => {
    switch (data.visualization?.chartType) {
      case 'bar': return 'Barres';
      case 'line': return 'Courbes';
      case 'pie': return 'Camembert';
      case 'radar': return 'Radar';
      case 'scatter': return 'Nuage de points';
      case 'heatmap': return 'Carte de chaleur';
      default: return 'Non défini';
    }
  };

  const getColorSchemeDisplay = () => {
    switch (data.visualization?.colorScheme) {
      case 'blue': return 'Bleus';
      case 'green': return 'Verts';
      case 'purple': return 'Violets';
      case 'orange': return 'Oranges';
      case 'rainbow': return 'Arc-en-ciel';
      case 'monochrome': return 'Monochrome';
      default: return 'Non définie';
    }
  };

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className="space-y-8">
      {/* Informations de base */}
      <div>
        <div className="flex items-center mb-4">
          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Informations de base</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de la configuration
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Analyse des performances en mathématiques CP"
              className={cn(
                'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                validationErrors['name'] && 'border-red-500 focus:border-red-500 focus:ring-red-500'
              )}
            />
            {validationErrors['name'] && (
              <div className="text-red-600 text-sm mt-1">
                {validationErrors['name'].join(', ')}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optionnelle)
            </label>
            <textarea
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Décrivez l'objectif et le contexte de cette analyse..."
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Catégorie */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Catégorie</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.category;
            
            return (
              <button
                key={category.category}
                type="button"
                onClick={() => handleCategoryChange(category.category)}
                className={cn(
                  'relative p-3 border rounded-lg text-center transition-all hover:shadow-md',
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                    : 'border-gray-300 hover:border-gray-400'
                )}
              >
                <div className="text-xl mb-1">{category.icon}</div>
                <h4 className={cn(
                  'font-medium text-sm',
                  isSelected ? 'text-blue-900' : 'text-gray-900'
                )}>
                  {category.title}
                </h4>
                <p className={cn(
                  'text-xs mt-1',
                  isSelected ? 'text-blue-700' : 'text-gray-500'
                )}>
                  {category.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      <div>
        <div className="flex items-center mb-4">
          <TagIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Tags pour l'organisation</h3>
        </div>

        {/* Tags sélectionnés */}
        {selectedTags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags suggérés */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Tags suggérés</h4>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TAGS.filter(tag => !selectedTags.includes(tag)).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Ajouter un tag personnalisé */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            placeholder="Ajouter un tag personnalisé..."
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
          />
          <button
            type="button"
            onClick={handleAddCustomTag}
            disabled={!customTag.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ajouter
          </button>
        </div>
      </div>

      {/* Options de partage */}
      <div>
        <div className="flex items-center mb-4">
          <ShareIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Options de partage</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              checked={isTemplate}
              onChange={(e) => handleTemplateChange(e.target.checked)}
            />
            <span className="ml-3 text-sm text-gray-700">
              Sauvegarder comme template
            </span>
          </label>
          <p className="text-xs text-gray-500 ml-7">
            Permet de réutiliser cette configuration pour créer rapidement de nouvelles analyses similaires
          </p>

          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              checked={isPublic}
              onChange={(e) => handlePublicChange(e.target.checked)}
            />
            <span className="ml-3 text-sm text-gray-700">
              Partager avec d'autres enseignants
            </span>
          </label>
          <p className="text-xs text-gray-500 ml-7">
            Rend cette configuration visible et utilisable par les autres enseignants de l'établissement
          </p>
        </div>
      </div>

      {/* Résumé de la configuration */}
      <div>
        <div className="flex items-center mb-4">
          <EyeIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Résumé de la configuration</h3>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Données source */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Sources de données</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div>Classes: {getSelectedClassesCount()} sélectionnée(s)</div>
                <div>Période: {getDateRangeDisplay()}</div>
                {data.dataSources?.subjectFilters?.length > 0 && (
                  <div>Matières: {data.dataSources.subjectFilters.join(', ')}</div>
                )}
                {data.dataSources?.typeFilters?.length > 0 && (
                  <div>Types: {data.dataSources.typeFilters.join(', ')}</div>
                )}
              </div>
            </div>

            {/* Calculs */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Analyses</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div>Type: {data.calculations?.type}</div>
                <div>Métriques: {getSelectedMetricsCount()} sélectionnée(s)</div>
                <div>Regroupement: {data.calculations?.groupBy}</div>
                <div>Agrégation: {data.calculations?.aggregation}</div>
              </div>
            </div>

            {/* Visualisation */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Visualisation</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div>Graphique: {getChartTypeDisplay()}</div>
                <div>Couleurs: {getColorSchemeDisplay()}</div>
                <div>Mise en page: {data.visualization?.layout}</div>
                {data.visualization?.multiSeries && <div>✓ Séries multiples</div>}
                {data.visualization?.annotations && <div>✓ Annotations</div>}
              </div>
            </div>

            {/* Métadonnées */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Métadonnées</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div>Nom: {name || 'Non défini'}</div>
                <div>Catégorie: {CATEGORIES.find(c => c.category === selectedCategory)?.title}</div>
                <div>Tags: {selectedTags.length || 0}</div>
                {isTemplate && <div>✓ Template</div>}
                {isPublic && <div>✓ Public</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes de validation */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-900 mb-2">
            Erreurs à corriger avant de continuer :
          </h4>
          <ul className="text-sm text-red-800 space-y-1">
            {Object.entries(validationErrors).map(([field, errors]) => (
              <li key={field}>• {errors.join(', ')}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PreviewStep;
