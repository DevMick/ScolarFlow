// ========================================
// CONFIGURATION JEST - TESTS BACKEND
// ========================================

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Répertoires de tests
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.spec.ts'
  ],
  
  // Couverture de code
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Seuils de couverture
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Seuils spécifiques pour les services critiques
    './src/services/tables/FormulaEngine.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/services/tables/CustomTableService.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Configuration des modules
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Setup et teardown
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  
  // Timeout pour les tests
  testTimeout: 30000,
  
  // Variables d'environnement pour les tests
  setupFiles: ['<rootDir>/src/tests/env.ts'],
  
  // Transformation des fichiers
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Extensions de fichiers
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Ignorer certains répertoires
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/'
  ],
  
  // Configuration spécifique pour les tests de performance
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      testPathIgnorePatterns: ['<rootDir>/src/tests/performance.test.ts']
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/**/*.integration.test.ts']
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/src/tests/performance.test.ts'],
      testTimeout: 60000 // Timeout plus long pour les tests de performance
    }
  ],
  
  // Reporters personnalisés
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false
      }
    ]
  ],
  
  // Configuration pour les tests de sécurité
  globals: {
    'ts-jest': {
      tsconfig: {
        compilerOptions: {
          // Configuration stricte pour les tests
          strict: true,
          noImplicitAny: true,
          noImplicitReturns: true,
          noFallthroughCasesInSwitch: true
        }
      }
    }
  }
};
