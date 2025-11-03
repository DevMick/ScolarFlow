// ========================================
// USER GUIDE - GUIDE UTILISATEUR INTERACTIF
// ========================================

import React, { useState, useEffect } from 'react';
import { 
  BookOpenIcon, 
  PlayIcon, 
  ChevronRightIcon,
  ChevronDownIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/classNames';

/**
 * Structure d'une section du guide
 */
interface GuideSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  subsections: GuideSubsection[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
}

interface GuideSubsection {
  id: string;
  title: string;
  content: React.ReactNode;
  type: 'text' | 'steps' | 'tips' | 'warning' | 'example';
  interactive?: boolean;
}

/**
 * Props du composant UserGuide
 */
interface UserGuideProps {
  /** Section à afficher par défaut */
  defaultSection?: string;
  /** Mode compact */
  compact?: boolean;
  /** Callback de fermeture */
  onClose?: () => void;
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Contenu du guide utilisateur
 */
const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'getting-started',
    title: 'Premiers pas',
    description: 'Découvrez les bases d\'ScolarFlow et créez votre première analyse',
    icon: PlayIcon,
    difficulty: 'beginner',
    estimatedTime: '10 min',
    subsections: [
      {
        id: 'overview',
        title: 'Vue d\'ensemble d\'ScolarFlow',
        type: 'text',
        content: (
          <div className="space-y-4">
            <p>
              ScolarFlow est un système d'analyse statistique conçu spécialement pour les enseignants. 
              Il vous permet de créer des analyses personnalisées de vos évaluations et d'obtenir 
              des insights pédagogiques précieux.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Principales fonctionnalités :</h4>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>Assistant de création d'analyses guidé</li>
                <li>Templates prêts à l'emploi pour différents contextes</li>
                <li>Graphiques interactifs et personnalisables</li>
                <li>Export PDF professionnel pour les rapports</li>
                <li>Analyses de performance et de progression</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'first-analysis',
        title: 'Créer votre première analyse',
        type: 'steps',
        content: (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-900">Étape 1 : Accéder au wizard</h4>
                  <p className="text-green-800 mt-1">
                    Cliquez sur "Nouvelle Analyse" dans le menu principal pour ouvrir l'assistant de création.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-900">Étape 2 : Configurer les sources</h4>
                  <p className="text-green-800 mt-1">
                    Donnez un nom à votre analyse, sélectionnez vos classes et définissez la période à analyser.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-900">Étape 3 : Choisir les métriques</h4>
                  <p className="text-green-800 mt-1">
                    Sélectionnez les statistiques que vous souhaitez calculer (moyenne, médiane, etc.).
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-900">Étape 4 : Personnaliser l'affichage</h4>
                  <p className="text-green-800 mt-1">
                    Choisissez le type de graphique et les couleurs qui conviennent le mieux à votre analyse.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'navigation-tips',
        title: 'Conseils de navigation',
        type: 'tips',
        content: (
          <div className="space-y-3">
            <div className="flex items-start">
              <LightBulbIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Raccourcis clavier</h4>
                <p className="text-gray-600 text-sm">
                  Utilisez Tab pour naviguer entre les champs, Entrée pour valider, Échap pour fermer les modals.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <LightBulbIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Sauvegarde automatique</h4>
                <p className="text-gray-600 text-sm">
                  Vos configurations sont automatiquement sauvegardées pendant que vous travaillez.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <LightBulbIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Mode hors ligne</h4>
                <p className="text-gray-600 text-sm">
                  Les analyses récentes restent accessibles même sans connexion internet.
                </p>
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'templates',
    title: 'Utiliser les templates',
    description: 'Gagnez du temps avec nos templates prêts à l\'emploi',
    icon: BookOpenIcon,
    difficulty: 'beginner',
    estimatedTime: '5 min',
    subsections: [
      {
        id: 'template-overview',
        title: 'Qu\'est-ce qu\'un template ?',
        type: 'text',
        content: (
          <div className="space-y-4">
            <p>
              Les templates sont des configurations d'analyse pré-définies pour des cas d'usage 
              pédagogiques courants. Ils vous permettent de créer rapidement des analyses 
              pertinentes sans avoir à configurer tous les paramètres manuellement.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📊 Performance</h4>
                <p className="text-blue-800 text-sm">
                  Analysez les résultats de vos évaluations avec des statistiques détaillées.
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">📈 Progression</h4>
                <p className="text-green-800 text-sm">
                  Suivez l'évolution des performances de vos élèves dans le temps.
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">⚖️ Comparaison</h4>
                <p className="text-purple-800 text-sm">
                  Comparez les performances entre classes, matières ou périodes.
                </p>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'using-templates',
        title: 'Comment utiliser un template',
        type: 'steps',
        content: (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Parcourir la galerie</h4>
                  <p className="text-blue-800 mt-1">
                    Accédez à la galerie de templates depuis le menu principal ou lors de la création d'une analyse.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Filtrer et rechercher</h4>
                  <p className="text-blue-800 mt-1">
                    Utilisez les filtres par catégorie ou la barre de recherche pour trouver le template adapté.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Personnaliser</h4>
                  <p className="text-blue-800 mt-1">
                    Ajustez les paramètres du template selon vos besoins (classes, période, options).
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Générer l'analyse</h4>
                  <p className="text-blue-800 mt-1">
                    Cliquez sur "Utiliser ce template" pour créer votre analyse personnalisée.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'template-customization',
        title: 'Personnalisation avancée',
        type: 'tips',
        content: (
          <div className="space-y-3">
            <div className="flex items-start">
              <LightBulbIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Sauvegardez vos personnalisations</h4>
                <p className="text-gray-600 text-sm">
                  Après avoir modifié un template, vous pouvez le sauvegarder comme nouveau template personnel.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <LightBulbIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Partagez avec vos collègues</h4>
                <p className="text-gray-600 text-sm">
                  Les templates publics peuvent être utilisés par tous les enseignants de l'établissement.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <LightBulbIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Organisez avec des tags</h4>
                <p className="text-gray-600 text-sm">
                  Utilisez des tags pour organiser et retrouver facilement vos templates favoris.
                </p>
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'analysis-types',
    title: 'Types d\'analyses',
    description: 'Comprenez les différents types d\'analyses disponibles',
    icon: ChevronRightIcon,
    difficulty: 'intermediate',
    estimatedTime: '15 min',
    subsections: [
      {
        id: 'performance-analysis',
        title: 'Analyse de performance',
        type: 'example',
        content: (
          <div className="space-y-4">
            <p>
              L'analyse de performance vous permet d'évaluer les résultats de vos élèves 
              avec des statistiques détaillées et des comparaisons.
            </p>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Métriques disponibles :</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Tendance centrale :</strong>
                  <ul className="list-disc list-inside mt-1 text-gray-600">
                    <li>Moyenne arithmétique</li>
                    <li>Médiane</li>
                    <li>Mode</li>
                  </ul>
                </div>
                <div>
                  <strong>Dispersion :</strong>
                  <ul className="list-disc list-inside mt-1 text-gray-600">
                    <li>Écart-type</li>
                    <li>Variance</li>
                    <li>Étendue (min-max)</li>
                  </ul>
                </div>
                <div>
                  <strong>Position :</strong>
                  <ul className="list-disc list-inside mt-1 text-gray-600">
                    <li>Quartiles (Q1, Q3)</li>
                    <li>Percentiles</li>
                    <li>Rang centile</li>
                  </ul>
                </div>
                <div>
                  <strong>Distribution :</strong>
                  <ul className="list-disc list-inside mt-1 text-gray-600">
                    <li>Asymétrie (skewness)</li>
                    <li>Aplatissement (kurtosis)</li>
                    <li>Normalité</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Cas d'usage typiques :</h4>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>Évaluer le niveau général de la classe</li>
                <li>Identifier les élèves en difficulté ou excellents</li>
                <li>Comparer les résultats entre matières</li>
                <li>Préparer des rapports pour les parents</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'progression-analysis',
        title: 'Analyse de progression',
        type: 'example',
        content: (
          <div className="space-y-4">
            <p>
              L'analyse de progression suit l'évolution des performances dans le temps 
              et identifie les tendances d'amélioration ou de régression.
            </p>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Indicateurs de progression :</h4>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="bg-green-100 text-green-800 rounded-full px-2 py-1 text-xs font-medium mr-3 mt-0.5">
                    📈
                  </div>
                  <div>
                    <strong>Taux d'amélioration :</strong>
                    <p className="text-gray-600 text-sm">Pourcentage d'élèves en progression positive</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-xs font-medium mr-3 mt-0.5">
                    ⚖️
                  </div>
                  <div>
                    <strong>Indice de stabilité :</strong>
                    <p className="text-gray-600 text-sm">Mesure de la régularité des performances</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-purple-100 text-purple-800 rounded-full px-2 py-1 text-xs font-medium mr-3 mt-0.5">
                    🚀
                  </div>
                  <div>
                    <strong>Accélération :</strong>
                    <p className="text-gray-600 text-sm">Vitesse de progression (dérivée seconde)</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-orange-100 text-orange-800 rounded-full px-2 py-1 text-xs font-medium mr-3 mt-0.5">
                    🔮
                  </div>
                  <div>
                    <strong>Prédiction :</strong>
                    <p className="text-gray-600 text-sm">Projection des performances futures</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">🎯 Applications pédagogiques :</h4>
              <ul className="list-disc list-inside text-green-800 space-y-1">
                <li>Suivre les progrès individuels des élèves</li>
                <li>Adapter les méthodes pédagogiques</li>
                <li>Identifier les périodes de difficulté</li>
                <li>Valoriser les efforts et progrès</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'comparison-analysis',
        title: 'Analyse comparative',
        type: 'example',
        content: (
          <div className="space-y-4">
            <p>
              L'analyse comparative permet de comparer les performances entre différents 
              groupes, périodes ou matières avec des tests statistiques.
            </p>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Types de comparaisons :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <strong>Classes entre elles</strong>
                  </div>
                  <p className="text-gray-600 text-sm ml-5">
                    Comparer les performances entre différentes classes du même niveau
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <strong>Matières entre elles</strong>
                  </div>
                  <p className="text-gray-600 text-sm ml-5">
                    Analyser les écarts de performance par matière
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <strong>Périodes entre elles</strong>
                  </div>
                  <p className="text-gray-600 text-sm ml-5">
                    Comparer les résultats entre trimestres ou années
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                    <strong>Groupes d'élèves</strong>
                  </div>
                  <p className="text-gray-600 text-sm ml-5">
                    Comparer des sous-groupes (niveau, genre, etc.)
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-900">Tests statistiques inclus</h4>
                  <p className="text-yellow-800 text-sm mt-1">
                    Les analyses comparatives incluent automatiquement des tests de significativité 
                    (t-test, ANOVA) et des intervalles de confiance pour valider vos observations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'export-reports',
    title: 'Export et rapports',
    description: 'Créez des rapports professionnels et exportez vos analyses',
    icon: ChevronDownIcon,
    difficulty: 'intermediate',
    estimatedTime: '10 min',
    subsections: [
      {
        id: 'quick-export',
        title: 'Export rapide',
        type: 'steps',
        content: (
          <div className="space-y-4">
            <p>
              L'export rapide vous permet de sauvegarder vos graphiques et données 
              en quelques clics dans différents formats.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🖼️</div>
                <h4 className="font-semibold text-blue-900">PNG/JPEG</h4>
                <p className="text-blue-800 text-sm mt-1">
                  Images haute qualité pour présentations et documents
                </p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">📄</div>
                <h4 className="font-semibold text-red-900">PDF</h4>
                <p className="text-red-800 text-sm mt-1">
                  Documents imprimables avec graphiques intégrés
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-semibold text-green-900">CSV/Excel</h4>
                <p className="text-green-800 text-sm mt-1">
                  Données brutes pour analyses externes
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Comment exporter rapidement :</h4>
              <ol className="list-decimal list-inside text-gray-700 space-y-1">
                <li>Cliquez sur l'icône d'export à côté de votre graphique</li>
                <li>Choisissez le format souhaité (PNG, PDF, CSV)</li>
                <li>Le fichier se télécharge automatiquement</li>
              </ol>
            </div>
          </div>
        )
      },
      {
        id: 'advanced-reports',
        title: 'Rapports avancés',
        type: 'example',
        content: (
          <div className="space-y-4">
            <p>
              Le générateur de rapports avancés vous permet de créer des documents 
              multi-pages personnalisés avec plusieurs analyses et commentaires.
            </p>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3">Templates de rapports disponibles :</h4>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                    📋
                  </div>
                  <div>
                    <strong>Résumé exécutif :</strong>
                    <p className="text-purple-800 text-sm">Rapport concis pour la direction avec graphiques clés</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                    📊
                  </div>
                  <div>
                    <strong>Analyse détaillée :</strong>
                    <p className="text-purple-800 text-sm">Rapport complet avec toutes les données et analyses</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                    👨‍👩‍👧‍👦
                  </div>
                  <div>
                    <strong>Rapport parents :</strong>
                    <p className="text-purple-800 text-sm">Format adapté pour la communication avec les parents</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                    🎓
                  </div>
                  <div>
                    <strong>Rapport académique :</strong>
                    <p className="text-purple-800 text-sm">Format scientifique avec méthodologie et références</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Personnalisation avancée :</h4>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>Ajoutez votre logo et informations d'établissement</li>
                <li>Choisissez les sections à inclure</li>
                <li>Personnalisez les couleurs et la mise en page</li>
                <li>Activez le mode anonyme pour la confidentialité</li>
                <li>Incluez des commentaires et recommandations</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'sharing-tips',
        title: 'Conseils de partage',
        type: 'tips',
        content: (
          <div className="space-y-3">
            <div className="flex items-start">
              <LightBulbIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Mode anonyme pour les présentations</h4>
                <p className="text-gray-600 text-sm">
                  Activez le mode anonyme lors de projections en classe pour respecter la confidentialité.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <LightBulbIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Formats optimaux par usage</h4>
                <p className="text-gray-600 text-sm">
                  PNG pour les présentations, PDF pour l'impression, CSV pour les analyses externes.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <LightBulbIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Qualité d'export</h4>
                <p className="text-gray-600 text-sm">
                  Choisissez "Haute qualité" pour les documents officiels, "Standard" pour un partage rapide.
                </p>
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Résolution de problèmes',
    description: 'Solutions aux problèmes courants et conseils de dépannage',
    icon: ExclamationTriangleIcon,
    difficulty: 'advanced',
    estimatedTime: '20 min',
    subsections: [
      {
        id: 'common-issues',
        title: 'Problèmes courants',
        type: 'warning',
        content: (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900">L'analyse ne se génère pas</h4>
                  <p className="text-red-800 text-sm mt-1 mb-2">
                    Vérifiez que vous avez sélectionné au moins une classe et une métrique.
                  </p>
                  <div className="text-red-800 text-sm">
                    <strong>Solutions :</strong>
                    <ul className="list-disc list-inside mt-1">
                      <li>Vérifiez votre connexion internet</li>
                      <li>Assurez-vous d'avoir des données dans la période sélectionnée</li>
                      <li>Réessayez avec une période plus large</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-900">Les graphiques ne s'affichent pas</h4>
                  <p className="text-yellow-800 text-sm mt-1 mb-2">
                    Problème d'affichage des visualisations.
                  </p>
                  <div className="text-yellow-800 text-sm">
                    <strong>Solutions :</strong>
                    <ul className="list-disc list-inside mt-1">
                      <li>Actualisez la page (F5)</li>
                      <li>Vérifiez que JavaScript est activé</li>
                      <li>Essayez un autre navigateur</li>
                      <li>Désactivez temporairement les bloqueurs de publicité</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-orange-900">L'export PDF échoue</h4>
                  <p className="text-orange-800 text-sm mt-1 mb-2">
                    Le téléchargement du rapport PDF ne fonctionne pas.
                  </p>
                  <div className="text-orange-800 text-sm">
                    <strong>Solutions :</strong>
                    <ul className="list-disc list-inside mt-1">
                      <li>Vérifiez que les pop-ups sont autorisées</li>
                      <li>Essayez l'export en format PNG d'abord</li>
                      <li>Réduisez le nombre de graphiques dans le rapport</li>
                      <li>Contactez l'administrateur si le problème persiste</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'performance-tips',
        title: 'Optimisation des performances',
        type: 'tips',
        content: (
          <div className="space-y-3">
            <div className="flex items-start">
              <LightBulbIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Limitez la période d'analyse</h4>
                <p className="text-gray-600 text-sm">
                  Pour de meilleures performances, analysez des périodes de 3-6 mois maximum.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <LightBulbIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Utilisez le cache</h4>
                <p className="text-gray-600 text-sm">
                  Les analyses récentes sont mises en cache pour un accès plus rapide.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <LightBulbIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Fermez les onglets inutiles</h4>
                <p className="text-gray-600 text-sm">
                  Pour les analyses de gros volumes, fermez les autres onglets du navigateur.
                </p>
              </div>
            </div>
          </div>
        )
      }
    ]
  }
];

/**
 * Composant principal du guide utilisateur
 */
export const UserGuide: React.FC<UserGuideProps> = ({
  defaultSection = 'getting-started',
  compact = false,
  onClose,
  className
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [activeSection, setActiveSection] = useState(defaultSection);
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GuideSection[]>([]);

  // ========================================
  // RECHERCHE
  // ========================================

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = GUIDE_SECTIONS.filter(section => 
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.subsections.some(sub => 
          sub.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // ========================================
  // GESTION DES ACTIONS
  // ========================================

  const toggleSubsection = (subsectionId: string) => {
    setExpandedSubsections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subsectionId)) {
        newSet.delete(subsectionId);
      } else {
        newSet.add(subsectionId);
      }
      return newSet;
    });
  };

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    setSearchQuery('');
    setSearchResults([]);
  };

  // ========================================
  // RENDU DES COMPOSANTS
  // ========================================

  const renderSubsection = (subsection: GuideSubsection) => {
    const isExpanded = expandedSubsections.has(subsection.id);
    
    return (
      <div key={subsection.id} className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSubsection(subsection.id)}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
        >
          <h4 className="font-medium text-gray-900">{subsection.title}</h4>
          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-gray-500" />
          )}
        </button>
        
        {isExpanded && (
          <div className="p-4 bg-white">
            {subsection.content}
          </div>
        )}
      </div>
    );
  };

  const renderSectionList = () => (
    <div className="space-y-2">
      {(searchResults.length > 0 ? searchResults : GUIDE_SECTIONS).map(section => {
        const IconComponent = section.icon;
        const isActive = section.id === activeSection;
        
        return (
          <button
            key={section.id}
            onClick={() => handleSectionChange(section.id)}
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
                <div className="font-medium">{section.title}</div>
                <div className={cn(
                  'text-sm mt-1',
                  isActive ? 'text-blue-700' : 'text-gray-500'
                )}>
                  {section.description}
                </div>
                <div className="flex items-center mt-2 space-x-2">
                  <span className={cn(
                    'px-2 py-1 text-xs rounded-full',
                    section.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    section.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  )}>
                    {section.difficulty === 'beginner' ? 'Débutant' :
                     section.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {section.estimatedTime}
                  </span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  const activeGuideSection = GUIDE_SECTIONS.find(s => s.id === activeSection);

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className={cn(
      'flex h-full bg-white',
      compact ? 'text-sm' : '',
      className
    )}>
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Guide d'utilisation</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {/* Recherche */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans le guide..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* Liste des sections */}
        <div className="flex-1 p-4 overflow-y-auto">
          {renderSectionList()}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col">
        {activeGuideSection && (
          <>
            {/* Header de section */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-start">
                <activeGuideSection.icon className="h-8 w-8 text-blue-600 mt-1 mr-4 flex-shrink-0" />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {activeGuideSection.title}
                  </h1>
                  <p className="text-gray-600 mb-4">
                    {activeGuideSection.description}
                  </p>
                  <div className="flex items-center space-x-4">
                    <span className={cn(
                      'px-3 py-1 text-sm rounded-full',
                      activeGuideSection.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                      activeGuideSection.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    )}>
                      {activeGuideSection.difficulty === 'beginner' ? 'Débutant' :
                       activeGuideSection.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
                    </span>
                    <span className="text-sm text-gray-500">
                      ⏱️ {activeGuideSection.estimatedTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contenu des subsections */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-4xl space-y-6">
                {activeGuideSection.subsections.map(renderSubsection)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserGuide;
