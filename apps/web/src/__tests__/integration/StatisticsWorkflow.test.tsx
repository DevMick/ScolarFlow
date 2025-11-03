// ========================================
// STATISTICS WORKFLOW INTEGRATION TESTS - TESTS D'INTÉGRATION COMPLETS
// ========================================

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConfigurationWizard } from '../../components/statistics/ConfigurationWizard';
import { AdvancedChart } from '../../components/statistics/visualizations/AdvancedChart';
import { TemplateGallery } from '../../components/statistics/templates/TemplateGallery';
import { ChartExporter } from '../../components/statistics/export/ChartExporter';
import { createMockStatisticResult } from '../setup';

// Mock des services
const mockStatisticsService = {
  generateStatistics: jest.fn(),
  createConfiguration: jest.fn(),
  getTemplates: jest.fn(),
  exportToPDF: jest.fn()
};

// Mock des hooks
jest.mock('../../hooks/useClasses', () => ({
  useClasses: () => ({
    classes: [
      { id: 1, name: 'CM2 A', level: 'CM2', studentCount: 25, teacherId: 1 },
      { id: 2, name: 'CM1 B', level: 'CM1', studentCount: 23, teacherId: 1 },
    ],
    loading: false,
    error: null
  })
}));

jest.mock('../../hooks/useEvaluations', () => ({
  useEvaluations: () => ({
    evaluations: [
      { 
        id: 1, 
        title: 'Mathématiques - Fractions', 
        subject: 'Mathématiques', 
        date: new Date('2024-01-15'),
        classId: 1,
        maxScore: 20
      },
      { 
        id: 2, 
        title: 'Français - Dictée', 
        subject: 'Français', 
        date: new Date('2024-01-20'),
        classId: 1,
        maxScore: 20
      },
    ],
    loading: false,
    error: null
  })
}));

jest.mock('../../hooks/useStatisticsApi', () => ({
  useStatisticsApi: () => ({
    createConfiguration: mockStatisticsService.createConfiguration,
    generateStatistics: mockStatisticsService.generateStatistics,
    getTemplates: mockStatisticsService.getTemplates,
    loading: false,
    error: null
  })
}));

// Mock de react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn()
  }
}));

describe('Workflow complet des statistiques', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configuration des mocks par défaut
    mockStatisticsService.createConfiguration.mockResolvedValue({
      id: 'new-config-123',
      name: 'Test Analysis',
      category: 'performance'
    });
    
    mockStatisticsService.generateStatistics.mockResolvedValue(
      createMockStatisticResult()
    );
    
    mockStatisticsService.getTemplates.mockResolvedValue([
      {
        id: 'template-1',
        name: 'Performance Analysis',
        description: 'Analyse des performances de classe',
        category: 'performance',
        isTemplate: true,
        isPublic: true,
        tags: ['performance', 'classe']
      }
    ]);
  });

  describe('Création d\'analyse via le wizard', () => {
    it('devrait permettre de créer une analyse complète', async () => {
      const user = userEvent.setup();
      const onComplete = jest.fn();
      const onCancel = jest.fn();

      render(
        <ConfigurationWizard 
          onComplete={onComplete} 
          onCancel={onCancel} 
        />
      );

      // Étape 1: Sources de données
      expect(screen.getByText('Sources de Données')).toBeInTheDocument();
      
      const nameInput = screen.getByPlaceholderText('Nom de votre analyse...');
      await user.type(nameInput, 'Analyse Test Complète');
      
      const classCheckbox = screen.getByLabelText(/CM2 A/);
      await user.click(classCheckbox);
      
      const startDateInput = screen.getByLabelText('Date de début');
      const endDateInput = screen.getByLabelText('Date de fin');
      await user.type(startDateInput, '2024-01-01');
      await user.type(endDateInput, '2024-03-31');
      
      let nextButton = screen.getByText('Suivant');
      await user.click(nextButton);

      // Étape 2: Type d'analyse
      await waitFor(() => {
        expect(screen.getByText('Type d\'Analyse')).toBeInTheDocument();
      });
      
      const averageCheckbox = screen.getByLabelText('Moyenne');
      const medianCheckbox = screen.getByLabelText('Médiane');
      await user.click(averageCheckbox);
      await user.click(medianCheckbox);
      
      nextButton = screen.getByText('Suivant');
      await user.click(nextButton);

      // Étape 3: Visualisation
      await waitFor(() => {
        expect(screen.getByText('Visualisation')).toBeInTheDocument();
      });
      
      const barChartButton = screen.getByText('Barres');
      await user.click(barChartButton);
      
      nextButton = screen.getByText('Suivant');
      await user.click(nextButton);

      // Étape 4: Finalisation
      await waitFor(() => {
        expect(screen.getByText('Aperçu et Finalisation')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Analyse Test Complète')).toBeInTheDocument();
      expect(screen.getByText('1 classe(s) sélectionnée(s)')).toBeInTheDocument();
      
      const createButton = screen.getByText('Créer l\'Analyse');
      await user.click(createButton);

      // Vérification de l'appel API
      await waitFor(() => {
        expect(mockStatisticsService.createConfiguration).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Analyse Test Complète',
            dataSources: expect.objectContaining({
              classIds: [1]
            }),
            calculations: expect.objectContaining({
              metrics: expect.arrayContaining(['average', 'median'])
            })
          })
        );
      });

      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'new-config-123'
        })
      );
    });

    it('devrait valider les données à chaque étape', async () => {
      const user = userEvent.setup();
      
      render(
        <ConfigurationWizard 
          onComplete={jest.fn()} 
          onCancel={jest.fn()} 
        />
      );

      // Essayer de passer à l'étape suivante sans remplir les champs
      const nextButton = screen.getByText('Suivant');
      await user.click(nextButton);
      
      // Devrait rester sur l'étape 1
      expect(screen.getByText('Sources de Données')).toBeInTheDocument();
      expect(screen.getByText('Étape 1 sur 4')).toBeInTheDocument();
      
      // Remplir seulement le nom
      const nameInput = screen.getByPlaceholderText('Nom de votre analyse...');
      await user.type(nameInput, 'Test');
      
      await user.click(nextButton);
      
      // Devrait toujours rester sur l'étape 1 (pas de classe sélectionnée)
      expect(screen.getByText('Sources de Données')).toBeInTheDocument();
    });
  });

  describe('Utilisation des templates', () => {
    it('devrait afficher et utiliser les templates disponibles', async () => {
      const user = userEvent.setup();
      const onTemplateSelect = jest.fn();
      
      render(
        <TemplateGallery 
          onTemplateSelect={onTemplateSelect}
          onCreateFromTemplate={jest.fn()}
        />
      );

      // Vérifier le chargement des templates
      await waitFor(() => {
        expect(screen.getByText('Performance Analysis')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Analyse des performances de classe')).toBeInTheDocument();
      
      // Cliquer sur un template
      const templateCard = screen.getByText('Performance Analysis').closest('div');
      await user.click(templateCard!);
      
      expect(onTemplateSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'template-1',
          name: 'Performance Analysis'
        })
      );
    });

    it('devrait filtrer les templates par catégorie', async () => {
      const user = userEvent.setup();
      
      render(
        <TemplateGallery 
          onTemplateSelect={jest.fn()}
          onCreateFromTemplate={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Performance Analysis')).toBeInTheDocument();
      });
      
      // Filtrer par catégorie
      const categorySelect = screen.getByLabelText('Catégorie');
      await user.selectOptions(categorySelect, 'comparison');
      
      // Le template de performance ne devrait plus être visible
      await waitFor(() => {
        expect(screen.queryByText('Performance Analysis')).not.toBeInTheDocument();
      });
    });

    it('devrait permettre la recherche de templates', async () => {
      const user = userEvent.setup();
      
      render(
        <TemplateGallery 
          onTemplateSelect={jest.fn()}
          onCreateFromTemplate={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Performance Analysis')).toBeInTheDocument();
      });
      
      // Rechercher un template
      const searchInput = screen.getByPlaceholderText('Rechercher un template...');
      await user.type(searchInput, 'Performance');
      
      // Le template devrait toujours être visible
      expect(screen.getByText('Performance Analysis')).toBeInTheDocument();
      
      // Rechercher quelque chose qui n'existe pas
      await user.clear(searchInput);
      await user.type(searchInput, 'Inexistant');
      
      await waitFor(() => {
        expect(screen.queryByText('Performance Analysis')).not.toBeInTheDocument();
        expect(screen.getByText('Aucun template trouvé')).toBeInTheDocument();
      });
    });
  });

  describe('Génération et affichage des graphiques', () => {
    it('devrait afficher un graphique avec les données', async () => {
      const mockResult = createMockStatisticResult({
        datasets: [{
          label: 'Scores des élèves',
          data: [
            { label: 'Alice', value: 18, metadata: {} },
            { label: 'Bob', value: 15, metadata: {} },
            { label: 'Charlie', value: 12, metadata: {} }
          ]
        }]
      });

      render(
        <AdvancedChart 
          result={mockResult}
          anonymous={false}
        />
      );

      // Vérifier que le graphique est rendu
      const canvas = screen.getByRole('img');
      expect(canvas).toBeInTheDocument();
      
      // Vérifier les données dans le titre ou les légendes
      expect(screen.getByText('Mock Analysis')).toBeInTheDocument();
    });

    it('devrait supporter le mode anonyme', async () => {
      const mockResult = createMockStatisticResult({
        datasets: [{
          label: 'Scores des élèves',
          data: [
            { label: 'Alice Martin', value: 18, metadata: {} },
            { label: 'Bob Dupont', value: 15, metadata: {} }
          ]
        }]
      });

      render(
        <AdvancedChart 
          result={mockResult}
          anonymous={true}
        />
      );

      // En mode anonyme, les noms ne devraient pas apparaître
      expect(screen.queryByText('Alice Martin')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Dupont')).not.toBeInTheDocument();
    });

    it('devrait gérer les différents types de graphiques', async () => {
      const mockResult = createMockStatisticResult();
      const { rerender } = render(
        <AdvancedChart 
          result={mockResult}
          anonymous={false}
        />
      );

      // Graphique en barres par défaut
      expect(screen.getByRole('img')).toBeInTheDocument();
      
      // Changer pour un graphique en ligne
      const lineResult = {
        ...mockResult,
        configuration: {
          ...mockResult.configuration,
          visualization: {
            ...mockResult.configuration.visualization,
            chartType: 'line' as const
          }
        }
      };
      
      rerender(
        <AdvancedChart 
          result={lineResult}
          anonymous={false}
        />
      );
      
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  describe('Export des données', () => {
    it('devrait permettre l\'export rapide en différents formats', async () => {
      const user = userEvent.setup();
      const mockResult = createMockStatisticResult();
      const chartRef = React.createRef<HTMLDivElement>();

      render(
        <div>
          <div ref={chartRef}>
            <AdvancedChart result={mockResult} anonymous={false} />
          </div>
          <ChartExporter
            result={mockResult}
            chartRef={chartRef}
            enableAdvancedReports={true}
          />
        </div>
      );

      // Export PNG rapide
      const pngButton = screen.getByTitle('Export PNG rapide');
      await user.click(pngButton);
      
      // Vérifier que l'export a été déclenché (via les mocks)
      await waitFor(() => {
        // Le mock html2canvas devrait avoir été appelé
        expect(require('html2canvas')).toHaveBeenCalled();
      });
    });

    it('devrait ouvrir les options d\'export avancées', async () => {
      const user = userEvent.setup();
      const mockResult = createMockStatisticResult();
      const chartRef = React.createRef<HTMLDivElement>();

      render(
        <div>
          <div ref={chartRef}>Mock Chart</div>
          <ChartExporter
            result={mockResult}
            chartRef={chartRef}
          />
        </div>
      );

      // Ouvrir les options avancées
      const exportButton = screen.getByText('Exporter');
      await user.click(exportButton);
      
      // Vérifier que le modal d'options s'ouvre
      await waitFor(() => {
        expect(screen.getByText('Options d\'export')).toBeInTheDocument();
      });
      
      // Vérifier les options disponibles
      expect(screen.getByText('Format')).toBeInTheDocument();
      expect(screen.getByText('Qualité')).toBeInTheDocument();
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de création de configuration', async () => {
      const user = userEvent.setup();
      
      // Mock d'une erreur API
      mockStatisticsService.createConfiguration.mockRejectedValue(
        new Error('Erreur de validation')
      );
      
      const onComplete = jest.fn();
      
      render(
        <ConfigurationWizard 
          onComplete={onComplete} 
          onCancel={jest.fn()} 
        />
      );

      // Remplir le wizard rapidement
      const nameInput = screen.getByPlaceholderText('Nom de votre analyse...');
      await user.type(nameInput, 'Test Error');
      
      const classCheckbox = screen.getByLabelText(/CM2 A/);
      await user.click(classCheckbox);
      
      // Navigation rapide vers la fin
      for (let i = 0; i < 3; i++) {
        const nextButton = screen.getByText('Suivant');
        await user.click(nextButton);
        await waitFor(() => {}, { timeout: 1000 });
      }
      
      const createButton = screen.getByText('Créer l\'Analyse');
      await user.click(createButton);
      
      // Vérifier que l'erreur est gérée
      await waitFor(() => {
        expect(onComplete).not.toHaveBeenCalled();
      });
    });

    it('devrait gérer les erreurs de chargement des templates', async () => {
      mockStatisticsService.getTemplates.mockRejectedValue(
        new Error('Erreur réseau')
      );
      
      render(
        <TemplateGallery 
          onTemplateSelect={jest.fn()}
          onCreateFromTemplate={jest.fn()}
        />
      );

      // Vérifier que l'erreur est gérée gracieusement
      await waitFor(() => {
        // Le composant devrait toujours être rendu même en cas d'erreur
        expect(screen.getByText('Galerie de Templates Statistiques')).toBeInTheDocument();
      });
    });
  });

  describe('Performance et optimisation', () => {
    it('devrait gérer efficacement de grandes quantités de données', async () => {
      // Créer un résultat avec beaucoup de données
      const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
        label: `Student ${index + 1}`,
        value: Math.floor(Math.random() * 20) + 1,
        metadata: {}
      }));

      const mockResult = createMockStatisticResult({
        datasets: [{
          label: 'Large Dataset',
          data: largeDataset
        }],
        summary: {
          totalDataPoints: 1000,
          timeRange: [new Date('2024-01-01'), new Date('2024-03-01')],
          calculatedAt: new Date(),
          processingTime: 250
        }
      });

      const startTime = performance.now();
      
      render(
        <AdvancedChart 
          result={mockResult}
          anonymous={false}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Le rendu devrait être rapide même avec beaucoup de données
      expect(renderTime).toBeLessThan(1000); // Moins d'1 seconde
      
      // Le graphique devrait être rendu
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('devrait utiliser la virtualisation pour les grandes listes', async () => {
      // Ce test vérifierait l'utilisation de VirtualizedList
      // dans les composants qui affichent de grandes listes de données
      
      const manyTemplates = Array.from({ length: 100 }, (_, index) => ({
        id: `template-${index}`,
        name: `Template ${index}`,
        description: `Description ${index}`,
        category: 'performance' as const,
        isTemplate: true,
        isPublic: true,
        tags: ['test']
      }));

      mockStatisticsService.getTemplates.mockResolvedValue(manyTemplates);
      
      render(
        <TemplateGallery 
          onTemplateSelect={jest.fn()}
          onCreateFromTemplate={jest.fn()}
        />
      );

      await waitFor(() => {
        // Vérifier que les templates sont chargés
        expect(screen.getByText('Template 0')).toBeInTheDocument();
      });
      
      // Tous les templates ne devraient pas être rendus simultanément
      // (virtualisation)
      expect(screen.queryByText('Template 99')).not.toBeInTheDocument();
    });
  });

  describe('Accessibilité', () => {
    it('devrait avoir les attributs ARIA appropriés', () => {
      render(
        <ConfigurationWizard 
          onComplete={jest.fn()} 
          onCancel={jest.fn()} 
        />
      );

      // Vérifier les attributs ARIA
      const wizard = screen.getByRole('dialog');
      expect(wizard).toHaveAttribute('aria-labelledby');
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow');
      expect(progressBar).toHaveAttribute('aria-valuemax');
    });

    it('devrait supporter la navigation au clavier', async () => {
      const user = userEvent.setup();
      
      render(
        <ConfigurationWizard 
          onComplete={jest.fn()} 
          onCancel={jest.fn()} 
        />
      );

      // Navigation au clavier
      await user.tab();
      expect(screen.getByPlaceholderText('Nom de votre analyse...')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/CM2 A/)).toHaveFocus();
    });

    it('devrait avoir des labels appropriés pour les éléments interactifs', () => {
      const mockResult = createMockStatisticResult();
      const chartRef = React.createRef<HTMLDivElement>();

      render(
        <ChartExporter
          result={mockResult}
          chartRef={chartRef}
        />
      );

      // Vérifier les labels des boutons
      expect(screen.getByTitle('Export PNG rapide')).toBeInTheDocument();
      expect(screen.getByTitle('Export PDF rapide')).toBeInTheDocument();
      expect(screen.getByTitle('Export CSV rapide')).toBeInTheDocument();
    });
  });
});
