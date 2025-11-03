// ========================================
// TESTS DE PERFORMANCE ET CHARGE
// ========================================

import { FormulaEngine } from '../services/tables/FormulaEngine';
import { CustomTableService } from '../services/tables/CustomTableService';
import { ExportService } from '../services/tables/ExportService';
import { 
  FormulaContext, 
  TableData, 
  CustomTable,
  ColumnType,
  TextAlignment,
  FormulaResultType 
} from '@edustats/shared/types';

// Mock Prisma pour les tests de performance
const mockPrisma = {
  customTable: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  student: {
    findMany: jest.fn()
  },
  evaluation: {
    findMany: jest.fn()
  }
} as any;

describe('Tests de Performance', () => {
  let formulaEngine: FormulaEngine;
  let customTableService: CustomTableService;
  let exportService: ExportService;

  beforeEach(() => {
    formulaEngine = new FormulaEngine();
    customTableService = new CustomTableService(mockPrisma);
    exportService = new ExportService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('Performance du Moteur de Formules', () => {
    test('doit évaluer rapidement des formules simples', async () => {
      const context: FormulaContext = {
        variables: { A: 10, B: 20, C: 30 },
        functions: {},
        metadata: { calculationDate: new Date() }
      };

      const formulas = [
        'A + B',
        'MOYENNE(A, B, C)',
        'SI(A > 5, "Vrai", "Faux")',
        'CONCATENER("Test", " ", "Performance")',
        'MAX(A, B, C) - MIN(A, B, C)'
      ];

      const startTime = Date.now();
      
      for (const formula of formulas) {
        const result = await formulaEngine.evaluate(formula, context);
        expect(result.errors).toHaveLength(0);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Toutes les formules doivent être évaluées en moins de 100ms
      expect(totalTime).toBeLessThan(100);
      
      // Temps moyen par formule doit être < 20ms
      const avgTime = totalTime / formulas.length;
      expect(avgTime).toBeLessThan(20);
    });

    test('doit gérer efficacement de grandes listes de données', async () => {
      const largeArray = Array(10000).fill(0).map((_, i) => i + 1);
      const context: FormulaContext = {
        variables: { LARGE_ARRAY: largeArray },
        functions: {},
        metadata: { calculationDate: new Date() }
      };

      const startTime = Date.now();
      const result = await formulaEngine.evaluate('MOYENNE(LARGE_ARRAY)', context);
      const endTime = Date.now();

      expect(result.errors).toHaveLength(0);
      expect(result.value).toBe(5000.5); // Moyenne de 1 à 10000
      expect(endTime - startTime).toBeLessThan(1000); // Moins d'1 seconde
    });

    test('doit maintenir les performances avec des formules complexes', async () => {
      const context: FormulaContext = {
        variables: {
          NOTES: [15, 18, 12, 16, 14, 19, 11, 17, 13, 20],
          COEFFS: [1, 2, 1, 2, 1, 3, 1, 2, 1, 3]
        },
        functions: {},
        metadata: { calculationDate: new Date() }
      };

      // Formule complexe avec conditions imbriquées
      const complexFormula = `
        SI(
          MOYENNE(NOTES) >= 16,
          CONCATENER("Excellent: ", ARRONDIR(MOYENNE(NOTES), 2)),
          SI(
            MOYENNE(NOTES) >= 14,
            CONCATENER("Bien: ", ARRONDIR(MOYENNE(NOTES), 2)),
            SI(
              MOYENNE(NOTES) >= 12,
              CONCATENER("Assez Bien: ", ARRONDIR(MOYENNE(NOTES), 2)),
              CONCATENER("Peut mieux faire: ", ARRONDIR(MOYENNE(NOTES), 2))
            )
          )
        )
      `;

      const startTime = Date.now();
      const result = await formulaEngine.evaluate(complexFormula, context);
      const endTime = Date.now();

      expect(result.errors).toHaveLength(0);
      expect(result.value).toContain('Bien:'); // Moyenne = 15.5
      expect(endTime - startTime).toBeLessThan(50); // Moins de 50ms
    });

    test('doit gérer la concurrence de multiples évaluations', async () => {
      const context: FormulaContext = {
        variables: { A: 10, B: 20 },
        functions: {},
        metadata: { calculationDate: new Date() }
      };

      const promises = Array(100).fill(0).map((_, i) => 
        formulaEngine.evaluate(`MOYENNE(A, B) + ${i}`, context)
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(100);
      expect(results.every(r => r.errors.length === 0)).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Moins d'1 seconde pour 100 évaluations
    });
  });

  describe('Performance de Génération de Tableaux', () => {
    test('doit générer rapidement des tableaux avec beaucoup d\'élèves', async () => {
      // Mock d'une classe avec 500 élèves
      const mockStudents = Array(500).fill(0).map((_, i) => ({
        id: i + 1,
        firstName: `Élève${i + 1}`,
        lastName: `Nom${i + 1}`,
        class: { name: 'Grande Classe' }
      }));

      // Mock d'évaluations avec résultats pour tous les élèves
      const mockEvaluations = [
        {
          id: 1,
          subject: 'Mathématiques',
          results: mockStudents.map(s => ({ studentId: s.id, score: Math.random() * 20 }))
        },
        {
          id: 2,
          subject: 'Français',
          results: mockStudents.map(s => ({ studentId: s.id, score: Math.random() * 20 }))
        }
      ];

      const mockTable = {
        id: '1',
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
              formatting: { alignment: TextAlignment.Center },
              sortable: true,
              filterable: true,
              exportable: true
            }
          ]
        },
        computedData: null
      };

      mockPrisma.customTable.findUnique.mockResolvedValue(mockTable);
      mockPrisma.student.findMany.mockResolvedValue(mockStudents);
      mockPrisma.evaluation.findMany.mockResolvedValue(mockEvaluations);

      const startTime = Date.now();
      const result = await customTableService.generateTableData(1, '1');
      const endTime = Date.now();

      expect(result.rows).toHaveLength(500);
      expect(result.summary?.hasErrors).toBe(false);
      expect(endTime - startTime).toBeLessThan(5000); // Moins de 5 secondes
    });

    test('doit optimiser les calculs avec mise en cache', async () => {
      const mockTable = {
        id: '1',
        classId: 1,
        config: { columns: [] },
        computedData: {
          headers: ['Test'],
          rows: [{ studentId: 1, cells: [{ value: 'Cached', formattedValue: 'Cached' }] }],
          calculatedAt: new Date(Date.now() - 60000), // Cache de 1 minute
          summary: { totalRows: 1, hasErrors: false }
        }
      };

      mockPrisma.customTable.findUnique.mockResolvedValue(mockTable);

      const startTime = Date.now();
      const result = await customTableService.generateTableData(1, '1');
      const endTime = Date.now();

      // Doit utiliser le cache et être très rapide
      expect(endTime - startTime).toBeLessThan(10); // Moins de 10ms
      expect(result.rows[0].cells[0].formattedValue).toBe('Cached');
    });
  });

  describe('Performance d\'Export', () => {
    const generateLargeTableData = (rows: number, cols: number): TableData => ({
      headers: Array(cols).fill(0).map((_, i) => `Colonne ${i + 1}`),
      rows: Array(rows).fill(0).map((_, i) => ({
        studentId: i + 1,
        cells: Array(cols).fill(0).map((_, j) => ({
          value: `Valeur ${i + 1}-${j + 1}`,
          formattedValue: `Valeur ${i + 1}-${j + 1}`,
          style: j % 2 === 0 ? { backgroundColor: '#f0f0f0' } : {}
        }))
      })),
      summary: {
        totalRows: rows,
        calculatedAt: new Date(),
        hasErrors: false
      }
    });

    test('doit exporter rapidement en CSV', async () => {
      const largeData = generateLargeTableData(1000, 20);
      const mockTable = { id: '1', name: 'Large Export', config: {} };

      const startTime = Date.now();
      const result = await exportService.exportTable(
        largeData,
        mockTable as any,
        { format: 'csv', includeHeaders: true, includeFormatting: false, includeFormulas: false }
      );
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(3000); // Moins de 3 secondes
    });

    test('doit exporter efficacement en Excel', async () => {
      const mediumData = generateLargeTableData(500, 15);
      const mockTable = { id: '1', name: 'Medium Export', config: {} };

      const startTime = Date.now();
      const result = await exportService.exportTable(
        mediumData,
        mockTable as any,
        { format: 'excel', includeHeaders: true, includeFormatting: true, includeFormulas: false }
      );
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Moins de 5 secondes
    });

    test('doit gérer la mémoire lors d\'exports volumineux', async () => {
      // Test avec beaucoup de données pour vérifier la gestion mémoire
      const hugeData = generateLargeTableData(5000, 30);
      const mockTable = { id: '1', name: 'Huge Export', config: {} };

      // Mesurer l'utilisation mémoire avant
      const memBefore = process.memoryUsage().heapUsed;

      const result = await exportService.exportTable(
        hugeData,
        mockTable as any,
        { format: 'csv', includeHeaders: true, includeFormatting: false, includeFormulas: false }
      );

      // Forcer le garbage collection si disponible
      if (global.gc) {
        global.gc();
      }

      const memAfter = process.memoryUsage().heapUsed;
      const memIncrease = memAfter - memBefore;

      expect(result.success).toBe(true);
      // L'augmentation mémoire ne doit pas être excessive (< 100MB)
      expect(memIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Tests de Charge', () => {
    test('doit supporter de multiples requêtes simultanées', async () => {
      const mockTable = {
        id: '1',
        classId: 1,
        config: {
          columns: [{
            id: 'simple',
            label: 'Simple',
            type: ColumnType.StudentInfo,
            source: { field: 'firstName' },
            formatting: { alignment: TextAlignment.Left },
            sortable: true,
            filterable: true,
            exportable: true
          }]
        },
        computedData: null
      };

      mockPrisma.customTable.findUnique.mockResolvedValue(mockTable);
      mockPrisma.student.findMany.mockResolvedValue([
        { id: 1, firstName: 'Test', lastName: 'User' }
      ]);
      mockPrisma.evaluation.findMany.mockResolvedValue([]);

      // Simuler 50 requêtes simultanées
      const promises = Array(50).fill(0).map((_, i) => 
        customTableService.generateTableData(1, '1')
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(50);
      expect(results.every(r => r.rows.length === 1)).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Moins de 10 secondes
    });

    test('doit maintenir les performances sous charge CPU', async () => {
      const context: FormulaContext = {
        variables: { 
          NOTES: Array(100).fill(0).map(() => Math.random() * 20)
        },
        functions: {},
        metadata: { calculationDate: new Date() }
      };

      // Formule intensive en calculs
      const intensiveFormula = 'MOYENNE(NOTES) + SOMME(NOTES) / MAX(NOTES) * MIN(NOTES)';

      // Exécuter en parallèle pour simuler la charge
      const promises = Array(20).fill(0).map(() => 
        formulaEngine.evaluate(intensiveFormula, context)
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results.every(r => r.errors.length === 0)).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Moins de 2 secondes
    });
  });

  describe('Benchmarks', () => {
    test('benchmark: évaluation de formules par seconde', async () => {
      const context: FormulaContext = {
        variables: { A: 10, B: 20, C: 30 },
        functions: {},
        metadata: { calculationDate: new Date() }
      };

      const iterations = 1000;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await formulaEngine.evaluate('MOYENNE(A, B, C)', context);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const evaluationsPerSecond = (iterations / totalTime) * 1000;

      console.log(`Benchmark: ${evaluationsPerSecond.toFixed(0)} évaluations/seconde`);
      
      // Doit pouvoir faire au moins 100 évaluations par seconde
      expect(evaluationsPerSecond).toBeGreaterThan(100);
    });

    test('benchmark: génération de tableaux par minute', async () => {
      const mockTable = {
        id: '1',
        classId: 1,
        config: {
          columns: [{
            id: 'test',
            label: 'Test',
            type: ColumnType.StudentInfo,
            source: { field: 'firstName' },
            formatting: { alignment: TextAlignment.Left },
            sortable: true,
            filterable: true,
            exportable: true
          }]
        },
        computedData: null
      };

      mockPrisma.customTable.findUnique.mockResolvedValue(mockTable);
      mockPrisma.student.findMany.mockResolvedValue([
        { id: 1, firstName: 'Test', lastName: 'User' }
      ]);
      mockPrisma.evaluation.findMany.mockResolvedValue([]);

      const iterations = 10;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await customTableService.generateTableData(1, '1');
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const generationsPerMinute = (iterations / totalTime) * 60000;

      console.log(`Benchmark: ${generationsPerMinute.toFixed(0)} générations/minute`);
      
      // Doit pouvoir générer au moins 60 tableaux par minute
      expect(generationsPerMinute).toBeGreaterThan(60);
    });
  });
});
