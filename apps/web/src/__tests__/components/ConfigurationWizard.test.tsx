// ========================================
// CONFIGURATION WIZARD TESTS - TESTS DU WIZARD DE CONFIGURATION
// ========================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConfigurationWizard } from '../../components/statistics/ConfigurationWizard';
import type { StatisticConfiguration } from '@edustats/shared/types/statistics';

// Mock des hooks
jest.mock('../../hooks/useClasses', () => ({
  useClasses: () => ({
    classes: [
      { id: 1, name: 'CM2 A', level: 'CM2', studentCount: 25 },
      { id: 2, name: 'CM1 B', level: 'CM1', studentCount: 23 },
    ],
    loading: false,
    error: null
  })
}));

jest.mock('../../hooks/useEvaluations', () => ({
  useEvaluations: () => ({
    evaluations: [
      { id: 1, title: 'Mathématiques - Fractions', subject: 'Mathématiques', date: new Date('2024-01-15') },
      { id: 2, title: 'Français - Dictée', subject: 'Français', date: new Date('2024-01-20') },
    ],
    loading: false,
    error: null
  })
}));

jest.mock('../../hooks/useStatisticsApi', () => ({
  useStatisticsApi: () => ({
    createConfiguration: jest.fn().mockResolvedValue({ id: 'new-config-123' }),
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

const mockOnComplete = jest.fn();
const mockOnCancel = jest.fn();

const defaultProps = {
  onComplete: mockOnComplete,
  onCancel: mockOnCancel
};

describe('ConfigurationWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu initial', () => {
    it('devrait afficher le titre et la première étape', () => {
      render(<ConfigurationWizard {...defaultProps} />);
      
      expect(screen.getByText('Assistant de Configuration Statistique')).toBeInTheDocument();
      expect(screen.getByText('Sources de Données')).toBeInTheDocument();
      expect(screen.getByText('Étape 1 sur 4')).toBeInTheDocument();
    });

    it('devrait afficher la barre de progression', () => {
      render(<ConfigurationWizard {...defaultProps} />);
      
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(1);
    });

    it('devrait désactiver le bouton Précédent sur la première étape', () => {
      render(<ConfigurationWizard {...defaultProps} />);
      
      const previousButton = screen.getByText('Précédent');
      expect(previousButton).toBeDisabled();
    });
  });

  describe('Navigation entre les étapes', () => {
    it('devrait permettre de passer à l\'étape suivante', async () => {
      const user = userEvent.setup();
      render(<ConfigurationWizard {...defaultProps} />);
      
      // Remplir les champs requis de l'étape 1
      const nameInput = screen.getByPlaceholderText('Nom de votre analyse...');
      await user.type(nameInput, 'Test Analysis');
      
      // Sélectionner une classe
      const classCheckbox = screen.getByLabelText(/CM2 A/);
      await user.click(classCheckbox);
      
      // Cliquer sur Suivant
      const nextButton = screen.getByText('Suivant');
      await user.click(nextButton);
      
      // Vérifier qu'on est à l'étape 2
      await waitFor(() => {
        expect(screen.getByText('Type d\'Analyse')).toBeInTheDocument();
        expect(screen.getByText('Étape 2 sur 4')).toBeInTheDocument();
      });
    });

    it('devrait permettre de revenir à l\'étape précédente', async () => {
      const user = userEvent.setup();
      render(<ConfigurationWizard {...defaultProps} />);
      
      // Aller à l'étape 2
      const nameInput = screen.getByPlaceholderText('Nom de votre analyse...');
      await user.type(nameInput, 'Test Analysis');
      
      const classCheckbox = screen.getByLabelText(/CM2 A/);
      await user.click(classCheckbox);
      
      const nextButton = screen.getByText('Suivant');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Type d\'Analyse')).toBeInTheDocument();
      });
      
      // Revenir à l'étape 1
      const previousButton = screen.getByText('Précédent');
      await user.click(previousButton);
      
      await waitFor(() => {
        expect(screen.getByText('Sources de Données')).toBeInTheDocument();
        expect(screen.getByText('Étape 1 sur 4')).toBeInTheDocument();
      });
    });

    it('devrait empêcher de passer à l\'étape suivante si les champs requis ne sont pas remplis', async () => {
      const user = userEvent.setup();
      render(<ConfigurationWizard {...defaultProps} />);
      
      const nextButton = screen.getByText('Suivant');
      await user.click(nextButton);
      
      // Devrait rester sur l'étape 1
      expect(screen.getByText('Sources de Données')).toBeInTheDocument();
      expect(screen.getByText('Étape 1 sur 4')).toBeInTheDocument();
    });
  });

  describe('Étape 1 - Sources de Données', () => {
    it('devrait permettre de saisir le nom de l\'analyse', async () => {
      const user = userEvent.setup();
      render(<ConfigurationWizard {...defaultProps} />);
      
      const nameInput = screen.getByPlaceholderText('Nom de votre analyse...');
      await user.type(nameInput, 'Mon Analyse Test');
      
      expect(nameInput).toHaveValue('Mon Analyse Test');
    });

    it('devrait afficher la liste des classes disponibles', () => {
      render(<ConfigurationWizard {...defaultProps} />);
      
      expect(screen.getByText('CM2 A')).toBeInTheDocument();
      expect(screen.getByText('CM1 B')).toBeInTheDocument();
      expect(screen.getByText('25 élèves')).toBeInTheDocument();
      expect(screen.getByText('23 élèves')).toBeInTheDocument();
    });

    it('devrait permettre de sélectionner plusieurs classes', async () => {
      const user = userEvent.setup();
      render(<ConfigurationWizard {...defaultProps} />);
      
      const class1Checkbox = screen.getByLabelText(/CM2 A/);
      const class2Checkbox = screen.getByLabelText(/CM1 B/);
      
      await user.click(class1Checkbox);
      await user.click(class2Checkbox);
      
      expect(class1Checkbox).toBeChecked();
      expect(class2Checkbox).toBeChecked();
    });

    it('devrait permettre de définir une période de dates', async () => {
      const user = userEvent.setup();
      render(<ConfigurationWizard {...defaultProps} />);
      
      const startDateInput = screen.getByLabelText('Date de début');
      const endDateInput = screen.getByLabelText('Date de fin');
      
      await user.type(startDateInput, '2024-01-01');
      await user.type(endDateInput, '2024-03-31');
      
      expect(startDateInput).toHaveValue('2024-01-01');
      expect(endDateInput).toHaveValue('2024-03-31');
    });
  });

  describe('Étape 2 - Type d\'Analyse', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<ConfigurationWizard {...defaultProps} />);
      
      // Naviguer vers l'étape 2
      const nameInput = screen.getByPlaceholderText('Nom de votre analyse...');
      await user.type(nameInput, 'Test Analysis');
      
      const classCheckbox = screen.getByLabelText(/CM2 A/);
      await user.click(classCheckbox);
      
      const nextButton = screen.getByText('Suivant');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Type d\'Analyse')).toBeInTheDocument();
      });
    });

    it('devrait afficher les types d\'analyse disponibles', () => {
      expect(screen.getByText('Analyse de base')).toBeInTheDocument();
      expect(screen.getByText('Analyse comparative')).toBeInTheDocument();
      expect(screen.getByText('Analyse temporelle')).toBeInTheDocument();
    });

    it('devrait permettre de sélectionner un type d\'analyse', async () => {
      const user = userEvent.setup();
      
      const comparativeButton = screen.getByText('Analyse comparative');
      await user.click(comparativeButton);
      
      // Le bouton devrait être sélectionné (visuellement)
      expect(comparativeButton.closest('button')).toHaveClass('border-blue-500');
    });

    it('devrait permettre de sélectionner des métriques', async () => {
      const user = userEvent.setup();
      
      const averageCheckbox = screen.getByLabelText('Moyenne');
      const medianCheckbox = screen.getByLabelText('Médiane');
      
      await user.click(averageCheckbox);
      await user.click(medianCheckbox);
      
      expect(averageCheckbox).toBeChecked();
      expect(medianCheckbox).toBeChecked();
    });
  });

  describe('Étape 3 - Visualisation', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<ConfigurationWizard {...defaultProps} />);
      
      // Naviguer vers l'étape 3
      const nameInput = screen.getByPlaceholderText('Nom de votre analyse...');
      await user.type(nameInput, 'Test Analysis');
      
      const classCheckbox = screen.getByLabelText(/CM2 A/);
      await user.click(classCheckbox);
      
      let nextButton = screen.getByText('Suivant');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Type d\'Analyse')).toBeInTheDocument();
      });
      
      const averageCheckbox = screen.getByLabelText('Moyenne');
      await user.click(averageCheckbox);
      
      nextButton = screen.getByText('Suivant');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Visualisation')).toBeInTheDocument();
      });
    });

    it('devrait afficher les types de graphiques disponibles', () => {
      expect(screen.getByText('Barres')).toBeInTheDocument();
      expect(screen.getByText('Courbes')).toBeInTheDocument();
      expect(screen.getByText('Camembert')).toBeInTheDocument();
    });

    it('devrait permettre de sélectionner un type de graphique', async () => {
      const user = userEvent.setup();
      
      const lineChartButton = screen.getByText('Courbes');
      await user.click(lineChartButton);
      
      expect(lineChartButton.closest('button')).toHaveClass('border-blue-500');
    });

    it('devrait permettre de choisir un schéma de couleurs', async () => {
      const user = userEvent.setup();
      
      const colorSelect = screen.getByLabelText('Schéma de couleurs');
      await user.selectOptions(colorSelect, 'green');
      
      expect(colorSelect).toHaveValue('green');
    });
  });

  describe('Étape 4 - Aperçu et Finalisation', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<ConfigurationWizard {...defaultProps} />);
      
      // Naviguer vers l'étape 4
      const nameInput = screen.getByPlaceholderText('Nom de votre analyse...');
      await user.type(nameInput, 'Test Analysis');
      
      const classCheckbox = screen.getByLabelText(/CM2 A/);
      await user.click(classCheckbox);
      
      let nextButton = screen.getByText('Suivant');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Type d\'Analyse')).toBeInTheDocument();
      });
      
      const averageCheckbox = screen.getByLabelText('Moyenne');
      await user.click(averageCheckbox);
      
      nextButton = screen.getByText('Suivant');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Visualisation')).toBeInTheDocument();
      });
      
      nextButton = screen.getByText('Suivant');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Aperçu et Finalisation')).toBeInTheDocument();
      });
    });

    it('devrait afficher un résumé de la configuration', () => {
      expect(screen.getByText('Résumé de la Configuration')).toBeInTheDocument();
      expect(screen.getByText('Test Analysis')).toBeInTheDocument();
      expect(screen.getByText('1 classe(s) sélectionnée(s)')).toBeInTheDocument();
    });

    it('devrait permettre de créer la configuration', async () => {
      const user = userEvent.setup();
      
      const createButton = screen.getByText('Créer l\'Analyse');
      await user.click(createButton);
      
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Analysis'
          })
        );
      });
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait afficher une erreur si la création échoue', async () => {
      // Mock d'une erreur API
      const mockCreateConfiguration = jest.fn().mockRejectedValue(new Error('Erreur API'));
      
      jest.doMock('../../hooks/useStatisticsApi', () => ({
        useStatisticsApi: () => ({
          createConfiguration: mockCreateConfiguration,
          loading: false,
          error: null
        })
      }));

      const user = userEvent.setup();
      render(<ConfigurationWizard {...defaultProps} />);
      
      // Naviguer jusqu'à la fin et essayer de créer
      const nameInput = screen.getByPlaceholderText('Nom de votre analyse...');
      await user.type(nameInput, 'Test Analysis');
      
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
        expect(mockOnComplete).not.toHaveBeenCalled();
      });
    });
  });

  describe('Annulation', () => {
    it('devrait appeler onCancel quand on clique sur Annuler', async () => {
      const user = userEvent.setup();
      render(<ConfigurationWizard {...defaultProps} />);
      
      const cancelButton = screen.getByText('Annuler');
      await user.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Validation des données', () => {
    it('devrait valider que le nom n\'est pas vide', async () => {
      const user = userEvent.setup();
      render(<ConfigurationWizard {...defaultProps} />);
      
      const classCheckbox = screen.getByLabelText(/CM2 A/);
      await user.click(classCheckbox);
      
      const nextButton = screen.getByText('Suivant');
      await user.click(nextButton);
      
      // Devrait rester sur l'étape 1 car le nom est vide
      expect(screen.getByText('Sources de Données')).toBeInTheDocument();
    });

    it('devrait valider qu\'au moins une classe est sélectionnée', async () => {
      const user = userEvent.setup();
      render(<ConfigurationWizard {...defaultProps} />);
      
      const nameInput = screen.getByPlaceholderText('Nom de votre analyse...');
      await user.type(nameInput, 'Test Analysis');
      
      const nextButton = screen.getByText('Suivant');
      await user.click(nextButton);
      
      // Devrait rester sur l'étape 1 car aucune classe n'est sélectionnée
      expect(screen.getByText('Sources de Données')).toBeInTheDocument();
    });

    it('devrait valider qu\'au moins une métrique est sélectionnée', async () => {
      const user = userEvent.setup();
      render(<ConfigurationWizard {...defaultProps} />);
      
      // Étape 1
      const nameInput = screen.getByPlaceholderText('Nom de votre analyse...');
      await user.type(nameInput, 'Test Analysis');
      
      const classCheckbox = screen.getByLabelText(/CM2 A/);
      await user.click(classCheckbox);
      
      let nextButton = screen.getByText('Suivant');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Type d\'Analyse')).toBeInTheDocument();
      });
      
      // Étape 2 - ne pas sélectionner de métriques
      nextButton = screen.getByText('Suivant');
      await user.click(nextButton);
      
      // Devrait rester sur l'étape 2
      expect(screen.getByText('Type d\'Analyse')).toBeInTheDocument();
    });
  });

  describe('Accessibilité', () => {
    it('devrait avoir les attributs ARIA appropriés', () => {
      render(<ConfigurationWizard {...defaultProps} />);
      
      const wizard = screen.getByRole('dialog');
      expect(wizard).toHaveAttribute('aria-labelledby');
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '1');
      expect(progressBar).toHaveAttribute('aria-valuemax', '4');
    });

    it('devrait permettre la navigation au clavier', async () => {
      const user = userEvent.setup();
      render(<ConfigurationWizard {...defaultProps} />);
      
      // Tab vers le premier input
      await user.tab();
      expect(screen.getByPlaceholderText('Nom de votre analyse...')).toHaveFocus();
      
      // Tab vers la première checkbox
      await user.tab();
      expect(screen.getByLabelText(/CM2 A/)).toHaveFocus();
    });
  });
});
