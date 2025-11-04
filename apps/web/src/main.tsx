import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { ConfigProvider } from 'antd'
import type { ThemeConfig } from 'antd'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.tsx'

// Import de la locale Ant Design
import frFR from 'antd/locale/fr_FR'

// Configuration de thème pour Ant Design
// CRITICAL FIX: Ensure token is always a valid plain object to prevent "Cannot convert undefined or null to object" errors
// This is critical for Ant Design's flattenToken function which calls Object.keys() on the token
// IMPORTANT: The token must be a plain object (not null, undefined, or array) for Object.keys() to work

// Solution robuste : définir le thème directement dans le JSX pour éviter toute transformation
// Ne pas utiliser l'algorithme pour éviter les problèmes de transformation
// Créer une fonction qui retourne toujours un thème valide
const getThemeConfig = (): ThemeConfig => {
  const token = {
    colorPrimary: '#1890ff',
    borderRadius: 6,
  }
  
  // Vérification finale de sécurité
  if (!token || typeof token !== 'object' || Array.isArray(token)) {
    console.error('Token invalide, utilisation des valeurs par défaut')
    return {
      token: {
        colorPrimary: '#1890ff',
        borderRadius: 6,
      },
    }
  }
  
  return {
    token,
  }
}

// Vérifier que l'élément root existe avant de rendre l'application
// Cela évite l'erreur "The deferred DOM Node could not be resolved to a valid node"
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a <div id="root"></div> in your HTML.')
}

createRoot(rootElement).render(
  <StrictMode>
    <ConfigProvider theme={getThemeConfig()} locale={frFR}>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </ConfigProvider>
  </StrictMode>,
)
