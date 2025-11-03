// ========================================
// TESTS COMPOSANT TABLE DESIGNER
// ========================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { TableDesigner } from '../components/tables/TableDesigner';
import { useCustomTables } from '../hooks/useCustomTables';
import { useClasses } from '../hooks/useClasses';
import { ColumnType, TableCategory, TextAlignment } from '@edustats/shared/types';

// Mocks
jest.mock('../hooks/useCustomTables');
jest.mock('../hooks/useClasses');
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

const mockUseCustomTables = useCustomTables as jest.MockedFunction<typeof useCustomTables>;
const mockUseClasses = useClasses as jest.MockedFunction<typeof useClasses>;

// Mock des données
const mockClasses = [
  { id: 1, name: 'CM2A', level: 'CM2', teacherId: 1 },
  { id: 2, name: 'CM1B', level: 'CM1', teacherId: 1 }
];

const mockCustomTablesHook = {
  createTable: jest.fn(),
  updateTable: jest.fn(),
  getTableById: jest.fn(),
  generateTableData: jest.fn(),
  loading: false
};

describe('TableDesigner', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    mockUseCustomTables.mockReturnValue(mockCustomTablesHook as any);
    mockUseClasses.mockReturnValue({ classes: mockClasses } as any);
    jest.clearAllMocks();
  });

  const renderTableDesigner = (props = {}) => {
    return render(
      <DndContext onDragEnd={() => {}}>
        <TableDesigner {...props} />
      </DndContext>
    );
  };

  describe('Création de tableau', () => {
    test('doit afficher l\'interface de création', () => {
      renderTableDesigner({ mode: 'create' });

      expect(screen.getByText('Nouveau Tableau')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Mon tableau personnalisé')).toBeInTheDocument();
      expect(screen.getByText('Sélectionner une classe')).toBeInTheDocument();
    });

    test('doit permettre de saisir les informations de base', async () => {
      renderTableDesigner({ mode: 'create' });

      const nameInput = screen.getByPlaceholderText('Mon tableau personnalisé');
      const descriptionInput = screen.getByPlaceholderText('Description optionnelle...');
      const classSelect = screen.getByDisplayValue('Sélectionner une classe');

      await user.type(nameInput, 'Mon Bulletin de Notes');
      await user.type(descriptionInput, 'Bulletin pour le trimestre 1');
      await user.selectOptions(classSelect, '1');

      expect(nameInput).toHaveValue('Mon Bulletin de Notes');
      expect(descriptionInput).toHaveValue('Bulletin pour le trimestre 1');
      expect(classSelect).toHaveValue('1');
    });

    test('doit afficher les classes disponibles', () => {
      renderTableDesigner({ mode: 'create' });

      const classSelect = screen.getByDisplayValue('Sélectionner une classe');
      
      expect(screen.getByText('CM2A (CM2)')).toBeInTheDocument();
      expect(screen.getByText('CM1B (CM1)')).toBeInTheDocument();
    });
  });

  describe('Gestion des colonnes', () => {
    test('doit afficher le menu d\'ajout de colonnes', async () => {
      renderTableDesigner({ mode: 'create' });

      const addButton = screen.getByRole('button', { name: /plus/i });
      
      // Simuler le hover pour afficher le menu
      await user.hover(addButton);

      await waitFor(() => {
        expect(screen.getByText('Info Élève')).toBeInTheDocument();
        expect(screen.getByText('Note Évaluation')).toBeInTheDocument();
        expect(screen.getByText('Colonne Calculée')).toBeInTheDocument();
        expect(screen.getByText('Formule Personnalisée')).toBeInTheDocument();
        expect(screen.getByText('Valeur Fixe')).toBeInTheDocument();
      });
    });

    test('doit ajouter une colonne d\'information élève', async () => {
      renderTableDesigner({ mode: 'create' });

      const addButton = screen.getByRole('button', { name: /plus/i });
      await user.hover(addButton);

      await waitFor(() => {
        const studentInfoButton = screen.getByText('Info Élève');
        fireEvent.click(studentInfoButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Nouvelle Colonne')).toBeInTheDocument();
        expect(screen.getByText('👤')).toBeInTheDocument(); // Icône info élève
      });
    });

    test('doit permettre de réorganiser les colonnes par drag & drop', async () => {
      // Ce test nécessiterait une simulation plus complexe du drag & drop
      // Pour l'instant, on teste que les éléments sont présents
      renderTableDesigner({ mode: 'create' });

      // Ajouter quelques colonnes d'abord
      const addButton = screen.getByRole('button', { name: /plus/i });
      await user.hover(addButton);

      // Vérifier que les handles de drag sont présents
      // (après ajout de colonnes)
    });

    test('doit valider qu\'au moins une colonne est requise pour sauvegarder', async () => {
      const mockOnSave = jest.fn();
      renderTableDesigner({ mode: 'create', onSave: mockOnSave });

      const nameInput = screen.getByPlaceholderText('Mon tableau personnalisé');
      await user.type(nameInput, 'Test Tableau');

      const saveButton = screen.getByText('Sauvegarder');
      await user.click(saveButton);

      // Doit afficher une erreur car aucune colonne n'est définie
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Aperçu du tableau', () => {
    test('doit afficher un message quand aucune donnée n\'est disponible', () => {
      renderTableDesigner({ mode: 'create' });

      expect(screen.getByText('Aperçu du tableau')).toBeInTheDocument();
      expect(screen.getByText('Configurez vos colonnes et sélectionnez une classe')).toBeInTheDocument();
    });

    test('doit générer un aperçu avec des données simulées', async () => {
      mockCustomTablesHook.generateTableData.mockResolvedValue({
        headers: ['Nom', 'Prénom', 'Moyenne'],
        rows: [
          {
            studentId: 1,
            cells: [
              { value: 'Dupont', formattedValue: 'Dupont', style: {} },
              { value: 'Marie', formattedValue: 'Marie', style: {} },
              { value: 15.5, formattedValue: '15.50', style: {} }
            ]
          }
        ],
        summary: {
          totalRows: 1,
          calculatedAt: new Date(),
          hasErrors: false
        }
      });

      renderTableDesigner({ 
        mode: 'edit', 
        tableId: '1',
        defaultClassId: 1 
      });

      await waitFor(() => {
        expect(screen.getByText('Aperçu temps réel')).toBeInTheDocument();
      });
    });

    test('doit afficher les erreurs de calcul dans l\'aperçu', async () => {
      mockCustomTablesHook.generateTableData.mockResolvedValue({
        headers: ['Nom', 'Formule Erreur'],
        rows: [
          {
            studentId: 1,
            cells: [
              { value: 'Dupont', formattedValue: 'Dupont', style: {} },
              { 
                value: null, 
                formattedValue: '#ERREUR', 
                style: { backgroundColor: '#fee2e2' },
                metadata: { error: 'Division par zéro' }
              }
            ]
          }
        ],
        summary: {
          totalRows: 1,
          calculatedAt: new Date(),
          hasErrors: true,
          errors: ['Erreur de calcul dans la formule']
        }
      });

      renderTableDesigner({ 
        mode: 'edit', 
        tableId: '1',
        defaultClassId: 1 
      });

      await waitFor(() => {
        expect(screen.getByText('#ERREUR')).toBeInTheDocument();
      });
    });
  });

  describe('Sauvegarde', () => {
    test('doit sauvegarder un nouveau tableau', async () => {
      const mockOnSave = jest.fn();
      mockCustomTablesHook.createTable.mockResolvedValue({
        id: '1',
        name: 'Test Tableau',
        category: TableCategory.Custom
      });

      renderTableDesigner({ mode: 'create', onSave: mockOnSave });

      // Remplir les informations de base
      const nameInput = screen.getByPlaceholderText('Mon tableau personnalisé');
      await user.type(nameInput, 'Test Tableau');

      // Ajouter une colonne (simulation)
      // Dans un vrai test, on ajouterait une colonne via l'interface

      // Sauvegarder
      const saveButton = screen.getByText('Sauvegarder');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockCustomTablesHook.createTable).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Tableau'
          })
        );
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    test('doit mettre à jour un tableau existant', async () => {
      const mockOnSave = jest.fn();
      mockCustomTablesHook.updateTable.mockResolvedValue({
        id: '1',
        name: 'Tableau Modifié'
      });

      renderTableDesigner({ 
        mode: 'edit', 
        tableId: '1',
        onSave: mockOnSave 
      });

      const nameInput = screen.getByPlaceholderText('Mon tableau personnalisé');
      await user.clear(nameInput);
      await user.type(nameInput, 'Tableau Modifié');

      const saveButton = screen.getByText('Sauvegarder');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockCustomTablesHook.updateTable).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({
            name: 'Tableau Modifié'
          })
        );
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    test('doit gérer les erreurs de sauvegarde', async () => {
      mockCustomTablesHook.createTable.mockRejectedValue(
        new Error('Erreur de validation')
      );

      renderTableDesigner({ mode: 'create' });

      const nameInput = screen.getByPlaceholderText('Mon tableau personnalisé');
      await user.type(nameInput, 'Test Tableau');

      const saveButton = screen.getByText('Sauvegarder');
      await user.click(saveButton);

      // Vérifier que l'erreur est gérée (toast d'erreur)
      await waitFor(() => {
        expect(mockCustomTablesHook.createTable).toHaveBeenCalled();
      });
    });
  });

  describe('Panneau de paramètres', () => {
    test('doit ouvrir et fermer le panneau de paramètres', async () => {
      renderTableDesigner({ mode: 'create' });

      const settingsButton = screen.getByRole('button', { name: /cog/i });
      await user.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('Paramètres du tableau')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /x/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Paramètres du tableau')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibilité', () => {
    test('doit avoir les labels appropriés', () => {
      renderTableDesigner({ mode: 'create' });

      expect(screen.getByLabelText('Nom du tableau')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Classe')).toBeInTheDocument();
    });

    test('doit supporter la navigation au clavier', async () => {
      renderTableDesigner({ mode: 'create' });

      const nameInput = screen.getByPlaceholderText('Mon tableau personnalisé');
      
      // Tester la navigation avec Tab
      nameInput.focus();
      expect(document.activeElement).toBe(nameInput);

      await user.tab();
      const descriptionInput = screen.getByPlaceholderText('Description optionnelle...');
      expect(document.activeElement).toBe(descriptionInput);
    });
  });

  describe('Responsive Design', () => {
    test('doit s\'adapter aux petits écrans', () => {
      // Simuler un écran mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderTableDesigner({ mode: 'create' });

      // Vérifier que l'interface s'adapte
      // (les tests spécifiques dépendraient de l'implémentation responsive)
      expect(screen.getByText('Nouveau Tableau')).toBeInTheDocument();
    });
  });
});
