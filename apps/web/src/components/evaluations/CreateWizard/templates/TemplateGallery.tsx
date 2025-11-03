// ========================================
// TEMPLATE GALLERY - GALERIE DE TEMPLATES
// ========================================

import React, { useState, useMemo } from 'react';
import { TemplateCard } from './TemplateCard';
import { evaluationTemplates, templateCategories, schoolLevels, filterTemplates } from './templateData';
import type { EvaluationTemplate } from './templateData';

/**
 * Props du composant TemplateGallery
 */
interface TemplateGalleryProps {
  onSelect: (template: EvaluationTemplate) => void;
  selectedTemplate?: EvaluationTemplate | null;
  maxDisplay?: number;
}

/**
 * Galerie de templates avec recherche et filtres
 */
export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onSelect,
  selectedTemplate,
  maxDisplay
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'category'>('popularity');

  // ========================================
  // FILTRAGE ET TRI
  // ========================================

  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = filterTemplates(evaluationTemplates, {
      search: searchTerm,
      category: selectedCategory,
      level: selectedLevel
    });

    // Tri
    switch (sortBy) {
      case 'popularity':
        filtered.sort((a, b) => b.popularity - a.popularity);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'category':
        filtered.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }

    // Limiter si nécessaire
    if (maxDisplay) {
      filtered = filtered.slice(0, maxDisplay);
    }

    return filtered;
  }, [searchTerm, selectedCategory, selectedLevel, sortBy, maxDisplay]);

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className="space-y-6">
      {/* Barre de recherche et filtres */}
      <div className="space-y-4">
        {/* Recherche */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Rechercher un modèle..."
          />
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Catégorie */}
          <div className="flex-1">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Matière
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Toutes les matières</option>
              {Object.entries(templateCategories).map(([key, category]) => (
                <option key={key} value={key}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Niveau */}
          <div className="flex-1">
            <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
              Niveau
            </label>
            <select
              id="level"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(schoolLevels)
                .sort((a, b) => a[1].order - b[1].order)
                .map(([key, level]) => (
                  <option key={key} value={key}>
                    {level.label}
                  </option>
                ))}
            </select>
          </div>

          {/* Tri */}
          <div className="flex-1">
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
              Trier par
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="popularity">Popularité</option>
              <option value="name">Nom</option>
              <option value="category">Matière</option>
            </select>
          </div>
        </div>
      </div>

      {/* Résultats */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {filteredAndSortedTemplates.length} modèle(s) trouvé(s)
          </h3>
          
          {(searchTerm || selectedCategory !== 'all' || selectedLevel !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedLevel('all');
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Effacer les filtres
            </button>
          )}
        </div>

        {/* Grille de templates */}
        {filteredAndSortedTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => onSelect(template)}
                isSelected={selectedTemplate?.id === template.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun modèle trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              Essayez d'modifier vos critères de recherche ou 
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedLevel('all');
                }}
                className="text-blue-600 hover:text-blue-800 ml-1"
              >
                effacez les filtres
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateGallery;
