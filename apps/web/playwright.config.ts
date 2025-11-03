// ========================================
// CONFIGURATION PLAYWRIGHT - TESTS E2E
// ========================================

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Répertoire des tests E2E
  testDir: './src/tests/e2e',
  
  // Timeout global
  timeout: 30000,
  
  // Timeout pour les attentes
  expect: {
    timeout: 5000
  },
  
  // Exécution en parallèle
  fullyParallel: true,
  
  // Échec si des tests sont marqués comme .only
  forbidOnly: !!process.env.CI,
  
  // Nombre de tentatives en cas d'échec
  retries: process.env.CI ? 2 : 0,
  
  // Nombre de workers
  workers: process.env.CI ? 1 : undefined,
  
  // Configuration des reporters
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  
  // Configuration globale
  use: {
    // URL de base de l'application
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    
    // Traces en cas d'échec
    trace: 'on-first-retry',
    
    // Screenshots
    screenshot: 'only-on-failure',
    
    // Vidéos
    video: 'retain-on-failure',
    
    // Navigateur headless
    headless: process.env.CI ? true : false,
    
    // Viewport par défaut
    viewport: { width: 1280, height: 720 },
    
    // Ignorer les erreurs HTTPS
    ignoreHTTPSErrors: true,
    
    // Timeout pour les actions
    actionTimeout: 10000,
    
    // Timeout pour la navigation
    navigationTimeout: 15000
  },

  // Configuration des projets (navigateurs)
  projects: [
    // Tests sur Chrome Desktop
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Tests sur Firefox Desktop
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    // Tests sur Safari Desktop (si sur macOS)
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Tests Mobile Chrome
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    // Tests Mobile Safari
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // Tests Tablette
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    }
  ],

  // Configuration du serveur de développement
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
  
  // Répertoires de sortie
  outputDir: 'test-results/',
  
  // Configuration des tests par défaut
  testMatch: '**/*.e2e.test.ts',
  
  // Hooks globaux
  globalSetup: require.resolve('./src/tests/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./src/tests/e2e/global-teardown.ts'),
  
  // Configuration des métadonnées
  metadata: {
    'test-suite': 'EduStats E2E Tests',
    'version': '1.0.0',
    'environment': process.env.NODE_ENV || 'test'
  }
});
