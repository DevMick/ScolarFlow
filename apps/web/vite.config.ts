import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
    mainFields: ['module', 'jsnext:main', 'jsnext', 'browser', 'main'],
    conditions: ['import', 'module', 'browser', 'default']
  },
  define: {
    'process.env': process.env
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      },
      external: []
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      defaultIsModuleExports: true,
      requireReturnsDefault: 'auto',
      esmExternals: true,
      // Gérer spécifiquement dayjs et ses plugins
      transformRequire: false
    }
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
      '@ant-design/cssinjs'
    ],
    exclude: ['antd'], // Retirer @ant-design/cssinjs de l'exclusion pour permettre la pré-optimisation
    esbuildOptions: {
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs'],
      plugins: [],
      // Gérer les exports CommonJS pour dayjs
      mainFields: ['module', 'main']
    }
  }
})
