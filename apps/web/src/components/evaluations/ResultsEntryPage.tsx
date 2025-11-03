// ========================================
// RESULTS ENTRY PAGE - PAGE PRINCIPALE DE SAISIE
// ========================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResultsTable } from './ResultsEntry/ResultsTable';
import { LiveStats } from './CalculationDisplay/LiveStats';
import { RankingPreview } from './CalculationDisplay/RankingPreview';
import { ProgressBar } from './CalculationDisplay/ProgressBar';
import { useEvaluations } from '../../hooks/useEvaluations';
import { useStudents } from '../../hooks/useStudents';
import { useEvaluationKeyboardShortcuts } from '../../hooks/useKeyboardNavigation';
import { cn } from '../../utils/classNames';
import type { Evaluation, Student, EvaluationResult } from '../../types';

/**
 * Interface pour les paramètres de la page
 */
interface ResultsEntryPageParams {
  classId: string;
  evaluationId: string;
}

/**
 * Configuration d'affichage de la page
 */
interface PageLayout {
  showStats: boolean;
  showRanking: boolean;
  statsPosition: 'top' | 'bottom' | 'side';
  compactMode: boolean;
}

/**
 * Page principale de saisie des résultats d'évaluation
 */
export const ResultsEntryPage: React.FC = () => {
  const { classId, evaluationId } = useParams<ResultsEntryPageParams>();
  const navigate = useNavigate();

  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [layout, setLayout] = useState<PageLayout>({
    showStats: true,
    showRanking: true,
    statsPosition: 'side',
    compactMode: false
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [results, setResults] = useState<Record<number, EvaluationResult>>({});

  // ========================================
  // HOOKS MÉTIER
  // ========================================

  const {
    getEvaluationById,
    updateEvaluation,
    finalizeEvaluation,
    loading: evaluationLoading,
    error: evaluationError
  } = useEvaluations();

  const {
    students,
    loading: studentsLoading,
    error: studentsError
  } = useStudents({
    classId: classId ? parseInt(classId) : undefined,
    includeInactive: false
  });

  // ========================================
  // CHARGEMENT DES DONNÉES
  // ========================================

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  useEffect(() => {
    const loadEvaluation = async () => {
      if (!evaluationId) return;

      try {
        const evalData = await getEvaluationById(parseInt(evaluationId), true);
        if (evalData) {
          setEvaluation(evalData);
          
          // Charger les résultats existants si disponibles
          if (evalData.results) {
            const resultsMap = evalData.results.reduce((acc, result) => {
              acc[result.studentId] = result;
              return acc;
            }, {} as Record<number, EvaluationResult>);
            setResults(resultsMap);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'évaluation:', error);
      }
    };

    loadEvaluation();
  }, [evaluationId, getEvaluationById]);

  // ========================================
  // VALIDATION ET NAVIGATION
  // ========================================

  // Vérifications de sécurité
  useEffect(() => {
    if (!classId || !evaluationId) {
      navigate('/evaluations');
      return;
    }

    // Vérifier que l'évaluation appartient à la classe
    if (evaluation && evaluation.classId !== parseInt(classId)) {
      console.error('L\'évaluation ne correspond pas à la classe');
      navigate('/evaluations');
      return;
    }
  }, [classId, evaluationId, evaluation, navigate]);

  // ========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const handleResultsChange = useCallback((newResults: Record<number, EvaluationResult>) => {
    setResults(newResults);
  }, []);

  const handleSaveAndExit = useCallback(async () => {
    // Sauvegarder et retourner à la liste des évaluations
    navigate(`/classes/${classId}/evaluations`);
  }, [navigate, classId]);

  const handleFinalize = useCallback(async () => {
    if (!evaluation) return;

    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir finaliser cette évaluation ? ' +
      'Une fois finalisée, les notes ne pourront plus être modifiées.'
    );

    if (confirmed) {
      try {
        await finalizeEvaluation(evaluation.id);
        navigate(`/classes/${classId}/evaluations`);
      } catch (error) {
        console.error('Erreur lors de la finalisation:', error);
      }
    }
  }, [evaluation, finalizeEvaluation, navigate, classId]);

  const handleExport = useCallback(() => {
    // Logique d'export des résultats
    console.log('Export des résultats...');
  }, []);

  const toggleLayout = useCallback((setting: keyof PageLayout) => {
    setLayout(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // ========================================
  // RACCOURCIS CLAVIER GLOBAUX
  // ========================================

  useEvaluationKeyboardShortcuts({
    onSave: handleSaveAndExit,
    onShowHelp: () => setShowHelp(!showHelp),
    onFinalizeEvaluation: handleFinalize,
    onExportResults: handleExport
  });

  // ========================================
  // CALCULS STATISTIQUES
  // ========================================

  const completionStats = useMemo(() => {
    if (!students.length) return { completed: 0, total: 0, percentage: 0 };

    const completed = students.filter(student => {
      const result = results[student.id];
      return result && (result.score !== null || result.isAbsent);
    }).length;

    return {
      completed,
      total: students.length,
      percentage: (completed / students.length) * 100
    };
  }, [students, results]);

  // ========================================
  // RENDU CONDITIONNEL POUR LES ERREURS
  // ========================================

  if (evaluationLoading || studentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'évaluation...</p>
        </div>
      </div>
    );
  }

  if (evaluationError || studentsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-gray-600 mb-4">
            {evaluationError || studentsError}
          </p>
          <button
            onClick={() => navigate(`/classes/${classId}/evaluations`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retour aux évaluations
          </button>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Évaluation non trouvée
          </h2>
          <p className="text-gray-600 mb-4">
            L'évaluation demandée n'existe pas ou n'est plus accessible.
          </p>
          <button
            onClick={() => navigate(`/classes/${classId}/evaluations`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retour aux évaluations
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className={cn(
      'min-h-screen bg-gray-50',
      isFullscreen && 'fixed inset-0 z-50 bg-white'
    )}>
      {/* Header de la page */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Titre et informations */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate(`/classes/${classId}/evaluations`)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Retour aux évaluations"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-semibold text-gray-900 truncate">
                    {evaluation.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{evaluation.subject}</span>
                    <span>•</span>
                    <span>{evaluation.type}</span>
                    <span>•</span>
                    <span>/{evaluation.maxScore} points</span>
                    {evaluation.isFinalized && (
                      <>
                        <span>•</span>
                        <span className="text-green-600 font-medium">✅ Finalisée</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Barre de progression compacte */}
            <div className="hidden md:block mx-6 w-48">
              <ProgressBar
                current={completionStats.completed}
                total={completionStats.total}
                size="sm"
                animated={true}
                showNumbers={false}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {/* Toggle des panneaux */}
              <div className="hidden lg:flex items-center space-x-1">
                <button
                  onClick={() => toggleLayout('showStats')}
                  className={cn(
                    'p-2 rounded-md text-sm transition-colors',
                    layout.showStats 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  )}
                  title="Afficher/masquer les statistiques"
                >
                  📊
                </button>
                
                <button
                  onClick={() => toggleLayout('showRanking')}
                  className={cn(
                    'p-2 rounded-md text-sm transition-colors',
                    layout.showRanking 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  )}
                  title="Afficher/masquer le classement"
                >
                  🏆
                </button>
              </div>

              {/* Plein écran */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Mode plein écran"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>

              {/* Finaliser */}
              {!evaluation.isFinalized && completionStats.percentage === 100 && (
                <button
                  onClick={handleFinalize}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  Finaliser
                </button>
              )}

              {/* Sauvegarder et quitter */}
              <button
                onClick={handleSaveAndExit}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Layout adaptatif */}
        {layout.statsPosition === 'side' ? (
          /* Layout avec panneau latéral */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Tableau principal */}
            <div className="lg:col-span-3">
              <ResultsTable
                evaluation={evaluation}
                students={students}
                onResultsChange={handleResultsChange}
                autoSaveEnabled={!evaluation.isFinalized}
                showKeyboardShortcuts={showHelp}
              />
            </div>

            {/* Panneau latéral */}
            <div className="lg:col-span-1 space-y-6">
              {layout.showStats && (
                <LiveStats
                  evaluation={evaluation}
                  students={students}
                  results={results}
                  compact={true}
                />
              )}

              {layout.showRanking && (
                <RankingPreview
                  evaluation={evaluation}
                  students={students}
                  results={results}
                  maxDisplay={5}
                  showAnimation={true}
                />
              )}
            </div>
          </div>
        ) : (
          /* Layout vertical */
          <div className="space-y-6">
            {/* Statistiques et progression en haut */}
            {layout.statsPosition === 'top' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {layout.showStats && (
                  <LiveStats
                    evaluation={evaluation}
                    students={students}
                    results={results}
                    compact={false}
                  />
                )}

                {layout.showRanking && (
                  <RankingPreview
                    evaluation={evaluation}
                    students={students}
                    results={results}
                    maxDisplay={5}
                    showAnimation={true}
                  />
                )}
              </div>
            )}

            {/* Tableau principal */}
            <ResultsTable
              evaluation={evaluation}
              students={students}
              onResultsChange={handleResultsChange}
              autoSaveEnabled={!evaluation.isFinalized}
              showKeyboardShortcuts={showHelp}
            />

            {/* Statistiques en bas */}
            {layout.statsPosition === 'bottom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {layout.showStats && (
                  <LiveStats
                    evaluation={evaluation}
                    students={students}
                    results={results}
                    compact={false}
                  />
                )}

                {layout.showRanking && (
                  <RankingPreview
                    evaluation={evaluation}
                    students={students}
                    results={results}
                    maxDisplay={10}
                    showAnimation={true}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress bar mobile en bas */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <ProgressBar
          current={completionStats.completed}
          total={completionStats.total}
          label="Progression"
          size="sm"
          animated={true}
        />
      </div>
    </div>
  );
};

export default ResultsEntryPage;
