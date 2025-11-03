// ========================================
// RESULTS OVERVIEW - VUE D'ENSEMBLE RÉSULTATS
// ========================================

import React, { useState, useMemo, useEffect } from 'react';
import { RankingTable } from './rankings/RankingTable';
import { StatisticsPanel } from './statistics/StatisticsPanel';
import { AnalysisInsights } from './analysis/AnalysisInsights';
import { useEvaluations } from '../../../hooks/useEvaluations';
import { useResults } from '../../../hooks/useResults';
import { useStudents } from '../../../hooks/useStudents';
import { useStatistics } from '../../../hooks/useStatistics';
import { useRanking } from '../../../hooks/useRanking';
import { cn } from '../../../utils/classNames';

/**
 * Types pour les modes d'affichage
 */
type ViewMode = 'table' | 'charts' | 'analysis';

/**
 * Interface pour les filtres
 */
interface ResultsFilters {
  showAbsentsOnly?: boolean;
  showPresentOnly?: boolean;
  showOnlyPresent?: boolean;
  minScore?: number;
  maxScore?: number;
  quartile?: 1 | 2 | 3 | 4 | null;
  searchTerm?: string;
}

/**
 * Props du composant ResultsOverview
 */
interface ResultsOverviewProps {
  evaluationId: number;
  classId: number;
  className?: string;
}

/**
 * Composant principal pour l'affichage des résultats
 */
export const ResultsOverview: React.FC<ResultsOverviewProps> = ({
  evaluationId,
  classId,
  className = ''
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<ResultsFilters>({});
  const [isExporting, setIsExporting] = useState(false);

  // ========================================
  // HOOKS MÉTIER
  // ========================================

  const { evaluations } = useEvaluations();
  const { getEvaluationResults } = useResults();
  const { students } = useStudents(classId);

  // Charger les données
  const evaluation = useMemo(() => evaluations.find(e => e.id === evaluationId), [evaluationId, evaluations]);
  
  // Pour l'instant, utilisons un state temporaire pour les résultats
  const [results, setResults] = useState<any[]>([]);
  
  useEffect(() => {
    const loadResults = async () => {
      try {
        const evaluationResults = await getEvaluationResults(evaluationId);
        setResults(evaluationResults);
      } catch (error) {
        console.error('Erreur chargement résultats:', error);
        setResults([]);
      }
    };
    loadResults();
  }, [evaluationId, getEvaluationResults]);

  // Calculs statistiques et classement
  const statistics = useStatistics(evaluation, results, students);
  const { ranking, statistics: rankingStats } = useRanking(
    evaluation,
    results,
    students,
    {
      anonymize: isAnonymous,
      showOnlyPresent: selectedFilters.showOnlyPresent,
      highlightOutliers: true
    }
  );

  // ========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleAnonymousToggle = () => {
    setIsAnonymous(prev => !prev);
  };

  const handleFiltersChange = (newFilters: ResultsFilters) => {
    setSelectedFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setIsExporting(true);
    try {
      // TODO: Implémenter export
      console.log(`Export ${format} demandé`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // ========================================
  // ÉTAT DE CHARGEMENT
  // ========================================

  const isLoading = !evaluation || !statistics || !ranking;

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header avec contrôles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Informations de l'évaluation */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {evaluation.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                {statistics.presentStudents} élèves présents
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Moyenne: {statistics.average.toFixed(1)}/{evaluation.maxScore}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(evaluation.evaluationDate).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>

          {/* Contrôles */}
          <div className="flex flex-wrap gap-2">
            {/* Sélecteur de mode */}
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <ViewModeButton
                mode="table"
                currentMode={viewMode}
                onClick={handleViewModeChange}
                icon="table"
                label="Tableau"
              />
              <ViewModeButton
                mode="charts"
                currentMode={viewMode}
                onClick={handleViewModeChange}
                icon="chart"
                label="Graphiques"
              />
              <ViewModeButton
                mode="analysis"
                currentMode={viewMode}
                onClick={handleViewModeChange}
                icon="analysis"
                label="Analyse"
              />
            </div>

            {/* Toggle anonyme */}
            <button
              onClick={handleAnonymousToggle}
              className={cn(
                'inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md transition-colors',
                isAnonymous
                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              )}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
              Mode anonyme
            </button>

            {/* Menu export */}
            <ExportDropdown
              onExport={handleExport}
              isExporting={isExporting}
              evaluation={evaluation}
            />
          </div>
        </div>
      </div>

      {/* Alertes et insights */}
      <AnalysisInsights
        statistics={statistics}
        ranking={ranking}
        evaluation={evaluation}
        className="mb-6"
      />

      {/* Contenu principal selon le mode */}
      <div className="min-h-[400px]">
        {viewMode === 'table' && (
          <RankingTable
            evaluation={evaluation}
            ranking={ranking}
            isAnonymous={isAnonymous}
            filters={selectedFilters}
            onFiltersChange={handleFiltersChange}
          />
        )}

        {viewMode === 'charts' && (
          <StatisticsPanel
            statistics={statistics}
            ranking={ranking}
            evaluation={evaluation}
          />
        )}

        {viewMode === 'analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatisticsPanel
              statistics={statistics}
              ranking={ranking}
              evaluation={evaluation}
              compact
            />
            <AnalysisInsights
              statistics={statistics}
              ranking={ranking}
              evaluation={evaluation}
              detailed
            />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Composant pour les boutons de mode d'affichage
 */
interface ViewModeButtonProps {
  mode: ViewMode;
  currentMode: ViewMode;
  onClick: (mode: ViewMode) => void;
  icon: string;
  label: string;
}

const ViewModeButton: React.FC<ViewModeButtonProps> = ({
  mode,
  currentMode,
  onClick,
  icon,
  label
}) => {
  const isActive = currentMode === mode;

  const icons = {
    table: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h14a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1z" />
      </svg>
    ),
    chart: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    analysis: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    )
  };

  return (
    <button
      onClick={() => onClick(mode)}
      className={cn(
        'inline-flex items-center px-3 py-2 text-sm font-medium transition-colors',
        'first:rounded-l-md last:rounded-r-md border-r border-gray-300 last:border-r-0',
        isActive
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      )}
    >
      {icons[icon as keyof typeof icons]}
      <span className="ml-2 hidden sm:inline">{label}</span>
    </button>
  );
};

/**
 * Composant pour le menu d'export
 */
interface ExportDropdownProps {
  onExport: (format: 'pdf' | 'excel' | 'csv') => void;
  isExporting: boolean;
  evaluation: any;
}

const ExportDropdown: React.FC<ExportDropdownProps> = ({ onExport, isExporting, evaluation }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
      >
        {isExporting ? (
          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        ) : (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        Export
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
          <div className="py-1">
            <button
              onClick={() => { onExport('pdf'); setIsOpen(false); }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              📄 Export PDF
            </button>
            <button
              onClick={() => { onExport('excel'); setIsOpen(false); }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              📊 Export Excel
            </button>
            <button
              onClick={() => { onExport('csv'); setIsOpen(false); }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              📋 Export CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsOverview;
