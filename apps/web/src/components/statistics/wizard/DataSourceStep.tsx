// ========================================
// DATA SOURCE STEP - SÉLECTION DES SOURCES DE DONNÉES
// ========================================

import React, { useState, useEffect } from 'react';
import { CalendarIcon, FunnelIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { useClasses } from '../../../hooks/useClasses';
import { useEvaluations } from '../../../hooks/useEvaluations';
import type { CreateStatisticConfigurationData } from '@edustats/shared/types';
import { cn } from '../../../utils/classNames';

/**
 * Props du composant DataSourceStep
 */
interface DataSourceStepProps {
  data: Partial<CreateStatisticConfigurationData>;
  validationErrors: Record<string, string[]>;
  onDataChange: (data: Partial<CreateStatisticConfigurationData>) => void;
}

/**
 * Étape de sélection des sources de données
 */
export const DataSourceStep: React.FC<DataSourceStepProps> = ({
  data,
  validationErrors,
  onDataChange
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [selectedClassIds, setSelectedClassIds] = useState<number[]>(
    data.dataSources?.classIds || []
  );
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    data.dataSources?.dateRange?.[0] || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    data.dataSources?.dateRange?.[1] || new Date()
  ]);
  const [subjectFilters, setSubjectFilters] = useState<string[]>(
    data.dataSources?.subjectFilters || []
  );
  const [typeFilters, setTypeFilters] = useState<string[]>(
    data.dataSources?.typeFilters || []
  );
  const [excludeAbsent, setExcludeAbsent] = useState<boolean>(
    data.dataSources?.excludeAbsent ?? true
  );
  const [excludeIncomplete, setExcludeIncomplete] = useState<boolean>(
    data.dataSources?.excludeIncomplete ?? false
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ========================================
  // HOOKS
  // ========================================

  const { classes, loading: classesLoading } = useClasses();
  const { evaluations } = useEvaluations();

  // ========================================
  // DONNÉES DISPONIBLES POUR LES FILTRES
  // ========================================

  const availableSubjects = React.useMemo(() => {
    const subjects = new Set<string>();
    evaluations.forEach(eval => {
      if (eval.subject) subjects.add(eval.subject);
    });
    return Array.from(subjects).sort();
  }, [evaluations]);

  const availableTypes = React.useMemo(() => {
    const types = new Set<string>();
    evaluations.forEach(eval => {
      if (eval.type) types.add(eval.type);
    });
    return Array.from(types).sort();
  }, [evaluations]);

  // ========================================
  // FONCTIONS DE MISE À JOUR
  // ========================================

  const updateDataSources = React.useCallback((updates: Partial<typeof data.dataSources>) => {
    onDataChange({
      dataSources: {
        ...data.dataSources,
        ...updates
      }
    });
  }, [data.dataSources, onDataChange]);

  // ========================================
  // GESTION DES CHANGEMENTS
  // ========================================

  const handleClassSelection = (classId: number, isSelected: boolean) => {
    const newSelection = isSelected
      ? [...selectedClassIds, classId]
      : selectedClassIds.filter(id => id !== classId);
    
    setSelectedClassIds(newSelection);
    updateDataSources({ classIds: newSelection });
  };

  const handleSelectAllClasses = () => {
    const allClassIds = classes.map(c => c.id);
    setSelectedClassIds(allClassIds);
    updateDataSources({ classIds: allClassIds });
  };

  const handleDeselectAllClasses = () => {
    setSelectedClassIds([]);
    updateDataSources({ classIds: [] });
  };

  const handleDateRangeChange = (field: 'start' | 'end', date: string) => {
    const newDate = new Date(date);
    const newRange: [Date, Date] = field === 'start' 
      ? [newDate, dateRange[1]]
      : [dateRange[0], newDate];
    
    setDateRange(newRange);
    updateDataSources({ dateRange: newRange });
  };

  const handleSubjectFilter = (subject: string, isSelected: boolean) => {
    const newSubjects = isSelected
      ? [...subjectFilters, subject]
      : subjectFilters.filter(s => s !== subject);
    
    setSubjectFilters(newSubjects);
    updateDataSources({ subjectFilters: newSubjects });
  };

  const handleTypeFilter = (type: string, isSelected: boolean) => {
    const newTypes = isSelected
      ? [...typeFilters, type]
      : typeFilters.filter(t => t !== type);
    
    setTypeFilters(newTypes);
    updateDataSources({ typeFilters: newTypes });
  };

  const handleAdvancedOptions = (option: 'excludeAbsent' | 'excludeIncomplete', value: boolean) => {
    if (option === 'excludeAbsent') {
      setExcludeAbsent(value);
    } else {
      setExcludeIncomplete(value);
    }
    updateDataSources({ [option]: value });
  };

  // ========================================
  // UTILITAIRES
  // ========================================

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className="space-y-8">
      {/* Sélection des classes */}
      <div>
        <div className="flex items-center mb-4">
          <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Classes à analyser</h3>
          <span className="text-red-500 ml-1">*</span>
        </div>
        
        {classesLoading ? (
          <div className="text-gray-500">Chargement des classes...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAllClasses}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Tout sélectionner
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={handleDeselectAllClasses}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Tout désélectionner
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {classes.map((classe) => (
                <label
                  key={classe.id}
                  className={cn(
                    'relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors',
                    selectedClassIds.includes(classe.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300'
                  )}
                >
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    checked={selectedClassIds.includes(classe.id)}
                    onChange={(e) => handleClassSelection(classe.id, e.target.checked)}
                  />
                  <div className="ml-3 min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {classe.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {classe.level} - {classe.academicYear}
                    </div>
                    <div className="text-xs text-gray-400">
                      {classe.studentCount || 0} élève(s)
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {validationErrors['dataSources.classIds'] && (
              <div className="text-red-600 text-sm">
                {validationErrors['dataSources.classIds'].join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Période d'analyse */}
      <div>
        <div className="flex items-center mb-4">
          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Période d'analyse</h3>
          <span className="text-red-500 ml-1">*</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={formatDateForInput(dateRange[0])}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={formatDateForInput(dateRange[1])}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {validationErrors['dataSources.dateRange'] && (
          <div className="text-red-600 text-sm mt-2">
            {validationErrors['dataSources.dateRange'].join(', ')}
          </div>
        )}
      </div>

      {/* Filtres par matière et type */}
      <div>
        <div className="flex items-center mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filtres optionnels</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Filtres par matière */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Matières</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableSubjects.map((subject) => (
                <label key={subject} className="flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600 rounded"
                    checked={subjectFilters.includes(subject)}
                    onChange={(e) => handleSubjectFilter(subject, e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-700">{subject}</span>
                </label>
              ))}
              {availableSubjects.length === 0 && (
                <div className="text-sm text-gray-500">Aucune matière disponible</div>
              )}
            </div>
          </div>

          {/* Filtres par type */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Types d'évaluation</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableTypes.map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600 rounded"
                    checked={typeFilters.includes(type)}
                    onChange={(e) => handleTypeFilter(type, e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-700">{type}</span>
                </label>
              ))}
              {availableTypes.length === 0 && (
                <div className="text-sm text-gray-500">Aucun type disponible</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Options avancées */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <span>{showAdvanced ? 'Masquer' : 'Afficher'} les options avancées</span>
          <svg
            className={cn(
              'ml-2 h-4 w-4 transition-transform',
              showAdvanced ? 'rotate-180' : ''
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-blue-600 rounded"
                checked={excludeAbsent}
                onChange={(e) => handleAdvancedOptions('excludeAbsent', e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-700">
                Exclure les élèves absents des calculs
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-blue-600 rounded"
                checked={excludeIncomplete}
                onChange={(e) => handleAdvancedOptions('excludeIncomplete', e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-700">
                Exclure les évaluations incomplètes
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Résumé de la sélection */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Résumé de la sélection</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div>Classes sélectionnées: {selectedClassIds.length}</div>
          <div>
            Période: du {dateRange[0].toLocaleDateString('fr-FR')} au {dateRange[1].toLocaleDateString('fr-FR')}
          </div>
          {subjectFilters.length > 0 && (
            <div>Matières filtrées: {subjectFilters.join(', ')}</div>
          )}
          {typeFilters.length > 0 && (
            <div>Types filtrés: {typeFilters.join(', ')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataSourceStep;
