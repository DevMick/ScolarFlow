// ========================================
// CONFIGURATION JEST - TESTS FRONTEND
// ========================================

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  // Configuration pour React Testing Library
  setupFilesAfterEnv: [],
  
  // Répertoires de tests
  testMatch: [
    '<rootDir>/src/**/*.test.tsx',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.spec.tsx',
    '<rootDir>/src/**/*.spec.ts'
  ],
  
  // Couverture de code
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Seuils de couverture
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    },
    // Seuils spécifiques pour les composants critiques
    './src/components/tables/TableDesigner.tsx': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/hooks/useCustomTables.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Mapping des modules
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/tests/__mocks__/fileMock.js'
  },
  
  // Transformation des fichiers
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  
  // Extensions de fichiers
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Ignorer certains répertoires
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
    '<rootDir>/src/tests/e2e/'
  ],
  
  // Configuration pour les tests E2E séparés
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
      testPathIgnorePatterns: ['<rootDir>/src/tests/e2e/']
    },
    {
      displayName: 'components',
      testMatch: ['<rootDir>/src/components/**/*.test.tsx']
    },
    {
      displayName: 'hooks',
      testMatch: ['<rootDir>/src/hooks/**/*.test.ts']
    }
  ],
  
  // Variables d'environnement pour les tests
  setupFiles: [],
  
  // Timeout pour les tests
  testTimeout: 15000,
  
  // Configuration TypeScript
  globals: {
    'ts-jest': {
      tsconfig: {
        compilerOptions: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true
        }
      }
    }
  },
  
  // Reporters
  reporters: ['default']
};