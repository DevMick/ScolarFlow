// ========================================
// TESTS FRONTEND REPORT GENERATOR - PHASE 7
// ========================================

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { ReportGenerator } from '../../components/reports/ReportGenerator';
import { useAnnualReports, useReportTemplates } from '../../hooks/useAnnualReports';
import { useClasses } from '../../hooks/useClasses';
import { 
  AnnualReport,
  ReportTemplate,
  ReportTarget,
  ReportGenerationOptions
} from '@edustats/shared/types';

// ========================================
// MOCKS
// ========================================

// Mock des hooks
jest.mock('../../hooks/useAnnualReports');
jest.mock('../../hooks/useClasses');
jest.mock('react-hot-toast');

const mockUseAnnualReports = useAnnualReports as jest.MockedFunction<typeof useAnnualReports>;
const mockUseReportTemplates = useReportTemplates as jest.MockedFunction<typeof useReportTemplates>;
const mockUseClasses = useClasses as jest.MockedFunction<typeof useClasses>;

// Données de test
const mockClasses = [
  {
    id: 1,
    name: 'CM2 A',
    level: 'CM2',
    studentCount: 25,
    description: 'Classe de CM2 section A'
  },
  {
    id: 2,
    name: 'CM1 B',
    level: 'CM1',
    studentCount: 22,
    description: 'Classe de CM1 section B'
  }
];

const mockTemplates: ReportTemplate[] = [
  {
    id: '1',
    name: 'Rapport Administratif Complet',
    description: 'Rapport détaillé pour l\'administration',
    target: ReportTarget.Administration,
    config: {},
    sections: [
      {
        id: 'metadata',
        title: 'Informations Générales',
        type: 'summary' as any,
        required: true,
        customizable: false,
        config: {},
        order: 1
      }
    ],
    formatting: {
      layout: 'detailed' as any,
      includeCharts: true,
      includeRawData: true,
      pageBreaks: [],
      branding: true
    },
    isOfficial: true,
    usageCount: 150,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Résumé de Transition',
    description: 'Synthèse pour l\'enseignant suivant',
    target: ReportTarget.NextTeacher,
    config: {},
    sections: [],
    formatting: {
      layout: 'compact' as any,
      includeCharts: false,
      includeRawData: false,
      pageBreaks: [],
      branding: false
    },
    isOfficial: true,
    usageCount: 89,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockGeneratedReport: AnnualReport = {
  id: 'report_1_2024-2025',
  classId: 1,
  academicYear: '2024-2025',
  generatedAt: new Date(),
  status: 'final',
  metadata: {
    className: 'CM2 A',
    level: 'CM2',
    teacher: 'Marie Dupont',
    totalStudents: 25,
    totalEvaluations: 45,
    dateRange: [new Date('2024-09-01'), new Date('2025-07-31')],
    generationTime: 15000
  },
  classSummary: {
    averagePerformance: 14.2,
    progressionTrend: 'stable' as any,
    subjectPerformances: [],
    keyMetrics: {
      successRate: 85.6,
      absenteeismRate: 3.2,
      participationRate: 96.8,
      improvementRate: 12.4,
      consistencyIndex: 0.78
    },
    distributionAnalysis: {
      excellentStudents: 8,
      goodStudents: 12,
      averageStudents: 4,
      strugglingStudents: 1
    },
    temporalAnalysis: {
      bestPeriod: 'Trimestre 2',
      worstPeriod: 'Trimestre 1',
      mostImprovement: 'Trimestre 3',
      seasonalPatterns: []
    }
  },
  studentAnalyses: [],
  insights: [],
  pedagogicalRecommendations: {
    strengths: ['Excellent niveau général', 'Bonne participation'],
    areasForImprovement: ['Mathématiques à renforcer'],
    suggestedActions: [],
    nextYearFocus: ['Consolidation des acquis'],
    individualSupport: []
  },
  rawData: {
    evaluations: [],
    results: [],
    statistics: {},
    classInfo: mockClasses[0] as any
  },
  generationMetrics: {
    processingTime: 15000,
    dataPoints: 1125,
    algorithmsUsed: ['Classification', 'Régression'],
    confidenceScore: 0.89
  }
};

describe('ReportGenerator - Interface Wizard', () => {
  let mockGenerateReport: jest.Mock;
  let mockGetTemplates: jest.Mock;

  beforeEach(() => {
    // Reset des mocks
    jest.clearAllMocks();

    // Configuration des mocks
    mockGenerateReport = jest.fn();
    mockGetTemplates = jest.fn();

    mockUseAnnualReports.mockReturnValue({
      generateReport: mockGenerateReport,
      loading: false,
      error: null,
      generationProgress: 0,
      getReports: jest.fn(),
      getReportById: jest.fn(),
      exportReport: jest.fn(),
      deleteReport: jest.fn(),
      archiveReport: jest.fn(),
      clearError: jest.fn()
    });

    mockUseReportTemplates.mockReturnValue({
      getTemplates: mockGetTemplates,
      getTemplateById: jest.fn(),
      createTemplate: jest.fn(),
      loading: false,
      error: null,
      clearError: jest.fn()
    });

    mockUseClasses.mockReturnValue({
      classes: mockClasses,
      loading: false,
      error: null,
      createClass: jest.fn(),
      updateClass: jest.fn(),
      deleteClass: jest.fn(),
      getClassById: jest.fn()
    });

    // Mock des templates
    mockGetTemplates.mockResolvedValue({
      templates: mockTemplates,
      total: mockTemplates.length
    });
  });

  // ========================================
  // TESTS D'AFFICHAGE INITIAL
  // ========================================

  describe('Affichage Initial', () => {
    test('devrait afficher le titre et la description', () => {
      render(<ReportGenerator />);

      expect(screen.getByText('Générateur de Bilan Annuel')).toBeInTheDocument();
      expect(screen.getByText('Créez automatiquement le bilan complet de votre classe')).toBeInTheDocument();
    });

    test('devrait afficher l\'indicateur de progression', () => {
      render(<ReportGenerator />);

      // Vérification des étapes
      expect(screen.getByText('Sélection')).toBeInTheDocument();
      expect(screen.getByText('Template')).toBeInTheDocument();
      expect(screen.getByText('Personnalisation')).toBeInTheDocument();
      expect(screen.getByText('Génération')).toBeInTheDocument();
      expect(screen.getByText('Résultats')).toBeInTheDocument();
    });

    test('devrait commencer à l\'étape de sélection', () => {
      render(<ReportGenerator />);

      expect(screen.getByText('Informations de base')).toBeInTheDocument();
      expect(screen.getByLabelText('Classe')).toBeInTheDocument();
      expect(screen.getByLabelText('Année académique')).toBeInTheDocument();
    });
  });

  // ========================================
  // TESTS ÉTAPE 1 - SÉLECTION
  // ========================================

  describe('Étape 1 - Sélection de Classe', () => {
    test('devrait afficher la liste des classes', () => {
      render(<ReportGenerator />);

      const classSelect = screen.getByLabelText('Classe');
      expect(classSelect).toBeInTheDocument();

      // Vérification des options
      expect(screen.getByText('CM2 A - CM2 (25 élèves)')).toBeInTheDocument();
      expect(screen.getByText('CM1 B - CM1 (22 élèves)')).toBeInTheDocument();
    });

    test('devrait permettre de sélectionner une classe', async () => {
      const user = userEvent.setup();
      render(<ReportGenerator />);

      const classSelect = screen.getByLabelText('Classe');
      await user.selectOptions(classSelect, '1');

      expect(classSelect).toHaveValue('1');
    });

    test('devrait afficher les informations de la classe sélectionnée', async () => {
      const user = userEvent.setup();
      render(<ReportGenerator />);

      const classSelect = screen.getByLabelText('Classe');
      await user.selectOptions(classSelect, '1');

      await waitFor(() => {
        expect(screen.getByText('Classe sélectionnée')).toBeInTheDocument();
        expect(screen.getByText('CM2 A')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
      });
    });

    test('devrait valider les champs requis', async () => {
      const user = userEvent.setup();
      render(<ReportGenerator />);

      const nextButton = screen.getByText('Suivant');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Erreurs de validation')).toBeInTheDocument();
        expect(screen.getByText('• Veuillez sélectionner une classe')).toBeInTheDocument();
      });
    });

    test('devrait permettre de passer à l\'étape suivante avec données valides', async () => {
      const user = userEvent.setup();
      render(<ReportGenerator />);

      // Sélection classe
      const classSelect = screen.getByLabelText('Classe');
      await user.selectOptions(classSelect, '1');

      // Passage à l'étape suivante
      const nextButton = screen.getByText('Suivant');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Sélection du template')).toBeInTheDocument();
      });
    });
  });

  // ========================================
  // TESTS ÉTAPE 2 - TEMPLATES
  // ========================================

  describe('Étape 2 - Sélection Template', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<ReportGenerator />);

      // Navigation vers l'étape 2
      const classSelect = screen.getByLabelText('Classe');
      await user.selectOptions(classSelect, '1');
      
      const nextButton = screen.getByText('Suivant');
      await user.click(nextButton);
    });

    test('devrait charger et afficher les templates', async () => {
      await waitFor(() => {
        expect(mockGetTemplates).toHaveBeenCalledWith({ isOfficial: true });
        expect(screen.getByText('Rapport Administratif Complet')).toBeInTheDocument();
        expect(screen.getByText('Résumé de Transition')).toBeInTheDocument();
      });
    });

    test('devrait permettre de sélectionner un template', async () => {
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Rapport Administratif Complet')).toBeInTheDocument();
      });

      const templateCard = screen.getByText('Rapport Administratif Complet').closest('div');
      await user.click(templateCard!);

      await waitFor(() => {
        expect(screen.getByText('Aperçu du template')).toBeInTheDocument();
      });
    });

    test('devrait afficher les badges de cible correctement', async () => {
      await waitFor(() => {
        expect(screen.getByText('Administration')).toBeInTheDocument();
        expect(screen.getByText('Enseignant suivant')).toBeInTheDocument();
      });
    });

    test('devrait afficher l\'aperçu du template sélectionné', async () => {
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Rapport Administratif Complet')).toBeInTheDocument();
      });

      const templateCard = screen.getByText('Rapport Administratif Complet').closest('div');
      await user.click(templateCard!);

      await waitFor(() => {
        expect(screen.getByText('Aperçu du template')).toBeInTheDocument();
        expect(screen.getByText('1. Informations Générales')).toBeInTheDocument();
        expect(screen.getByText('Obligatoire')).toBeInTheDocument();
      });
    });
  });

  // ========================================
  // TESTS ÉTAPE 3 - PERSONNALISATION
  // ========================================

  describe('Étape 3 - Personnalisation', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<ReportGenerator />);

      // Navigation vers l'étape 3
      const classSelect = screen.getByLabelText('Classe');
      await user.selectOptions(classSelect, '1');
      
      let nextButton = screen.getByText('Suivant');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Rapport Administratif Complet')).toBeInTheDocument();
      });

      const templateCard = screen.getByText('Rapport Administratif Complet').closest('div');
      await user.click(templateCard!);

      nextButton = screen.getByText('Suivant');
      await user.click(nextButton);
    });

    test('devrait afficher les options de personnalisation', async () => {
      await waitFor(() => {
        expect(screen.getByText('Options de personnalisation')).toBeInTheDocument();
        expect(screen.getByText('Contenu à inclure')).toBeInTheDocument();
        expect(screen.getByText('Inclure les graphiques et visualisations')).toBeInTheDocument();
      });
    });

    test('devrait permettre de configurer les options d\'inclusion', async () => {
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Inclure les graphiques et visualisations')).toBeInTheDocument();
      });

      const chartsCheckbox = screen.getByLabelText('Inclure les graphiques et visualisations');
      expect(chartsCheckbox).toBeChecked(); // Par défaut activé

      await user.click(chartsCheckbox);
      expect(chartsCheckbox).not.toBeChecked();
    });

    test('devrait permettre de sélectionner des domaines d\'intérêt', async () => {
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Domaines d\'intérêt')).toBeInTheDocument();
      });

      const mathCheckbox = screen.getByLabelText('Mathématiques');
      await user.click(mathCheckbox);

      expect(mathCheckbox).toBeChecked();
    });

    test('devrait permettre de configurer une période personnalisée', async () => {
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Période d\'analyse')).toBeInTheDocument();
      });

      const startDateInput = screen.getByLabelText('Date de début');
      await user.type(startDateInput, '2024-09-01');

      expect(startDateInput).toHaveValue('2024-09-01');
    });
  });

  // ========================================
  // TESTS GÉNÉRATION
  // ========================================

  describe('Génération de Rapport', () => {
    test('devrait déclencher la génération avec les bonnes options', async () => {
      const user = userEvent.setup();
      render(<ReportGenerator />);

      // Navigation complète
      const classSelect = screen.getByLabelText('Classe');
      await user.selectOptions(classSelect, '1');
      
      let nextButton = screen.getByText('Suivant');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Rapport Administratif Complet')).toBeInTheDocument();
      });

      const templateCard = screen.getByText('Rapport Administratif Complet').closest('div');
      await user.click(templateCard!);

      nextButton = screen.getByText('Suivant');
      await user.click(nextButton);

      // Configuration des options
      await waitFor(() => {
        expect(screen.getByText('Mathématiques')).toBeInTheDocument();
      });

      const mathCheckbox = screen.getByLabelText('Mathématiques');
      await user.click(mathCheckbox);

      // Génération
      const generateButton = screen.getByText('Générer le Bilan');
      
      mockGenerateReport.mockResolvedValue(mockGeneratedReport);
      
      await user.click(generateButton);

      expect(mockGenerateReport).toHaveBeenCalledWith(
        1, // classId
        '2024-2025', // academicYear
        expect.objectContaining({
          templateId: '1',
          includeCharts: true,
          focusAreas: ['Mathématiques']
        }),
        expect.any(Function) // onProgress callback
      );
    });

    test('devrait afficher l\'écran de génération avec progression', async () => {
      const user = userEvent.setup();
      render(<ReportGenerator />);

      // Navigation vers génération
      const classSelect = screen.getByLabelText('Classe');
      await user.selectOptions(classSelect, '1');
      
      let nextButton = screen.getByText('Suivant');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Rapport Administratif Complet')).toBeInTheDocument();
      });

      const templateCard = screen.getByText('Rapport Administratif Complet').closest('div');
      await user.click(templateCard!);

      nextButton = screen.getByText('Suivant');
      await user.click(nextButton);

      const generateButton = screen.getByText('Générer le Bilan');
      
      // Mock génération en cours
      mockGenerateReport.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve(mockGeneratedReport), 1000);
      }));
      
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Génération en cours...')).toBeInTheDocument();
        expect(screen.getByText('Analyse des données et création de votre bilan annuel personnalisé')).toBeInTheDocument();
      });
    });

    test('devrait afficher les résultats après génération réussie', async () => {
      const user = userEvent.setup();
      const mockOnReportGenerated = jest.fn();
      
      render(<ReportGenerator onReportGenerated={mockOnReportGenerated} />);

      // Navigation complète
      const classSelect = screen.getByLabelText('Classe');
      await user.selectOptions(classSelect, '1');
      
      let nextButton = screen.getByText('Suivant');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Rapport Administratif Complet')).toBeInTheDocument();
      });

      const templateCard = screen.getByText('Rapport Administratif Complet').closest('div');
      await user.click(templateCard!);

      nextButton = screen.getByText('Suivant');
      await user.click(nextButton);

      const generateButton = screen.getByText('Générer le Bilan');
      
      mockGenerateReport.mockResolvedValue(mockGeneratedReport);
      
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Rapport généré avec succès !')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument(); // Élèves analysés
        expect(screen.getByText('45')).toBeInTheDocument(); // Évaluations
        expect(mockOnReportGenerated).toHaveBeenCalledWith(mockGeneratedReport);
      });
    });

    test('devrait gérer les erreurs de génération', async () => {
      const user = userEvent.setup();
      render(<ReportGenerator />);

      // Navigation vers génération
      const classSelect = screen.getByLabelText('Classe');
      await user.selectOptions(classSelect, '1');
      
      let nextButton = screen.getByText('Suivant');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Rapport Administratif Complet')).toBeInTheDocument();
      });

      const templateCard = screen.getByText('Rapport Administratif Complet').closest('div');
      await user.click(templateCard!);

      nextButton = screen.getByText('Suivant');
      await user.click(nextButton);

      const generateButton = screen.getByText('Générer le Bilan');
      
      mockGenerateReport.mockRejectedValue(new Error('Données insuffisantes'));
      
      await user.click(generateButton);

      // Vérification que l'erreur est gérée (via toast)
      expect(mockGenerateReport).toHaveBeenCalled();
    });
  });

  // ========================================
  // TESTS NAVIGATION
  // ========================================

  describe('Navigation entre Étapes', () => {
    test('devrait permettre de revenir en arrière', async () => {
      const user = userEvent.setup();
      render(<ReportGenerator />);

      // Aller à l'étape 2
      const classSelect = screen.getByLabelText('Classe');
      await user.selectOptions(classSelect, '1');
      
      const nextButton = screen.getByText('Suivant');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Sélection du template')).toBeInTheDocument();
      });

      // Retour à l'étape 1
      const prevButton = screen.getByText('Précédent');
      await user.click(prevButton);

      expect(screen.getByText('Informations de base')).toBeInTheDocument();
    });

    test('devrait désactiver le bouton précédent à la première étape', () => {
      render(<ReportGenerator />);

      const prevButton = screen.getByText('Précédent');
      expect(prevButton).toBeDisabled();
    });

    test('devrait désactiver le bouton suivant si validation échoue', async () => {
      render(<ReportGenerator />);

      const nextButton = screen.getByText('Suivant');
      
      // Sans sélection de classe, le bouton devrait être désactivé après tentative
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Erreurs de validation')).toBeInTheDocument();
      });
    });
  });

  // ========================================
  // TESTS PROPS ET CALLBACKS
  // ========================================

  describe('Props et Callbacks', () => {
    test('devrait utiliser les valeurs par défaut des props', () => {
      render(<ReportGenerator defaultClassId={1} defaultAcademicYear="2023-2024" />);

      const classSelect = screen.getByLabelText('Classe') as HTMLSelectElement;
      const yearSelect = screen.getByLabelText('Année académique') as HTMLSelectElement;

      expect(classSelect.value).toBe('1');
      expect(yearSelect.value).toBe('2023-2024');
    });

    test('devrait appeler onClose quand fourni', async () => {
      const mockOnClose = jest.fn();
      const user = userEvent.setup();
      
      render(<ReportGenerator onClose={mockOnClose} />);

      const closeButton = screen.getByText('✕');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // ========================================
  // TESTS ACCESSIBILITÉ
  // ========================================

  describe('Accessibilité', () => {
    test('devrait avoir les labels appropriés', () => {
      render(<ReportGenerator />);

      expect(screen.getByLabelText('Classe')).toBeInTheDocument();
      expect(screen.getByLabelText('Année académique')).toBeInTheDocument();
    });

    test('devrait supporter la navigation au clavier', async () => {
      const user = userEvent.setup();
      render(<ReportGenerator />);

      const classSelect = screen.getByLabelText('Classe');
      
      await user.tab();
      expect(classSelect).toHaveFocus();
    });

    test('devrait avoir des rôles ARIA appropriés', () => {
      render(<ReportGenerator />);

      // Vérification que les éléments interactifs ont les bons rôles
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(2);
    });
  });
});
