// ========================================
// TESTS SÉCURITÉ MOTEUR DE FORMULES
// ========================================

import { FormulaEngine } from '../services/tables/FormulaEngine';
import { FormulaContext, FormulaResultType } from '@edustats/shared/types';

describe('FormulaEngine - Tests de Sécurité', () => {
  let engine: FormulaEngine;
  let mockContext: FormulaContext;

  beforeEach(() => {
    engine = new FormulaEngine();
    mockContext = {
      variables: {
        EVAL_1: 15,
        EVAL_2: 18,
        PRENOM: 'Marie',
        NOM: 'Dupont'
      },
      functions: {},
      metadata: {
        currentRow: 1,
        totalRows: 25,
        calculationDate: new Date()
      }
    };
  });

  describe('Protection contre les injections', () => {
    test('doit rejeter les tentatives d\'injection JavaScript', async () => {
      const maliciousExpressions = [
        'eval("alert(1)")',
        'Function("return process")();',
        'this.constructor.constructor("return process")()',
        'global.process',
        'window.location',
        'document.cookie',
        '__proto__.constructor',
        'constructor.prototype'
      ];

      for (const expr of maliciousExpressions) {
        const result = await engine.evaluate(expr, mockContext);
        expect(result.errors).toHaveLength(1);
        expect(result.value).toBeNull();
        expect(result.errors[0]).toContain('non autorisée');
      }
    });

    test('doit rejeter les propriétés système dangereuses', async () => {
      const dangerousProps = [
        'process',
        'require',
        'global',
        'window',
        'document',
        '__dirname',
        '__filename',
        'module',
        'exports'
      ];

      for (const prop of dangerousProps) {
        const result = await engine.evaluate(prop, mockContext);
        expect(result.errors).toHaveLength(1);
        expect(result.value).toBeNull();
      }
    });

    test('doit limiter la récursion excessive', async () => {
      // Expression avec récursion profonde simulée
      let deepExpression = 'SI(';
      for (let i = 0; i < 150; i++) {
        deepExpression += 'SI(1 = 1, ';
      }
      deepExpression += '1';
      for (let i = 0; i < 150; i++) {
        deepExpression += ', 0)';
      }
      deepExpression += ', 0)';

      const result = await engine.evaluate(deepExpression, mockContext);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('récursion maximale');
    });

    test('doit appliquer un timeout sur les expressions longues', async () => {
      // Expression qui pourrait prendre du temps (boucle simulée)
      const longExpression = 'SOMME(' + Array(10000).fill('1').join(', ') + ')';
      
      const startTime = Date.now();
      const result = await engine.evaluate(longExpression, mockContext);
      const endTime = Date.now();
      
      // Doit soit réussir rapidement, soit échouer avec timeout
      if (result.errors.length > 0) {
        expect(result.errors[0]).toContain('Timeout');
      }
      expect(endTime - startTime).toBeLessThan(6000); // Max 6 secondes
    });
  });

  describe('Validation des entrées', () => {
    test('doit rejeter les expressions trop longues', async () => {
      const longExpression = 'A'.repeat(15000);
      const result = await engine.evaluate(longExpression, mockContext);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('trop longue');
    });

    test('doit rejeter les expressions vides ou invalides', async () => {
      const invalidExpressions = ['', '   ', null, undefined];
      
      for (const expr of invalidExpressions) {
        const result = await engine.evaluate(expr as any, mockContext);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('invalide');
      }
    });

    test('doit valider la syntaxe des parenthèses', async () => {
      const invalidParentheses = [
        'MOYENNE(1, 2',
        'MOYENNE 1, 2)',
        'MOYENNE((1, 2)',
        'MOYENNE(1, 2))',
        '((MOYENNE(1, 2)'
      ];

      for (const expr of invalidParentheses) {
        const result = await engine.evaluate(expr, mockContext);
        expect(result.errors).toHaveLength(1);
      }
    });
  });

  describe('Gestion des erreurs', () => {
    test('doit gérer les divisions par zéro', async () => {
      const result = await engine.evaluate('10 / 0', mockContext);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Division par zéro');
    });

    test('doit gérer les variables non définies', async () => {
      const result = await engine.evaluate('VARIABLE_INEXISTANTE', mockContext);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('non définie');
    });

    test('doit gérer les fonctions non définies', async () => {
      const result = await engine.evaluate('FONCTION_INEXISTANTE(1, 2)', mockContext);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('inconnue');
    });

    test('doit gérer les arguments invalides', async () => {
      const result = await engine.evaluate('MOYENNE()', mockContext);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('argument');
    });
  });

  describe('Fonctions intégrées sécurisées', () => {
    test('MOYENNE doit fonctionner correctement', async () => {
      const result = await engine.evaluate('MOYENNE(10, 20, 30)', mockContext);
      expect(result.errors).toHaveLength(0);
      expect(result.value).toBe(20);
      expect(result.type).toBe(FormulaResultType.Number);
    });

    test('SI doit gérer les conditions logiques', async () => {
      const result = await engine.evaluate('SI(10 > 5, "Vrai", "Faux")', mockContext);
      expect(result.errors).toHaveLength(0);
      expect(result.value).toBe('Vrai');
      expect(result.type).toBe(FormulaResultType.Text);
    });

    test('CONCATENER doit joindre les chaînes', async () => {
      const result = await engine.evaluate('CONCATENER("Hello", " ", "World")', mockContext);
      expect(result.errors).toHaveLength(0);
      expect(result.value).toBe('Hello World');
      expect(result.type).toBe(FormulaResultType.Text);
    });

    test('RANG doit calculer correctement', async () => {
      const context = {
        ...mockContext,
        variables: {
          ...mockContext.variables,
          MA_NOTE: 15,
          TOUTES_NOTES: [10, 15, 20, 12, 18]
        }
      };
      
      const result = await engine.evaluate('RANG(MA_NOTE, TOUTES_NOTES)', context);
      expect(result.errors).toHaveLength(0);
      expect(result.value).toBeGreaterThan(0);
      expect(result.type).toBe(FormulaResultType.Number);
    });
  });

  describe('Performance et limites', () => {
    test('doit traiter les formules simples rapidement', async () => {
      const startTime = Date.now();
      const result = await engine.evaluate('MOYENNE(EVAL_1, EVAL_2)', mockContext);
      const endTime = Date.now();
      
      expect(result.errors).toHaveLength(0);
      expect(endTime - startTime).toBeLessThan(100); // Moins de 100ms
    });

    test('doit gérer les grandes listes de données', async () => {
      const largeArray = Array(1000).fill(0).map((_, i) => i + 1);
      const context = {
        ...mockContext,
        variables: {
          ...mockContext.variables,
          LARGE_ARRAY: largeArray
        }
      };
      
      const result = await engine.evaluate('MOYENNE(LARGE_ARRAY)', context);
      expect(result.errors).toHaveLength(0);
      expect(result.value).toBe(500.5); // Moyenne de 1 à 1000
    });

    test('doit limiter l\'utilisation mémoire', async () => {
      // Test avec une expression qui pourrait consommer beaucoup de mémoire
      const memoryIntensiveExpr = 'CONCATENER(' + 
        Array(100).fill('"A"').join(', ') + ')';
      
      const result = await engine.evaluate(memoryIntensiveExpr, mockContext);
      // Doit soit réussir soit échouer proprement, pas de crash
      expect(result).toBeDefined();
    });
  });

  describe('Validation des types', () => {
    test('doit inférer correctement les types de résultats', async () => {
      const tests = [
        { expr: '10 + 5', expectedType: FormulaResultType.Number },
        { expr: '"Hello"', expectedType: FormulaResultType.Text },
        { expr: '10 > 5', expectedType: FormulaResultType.Boolean },
        { expr: 'MOYENNE(1, 2, 3)', expectedType: FormulaResultType.Number },
        { expr: 'CONCATENER("A", "B")', expectedType: FormulaResultType.Text }
      ];

      for (const test of tests) {
        const result = await engine.evaluate(test.expr, mockContext);
        expect(result.errors).toHaveLength(0);
        expect(result.type).toBe(test.expectedType);
      }
    });

    test('doit gérer les conversions de types implicites', async () => {
      const result = await engine.evaluate('10 + "5"', mockContext);
      expect(result.errors).toHaveLength(0);
      expect(result.value).toBe(15); // Conversion automatique
    });
  });
});
