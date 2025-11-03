// ========================================
// KEYBOARD SHORTCUTS - GUIDE DES RACCOURCIS CLAVIER
// ========================================

import React from 'react';
import { cn } from '../../../utils/classNames';

/**
 * Props du composant KeyboardShortcuts
 */
interface KeyboardShortcutsProps {
  onClose: () => void;
  className?: string;
}

/**
 * Interface pour définir un raccourci clavier
 */
interface Shortcut {
  keys: string[];
  description: string;
  category: 'navigation' | 'edition' | 'global';
}

/**
 * Liste complète des raccourcis clavier
 */
const SHORTCUTS: Shortcut[] = [
  // Navigation
  {
    keys: ['Tab'],
    description: 'Cellule suivante (horizontale)',
    category: 'navigation'
  },
  {
    keys: ['Shift', 'Tab'],
    description: 'Cellule précédente',
    category: 'navigation'
  },
  {
    keys: ['Enter'],
    description: 'Ligne suivante (même colonne)',
    category: 'navigation'
  },
  {
    keys: ['Shift', 'Enter'],
    description: 'Ligne précédente',
    category: 'navigation'
  },
  {
    keys: ['↑'],
    description: 'Cellule au-dessus',
    category: 'navigation'
  },
  {
    keys: ['↓'],
    description: 'Cellule en-dessous',
    category: 'navigation'
  },
  {
    keys: ['←'],
    description: 'Cellule à gauche',
    category: 'navigation'
  },
  {
    keys: ['→'],
    description: 'Cellule à droite',
    category: 'navigation'
  },
  {
    keys: ['Home'],
    description: 'Début de ligne',
    category: 'navigation'
  },
  {
    keys: ['End'],
    description: 'Fin de ligne',
    category: 'navigation'
  },
  {
    keys: ['Ctrl', 'Home'],
    description: 'Première cellule du tableau',
    category: 'navigation'
  },
  {
    keys: ['Ctrl', 'End'],
    description: 'Dernière cellule du tableau',
    category: 'navigation'
  },
  {
    keys: ['Page Up'],
    description: 'Remonter de 10 lignes',
    category: 'navigation'
  },
  {
    keys: ['Page Down'],
    description: 'Descendre de 10 lignes',
    category: 'navigation'
  },

  // Édition
  {
    keys: ['F2'],
    description: 'Entrer en mode édition',
    category: 'edition'
  },
  {
    keys: ['Escape'],
    description: 'Annuler la saisie actuelle',
    category: 'edition'
  },
  {
    keys: ['Space'],
    description: 'Toggle absent (case sélectionnée)',
    category: 'edition'
  },
  {
    keys: ['Ctrl', 'A'],
    description: 'Sélectionner tout le texte',
    category: 'edition'
  },

  // Actions globales
  {
    keys: ['Ctrl', 'S'],
    description: 'Sauvegarde manuelle',
    category: 'global'
  },
  {
    keys: ['Ctrl', 'Z'],
    description: 'Annuler la dernière action',
    category: 'global'
  },
  {
    keys: ['Ctrl', 'Y'],
    description: 'Rétablir',
    category: 'global'
  },
  {
    keys: ['F1'],
    description: 'Afficher/masquer ce guide',
    category: 'global'
  }
];

/**
 * Composant pour afficher le guide des raccourcis clavier
 */
export const KeyboardShortcuts = React.memo<KeyboardShortcutsProps>(({
  onClose,
  className = ''
}) => {
  // ========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
      case 'F1':
        e.preventDefault();
        onClose();
        break;
    }
  }, [onClose]);

  const handleBackdropClick = React.useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // ========================================
  // UTILITAIRES DE RENDU
  // ========================================

  const renderKeyboardKey = (key: string) => {
    const keyDisplayMap: Record<string, string> = {
      'Ctrl': '⌃',
      'Shift': '⇧',
      'Alt': '⌥',
      'Meta': '⌘',
      'Enter': '↵',
      'Tab': '⇥',
      'Space': '␣',
      'Escape': '⎋',
      'Backspace': '⌫',
      'Delete': '⌦',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'PageUp': 'Page ↑',
      'PageDown': 'Page ↓',
      'Home': '⇱',
      'End': '⇲'
    };

    const displayKey = keyDisplayMap[key] || key;

    return (
      <kbd 
        key={key}
        className={cn(
          'inline-flex items-center justify-center min-w-8 h-6 px-2',
          'text-xs font-mono font-semibold text-gray-700',
          'bg-white border border-gray-300 rounded shadow-sm'
        )}
      >
        {displayKey}
      </kbd>
    );
  };

  const renderShortcut = (shortcut: Shortcut, index: number) => (
    <div 
      key={index} 
      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
    >
      <div className="flex-1 text-sm text-gray-700">
        {shortcut.description}
      </div>
      <div className="flex items-center space-x-1 ml-4">
        {shortcut.keys.map((key, keyIndex) => (
          <React.Fragment key={keyIndex}>
            {keyIndex > 0 && <span className="text-gray-400 text-xs">+</span>}
            {renderKeyboardKey(key)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  // Grouper les raccourcis par catégorie
  const shortcutsByCategory = SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  const categoryTitles = {
    navigation: '🧭 Navigation',
    edition: '✏️ Édition',
    global: '🌐 Actions globales'
  };

  // ========================================
  // RENDU
  // ========================================

  return (
    <div 
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black bg-opacity-50 backdrop-blur-sm',
        className
      )}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div 
        className={cn(
          'relative w-full max-w-2xl max-h-screen mx-4',
          'bg-white rounded-lg shadow-2xl',
          'flex flex-col overflow-hidden'
        )}
        role="document"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 
            id="shortcuts-title"
            className="text-xl font-semibold text-gray-900"
          >
            ⌨️ Raccourcis clavier
          </h2>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-md text-gray-400 hover:text-gray-600',
              'hover:bg-gray-100 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
            aria-label="Fermer le guide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {Object.entries(categoryTitles).map(([category, title]) => (
              <div key={category}>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  {title}
                </h3>
                <div className="space-y-1">
                  {shortcutsByCategory[category]?.map((shortcut, index) => 
                    renderShortcut(shortcut, index)
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Conseils d'utilisation */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              💡 Conseils pour une saisie efficace
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Utilisez <kbd className="text-xs px-1 bg-white border rounded">Tab</kbd> pour naviguer rapidement entre les cellules</li>
              <li>• Les notes peuvent être saisies sous différents formats : 15, 15.5, 15,5, 15/20</li>
              <li>• La sauvegarde automatique se fait toutes les 2 secondes</li>
              <li>• Utilisez <kbd className="text-xs px-1 bg-white border rounded">Escape</kbd> pour annuler une saisie incorrecte</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Appuyez sur <kbd className="text-xs px-1 bg-white border rounded">F1</kbd> pour afficher/masquer ce guide</span>
            <span>Appuyez sur <kbd className="text-xs px-1 bg-white border rounded">Escape</kbd> pour fermer</span>
          </div>
        </div>
      </div>
    </div>
  );
});

KeyboardShortcuts.displayName = 'KeyboardShortcuts';

/**
 * Version compacte pour affichage dans une tooltip
 */
export const QuickShortcutsTooltip = React.memo<{
  visible: boolean;
  onClose: () => void;
}>(({ visible, onClose }) => {
  if (!visible) return null;

  const quickShortcuts = [
    { key: 'Tab', desc: 'Suivant' },
    { key: 'Enter', desc: 'Ligne suivante' },
    { key: 'Escape', desc: 'Annuler' },
    { key: 'Ctrl+S', desc: 'Sauvegarder' }
  ];

  return (
    <div className="absolute top-full right-0 mt-2 z-20 w-48 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
      <div className="text-xs font-semibold text-gray-900 mb-2">Raccourcis rapides</div>
      <div className="space-y-1">
        {quickShortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <span className="text-gray-600">{shortcut.desc}</span>
            <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
              {shortcut.key}
            </kbd>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100">
        <button
          onClick={onClose}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          Appuyez sur F1 pour plus
        </button>
      </div>
    </div>
  );
});

QuickShortcutsTooltip.displayName = 'QuickShortcutsTooltip';

export default KeyboardShortcuts;
