// ========================================
// TESTS INTÉGRATION SERVICES TABLEAUX
// ========================================

import { PrismaClient } from '@prisma/client';
import { CustomTableService, TemplateService, ExportService } from '../services/tables';
import { 
  CreateCustomTableData, 
  TableCategory, 
  ColumnType, 
  TextAlignment,
  FormulaResultType 
} from '@edustats/shared/types';

// Mock Prisma pour les tests
const mockPrisma = {
  customTable: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  customTableTemplate: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  student: {
    findMany: jest.fn()
  },
  evaluation: {
    findMany: jest.fn()
  },
  class: {
    findFirst: jest.fn()
  }
} as any;

describe('Services Tableaux - Tests d\'Intégration', () => {
  let customTableService: CustomTableService;
  let templateService: TemplateService;
  let exportService: ExportService;

  beforeEach(() => {
    customTableService = new CustomTableService(mockPrisma);
    templateService = new TemplateService(mockPrisma);
    exportService = new ExportService(mockPrisma);
    
    // Reset des mocks
    jest.clearAllMocks();
  });

  describe('CustomTableService', () => {
    const mockTableData: CreateCustomTableData = {
      name: 'Test Bulletin',
      description: 'Bulletin de test',
      category: TableCategory.Bulletin,
      classId: 1,
      config: {
        columns: [
          {
            id: 'nom',
            label: 'Nom',
            type: ColumnType.StudentInfo,
            source: { field: 'lastName' },
            formatting: { alignment: TextAlignment.Left },
            sortable: true,
            filterable: true,
            exportable: true
          },
          {
            id: 'moyenne',
            label: 'Moyenne',
            type: ColumnType.Formula,
            formula: {
              expression: 'MOYENNE(EVAL_1, EVAL_2)',
              variables: ['EVAL_1', 'EVAL_2'],
              resultType: FormulaResultType.Number
            },
            formatting: { 
              alignment: TextAlignment.Center,
              numberFormat: '0.00'
            },
            sortable: true,
            filterable: true,
            exportable: true
          }
        ],
        rows: {},
        styling: {
          headerStyle: {
            backgroundColor: '#f3f4f6',
            textColor: '#1f2937',
            fontWeight: 'bold'
          },
          alternateRowColors: true,
          showBorders: true
        },
        filters: { enabled: true, filters: [] },
        sorting: { enabled: true }
      }
    };

    test('doit créer un tableau avec validation complète', async () => {
      const mockCreatedTable = {
        id: 1,
        userId: 1,
        ...mockTableData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.class.findFirst.mockResolvedValue({ id: 1, teacherId: 1 });
      mockPrisma.customTable.create.mockResolvedValue(mockCreatedTable);

      const result = await customTableService.createTable(1, mockTableData);

      expect(mockPrisma.class.findFirst).toHaveBeenCalledWith({
        where: { id: 1, teacherId: 1 }
      });
      expect(mockPrisma.customTable.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 1,
          name: mockTableData.name,
          config: mockTableData.config
        })
      });
      expect(result).toMatchObject({
        name: mockTableData.name,
        category: mockTableData.category
      });
    });

    test('doit valider les permissions de classe', async () => {
      mockPrisma.class.findFirst.mockResolvedValue(null);

      await expect(
        customTableService.createTable(1, mockTableData)
      ).rejects.toThrow('accès à cette classe');
    });

    test('doit valider la configuration du tableau', async () => {
      const invalidData = {
        ...mockTableData,
        name: '', // Nom vide
        config: {
          ...mockTableData.config,
          columns: [] // Aucune colonne
        }
      };

      await expect(
        customTableService.createTable(1, invalidData)
      ).rejects.toThrow();
    });

    test('doit générer les données avec formules', async () => {
      const mockTable = {
        id: '1',
        classId: 1,
        config: mockTableData.config,
        computedData: null
      };

      const mockStudents = [
        { id: 1, firstName: 'Marie', lastName: 'Dupont', class: { name: 'CM2A' } },
        { id: 2, firstName: 'Pierre', lastName: 'Martin', class: { name: 'CM2A' } }
      ];

      const mockEvaluations = [
        {
          id: 1,
          subject: 'Mathématiques',
          results: [
            { studentId: 1, score: 15 },
            { studentId: 2, score: 18 }
          ]
        },
        {
          id: 2,
          subject: 'Français',
          results: [
            { studentId: 1, score: 16 },
            { studentId: 2, score: 14 }
          ]
        }
      ];

      mockPrisma.customTable.findUnique.mockResolvedValue(mockTable);
      mockPrisma.student.findMany.mockResolvedValue(mockStudents);
      mockPrisma.evaluation.findMany.mockResolvedValue(mockEvaluations);

      const result = await customTableService.generateTableData(1, '1');

      expect(result.headers).toEqual(['Nom', 'Moyenne']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].cells[0].formattedValue).toBe('Dupont');
      expect(result.rows[0].cells[1].value).toBe(15.5); // Moyenne de 15 et 16
      expect(result.summary?.hasErrors).toBe(false);
    });

    test('doit gérer les erreurs de formules', async () => {
      const tableWithBadFormula = {
        ...mockTableData,
        config: {
          ...mockTableData.config,
          columns: [{
            id: 'bad',
            label: 'Bad Formula',
            type: ColumnType.Formula,
            formula: {
              expression: 'FONCTION_INEXISTANTE()',
              variables: [],
              resultType: FormulaResultType.Number
            },
            formatting: { alignment: TextAlignment.Left },
            sortable: true,
            filterable: true,
            exportable: true
          }]
        }
      };

      const mockTable = {
        id: '1',
        classId: 1,
        config: tableWithBadFormula.config,
        computedData: null
      };

      mockPrisma.customTable.findUnique.mockResolvedValue(mockTable);
      mockPrisma.student.findMany.mockResolvedValue([
        { id: 1, firstName: 'Test', lastName: 'User' }
      ]);
      mockPrisma.evaluation.findMany.mockResolvedValue([]);

      const result = await customTableService.generateTableData(1, '1');

      expect(result.summary?.hasErrors).toBe(true);
      expect(result.summary?.errors).toContain(
        expect.stringContaining('FONCTION_INEXISTANTE')
      );
    });
  });

  describe('TemplateService', () => {
    test('doit créer et utiliser un template', async () => {
      const templateData = {
        name: 'Bulletin Standard',
        description: 'Template de bulletin',
        category: TableCategory.Bulletin,
        config: mockTableData.config,
        tags: ['bulletin', 'notes']
      };

      const mockTemplate = {
        id: 1,
        ...templateData,
        isOfficial: false,
        createdBy: 1,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.customTableTemplate.create.mockResolvedValue(mockTemplate);
      mockPrisma.customTableTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.customTableTemplate.update.mockResolvedValue({
        ...mockTemplate,
        usageCount: 1
      });

      // Créer le template
      const created = await templateService.createTemplate(1, templateData);
      expect(created.name).toBe(templateData.name);

      // Utiliser le template
      const config = await templateService.useTemplate('1');
      expect(config).toEqual(templateData.config);

      // Vérifier l'incrémentation du compteur
      expect(mockPrisma.customTableTemplate.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { usageCount: { increment: 1 } }
      });
    });

    test('doit filtrer les templates par catégorie', async () => {
      const mockTemplates = [
        { id: 1, category: TableCategory.Bulletin, name: 'Bulletin 1' },
        { id: 2, category: TableCategory.ConseilClasse, name: 'Conseil 1' },
        { id: 3, category: TableCategory.Bulletin, name: 'Bulletin 2' }
      ];

      mockPrisma.customTableTemplate.findMany.mockResolvedValue(
        mockTemplates.filter(t => t.category === TableCategory.Bulletin)
      );
      mockPrisma.customTableTemplate.count.mockResolvedValue(2);

      const result = await templateService.getTemplates(1, {
        category: TableCategory.Bulletin
      });

      expect(result.templates).toHaveLength(2);
      expect(result.templates.every(t => t.category === TableCategory.Bulletin)).toBe(true);
    });
  });

  describe('ExportService', () => {
    const mockTableData = {
      headers: ['Nom', 'Prénom', 'Moyenne'],
      rows: [
        {
          studentId: 1,
          cells: [
            { value: 'Dupont', formattedValue: 'Dupont', style: {} },
            { value: 'Marie', formattedValue: 'Marie', style: {} },
            { value: 15.5, formattedValue: '15.50', style: { backgroundColor: '#dcfce7' } }
          ]
        },
        {
          studentId: 2,
          cells: [
            { value: 'Martin', formattedValue: 'Martin', style: {} },
            { value: 'Pierre', formattedValue: 'Pierre', style: {} },
            { value: 12.0, formattedValue: '12.00', style: { backgroundColor: '#fee2e2' } }
          ]
        }
      ],
      summary: {
        totalRows: 2,
        calculatedAt: new Date(),
        hasErrors: false
      }
    };

    const mockTable = {
      id: '1',
      name: 'Test Export',
      config: mockTableData.config
    };

    test('doit exporter en CSV avec formatage', async () => {
      const exportOptions = {
        format: 'csv' as const,
        includeHeaders: true,
        includeFormatting: false,
        includeFormulas: false
      };

      const result = await exportService.exportTable(
        mockTableData as any,
        mockTable as any,
        exportOptions
      );

      expect(result.success).toBe(true);
      expect(result.format).toBe('csv');
      expect(result.filename).toMatch(/\.csv$/);
      expect(result.size).toBeGreaterThan(0);
    });

    test('doit exporter en Excel avec styles', async () => {
      const exportOptions = {
        format: 'excel' as const,
        includeHeaders: true,
        includeFormatting: true,
        includeFormulas: false
      };

      const result = await exportService.exportTable(
        mockTableData as any,
        mockTable as any,
        exportOptions
      );

      expect(result.success).toBe(true);
      expect(result.format).toBe('excel');
      expect(result.filename).toMatch(/\.xlsx$/);
    });

    test('doit générer du HTML avec styles CSS', async () => {
      const exportOptions = {
        format: 'html' as const,
        includeHeaders: true,
        includeFormatting: true,
        includeFormulas: false
      };

      const result = await exportService.exportTable(
        mockTableData as any,
        mockTable as any,
        exportOptions
      );

      expect(result.success).toBe(true);
      expect(result.format).toBe('html');
      expect(result.filename).toMatch(/\.html$/);
    });

    test('doit gérer les erreurs d\'export', async () => {
      const invalidOptions = {
        format: 'invalid' as any,
        includeHeaders: true,
        includeFormatting: true,
        includeFormulas: false
      };

      await expect(
        exportService.exportTable(
          mockTableData as any,
          mockTable as any,
          invalidOptions
        )
      ).rejects.toThrow('Format d\'export non supporté');
    });
  });

  describe('Tests de Performance', () => {
    test('doit traiter rapidement un tableau avec beaucoup de données', async () => {
      const largeDataset = {
        headers: Array(20).fill(0).map((_, i) => `Colonne ${i + 1}`),
        rows: Array(1000).fill(0).map((_, i) => ({
          studentId: i + 1,
          cells: Array(20).fill(0).map((_, j) => ({
            value: Math.random() * 20,
            formattedValue: (Math.random() * 20).toFixed(2),
            style: {}
          }))
        })),
        summary: {
          totalRows: 1000,
          calculatedAt: new Date(),
          hasErrors: false
        }
      };

      const startTime = Date.now();
      
      const result = await exportService.exportTable(
        largeDataset as any,
        { id: '1', name: 'Large Dataset', config: {} } as any,
        { format: 'csv', includeHeaders: true, includeFormatting: false, includeFormulas: false }
      );
      
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Moins de 5 secondes
    });

    test('doit gérer la mémoire efficacement', async () => {
      // Simuler un usage mémoire important
      const memoryIntensiveData = {
        headers: Array(50).fill(0).map((_, i) => `Col_${i}`),
        rows: Array(5000).fill(0).map((_, i) => ({
          studentId: i,
          cells: Array(50).fill(0).map(() => ({
            value: 'A'.repeat(100), // Chaînes longues
            formattedValue: 'A'.repeat(100),
            style: { backgroundColor: '#ffffff', color: '#000000' }
          }))
        })),
        summary: { totalRows: 5000, calculatedAt: new Date(), hasErrors: false }
      };

      // Le test ne doit pas planter par manque de mémoire
      const result = await exportService.exportTable(
        memoryIntensiveData as any,
        { id: '1', name: 'Memory Test', config: {} } as any,
        { format: 'csv', includeHeaders: true, includeFormatting: false, includeFormulas: false }
      );

      expect(result).toBeDefined();
    });
  });
});
