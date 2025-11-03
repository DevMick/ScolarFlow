// ========================================
// TEMPLATE DATA - TEMPLATES PRÉDÉFINIS CP1-CM2
// ========================================

import type { CreateEvaluationData, EvaluationType, AbsentHandling, RoundingMethod } from '../../../../types';

/**
 * Interface pour un template d'évaluation
 */
export interface EvaluationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'mathematiques' | 'francais' | 'sciences' | 'histoire_geo' | 'general';
  level: 'CP1' | 'CP2' | 'CE1' | 'CE2' | 'CM1' | 'CM2' | 'all';
  icon: string;
  data: Partial<CreateEvaluationData>;
  popularity: number; // Pour tri (1-5)
  tags: string[];
}

/**
 * Templates pour les mathématiques
 */
const mathematiquesTemplates: EvaluationTemplate[] = [
  {
    id: 'math_controle_standard',
    name: 'Contrôle Math Standard',
    description: 'Évaluation classique de mathématiques sur 20',
    category: 'mathematiques',
    level: 'all',
    icon: '🔢',
    data: {
      subject: 'Mathématiques',
      type: 'Controle',
      maxScore: 20,
      coefficient: 1,
      description: 'Contrôle de mathématiques - Durée: 45 minutes',
      absentHandling: 'exclude_from_ranking',
      roundingMethod: 'two_decimals',
      showRanking: true
    },
    popularity: 5,
    tags: ['standard', 'rapide', 'classique']
  },
  {
    id: 'math_calcul_mental',
    name: 'Calcul Mental',
    description: 'Évaluation rapide de calcul mental sur 10',
    category: 'mathematiques',
    level: 'all',
    icon: '🧮',
    data: {
      subject: 'Mathématiques',
      type: 'Quiz',
      maxScore: 10,
      coefficient: 0.5,
      description: 'Calcul mental - 10 opérations - Durée: 15 minutes',
      absentHandling: 'zero_score',
      roundingMethod: 'nearest_integer',
      showRanking: true
    },
    popularity: 4,
    tags: ['rapide', 'mental', 'quotidien']
  },
  {
    id: 'math_geometrie_cp_ce',
    name: 'Géométrie CP-CE',
    description: 'Évaluation de géométrie adaptée CP-CE',
    category: 'mathematiques',
    level: 'CP1',
    icon: '📐',
    data: {
      subject: 'Mathématiques',
      type: 'Controle',
      maxScore: 15,
      coefficient: 1,
      description: 'Géométrie : formes, lignes et reproductions - Durée: 30 minutes',
      absentHandling: 'exclude_from_ranking',
      roundingMethod: 'nearest_half',
      showRanking: false
    },
    popularity: 3,
    tags: ['géométrie', 'formes', 'manipulation']
  },
  {
    id: 'math_problemes_cm',
    name: 'Résolution de Problèmes CM',
    description: 'Problèmes complexes pour CM1-CM2',
    category: 'mathematiques',
    level: 'CM1',
    icon: '🧩',
    data: {
      subject: 'Mathématiques',
      type: 'Devoir',
      maxScore: 25,
      coefficient: 2,
      description: 'Résolution de problèmes complexes - Durée: 60 minutes',
      absentHandling: 'manual_decision',
      roundingMethod: 'two_decimals',
      showRanking: true
    },
    popularity: 4,
    tags: ['problèmes', 'complexe', 'raisonnement']
  },
  {
    id: 'math_tables_multiplication',
    name: 'Tables de Multiplication',
    description: 'Évaluation des tables de multiplication',
    category: 'mathematiques',
    level: 'CE2',
    icon: '✖️',
    data: {
      subject: 'Mathématiques',
      type: 'Controle',
      maxScore: 20,
      coefficient: 1,
      description: 'Tables de multiplication - 20 opérations - Durée: 20 minutes',
      absentHandling: 'zero_score',
      roundingMethod: 'nearest_integer',
      showRanking: true
    },
    popularity: 5,
    tags: ['tables', 'multiplication', 'mémorisation']
  }
];

/**
 * Templates pour le français
 */
const francaisTemplates: EvaluationTemplate[] = [
  {
    id: 'francais_dictee_preparee',
    name: 'Dictée Préparée',
    description: 'Dictée avec barème adapté',
    category: 'francais',
    level: 'all',
    icon: '✍️',
    data: {
      subject: 'Français',
      type: 'Controle',
      maxScore: 20,
      coefficient: 1,
      description: 'Dictée préparée - Barème: -0.5 par faute d\'usage, -1 par faute d\'accord',
      absentHandling: 'exclude_from_ranking',
      roundingMethod: 'nearest_half',
      showRanking: true
    },
    popularity: 5,
    tags: ['dictée', 'orthographe', 'préparée']
  },
  {
    id: 'francais_comprehension_lecture',
    name: 'Compréhension de Lecture',
    description: 'Évaluation de compréhension sur texte',
    category: 'francais',
    level: 'all',
    icon: '📖',
    data: {
      subject: 'Français',
      type: 'Controle',
      maxScore: 20,
      coefficient: 1.5,
      description: 'Compréhension de lecture - Questions sur texte - Durée: 45 minutes',
      absentHandling: 'exclude_from_ranking',
      roundingMethod: 'two_decimals',
      showRanking: true
    },
    popularity: 4,
    tags: ['lecture', 'compréhension', 'texte']
  },
  {
    id: 'francais_expression_ecrite',
    name: 'Expression Écrite',
    description: 'Production d\'écrit créatif ou fonctionnel',
    category: 'francais',
    level: 'CE1',
    icon: '✏️',
    data: {
      subject: 'Français',
      type: 'Devoir',
      maxScore: 20,
      coefficient: 2,
      description: 'Expression écrite - Rédaction - Durée: 60 minutes',
      absentHandling: 'manual_decision',
      roundingMethod: 'two_decimals',
      showRanking: false
    },
    popularity: 3,
    tags: ['rédaction', 'créativité', 'expression']
  },
  {
    id: 'francais_grammaire_conjugaison',
    name: 'Grammaire et Conjugaison',
    description: 'Évaluation de grammaire et conjugaison',
    category: 'francais',
    level: 'CE2',
    icon: '📝',
    data: {
      subject: 'Français',
      type: 'Controle',
      maxScore: 20,
      coefficient: 1,
      description: 'Grammaire et conjugaison - Exercices variés - Durée: 40 minutes',
      absentHandling: 'exclude_from_ranking',
      roundingMethod: 'nearest_half',
      showRanking: true
    },
    popularity: 4,
    tags: ['grammaire', 'conjugaison', 'langue']
  },
  {
    id: 'francais_vocabulaire_oral',
    name: 'Vocabulaire et Oral',
    description: 'Évaluation orale du vocabulaire',
    category: 'francais',
    level: 'CP1',
    icon: '🗣️',
    data: {
      subject: 'Français',
      type: 'Oral',
      maxScore: 10,
      coefficient: 1,
      description: 'Vocabulaire et expression orale - Entretien individuel - Durée: 10 minutes par élève',
      absentHandling: 'exclude_from_ranking',
      roundingMethod: 'nearest_integer',
      showRanking: false
    },
    popularity: 2,
    tags: ['oral', 'vocabulaire', 'individuel']
  }
];

/**
 * Templates pour les sciences
 */
const sciencesTemplates: EvaluationTemplate[] = [
  {
    id: 'sciences_decouverte_monde',
    name: 'Découverte du Monde',
    description: 'Évaluation de découverte du monde CP-CE',
    category: 'sciences',
    level: 'CP1',
    icon: '🌍',
    data: {
      subject: 'Découverte du Monde',
      type: 'Controle',
      maxScore: 15,
      coefficient: 1,
      description: 'Découverte du monde - Observation et questionnement - Durée: 30 minutes',
      absentHandling: 'exclude_from_ranking',
      roundingMethod: 'nearest_integer',
      showRanking: false
    },
    popularity: 3,
    tags: ['découverte', 'observation', 'monde']
  },
  {
    id: 'sciences_experience_tp',
    name: 'Expérience et TP',
    description: 'Travaux pratiques avec expérimentation',
    category: 'sciences',
    level: 'CM1',
    icon: '🔬',
    data: {
      subject: 'Sciences',
      type: 'TP',
      maxScore: 20,
      coefficient: 1.5,
      description: 'Travaux pratiques - Expérimentation et analyse - Durée: 90 minutes',
      absentHandling: 'manual_decision',
      roundingMethod: 'two_decimals',
      showRanking: true
    },
    popularity: 4,
    tags: ['expérience', 'manipulation', 'analyse']
  },
  {
    id: 'sciences_corps_humain',
    name: 'Corps Humain',
    description: 'Évaluation sur le corps humain et la santé',
    category: 'sciences',
    level: 'CE2',
    icon: '🫀',
    data: {
      subject: 'Sciences',
      type: 'Controle',
      maxScore: 20,
      coefficient: 1,
      description: 'Le corps humain et la santé - Durée: 45 minutes',
      absentHandling: 'exclude_from_ranking',
      roundingMethod: 'two_decimals',
      showRanking: true
    },
    popularity: 3,
    tags: ['corps', 'santé', 'biologie']
  }
];

/**
 * Templates pour l'histoire-géographie
 */
const histoireGeoTemplates: EvaluationTemplate[] = [
  {
    id: 'histoire_frise_chronologique',
    name: 'Frise Chronologique',
    description: 'Évaluation sur la chronologie historique',
    category: 'histoire_geo',
    level: 'CM1',
    icon: '📅',
    data: {
      subject: 'Histoire',
      type: 'Controle',
      maxScore: 20,
      coefficient: 1,
      description: 'Frise chronologique et périodes historiques - Durée: 40 minutes',
      absentHandling: 'exclude_from_ranking',
      roundingMethod: 'nearest_integer',
      showRanking: true
    },
    popularity: 3,
    tags: ['chronologie', 'frise', 'périodes']
  },
  {
    id: 'geo_cartes_lecture',
    name: 'Lecture de Cartes',
    description: 'Évaluation de lecture et utilisation de cartes',
    category: 'histoire_geo',
    level: 'CE2',
    icon: '🗺️',
    data: {
      subject: 'Géographie',
      type: 'Controle',
      maxScore: 20,
      coefficient: 1,
      description: 'Lecture de cartes et orientation - Durée: 45 minutes',
      absentHandling: 'exclude_from_ranking',
      roundingMethod: 'two_decimals',
      showRanking: true
    },
    popularity: 4,
    tags: ['cartes', 'orientation', 'géographie']
  },
  {
    id: 'histoire_personnages_historiques',
    name: 'Personnages Historiques',
    description: 'Évaluation sur les grandes figures de l\'histoire',
    category: 'histoire_geo',
    level: 'CM2',
    icon: '👑',
    data: {
      subject: 'Histoire',
      type: 'Controle',
      maxScore: 20,
      coefficient: 1,
      description: 'Personnages historiques et leur époque - Durée: 45 minutes',
      absentHandling: 'exclude_from_ranking',
      roundingMethod: 'two_decimals',
      showRanking: true
    },
    popularity: 3,
    tags: ['personnages', 'biographie', 'époque']
  }
];

/**
 * Templates généraux
 */
const generalTemplates: EvaluationTemplate[] = [
  {
    id: 'general_controle_rapide',
    name: 'Contrôle Rapide',
    description: 'Évaluation courte sur 10 points',
    category: 'general',
    level: 'all',
    icon: '⚡',
    data: {
      subject: '', // À compléter
      type: 'Controle',
      maxScore: 10,
      coefficient: 0.5,
      description: 'Contrôle rapide - Durée: 20 minutes',
      absentHandling: 'zero_score',
      roundingMethod: 'nearest_half',
      showRanking: true
    },
    popularity: 4,
    tags: ['rapide', 'court', 'quotidien']
  },
  {
    id: 'general_participation',
    name: 'Note de Participation',
    description: 'Évaluation de la participation en classe',
    category: 'general',
    level: 'all',
    icon: '🗣️',
    data: {
      subject: '', // À compléter
      type: 'Participation',
      maxScore: 5,
      coefficient: 0.5,
      description: 'Participation et investissement en classe',
      absentHandling: 'zero_score',
      roundingMethod: 'nearest_integer',
      showRanking: false
    },
    popularity: 3,
    tags: ['participation', 'comportement', 'continu']
  },
  {
    id: 'general_projet_groupe',
    name: 'Projet de Groupe',
    description: 'Évaluation d\'un projet collaboratif',
    category: 'general',
    level: 'CE1',
    icon: '👥',
    data: {
      subject: '', // À compléter
      type: 'Projet',
      maxScore: 20,
      coefficient: 2,
      description: 'Projet de groupe - Présentation et collaboration',
      absentHandling: 'manual_decision',
      roundingMethod: 'two_decimals',
      showRanking: false
    },
    popularity: 2,
    tags: ['projet', 'groupe', 'collaboration']
  },
  {
    id: 'general_examen_blanc',
    name: 'Examen Blanc',
    description: 'Simulation d\'examen officiel',
    category: 'general',
    level: 'CM2',
    icon: '📋',
    data: {
      subject: '', // À compléter
      type: 'Examen',
      maxScore: 100,
      coefficient: 3,
      description: 'Examen blanc - Préparation certification - Durée: 2 heures',
      absentHandling: 'manual_decision',
      roundingMethod: 'nearest_integer',
      showRanking: true
    },
    popularity: 2,
    tags: ['examen', 'certification', 'officiel']
  }
];

/**
 * Combinaison de tous les templates
 */
export const evaluationTemplates: EvaluationTemplate[] = [
  ...mathematiquesTemplates,
  ...francaisTemplates,
  ...sciencesTemplates,
  ...histoireGeoTemplates,
  ...generalTemplates
];

/**
 * Catégories avec leurs labels et couleurs
 */
export const templateCategories = {
  mathematiques: {
    label: 'Mathématiques',
    color: 'blue',
    icon: '🔢',
    description: 'Calcul, géométrie, problèmes'
  },
  francais: {
    label: 'Français',
    color: 'green',
    icon: '📝',
    description: 'Lecture, écriture, grammaire'
  },
  sciences: {
    label: 'Sciences',
    color: 'purple',
    icon: '🔬',
    description: 'Expériences, découverte du monde'
  },
  histoire_geo: {
    label: 'Histoire-Géo',
    color: 'yellow',
    icon: '🏛️',
    description: 'Histoire, géographie, civilisations'
  },
  general: {
    label: 'Général',
    color: 'gray',
    icon: '📚',
    description: 'Templates polyvalents'
  }
} as const;

/**
 * Niveaux scolaires
 */
export const schoolLevels = {
  CP1: { label: 'CP1', order: 1 },
  CP2: { label: 'CP2', order: 2 },
  CE1: { label: 'CE1', order: 3 },
  CE2: { label: 'CE2', order: 4 },
  CM1: { label: 'CM1', order: 5 },
  CM2: { label: 'CM2', order: 6 },
  all: { label: 'Tous niveaux', order: 0 }
} as const;

/**
 * Fonction utilitaire pour filtrer les templates
 */
export function filterTemplates(
  templates: EvaluationTemplate[],
  filters: {
    search?: string;
    category?: string;
    level?: string;
    tags?: string[];
  }
): EvaluationTemplate[] {
  return templates.filter(template => {
    // Filtre par recherche textuelle
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    // Filtre par catégorie
    if (filters.category && filters.category !== 'all') {
      if (template.category !== filters.category) return false;
    }

    // Filtre par niveau
    if (filters.level && filters.level !== 'all') {
      if (template.level !== filters.level && template.level !== 'all') return false;
    }

    // Filtre par tags
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => 
        template.tags.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }

    return true;
  });
}

/**
 * Fonction pour obtenir les templates populaires
 */
export function getPopularTemplates(limit: number = 6): EvaluationTemplate[] {
  return evaluationTemplates
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

/**
 * Fonction pour obtenir les templates récents (basés sur l'usage)
 */
export function getRecentTemplates(usedTemplateIds: string[] = []): EvaluationTemplate[] {
  return usedTemplateIds
    .map(id => evaluationTemplates.find(t => t.id === id))
    .filter(Boolean) as EvaluationTemplate[];
}

export default evaluationTemplates;
