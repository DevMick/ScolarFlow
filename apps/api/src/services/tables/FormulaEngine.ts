// ========================================
// FORMULA ENGINE - MOTEUR DE FORMULES SÉCURISÉ
// ========================================

import { 
  FormulaFunction, 
  FormulaVariable, 
  FormulaResult, 
  FormulaContext, 
  FormulaResultType 
} from '@edustats/shared/types';

/**
 * Nœud de l'arbre syntaxique abstrait (AST)
 */
interface ASTNode {
  type: 'literal' | 'variable' | 'function' | 'binary_operation' | 'unary_operation';
  value?: any;
  name?: string;
  operator?: string;
  left?: ASTNode;
  right?: ASTNode;
  operand?: ASTNode;
  arguments?: ASTNode[];
}

/**
 * Token du parser
 */
interface Token {
  type: 'NUMBER' | 'STRING' | 'IDENTIFIER' | 'OPERATOR' | 'PARENTHESIS' | 'COMMA' | 'EOF';
  value: string;
  position: number;
}

/**
 * Moteur d'évaluation de formules sécurisé
 */
export class FormulaEngine {
  private functions: Map<string, FormulaFunction> = new Map();
  private variables: Map<string, FormulaVariable> = new Map();
  private readonly MAX_RECURSION_DEPTH = 100;
  private readonly MAX_EXECUTION_TIME = 5000; // 5 secondes
  private readonly RESTRICTED_PROPERTIES = [
    'constructor', 'prototype', '__proto__', 'eval', 'Function',
    'require', 'process', 'global', 'window', 'document'
  ];

  constructor() {
    this.registerDefaultFunctions();
    this.registerDefaultVariables();
  }

  /**
   * Évalue une expression de formule
   */
  async evaluate(expression: string, context: FormulaContext): Promise<FormulaResult> {
    const startTime = Date.now();
    
    try {
      // 1. Validation de base
      if (!expression || typeof expression !== 'string') {
        throw new Error('Expression invalide');
      }

      if (expression.length > 10000) {
        throw new Error('Expression trop longue (max 10000 caractères)');
      }

      // 2. Parser l'expression
      const tokens = this.tokenize(expression);
      const ast = this.parseTokens(tokens);

      // 3. Valider la sécurité
      this.validateSecurity(ast);

      // 4. Résoudre les variables
      const resolvedContext = this.resolveVariables(context);

      // 5. Évaluer l'expression avec timeout
      const result = await this.evaluateWithTimeout(ast, resolvedContext);

      const processingTime = Date.now() - startTime;

      return {
        value: result,
        type: this.inferType(result),
        errors: [],
        warnings: [],
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      return {
        value: null,
        type: FormulaResultType.Text,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
        warnings: [],
        processingTime
      };
    }
  }

  /**
   * Tokenise une expression
   */
  private tokenize(expression: string): Token[] {
    const tokens: Token[] = [];
    let position = 0;

    while (position < expression.length) {
      const char = expression[position];

      // Ignorer les espaces
      if (/\s/.test(char)) {
        position++;
        continue;
      }

      // Nombres (entiers et décimaux)
      if (/\d/.test(char)) {
        let value = '';
        while (position < expression.length && /[\d.]/.test(expression[position])) {
          value += expression[position];
          position++;
        }
        tokens.push({ type: 'NUMBER', value, position: position - value.length });
        continue;
      }

      // Chaînes de caractères
      if (char === '"' || char === "'") {
        const quote = char;
        let value = '';
        position++; // Ignorer la quote d'ouverture
        
        while (position < expression.length && expression[position] !== quote) {
          if (expression[position] === '\\' && position + 1 < expression.length) {
            // Échappement
            position++;
            const escaped = expression[position];
            switch (escaped) {
              case 'n': value += '\n'; break;
              case 't': value += '\t'; break;
              case 'r': value += '\r'; break;
              case '\\': value += '\\'; break;
              case '"': value += '"'; break;
              case "'": value += "'"; break;
              default: value += escaped;
            }
          } else {
            value += expression[position];
          }
          position++;
        }
        
        if (position >= expression.length) {
          throw new Error('Chaîne de caractères non fermée');
        }
        
        position++; // Ignorer la quote de fermeture
        tokens.push({ type: 'STRING', value, position: position - value.length - 2 });
        continue;
      }

      // Identifiants (variables et fonctions)
      if (/[a-zA-Z_]/.test(char)) {
        let value = '';
        while (position < expression.length && /[a-zA-Z0-9_]/.test(expression[position])) {
          value += expression[position];
          position++;
        }
        tokens.push({ type: 'IDENTIFIER', value: value.toUpperCase(), position: position - value.length });
        continue;
      }

      // Opérateurs
      if (/[+\-*/=<>!]/.test(char)) {
        let value = char;
        position++;
        
        // Opérateurs composés
        if (position < expression.length) {
          const nextChar = expression[position];
          if ((char === '=' && nextChar === '=') ||
              (char === '!' && nextChar === '=') ||
              (char === '<' && nextChar === '=') ||
              (char === '>' && nextChar === '=')) {
            value += nextChar;
            position++;
          }
        }
        
        tokens.push({ type: 'OPERATOR', value, position: position - value.length });
        continue;
      }

      // Parenthèses
      if (char === '(' || char === ')') {
        tokens.push({ type: 'PARENTHESIS', value: char, position });
        position++;
        continue;
      }

      // Virgules
      if (char === ',') {
        tokens.push({ type: 'COMMA', value: char, position });
        position++;
        continue;
      }

      throw new Error(`Caractère inattendu '${char}' à la position ${position}`);
    }

    tokens.push({ type: 'EOF', value: '', position });
    return tokens;
  }

  /**
   * Parse les tokens en AST
   */
  private parseTokens(tokens: Token[]): ASTNode {
    let position = 0;

    const peek = (): Token => tokens[position] || { type: 'EOF', value: '', position: 0 };
    const consume = (): Token => tokens[position++] || { type: 'EOF', value: '', position: 0 };

    const parseExpression = (): ASTNode => {
      return parseLogicalOr();
    };

    const parseLogicalOr = (): ASTNode => {
      let left = parseLogicalAnd();

      while (peek().value === 'OR') {
        const operator = consume().value;
        const right = parseLogicalAnd();
        left = { type: 'binary_operation', operator, left, right };
      }

      return left;
    };

    const parseLogicalAnd = (): ASTNode => {
      let left = parseEquality();

      while (peek().value === 'AND') {
        const operator = consume().value;
        const right = parseEquality();
        left = { type: 'binary_operation', operator, left, right };
      }

      return left;
    };

    const parseEquality = (): ASTNode => {
      let left = parseComparison();

      while (['==', '!=', '='].includes(peek().value)) {
        const operator = consume().value;
        const right = parseComparison();
        left = { type: 'binary_operation', operator, left, right };
      }

      return left;
    };

    const parseComparison = (): ASTNode => {
      let left = parseAddition();

      while (['<', '>', '<=', '>='].includes(peek().value)) {
        const operator = consume().value;
        const right = parseAddition();
        left = { type: 'binary_operation', operator, left, right };
      }

      return left;
    };

    const parseAddition = (): ASTNode => {
      let left = parseMultiplication();

      while (['+', '-'].includes(peek().value)) {
        const operator = consume().value;
        const right = parseMultiplication();
        left = { type: 'binary_operation', operator, left, right };
      }

      return left;
    };

    const parseMultiplication = (): ASTNode => {
      let left = parseUnary();

      while (['*', '/'].includes(peek().value)) {
        const operator = consume().value;
        const right = parseUnary();
        left = { type: 'binary_operation', operator, left, right };
      }

      return left;
    };

    const parseUnary = (): ASTNode => {
      if (['+', '-', '!'].includes(peek().value)) {
        const operator = consume().value;
        const operand = parseUnary();
        return { type: 'unary_operation', operator, operand };
      }

      return parsePrimary();
    };

    const parsePrimary = (): ASTNode => {
      const token = peek();

      if (token.type === 'NUMBER') {
        consume();
        return { type: 'literal', value: parseFloat(token.value) };
      }

      if (token.type === 'STRING') {
        consume();
        return { type: 'literal', value: token.value };
      }

      if (token.type === 'IDENTIFIER') {
        const name = consume().value;

        // Fonction
        if (peek().type === 'PARENTHESIS' && peek().value === '(') {
          consume(); // '('
          const args: ASTNode[] = [];

          if (peek().type !== 'PARENTHESIS' || peek().value !== ')') {
            args.push(parseExpression());

            while (peek().type === 'COMMA') {
              consume(); // ','
              args.push(parseExpression());
            }
          }

          if (peek().type !== 'PARENTHESIS' || peek().value !== ')') {
            throw new Error('Parenthèse fermante attendue');
          }
          consume(); // ')'

          return { type: 'function', name, arguments: args };
        }

        // Variable
        return { type: 'variable', name };
      }

      if (token.type === 'PARENTHESIS' && token.value === '(') {
        consume(); // '('
        const expr = parseExpression();
        
        if (peek().type !== 'PARENTHESIS' || peek().value !== ')') {
          throw new Error('Parenthèse fermante attendue');
        }
        consume(); // ')'
        
        return expr;
      }

      throw new Error(`Token inattendu: ${token.value}`);
    };

    const ast = parseExpression();

    if (peek().type !== 'EOF') {
      throw new Error(`Tokens non consommés: ${peek().value}`);
    }

    return ast;
  }

  /**
   * Valide la sécurité de l'AST
   */
  private validateSecurity(ast: ASTNode, depth = 0): void {
    if (depth > this.MAX_RECURSION_DEPTH) {
      throw new Error('Expression trop complexe (récursion maximale atteinte)');
    }

    switch (ast.type) {
      case 'function':
        if (!this.functions.has(ast.name!)) {
          throw new Error(`Fonction non autorisée: ${ast.name}`);
        }
        ast.arguments?.forEach(arg => this.validateSecurity(arg, depth + 1));
        break;

      case 'variable':
        if (this.RESTRICTED_PROPERTIES.includes(ast.name!.toLowerCase())) {
          throw new Error(`Variable non autorisée: ${ast.name}`);
        }
        break;

      case 'binary_operation':
        this.validateSecurity(ast.left!, depth + 1);
        this.validateSecurity(ast.right!, depth + 1);
        break;

      case 'unary_operation':
        this.validateSecurity(ast.operand!, depth + 1);
        break;
    }
  }

  /**
   * Résout les variables dans le contexte
   */
  private resolveVariables(context: FormulaContext): Record<string, any> {
    const resolved: Record<string, any> = { ...context.variables };

    // Ajouter les variables système
    resolved.DATE_AUJOURD_HUI = new Date();
    resolved.TIMESTAMP = Date.now();

    return resolved;
  }

  /**
   * Évalue l'AST avec timeout
   */
  private async evaluateWithTimeout(ast: ASTNode, context: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout: l\'évaluation a pris trop de temps'));
      }, this.MAX_EXECUTION_TIME);

      try {
        const result = this.evaluateAST(ast, context);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Évalue un nœud de l'AST
   */
  private evaluateAST(ast: ASTNode, context: Record<string, any>): any {
    switch (ast.type) {
      case 'literal':
        return ast.value;

      case 'variable':
        if (!(ast.name! in context)) {
          throw new Error(`Variable non définie: ${ast.name}`);
        }
        return context[ast.name!];

      case 'function':
        return this.evaluateFunction(ast.name!, ast.arguments!, context);

      case 'binary_operation':
        const left = this.evaluateAST(ast.left!, context);
        const right = this.evaluateAST(ast.right!, context);
        return this.evaluateBinaryOperation(ast.operator!, left, right);

      case 'unary_operation':
        const operand = this.evaluateAST(ast.operand!, context);
        return this.evaluateUnaryOperation(ast.operator!, operand);

      default:
        throw new Error(`Type de nœud non supporté: ${ast.type}`);
    }
  }

  /**
   * Évalue une fonction
   */
  private evaluateFunction(name: string, args: ASTNode[], context: Record<string, any>): any {
    const func = this.functions.get(name);
    if (!func) {
      throw new Error(`Fonction inconnue: ${name}`);
    }

    const evaluatedArgs = args.map(arg => this.evaluateAST(arg, context));

    // Validation du nombre d'arguments
    const requiredArgs = func.parameters.filter(p => p.required).length;
    if (evaluatedArgs.length < requiredArgs) {
      throw new Error(`${name} nécessite au moins ${requiredArgs} argument(s)`);
    }

    if (func.implementation) {
      return func.implementation(evaluatedArgs);
    }

    // Implémentations intégrées
    switch (name) {
      case 'MOYENNE':
        return this.calculateAverage(evaluatedArgs.flat());

      case 'SOMME':
        return this.calculateSum(evaluatedArgs.flat());

      case 'MIN':
        return Math.min(...evaluatedArgs.flat().filter(v => typeof v === 'number'));

      case 'MAX':
        return Math.max(...evaluatedArgs.flat().filter(v => typeof v === 'number'));

      case 'RANG':
        return this.calculateRank(evaluatedArgs[0], evaluatedArgs[1]);

      case 'SI':
        return evaluatedArgs[0] ? evaluatedArgs[1] : evaluatedArgs[2];

      case 'CONCATENER':
        return evaluatedArgs.map(v => String(v)).join('');

      case 'COMPTER':
        return evaluatedArgs.flat().length;

      case 'COMPTER_SI':
        return this.countIf(evaluatedArgs[0], evaluatedArgs[1], evaluatedArgs[2]);

      case 'ARRONDIR':
        return Math.round(evaluatedArgs[0] * Math.pow(10, evaluatedArgs[1] || 0)) / Math.pow(10, evaluatedArgs[1] || 0);

      case 'ABS':
        return Math.abs(evaluatedArgs[0]);

      case 'RACINE':
        return Math.sqrt(evaluatedArgs[0]);

      case 'PUISSANCE':
        return Math.pow(evaluatedArgs[0], evaluatedArgs[1]);

      default:
        throw new Error(`Fonction non implémentée: ${name}`);
    }
  }

  /**
   * Évalue une opération binaire
   */
  private evaluateBinaryOperation(operator: string, left: any, right: any): any {
    switch (operator) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        if (right === 0) throw new Error('Division par zéro');
        return left / right;
      case '=':
      case '==':
        return left === right;
      case '!=':
        return left !== right;
      case '<':
        return left < right;
      case '>':
        return left > right;
      case '<=':
        return left <= right;
      case '>=':
        return left >= right;
      case 'AND':
        return left && right;
      case 'OR':
        return left || right;
      default:
        throw new Error(`Opérateur non supporté: ${operator}`);
    }
  }

  /**
   * Évalue une opération unaire
   */
  private evaluateUnaryOperation(operator: string, operand: any): any {
    switch (operator) {
      case '+':
        return +operand;
      case '-':
        return -operand;
      case '!':
        return !operand;
      default:
        throw new Error(`Opérateur unaire non supporté: ${operator}`);
    }
  }

  /**
   * Calcule la moyenne
   */
  private calculateAverage(values: any[]): number {
    const numbers = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
  }

  /**
   * Calcule la somme
   */
  private calculateSum(values: any[]): number {
    const numbers = values.filter(v => typeof v === 'number' && !isNaN(v));
    return numbers.reduce((sum, val) => sum + val, 0);
  }

  /**
   * Calcule le rang
   */
  private calculateRank(value: number, dataset: number[]): number {
    const numbers = dataset.filter(v => typeof v === 'number' && !isNaN(v));
    const sorted = [...numbers].sort((a, b) => b - a);
    const rank = sorted.findIndex(v => v <= value) + 1;
    return rank || numbers.length + 1;
  }

  /**
   * Compte les valeurs qui satisfont une condition
   */
  private countIf(values: any[], operator: string, criteria: any): number {
    return values.filter(value => {
      switch (operator) {
        case '>': return value > criteria;
        case '<': return value < criteria;
        case '>=': return value >= criteria;
        case '<=': return value <= criteria;
        case '=': return value === criteria;
        case '!=': return value !== criteria;
        default: return false;
      }
    }).length;
  }

  /**
   * Infère le type du résultat
   */
  private inferType(value: any): FormulaResultType {
    if (typeof value === 'number') return FormulaResultType.Number;
    if (typeof value === 'boolean') return FormulaResultType.Boolean;
    if (value instanceof Date) return FormulaResultType.Date;
    return FormulaResultType.Text;
  }

  /**
   * Enregistre les fonctions par défaut
   */
  private registerDefaultFunctions(): void {
    const functions: FormulaFunction[] = [
      {
        name: 'MOYENNE',
        description: 'Calcule la moyenne d\'une série de valeurs',
        syntax: 'MOYENNE(valeur1, valeur2, ...)',
        category: 'statistical',
        parameters: [
          { name: 'valeurs', type: 'array', required: true, description: 'Valeurs à moyenner' }
        ],
        example: 'MOYENNE(15, 18, 12) = 15'
      },
      {
        name: 'SOMME',
        description: 'Calcule la somme d\'une série de valeurs',
        syntax: 'SOMME(valeur1, valeur2, ...)',
        category: 'math',
        parameters: [
          { name: 'valeurs', type: 'array', required: true, description: 'Valeurs à additionner' }
        ],
        example: 'SOMME(10, 20, 30) = 60'
      },
      {
        name: 'RANG',
        description: 'Calcule le rang d\'une valeur dans un ensemble',
        syntax: 'RANG(valeur, données)',
        category: 'statistical',
        parameters: [
          { name: 'valeur', type: 'number', required: true, description: 'Valeur à classer' },
          { name: 'données', type: 'array', required: true, description: 'Ensemble des valeurs' }
        ],
        example: 'RANG(15, [10, 15, 20]) = 2'
      },
      {
        name: 'SI',
        description: 'Condition logique',
        syntax: 'SI(condition, si_vrai, si_faux)',
        category: 'logical',
        parameters: [
          { name: 'condition', type: 'boolean', required: true, description: 'Test logique' },
          { name: 'si_vrai', type: 'any', required: true, description: 'Valeur si condition vraie' },
          { name: 'si_faux', type: 'any', required: true, description: 'Valeur si condition fausse' }
        ],
        example: 'SI(note >= 10, "Admis", "Redouble")'
      },
      {
        name: 'CONCATENER',
        description: 'Joint plusieurs textes',
        syntax: 'CONCATENER(texte1, texte2, ...)',
        category: 'text',
        parameters: [
          { name: 'textes', type: 'array', required: true, description: 'Textes à joindre' }
        ],
        example: 'CONCATENER("Bonjour ", "monde") = "Bonjour monde"'
      }
    ];

    functions.forEach(func => this.functions.set(func.name, func));
  }

  /**
   * Enregistre les variables par défaut
   */
  private registerDefaultVariables(): void {
    const variables: FormulaVariable[] = [
      {
        name: 'PRENOM',
        description: 'Prénom de l\'élève',
        type: 'student',
        dataType: FormulaResultType.Text,
        example: 'Marie'
      },
      {
        name: 'NOM',
        description: 'Nom de l\'élève',
        type: 'student',
        dataType: FormulaResultType.Text,
        example: 'Dupont'
      },
      {
        name: 'DATE_AUJOURD_HUI',
        description: 'Date actuelle',
        type: 'system',
        dataType: FormulaResultType.Date,
        example: new Date()
      }
    ];

    variables.forEach(variable => this.variables.set(variable.name, variable));
  }

  /**
   * Ajoute une fonction personnalisée
   */
  public addFunction(func: FormulaFunction): void {
    this.functions.set(func.name.toUpperCase(), func);
  }

  /**
   * Ajoute une variable personnalisée
   */
  public addVariable(variable: FormulaVariable): void {
    this.variables.set(variable.name.toUpperCase(), variable);
  }

  /**
   * Obtient toutes les fonctions disponibles
   */
  public getFunctions(): FormulaFunction[] {
    return Array.from(this.functions.values());
  }

  /**
   * Obtient toutes les variables disponibles
   */
  public getVariables(): FormulaVariable[] {
    return Array.from(this.variables.values());
  }
}
