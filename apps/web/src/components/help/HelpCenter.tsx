// ========================================
// HELP CENTER - CENTRE D'AIDE PRINCIPAL
// ========================================

import React, { useState, useEffect } from 'react';
import { 
  BookOpenIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CommandLineIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/classNames';
import { UserGuide } from './UserGuide';
import { FAQ } from './FAQ';
import { ContextualHelp, InteractiveTutorial } from './ContextualHelp';

/**
 * Sections du centre d'aide
 */
type HelpSection = 'guide' | 'faq' | 'tutorials' | 'shortcuts' | 'diagnostics';

/**
 * Props du composant HelpCenter
 */
interface HelpCenterProps {
  /** Section par défaut */
  defaultSection?: HelpSection;
  /** Mode modal */
  modal?: boolean;
  /** Callback de fermeture */
  onClose?: () => void;
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Interface pour les raccourcis clavier
 */
interface KeyboardShortcut {
  id: string;
  category: string;
  description: string;
  keys: string[];
  context?: string;
}

/**
 * Raccourcis clavier disponibles
 */
const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: 'new-analysis',
    category: 'Navigation',
    description: 'Créer une nouvelle analyse',
    keys: ['Ctrl', 'N']
  },
  {
    id: 'save-config',
    category: 'Configuration',
    description: 'Sauvegarder la configuration',
    keys: ['Ctrl', 'S']
  },
  {
    id: 'export-chart',
    category: 'Export',
    description: 'Exporter le graphique actuel',
    keys: ['Ctrl', 'E']
  },
  {
    id: 'toggle-anonymous',
    category: 'Affichage',
    description: 'Basculer le mode anonyme',
    keys: ['Ctrl', 'Shift', 'A']
  },
  {
    id: 'open-help',
    category: 'Aide',
    description: 'Ouvrir le centre d\'aide',
    keys: ['F1']
  },
  {
    id: 'search',
    category: 'Navigation',
    description: 'Rechercher',
    keys: ['Ctrl', 'K']
  },
  {
    id: 'wizard-next',
    category: 'Wizard',
    description: 'Étape suivante',
    keys: ['Tab'],
    context: 'Dans l\'assistant de création'
  },
  {
    id: 'wizard-previous',
    category: 'Wizard',
    description: 'Étape précédente',
    keys: ['Shift', 'Tab'],
    context: 'Dans l\'assistant de création'
  },
  {
    id: 'close-modal',
    category: 'Interface',
    description: 'Fermer la modal',
    keys: ['Escape']
  },
  {
    id: 'confirm-action',
    category: 'Interface',
    description: 'Confirmer l\'action',
    keys: ['Enter']
  }
];

/**
 * Tutoriels disponibles
 */
const TUTORIALS = [
  {
    id: 'first-analysis',
    title: 'Créer votre première analyse',
    description: 'Apprenez à utiliser l\'assistant de création pas à pas',
    duration: '5 min',
    difficulty: 'Débutant',
    steps: [
      {
        target: 'new-analysis-button',
        content: {
          id: 'tutorial-step-1',
          type: 'tutorial' as const,
          title: 'Bienvenue dans ScolarFlow !',
          content: (
            <div>
              <p>Ce tutoriel vous guide dans la création de votre première analyse statistique.</p>
              <p className="mt-2">Cliquez sur "Nouvelle Analyse" pour commencer.</p>
            </div>
          )
        }
      },
      {
        target: 'wizard-name-input',
        content: {
          id: 'tutorial-step-2',
          type: 'tutorial' as const,
          title: 'Nommez votre analyse',
          content: (
            <div>
              <p>Donnez un nom descriptif à votre analyse.</p>
              <p className="mt-2">Exemple : "Performance Mathématiques T1 2024"</p>
            </div>
          )
        }
      },
      {
        target: 'class-selector',
        content: {
          id: 'tutorial-step-3',
          type: 'tutorial' as const,
          title: 'Sélectionnez vos classes',
          content: (
            <div>
              <p>Choisissez une ou plusieurs classes à analyser.</p>
              <p className="mt-2">Vous pouvez sélectionner plusieurs classes pour une analyse comparative.</p>
            </div>
          )
        }
      }
    ]
  },
  {
    id: 'using-templates',
    title: 'Utiliser les templates',
    description: 'Découvrez comment gagner du temps avec les templates prédéfinis',
    duration: '3 min',
    difficulty: 'Débutant',
    steps: []
  },
  {
    id: 'advanced-statistics',
    title: 'Statistiques avancées',
    description: 'Maîtrisez les métriques statistiques et leur interprétation',
    duration: '10 min',
    difficulty: 'Intermédiaire',
    steps: []
  },
  {
    id: 'custom-reports',
    title: 'Rapports personnalisés',
    description: 'Créez des rapports PDF professionnels',
    duration: '7 min',
    difficulty: 'Intermédiaire',
    steps: []
  }
];

/**
 * Composant de diagnostic système
 */
const SystemDiagnostics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<{
    browser: { name: string; version: string; supported: boolean };
    javascript: boolean;
    localStorage: boolean;
    connectivity: 'online' | 'offline' | 'slow';
    performance: { memory: number; fps: number };
  } | null>(null);

  useEffect(() => {
    const runDiagnostics = async () => {
      // Détection du navigateur
      const userAgent = navigator.userAgent;
      let browserName = 'Unknown';
      let browserVersion = 'Unknown';
      let supported = false;

      if (userAgent.includes('Chrome')) {
        browserName = 'Chrome';
        const match = userAgent.match(/Chrome\/(\d+)/);
        browserVersion = match ? match[1] : 'Unknown';
        supported = parseInt(browserVersion) >= 90;
      } else if (userAgent.includes('Firefox')) {
        browserName = 'Firefox';
        const match = userAgent.match(/Firefox\/(\d+)/);
        browserVersion = match ? match[1] : 'Unknown';
        supported = parseInt(browserVersion) >= 88;
      } else if (userAgent.includes('Safari')) {
        browserName = 'Safari';
        const match = userAgent.match(/Version\/(\d+)/);
        browserVersion = match ? match[1] : 'Unknown';
        supported = parseInt(browserVersion) >= 14;
      }

      // Test JavaScript
      const jsEnabled = true; // Si on arrive ici, JS est activé

      // Test localStorage
      let localStorageEnabled = false;
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        localStorageEnabled = true;
      } catch (e) {
        localStorageEnabled = false;
      }

      // Test connectivité
      let connectivity: 'online' | 'offline' | 'slow' = 'online';
      if (!navigator.onLine) {
        connectivity = 'offline';
      } else {
        // Test de vitesse simple
        const start = Date.now();
        try {
          await fetch('/api/ping', { method: 'HEAD' });
          const duration = Date.now() - start;
          connectivity = duration > 2000 ? 'slow' : 'online';
        } catch {
          connectivity = 'offline';
        }
      }

      // Performance
      const memory = (performance as any).memory?.usedJSHeapSize || 0;
      const fps = 60; // Estimation

      setDiagnostics({
        browser: { name: browserName, version: browserVersion, supported },
        javascript: jsEnabled,
        localStorage: localStorageEnabled,
        connectivity,
        performance: { memory: Math.round(memory / 1024 / 1024), fps }
      });
    };

    runDiagnostics();
  }, []);

  if (!diagnostics) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Diagnostic en cours...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Diagnostic système</h3>
        <p className="text-gray-600 text-sm mb-6">
          Vérification de la compatibilité et des performances de votre environnement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Navigateur */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Navigateur</h4>
            <div className={cn(
              'w-3 h-3 rounded-full',
              diagnostics.browser.supported ? 'bg-green-500' : 'bg-red-500'
            )} />
          </div>
          <p className="text-sm text-gray-600">
            {diagnostics.browser.name} {diagnostics.browser.version}
          </p>
          {!diagnostics.browser.supported && (
            <p className="text-xs text-red-600 mt-1">
              Version non supportée. Veuillez mettre à jour votre navigateur.
            </p>
          )}
        </div>

        {/* JavaScript */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">JavaScript</h4>
            <div className={cn(
              'w-3 h-3 rounded-full',
              diagnostics.javascript ? 'bg-green-500' : 'bg-red-500'
            )} />
          </div>
          <p className="text-sm text-gray-600">
            {diagnostics.javascript ? 'Activé' : 'Désactivé'}
          </p>
        </div>

        {/* Stockage local */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Stockage local</h4>
            <div className={cn(
              'w-3 h-3 rounded-full',
              diagnostics.localStorage ? 'bg-green-500' : 'bg-red-500'
            )} />
          </div>
          <p className="text-sm text-gray-600">
            {diagnostics.localStorage ? 'Disponible' : 'Indisponible'}
          </p>
        </div>

        {/* Connectivité */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Connectivité</h4>
            <div className={cn(
              'w-3 h-3 rounded-full',
              diagnostics.connectivity === 'online' ? 'bg-green-500' :
              diagnostics.connectivity === 'slow' ? 'bg-yellow-500' : 'bg-red-500'
            )} />
          </div>
          <p className="text-sm text-gray-600">
            {diagnostics.connectivity === 'online' ? 'Excellente' :
             diagnostics.connectivity === 'slow' ? 'Lente' : 'Hors ligne'}
          </p>
        </div>
      </div>

      {/* Performance */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Performance</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Mémoire utilisée :</span>
            <span className="ml-2 font-medium">{diagnostics.performance.memory} MB</span>
          </div>
          <div>
            <span className="text-gray-600">FPS estimé :</span>
            <span className="ml-2 font-medium">{diagnostics.performance.fps}</span>
          </div>
        </div>
      </div>

      {/* Recommandations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Recommandations</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {!diagnostics.browser.supported && (
            <li>• Mettez à jour votre navigateur pour une meilleure compatibilité</li>
          )}
          {!diagnostics.localStorage && (
            <li>• Activez le stockage local pour sauvegarder vos préférences</li>
          )}
          {diagnostics.connectivity === 'slow' && (
            <li>• Votre connexion est lente, certaines fonctionnalités peuvent être ralenties</li>
          )}
          {diagnostics.performance.memory > 100 && (
            <li>• Fermez quelques onglets pour libérer de la mémoire</li>
          )}
        </ul>
      </div>
    </div>
  );
};

/**
 * Composant principal du centre d'aide
 */
export const HelpCenter: React.FC<HelpCenterProps> = ({
  defaultSection = 'guide',
  modal = false,
  onClose,
  className
}) => {
  const [activeSection, setActiveSection] = useState<HelpSection>(defaultSection);
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ========================================
  // NAVIGATION
  // ========================================

  const sections = [
    {
      id: 'guide' as const,
      title: 'Guide utilisateur',
      description: 'Documentation complète d\'ScolarFlow',
      icon: BookOpenIcon
    },
    {
      id: 'faq' as const,
      title: 'Questions fréquentes',
      description: 'Réponses aux questions courantes',
      icon: QuestionMarkCircleIcon
    },
    {
      id: 'tutorials' as const,
      title: 'Tutoriels interactifs',
      description: 'Apprenez par la pratique',
      icon: AcademicCapIcon
    },
    {
      id: 'shortcuts' as const,
      title: 'Raccourcis clavier',
      description: 'Gagnez en efficacité',
      icon: CommandLineIcon
    },
    {
      id: 'diagnostics' as const,
      title: 'Diagnostic système',
      description: 'Vérifiez votre configuration',
      icon: Cog6ToothIcon
    }
  ];

  // ========================================
  // RENDU DES SECTIONS
  // ========================================

  const renderShortcuts = () => {
    const categories = [...new Set(KEYBOARD_SHORTCUTS.map(s => s.category))];
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Raccourcis clavier</h3>
          <p className="text-gray-600 text-sm">
            Utilisez ces raccourcis pour naviguer plus rapidement dans ScolarFlow.
          </p>
        </div>

        {categories.map(category => (
          <div key={category} className="space-y-3">
            <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
              {category}
            </h4>
            
            <div className="space-y-2">
              {KEYBOARD_SHORTCUTS
                .filter(shortcut => shortcut.category === category)
                .map(shortcut => (
                  <div key={shortcut.id} className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {shortcut.description}
                      </div>
                      {shortcut.context && (
                        <div className="text-xs text-gray-500">
                          {shortcut.context}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {shortcut.keys.map((key, index) => (
                        <React.Fragment key={key}>
                          {index > 0 && <span className="text-gray-400 text-xs">+</span>}
                          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTutorials = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Tutoriels interactifs</h3>
        <p className="text-gray-600 text-sm">
          Apprenez à utiliser ScolarFlow avec nos tutoriels guidés.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TUTORIALS.map(tutorial => (
          <div key={tutorial.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-medium text-gray-900">{tutorial.title}</h4>
              <span className={cn(
                'px-2 py-1 text-xs rounded-full',
                tutorial.difficulty === 'Débutant' ? 'bg-green-100 text-green-800' :
                tutorial.difficulty === 'Intermédiaire' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              )}>
                {tutorial.difficulty}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{tutorial.description}</p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">⏱️ {tutorial.duration}</span>
              
              <button
                onClick={() => setActiveTutorial(tutorial.id)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Commencer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'guide':
        return <UserGuide compact={modal} />;
      case 'faq':
        return <FAQ compact={modal} />;
      case 'tutorials':
        return renderTutorials();
      case 'shortcuts':
        return renderShortcuts();
      case 'diagnostics':
        return <SystemDiagnostics />;
      default:
        return null;
    }
  };

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  const content = (
    <div className={cn(
      'flex h-full bg-white',
      modal ? 'rounded-lg shadow-xl' : '',
      className
    )}>
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Centre d'aide</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {/* Recherche globale */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher de l'aide..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {sections.map(section => {
              const IconComponent = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full p-3 rounded-lg text-left transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'hover:bg-gray-100 text-gray-700'
                  )}
                >
                  <div className="flex items-start">
                    <IconComponent className={cn(
                      'h-5 w-5 mt-0.5 mr-3 flex-shrink-0',
                      isActive ? 'text-blue-600' : 'text-gray-400'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{section.title}</div>
                      <div className={cn(
                        'text-xs mt-1',
                        isActive ? 'text-blue-700' : 'text-gray-500'
                      )}>
                        {section.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>

      {/* Tutoriel interactif */}
      {activeTutorial && (
        <InteractiveTutorial
          steps={TUTORIALS.find(t => t.id === activeTutorial)?.steps || []}
          onComplete={() => setActiveTutorial(null)}
          onSkip={() => setActiveTutorial(null)}
        />
      )}
    </div>
  );

  if (modal) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
          <div className="relative w-full max-w-6xl h-[80vh]">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
};

export default HelpCenter;
