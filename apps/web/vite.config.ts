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
    strictPort: true
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
      esmExternals: true
    }
  },
  optimizeDeps: {
    include: [
      'react-hot-toast',
      'goober',
      'classnames',
      'antd',
      '@ant-design/cssinjs',
      '@ant-design/cssinjs-utils',
      '@emotion/hash',
      '@emotion/unitless',
      'stylis',
      '@ant-design/react-slick',
      'json2mq',
      '@ant-design/icons-svg',
      '@ant-design/colors',
      '@ant-design/fast-color',
      '@babel/runtime',
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
      '@rc-component/motion'
    ],
    esbuildOptions: {
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs']
    }
  }
})
