// ========================================
// FAQ - FOIRE AUX QUESTIONS INTERACTIVE
// ========================================

import React, { useState, useMemo } from 'react';
import { 
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  TagIcon,
  ClockIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/classNames';

/**
 * Interface pour une question FAQ
 */
interface FAQItem {
  id: string;
  question: string;
  answer: React.ReactNode;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: Date;
  helpful?: number;
  notHelpful?: number;
  relatedQuestions?: string[];
}

/**
 * Props du composant FAQ
 */
interface FAQProps {
  /** Catégorie à afficher par défaut */
  defaultCategory?: string;
  /** Mode compact */
  compact?: boolean;
  /** Permettre le feedback */
  enableFeedback?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Base de données FAQ
 */
const FAQ_DATA: FAQItem[] = [
  {
    id: 'getting-started-1',
    question: 'Comment créer ma première analyse statistique ?',
    answer: (
      <div className="space-y-3">
        <p>Pour créer votre première analyse :</p>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Cliquez sur <strong>"Nouvelle Analyse"</strong> dans le menu principal</li>
          <li>Donnez un nom à votre analyse et sélectionnez vos classes</li>
          <li>Choisissez la période à analyser (ex: dernier trimestre)</li>
          <li>Sélectionnez les métriques souhaitées (moyenne, médiane, etc.)</li>
          <li>Choisissez le type de graphique adapté</li>
          <li>Cliquez sur <strong>"Créer l'analyse"</strong></li>
        </ol>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-blue-800 text-sm">
            💡 <strong>Conseil :</strong> Commencez par un template prédéfini pour vous familiariser avec le système.
          </p>
        </div>
      </div>
    ),
    category: 'Premiers pas',
    tags: ['débutant', 'création', 'wizard', 'analyse'],
    difficulty: 'beginner',
    lastUpdated: new Date('2024-01-15'),
    helpful: 45,
    notHelpful: 2,
    relatedQuestions: ['templates-1', 'wizard-2']
  },
  
  {
    id: 'templates-1',
    question: 'Qu\'est-ce qu\'un template et comment l\'utiliser ?',
    answer: (
      <div className="space-y-3">
        <p>
          Un template est une configuration d'analyse pré-définie qui vous fait gagner du temps 
          en proposant des paramètres optimisés pour des cas d'usage courants.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-blue-50 p-3 rounded">
            <h4 className="font-semibold text-blue-900">📊 Performance</h4>
            <p className="text-blue-800 text-sm">Analyse des résultats d'évaluations</p>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <h4 className="font-semibold text-green-900">📈 Progression</h4>
            <p className="text-green-800 text-sm">Suivi de l'évolution dans le temps</p>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <h4 className="font-semibold text-purple-900">⚖️ Comparaison</h4>
            <p className="text-purple-800 text-sm">Comparaison entre classes/matières</p>
          </div>
        </div>
        
        <p><strong>Pour utiliser un template :</strong></p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Accédez à la galerie de templates</li>
          <li>Parcourez ou recherchez le template adapté</li>
          <li>Cliquez sur "Utiliser ce template"</li>
          <li>Personnalisez les paramètres si nécessaire</li>
          <li>Générez votre analyse</li>
        </ol>
      </div>
    ),
    category: 'Templates',
    tags: ['template', 'galerie', 'configuration', 'prédéfini'],
    difficulty: 'beginner',
    lastUpdated: new Date('2024-01-20'),
    helpful: 38,
    notHelpful: 1,
    relatedQuestions: ['getting-started-1', 'customization-1']
  },
  
  {
    id: 'wizard-2',
    question: 'Que signifient les différentes métriques statistiques ?',
    answer: (
      <div className="space-y-4">
        <p>Voici les principales métriques disponibles dans ScolarFlow :</p>
        
        <div className="space-y-3">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold text-gray-900">Tendance centrale</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><strong>Moyenne :</strong> Somme des notes divisée par le nombre d'élèves</li>
              <li><strong>Médiane :</strong> Note du milieu quand on classe les résultats</li>
              <li><strong>Mode :</strong> Note la plus fréquente</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-semibold text-gray-900">Dispersion</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><strong>Écart-type :</strong> Mesure la dispersion des notes autour de la moyenne</li>
              <li><strong>Étendue :</strong> Différence entre la note max et min</li>
              <li><strong>Variance :</strong> Carré de l'écart-type</li>
            </ul>
          </div>
          
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-semibold text-gray-900">Position</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><strong>Quartiles :</strong> Divisent les résultats en 4 groupes égaux</li>
              <li><strong>Percentiles :</strong> Position d'un élève par rapport aux autres</li>
              <li><strong>Rang :</strong> Position dans le classement</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-yellow-800 text-sm">
            💡 <strong>Conseil pédagogique :</strong> La médiane est souvent plus représentative que la moyenne 
            quand il y a des notes très éloignées (outliers).
          </p>
        </div>
      </div>
    ),
    category: 'Statistiques',
    tags: ['métriques', 'statistiques', 'moyenne', 'médiane', 'écart-type'],
    difficulty: 'intermediate',
    lastUpdated: new Date('2024-01-25'),
    helpful: 52,
    notHelpful: 3,
    relatedQuestions: ['analysis-types-1', 'interpretation-1']
  },
  
  {
    id: 'charts-1',
    question: 'Quel type de graphique choisir pour mon analyse ?',
    answer: (
      <div className="space-y-4">
        <p>Le choix du graphique dépend de ce que vous voulez montrer :</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">📊 Graphique en barres</h4>
            <p className="text-blue-800 text-sm mb-2">
              <strong>Idéal pour :</strong> Comparer des catégories
            </p>
            <ul className="text-blue-700 text-xs space-y-1">
              <li>• Résultats par matière</li>
              <li>• Comparaison entre classes</li>
              <li>• Distribution des notes par tranche</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">📈 Graphique en courbes</h4>
            <p className="text-green-800 text-sm mb-2">
              <strong>Idéal pour :</strong> Montrer l'évolution
            </p>
            <ul className="text-green-700 text-xs space-y-1">
              <li>• Progression dans le temps</li>
              <li>• Évolution des moyennes</li>
              <li>• Tendances saisonnières</li>
            </ul>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">🥧 Graphique en secteurs</h4>
            <p className="text-purple-800 text-sm mb-2">
              <strong>Idéal pour :</strong> Montrer des proportions
            </p>
            <ul className="text-purple-700 text-xs space-y-1">
              <li>• Répartition des niveaux</li>
              <li>• Pourcentage de réussite</li>
              <li>• Distribution des mentions</li>
            </ul>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-semibold text-orange-900 mb-2">🕸️ Graphique radar</h4>
            <p className="text-orange-800 text-sm mb-2">
              <strong>Idéal pour :</strong> Profils multidimensionnels
            </p>
            <ul className="text-orange-700 text-xs space-y-1">
              <li>• Compétences par domaine</li>
              <li>• Profil d'un élève</li>
              <li>• Comparaison multi-critères</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-gray-700 text-sm">
            <strong>Règle générale :</strong> Commencez par des barres pour les comparaisons simples, 
            utilisez les courbes pour les évolutions temporelles, et les secteurs pour les proportions.
          </p>
        </div>
      </div>
    ),
    category: 'Visualisation',
    tags: ['graphiques', 'visualisation', 'barres', 'courbes', 'secteurs'],
    difficulty: 'beginner',
    lastUpdated: new Date('2024-02-01'),
    helpful: 41,
    notHelpful: 2,
    relatedQuestions: ['export-1', 'customization-2']
  },
  
  {
    id: 'export-1',
    question: 'Comment exporter mes analyses en PDF ?',
    answer: (
      <div className="space-y-3">
        <p>ScolarFlow propose plusieurs options d'export :</p>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">🚀 Export rapide</h4>
          <ol className="list-decimal list-inside text-blue-800 text-sm space-y-1">
            <li>Cliquez sur l'icône PDF à côté de votre graphique</li>
            <li>Le fichier se télécharge automatiquement</li>
            <li>Ouvrez-le avec votre lecteur PDF</li>
          </ol>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">📋 Rapport avancé</h4>
          <ol className="list-decimal list-inside text-green-800 text-sm space-y-1">
            <li>Cliquez sur "Générer un rapport"</li>
            <li>Choisissez le template de rapport</li>
            <li>Sélectionnez les sections à inclure</li>
            <li>Personnalisez la mise en page</li>
            <li>Téléchargez le rapport complet</li>
          </ol>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900">Options disponibles :</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>Qualité :</strong> Standard ou Haute résolution</li>
            <li>• <strong>Format :</strong> A4, A3, ou personnalisé</li>
            <li>• <strong>Orientation :</strong> Portrait ou paysage</li>
            <li>• <strong>Anonymat :</strong> Masquer les noms des élèves</li>
          </ul>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-yellow-800 text-sm">
            💡 <strong>Astuce :</strong> Utilisez la haute résolution pour les documents officiels 
            et la qualité standard pour un partage rapide.
          </p>
        </div>
      </div>
    ),
    category: 'Export',
    tags: ['export', 'pdf', 'rapport', 'téléchargement'],
    difficulty: 'beginner',
    lastUpdated: new Date('2024-02-05'),
    helpful: 33,
    notHelpful: 1,
    relatedQuestions: ['charts-1', 'sharing-1']
  },
  
  {
    id: 'performance-1',
    question: 'Pourquoi mon analyse est-elle lente à se générer ?',
    answer: (
      <div className="space-y-4">
        <p>Plusieurs facteurs peuvent affecter les performances :</p>
        
        <div className="space-y-3">
          <div className="bg-red-50 p-3 rounded-lg">
            <h4 className="font-semibold text-red-900">🔍 Causes possibles</h4>
            <ul className="text-red-800 text-sm space-y-1">
              <li>• Volume de données important (>1000 évaluations)</li>
              <li>• Période d'analyse très large (>1 an)</li>
              <li>• Connexion internet lente</li>
              <li>• Navigateur surchargé (trop d'onglets)</li>
              <li>• Cache plein ou corrompu</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-semibold text-green-900">✅ Solutions</h4>
            <ul className="text-green-800 text-sm space-y-1">
              <li>• Réduisez la période d'analyse (3-6 mois max)</li>
              <li>• Fermez les onglets inutiles</li>
              <li>• Videz le cache du navigateur</li>
              <li>• Utilisez une connexion plus stable</li>
              <li>• Essayez en mode navigation privée</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-semibold text-blue-900">⚡ Optimisations automatiques</h4>
          <p className="text-blue-800 text-sm">
            ScolarFlow optimise automatiquement les performances avec :
          </p>
          <ul className="text-blue-700 text-sm space-y-1 mt-2">
            <li>• Mise en cache des résultats récents</li>
            <li>• Traitement par lots des gros volumes</li>
            <li>• Compression des données</li>
            <li>• Calculs en arrière-plan</li>
          </ul>
        </div>
        
        <div className="bg-gray-100 p-3 rounded-lg">
          <p className="text-gray-700 text-sm">
            <strong>Temps de traitement indicatifs :</strong><br/>
            • 1-100 évaluations : &lt;5 secondes<br/>
            • 100-500 évaluations : 5-15 secondes<br/>
            • 500-1000 évaluations : 15-30 secondes<br/>
            • &gt;1000 évaluations : 30-60 secondes
          </p>
        </div>
      </div>
    ),
    category: 'Performance',
    tags: ['performance', 'lenteur', 'optimisation', 'cache'],
    difficulty: 'intermediate',
    lastUpdated: new Date('2024-02-10'),
    helpful: 28,
    notHelpful: 4,
    relatedQuestions: ['troubleshooting-1', 'data-volume-1']
  },
  
  {
    id: 'troubleshooting-1',
    question: 'Les graphiques ne s\'affichent pas, que faire ?',
    answer: (
      <div className="space-y-4">
        <p>Si vos graphiques ne s'affichent pas, suivez ces étapes de dépannage :</p>
        
        <div className="space-y-3">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
            <h4 className="font-semibold text-yellow-900">🔧 Vérifications de base</h4>
            <ol className="list-decimal list-inside text-yellow-800 text-sm space-y-1 mt-2">
              <li>Actualisez la page (Ctrl+F5 ou Cmd+R)</li>
              <li>Vérifiez que JavaScript est activé</li>
              <li>Désactivez temporairement les bloqueurs de pub</li>
              <li>Essayez en navigation privée</li>
            </ol>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
            <h4 className="font-semibold text-blue-900">🌐 Compatibilité navigateur</h4>
            <p className="text-blue-800 text-sm mb-2">Navigateurs recommandés :</p>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Chrome 90+ ✅</li>
              <li>• Firefox 88+ ✅</li>
              <li>• Safari 14+ ✅</li>
              <li>• Edge 90+ ✅</li>
            </ul>
          </div>
          
          <div className="bg-red-50 border-l-4 border-red-400 p-3">
            <h4 className="font-semibold text-red-900">🚨 Si le problème persiste</h4>
            <ol className="list-decimal list-inside text-red-800 text-sm space-y-1 mt-2">
              <li>Videz le cache et les cookies</li>
              <li>Mettez à jour votre navigateur</li>
              <li>Vérifiez votre connexion internet</li>
              <li>Contactez l'administrateur système</li>
            </ol>
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-semibold text-gray-900">🔍 Diagnostic automatique</h4>
          <p className="text-gray-700 text-sm">
            ScolarFlow inclut un outil de diagnostic qui vérifie automatiquement :
          </p>
          <ul className="text-gray-600 text-sm space-y-1 mt-2">
            <li>• Compatibilité du navigateur</li>
            <li>• Disponibilité de JavaScript</li>
            <li>• Connectivité réseau</li>
            <li>• État du cache</li>
          </ul>
          <p className="text-gray-700 text-sm mt-2">
            Accédez-y via <strong>Menu → Aide → Diagnostic</strong>
          </p>
        </div>
      </div>
    ),
    category: 'Dépannage',
    tags: ['dépannage', 'graphiques', 'affichage', 'navigateur'],
    difficulty: 'intermediate',
    lastUpdated: new Date('2024-02-12'),
    helpful: 22,
    notHelpful: 2,
    relatedQuestions: ['performance-1', 'browser-support-1']
  }
];

/**
 * Catégories disponibles
 */
const CATEGORIES = [
  'Tous',
  'Premiers pas',
  'Templates',
  'Statistiques',
  'Visualisation',
  'Export',
  'Performance',
  'Dépannage'
];

/**
 * Composant FAQ principal
 */
export const FAQ: React.FC<FAQProps> = ({
  defaultCategory = 'Tous',
  compact = false,
  enableFeedback = true,
  className
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Record<string, 'helpful' | 'not-helpful'>>({});

  // ========================================
  // DONNÉES FILTRÉES
  // ========================================

  const filteredFAQ = useMemo(() => {
    let filtered = FAQ_DATA;

    // Filtre par catégorie
    if (selectedCategory !== 'Tous') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.question.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (typeof item.answer === 'string' && item.answer.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery]);

  // ========================================
  // GESTION DES ACTIONS
  // ========================================

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleFeedback = (itemId: string, type: 'helpful' | 'not-helpful') => {
    setFeedback(prev => ({
      ...prev,
      [itemId]: type
    }));
    
    // Ici, vous pourriez envoyer le feedback à votre API
    console.log(`Feedback pour ${itemId}: ${type}`);
  };

  // ========================================
  // RENDU DES COMPOSANTS
  // ========================================

  const renderFAQItem = (item: FAQItem) => {
    const isExpanded = expandedItems.has(item.id);
    const userFeedback = feedback[item.id];

    return (
      <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Question */}
        <button
          onClick={() => toggleExpanded(item.id)}
          className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <h3 className={cn(
                'font-medium text-gray-900',
                compact ? 'text-sm' : 'text-base'
              )}>
                {item.question}
              </h3>
              
              <div className="flex items-center mt-2 space-x-3">
                <span className={cn(
                  'px-2 py-1 text-xs rounded-full',
                  item.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                  item.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                )}>
                  {item.difficulty === 'beginner' ? 'Débutant' :
                   item.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
                </span>
                
                <span className="text-xs text-gray-500 flex items-center">
                  <TagIcon className="h-3 w-3 mr-1" />
                  {item.category}
                </span>
                
                <span className="text-xs text-gray-500 flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {item.lastUpdated.toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </div>
        </button>

        {/* Réponse */}
        {isExpanded && (
          <div className="px-4 pb-4 bg-gray-50">
            <div className="pt-4 border-t border-gray-200">
              <div className={cn(
                'text-gray-700',
                compact ? 'text-sm' : 'text-base'
              )}>
                {item.answer}
              </div>

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Feedback */}
              {enableFeedback && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Cette réponse vous a-t-elle été utile ?
                    </span>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleFeedback(item.id, 'helpful')}
                        className={cn(
                          'flex items-center px-3 py-1 text-sm rounded transition-colors',
                          userFeedback === 'helpful'
                            ? 'bg-green-100 text-green-800'
                            : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                        )}
                      >
                        <HandThumbUpIcon className="h-4 w-4 mr-1" />
                        Oui ({item.helpful || 0})
                      </button>
                      
                      <button
                        onClick={() => handleFeedback(item.id, 'not-helpful')}
                        className={cn(
                          'flex items-center px-3 py-1 text-sm rounded transition-colors',
                          userFeedback === 'not-helpful'
                            ? 'bg-red-100 text-red-800'
                            : 'text-gray-600 hover:bg-red-50 hover:text-red-700'
                        )}
                      >
                        <HandThumbDownIcon className="h-4 w-4 mr-1" />
                        Non ({item.notHelpful || 0})
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions liées */}
              {item.relatedQuestions && item.relatedQuestions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Questions liées :
                  </h4>
                  <div className="space-y-1">
                    {item.relatedQuestions.map(relatedId => {
                      const relatedItem = FAQ_DATA.find(faq => faq.id === relatedId);
                      if (!relatedItem) return null;
                      
                      return (
                        <button
                          key={relatedId}
                          onClick={() => toggleExpanded(relatedId)}
                          className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {relatedItem.question}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h1 className={cn(
          'font-bold text-gray-900 mb-2',
          compact ? 'text-xl' : 'text-3xl'
        )}>
          Foire aux Questions
        </h1>
        <p className={cn(
          'text-gray-600',
          compact ? 'text-sm' : 'text-lg'
        )}>
          Trouvez rapidement les réponses à vos questions sur ScolarFlow
        </p>
      </div>

      {/* Recherche */}
      <div className="relative max-w-md mx-auto">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une question..."
          className={cn(
            'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            compact ? 'text-sm' : ''
          )}
        />
      </div>

      {/* Filtres par catégorie */}
      <div className="flex flex-wrap justify-center gap-2">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Résultats */}
      <div className="max-w-4xl mx-auto">
        {filteredFAQ.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              {filteredFAQ.length} question{filteredFAQ.length > 1 ? 's' : ''} trouvée{filteredFAQ.length > 1 ? 's' : ''}
            </div>
            
            {filteredFAQ.map(renderFAQItem)}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune question trouvée
            </h3>
            <p className="text-gray-600">
              Essayez de modifier vos critères de recherche ou de sélectionner une autre catégorie.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQ;
