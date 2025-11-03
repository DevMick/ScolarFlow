// ========================================
// CONTEXTUAL HELP - AIDE CONTEXTUELLE
// ========================================

import React, { useState, useEffect } from 'react';
import { 
  QuestionMarkCircleIcon, 
  XMarkIcon,
  LightBulbIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/classNames';

/**
 * Types d'aide contextuelle
 */
type HelpType = 'info' | 'tip' | 'warning' | 'tutorial';

/**
 * Interface pour le contenu d'aide
 */
interface HelpContent {
  id: string;
  type: HelpType;
  title: string;
  content: React.ReactNode;
  actions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
  dismissible?: boolean;
  autoShow?: boolean;
  showOnce?: boolean;
}

/**
 * Props du composant ContextualHelp
 */
interface ContextualHelpProps {
  /** Contexte actuel pour déterminer l'aide à afficher */
  context: string;
  /** Position du tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Décalage par rapport à l'élément parent */
  offset?: number;
  /** Afficher automatiquement */
  autoShow?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Base de données d'aide contextuelle
 */
const HELP_DATABASE: Record<string, HelpContent[]> = {
  'wizard-step-1': [
    {
      id: 'wizard-sources-help',
      type: 'info',
      title: 'Configuration des sources de données',
      content: (
        <div className="space-y-3">
          <p>Cette étape vous permet de définir les données à analyser :</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Nom :</strong> Donnez un nom descriptif à votre analyse</li>
            <li><strong>Classes :</strong> Sélectionnez une ou plusieurs classes</li>
            <li><strong>Période :</strong> Définissez la plage de dates à analyser</li>
            <li><strong>Filtres :</strong> Affinez votre sélection par matière ou type</li>
          </ul>
        </div>
      ),
      dismissible: true
    },
    {
      id: 'wizard-validation-tip',
      type: 'tip',
      title: 'Conseil de validation',
      content: (
        <p>
          Assurez-vous de sélectionner au moins une classe et de donner un nom à votre analyse 
          avant de passer à l'étape suivante.
        </p>
      ),
      dismissible: true
    }
  ],
  
  'wizard-step-2': [
    {
      id: 'analysis-types-help',
      type: 'info',
      title: 'Types d\'analyse disponibles',
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-blue-50 p-3 rounded">
              <strong className="text-blue-900">Analyse de base :</strong>
              <p className="text-blue-800 text-sm">Statistiques descriptives simples (moyenne, médiane, etc.)</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <strong className="text-green-900">Analyse comparative :</strong>
              <p className="text-green-800 text-sm">Compare différents groupes avec tests statistiques</p>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <strong className="text-purple-900">Analyse temporelle :</strong>
              <p className="text-purple-800 text-sm">Suit l'évolution dans le temps avec tendances</p>
            </div>
          </div>
        </div>
      ),
      dismissible: true
    }
  ],
  
  'wizard-step-3': [
    {
      id: 'visualization-help',
      type: 'info',
      title: 'Choisir le bon type de graphique',
      content: (
        <div className="space-y-3">
          <p>Chaque type de graphique convient à différents usages :</p>
          <div className="space-y-2 text-sm">
            <div><strong>📊 Barres :</strong> Comparer des catégories</div>
            <div><strong>📈 Courbes :</strong> Montrer l'évolution dans le temps</div>
            <div><strong>🥧 Camembert :</strong> Afficher des proportions</div>
            <div><strong>🕸️ Radar :</strong> Comparer plusieurs dimensions</div>
            <div><strong>🔵 Nuage :</strong> Montrer des corrélations</div>
          </div>
        </div>
      ),
      dismissible: true
    },
    {
      id: 'color-scheme-tip',
      type: 'tip',
      title: 'Conseil couleurs',
      content: (
        <p>
          Choisissez des couleurs contrastées pour une meilleure lisibilité, 
          surtout si vous prévoyez d'imprimer vos graphiques.
        </p>
      ),
      dismissible: true
    }
  ],
  
  'template-gallery': [
    {
      id: 'template-benefits',
      type: 'info',
      title: 'Avantages des templates',
      content: (
        <div className="space-y-3">
          <p>Les templates vous font gagner du temps en proposant des configurations optimisées :</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Paramètres pré-configurés pour des cas d'usage courants</li>
            <li>Métriques adaptées au contexte pédagogique</li>
            <li>Visualisations optimales pour chaque type d'analyse</li>
            <li>Personnalisation possible selon vos besoins</li>
          </ul>
        </div>
      ),
      dismissible: true
    },
    {
      id: 'template-customization',
      type: 'tip',
      title: 'Personnalisation',
      content: (
        <p>
          Vous pouvez modifier tous les paramètres d'un template avant de l'utiliser. 
          Vos modifications peuvent être sauvegardées comme nouveau template personnel.
        </p>
      ),
      dismissible: true
    }
  ],
  
  'chart-display': [
    {
      id: 'chart-interaction',
      type: 'info',
      title: 'Interagir avec les graphiques',
      content: (
        <div className="space-y-3">
          <p>Vos graphiques sont interactifs :</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Survolez les éléments pour voir les détails</li>
            <li>Cliquez sur la légende pour masquer/afficher des séries</li>
            <li>Utilisez la molette pour zoomer (si disponible)</li>
            <li>Clic droit pour accéder aux options d'export</li>
          </ul>
        </div>
      ),
      dismissible: true
    },
    {
      id: 'anonymous-mode',
      type: 'tip',
      title: 'Mode anonyme',
      content: (
        <p>
          Activez le mode anonyme pour masquer les noms des élèves lors de 
          présentations en classe ou de partage avec des tiers.
        </p>
      ),
      dismissible: true
    }
  ],
  
  'export-options': [
    {
      id: 'export-formats',
      type: 'info',
      title: 'Choisir le bon format d\'export',
      content: (
        <div className="space-y-3">
          <div className="space-y-2 text-sm">
            <div><strong>🖼️ PNG/JPEG :</strong> Pour les présentations et documents</div>
            <div><strong>📄 PDF :</strong> Pour l'impression et l'archivage</div>
            <div><strong>📊 CSV :</strong> Pour les analyses dans Excel/Calc</div>
            <div><strong>📋 JSON :</strong> Pour les développeurs et intégrations</div>
          </div>
        </div>
      ),
      dismissible: true
    },
    {
      id: 'quality-settings',
      type: 'tip',
      title: 'Réglages de qualité',
      content: (
        <p>
          Utilisez "Haute qualité" pour les documents officiels et "Standard" 
          pour un partage rapide. La haute qualité produit des fichiers plus volumineux.
        </p>
      ),
      dismissible: true
    }
  ],
  
  'performance-monitor': [
    {
      id: 'performance-metrics',
      type: 'info',
      title: 'Métriques de performance',
      content: (
        <div className="space-y-3">
          <p>Le moniteur affiche des informations sur les performances :</p>
          <div className="space-y-2 text-sm">
            <div><strong>FPS :</strong> Fluidité de l'affichage (60 = optimal)</div>
            <div><strong>Mémoire :</strong> Utilisation de la RAM du navigateur</div>
            <div><strong>Cache :</strong> Efficacité du système de cache</div>
            <div><strong>Réseau :</strong> Qualité de votre connexion</div>
          </div>
        </div>
      ),
      dismissible: true
    },
    {
      id: 'performance-tips',
      type: 'tip',
      title: 'Optimiser les performances',
      content: (
        <p>
          Pour de meilleures performances, fermez les onglets inutiles, 
          limitez les périodes d'analyse et utilisez le cache en gardant 
          les analyses récentes ouvertes.
        </p>
      ),
      dismissible: true
    }
  ]
};

/**
 * Hook pour gérer l'aide contextuelle
 */
export const useContextualHelp = (context: string) => {
  const [dismissedHelp, setDismissedHelp] = useState<Set<string>>(
    new Set(JSON.parse(localStorage.getItem('dismissedHelp') || '[]'))
  );

  const dismissHelp = (helpId: string) => {
    const newDismissed = new Set(dismissedHelp);
    newDismissed.add(helpId);
    setDismissedHelp(newDismissed);
    localStorage.setItem('dismissedHelp', JSON.stringify([...newDismissed]));
  };

  const resetHelp = () => {
    setDismissedHelp(new Set());
    localStorage.removeItem('dismissedHelp');
  };

  const getAvailableHelp = (): HelpContent[] => {
    const contextHelp = HELP_DATABASE[context] || [];
    return contextHelp.filter(help => 
      !help.showOnce || !dismissedHelp.has(help.id)
    );
  };

  return {
    availableHelp: getAvailableHelp(),
    dismissHelp,
    resetHelp,
    isDismissed: (helpId: string) => dismissedHelp.has(helpId)
  };
};

/**
 * Composant d'aide contextuelle
 */
export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  context,
  position = 'bottom',
  offset = 8,
  autoShow = false,
  className
}) => {
  const [isVisible, setIsVisible] = useState(autoShow);
  const [activeHelpIndex, setActiveHelpIndex] = useState(0);
  const { availableHelp, dismissHelp } = useContextualHelp(context);

  useEffect(() => {
    if (autoShow && availableHelp.length > 0) {
      setIsVisible(true);
    }
  }, [autoShow, availableHelp.length]);

  if (availableHelp.length === 0) {
    return null;
  }

  const currentHelp = availableHelp[activeHelpIndex];
  if (!currentHelp) {
    return null;
  }

  const getIcon = (type: HelpType) => {
    switch (type) {
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-600" />;
      case 'tip':
        return <LightBulbIcon className="h-5 w-5 text-yellow-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />;
      case 'tutorial':
        return <QuestionMarkCircleIcon className="h-5 w-5 text-purple-600" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBackgroundColor = (type: HelpType) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'tip':
        return 'bg-yellow-50 border-yellow-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'tutorial':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleDismiss = () => {
    if (currentHelp.dismissible) {
      dismissHelp(currentHelp.id);
      if (activeHelpIndex < availableHelp.length - 1) {
        setActiveHelpIndex(prev => prev + 1);
      } else {
        setIsVisible(false);
      }
    }
  };

  const handleNext = () => {
    if (activeHelpIndex < availableHelp.length - 1) {
      setActiveHelpIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (activeHelpIndex > 0) {
      setActiveHelpIndex(prev => prev - 1);
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={cn(
          'inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg',
          className
        )}
        title="Afficher l'aide"
      >
        <QuestionMarkCircleIcon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className={cn(
      'relative z-50',
      className
    )}>
      <div className={cn(
        'max-w-sm p-4 rounded-lg border shadow-lg',
        getBackgroundColor(currentHelp.type)
      )}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            {getIcon(currentHelp.type)}
            <h4 className="ml-2 font-medium text-gray-900">
              {currentHelp.title}
            </h4>
          </div>
          
          {currentHelp.dismissible && (
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Contenu */}
        <div className="text-gray-700 text-sm mb-4">
          {currentHelp.content}
        </div>

        {/* Actions */}
        {currentHelp.actions && (
          <div className="flex space-x-2 mb-3">
            {currentHelp.actions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={cn(
                  'px-3 py-1 text-xs rounded transition-colors',
                  action.primary
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Navigation */}
        {availableHelp.length > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex space-x-1">
              {availableHelp.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-2 h-2 rounded-full',
                    index === activeHelpIndex ? 'bg-blue-600' : 'bg-gray-300'
                  )}
                />
              ))}
            </div>
            
            <div className="flex space-x-2">
              {activeHelpIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  Précédent
                </button>
              )}
              
              {activeHelpIndex < availableHelp.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Suivant
                </button>
              ) : (
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Composant d'aide flottante
 */
interface FloatingHelpProps {
  context: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const FloatingHelp: React.FC<FloatingHelpProps> = ({
  context,
  children,
  position = 'top',
  className
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const { availableHelp } = useContextualHelp(context);

  if (availableHelp.length === 0) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        onMouseEnter={() => setShowHelp(true)}
        onMouseLeave={() => setShowHelp(false)}
      >
        {children}
      </div>
      
      {showHelp && (
        <div className={cn(
          'absolute z-50 pointer-events-none',
          position === 'top' && 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
          position === 'bottom' && 'top-full left-1/2 transform -translate-x-1/2 mt-2',
          position === 'left' && 'right-full top-1/2 transform -translate-y-1/2 mr-2',
          position === 'right' && 'left-full top-1/2 transform -translate-y-1/2 ml-2'
        )}>
          <ContextualHelp
            context={context}
            position={position}
            autoShow={true}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Composant de tutoriel interactif
 */
interface InteractiveTutorialProps {
  steps: Array<{
    target: string;
    content: HelpContent;
    position?: 'top' | 'bottom' | 'left' | 'right';
  }>;
  onComplete?: () => void;
  onSkip?: () => void;
}

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  steps,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsActive(false);
      onComplete?.();
    }
  };

  const handleSkip = () => {
    setIsActive(false);
    onSkip?.();
  };

  if (!isActive || steps.length === 0) {
    return null;
  }

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      {/* Tutorial content */}
      <div className="relative h-full flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 pointer-events-auto">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentStepData.content.title}
            </h3>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mb-6">
            {currentStepData.content.content}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Étape {currentStep + 1} sur {steps.length}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Passer
              </button>
              
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                {currentStep < steps.length - 1 ? 'Suivant' : 'Terminer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextualHelp;
