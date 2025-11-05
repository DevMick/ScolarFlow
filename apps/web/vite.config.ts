import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fixInteropRequireDefault from './vite-plugin-fix-interop.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    fixInteropRequireDefault()
  ],
  server: {
    port: 3000,
    host: true,
    open: true,
    strictPort: false // Permettre à Vite d'utiliser un autre port si 3000 est occupé
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@edustats/shared': path.resolve(__dirname, '../../packages/shared'),
    },
    preserveSymlinks: true,
    dedupe: ['react', 'react-dom'],
    // Prioriser les modules ESM pour éviter les problèmes de compatibilité
    mainFields: ['module', 'browser', 'main'],
    conditions: ['import', 'module', 'browser', 'default']
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  build: {
    rollupOptions: {
      output: {
        // Forcer un SEUL chunk pour éviter les problèmes de partage des helpers
        manualChunks: undefined,
        // Utiliser inlineDynamicImports pour forcer un seul fichier
        inlineDynamicImports: true,
        // Utiliser IIFE au lieu d'ESM pour éviter complètement les problèmes d'interopération
        format: 'iife',
        // IIFE gère mieux l'interopération
        interop: 'auto',
        // Nom global pour IIFE
        name: 'ScolarFlow',
        // Générer le code de manière compatible
        generatedCode: {
          constBindings: true,
          objectShorthand: true
        },
        // Préserver les helpers d'interopération
        exports: 'named',
        // Préserver les noms de fonctions pour éviter les problèmes
        preserveModules: false
      },
      external: [],
      // Forcer la transformation de tous les modules CommonJS
      plugins: [
        fixInteropRequireDefault()
      ],
      // Gérer les avertissements pour éviter les problèmes
      onwarn(warning, warn) {
        // Ignorer certains avertissements qui ne sont pas critiques
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
        warn(warning)
      }
    },
    commonjsOptions: {
      // Forcer la transformation de TOUS les modules CommonJS
      include: [/node_modules/, /packages\/shared/, /\.js$/],
      transformMixedEsModules: true,
      // Forcer la transformation complète pour éviter les problèmes d'interopération
      // Utiliser 'auto' pour une meilleure détection automatique
      defaultIsModuleExports: 'auto',
      requireReturnsDefault: 'auto',
      // Ne pas utiliser esmExternals en production pour éviter les problèmes
      esmExternals: false,
      // Gérer spécifiquement dayjs et ses plugins
      transformRequire: true,
      // Forcer la transformation des modules problématiques
      strictRequires: false,
      // Forcer la transformation de tous les requires
      dynamicRequireTargets: [],
      // Ne rien ignorer - tout transformer
      ignore: []
    },
    // Optimisations pour la production
    // Désactiver temporairement la minification pour tester si c'est la cause de _interopRequireDefault
    minify: false,
    // minify: 'esbuild',
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    sourcemap: false,
    // Forcer la transformation de tous les modules
    modulePreload: false,
    // Forcer le chunking pour éviter les problèmes
    chunkSizeWarningLimit: 1000,
    // Assurer la compatibilité avec les navigateurs modernes
    cssCodeSplit: true
  },
  optimizeDeps: {
    include: [
      'react-hot-toast',
      'goober',
      'classnames',
      '@ant-design/cssinjs-utils',
      '@emotion/hash',
      '@emotion/unitless',
      'stylis',
      '@ant-design/react-slick',
      'json2mq',
      '@ant-design/icons-svg',
      '@ant-design/colors',
      '@ant-design/fast-color',
      'rc-util',
      'rc-motion',
      'rc-resize-observer',
      'rc-trigger',
      'rc-overflow',
      '@rc-component/mini-decimal',
      '@rc-component/portal',
      '@remix-run/router',
      'react-router-dom',
      'react-is',
      'chart.js',
      '@kurkle/color',
      'resize-observer-polyfill',
      'compute-scroll-into-view',
      'scroll-into-view-if-needed',
      'copy-to-clipboard',
      'scheduler',
      '@tanstack/react-virtual',
      '@tanstack/virtual-core',
      '@rc-component/async-validator',
      '@rc-component/motion',
      // Ant Design locale files (CommonJS modules need to be pre-bundled)
      'antd/locale/fr_FR',
      // dayjs core + plugins référencés par antd/rc-picker
      'dayjs',
      'dayjs/plugin/advancedFormat',
      'dayjs/plugin/customParseFormat',
      'dayjs/plugin/weekday',
      'dayjs/plugin/weekOfYear',
      'dayjs/plugin/weekYear',
      'dayjs/plugin/isSameOrBefore',
      'dayjs/plugin/isSameOrAfter',
      'dayjs/plugin/localeData',
      'dayjs/plugin/updateLocale',
      'dayjs/plugin/quarterOfYear',
      'dayjs/plugin/utc',
      'dayjs/plugin/timezone',
      // Forcer l'optimisation de @ant-design/cssinjs pour éviter les problèmes de token undefined
      '@ant-design/cssinjs',
      // Package interne - doit être optimisé
      '@edustats/shared'
    ],
    exclude: ['antd'], // Retirer @ant-design/cssinjs de l'exclusion pour permettre la pré-optimisation
    esbuildOptions: {
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs'],
      plugins: [],
      // Gérer les exports CommonJS pour dayjs
      mainFields: ['module', 'main'],
      // Forcer la transformation du package shared
      target: 'es2020'
    }
  }
})
