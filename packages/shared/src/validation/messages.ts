// ========================================
// MESSAGES D'ERREUR DE VALIDATION EN FRANÇAIS
// ========================================

export const VALIDATION_MESSAGES = {
  // Messages génériques
  REQUIRED_FIELD: 'Ce champ est obligatoire',
  INVALID_TYPE: 'Type de données invalide',
  INVALID_FORMAT: 'Format invalide',
  
  // ========================================
  // VALIDATION ÉVALUATION - TITRE
  // ========================================
  TITLE_TOO_SHORT: 'Le titre doit contenir au moins 3 caractères',
  TITLE_TOO_LONG: 'Le titre ne peut pas dépasser 200 caractères',
  TITLE_INVALID_CHARS: 'Le titre contient des caractères non autorisés. Seuls les lettres, chiffres, espaces et - _ . : ( ) / + & sont acceptés',
  TITLE_EMPTY: 'Le titre ne peut pas être vide',
  TITLE_ONLY_SPACES: 'Le titre ne peut pas contenir uniquement des espaces',
  
  // ========================================
  // VALIDATION ÉVALUATION - MATIÈRE
  // ========================================
  SUBJECT_TOO_SHORT: 'La matière doit contenir au moins 2 caractères',
  SUBJECT_TOO_LONG: 'La matière ne peut pas dépasser 100 caractères',
  SUBJECT_INVALID_CHARS: 'La matière contient des caractères non autorisés. Seuls les lettres, espaces, tirets et esperluettes sont acceptés',
  SUBJECT_EMPTY: 'La matière ne peut pas être vide',
  
  // ========================================
  // VALIDATION ÉVALUATION - NOTE MAXIMALE
  // ========================================
  MAX_SCORE_REQUIRED: 'La note maximale est obligatoire',
  MAX_SCORE_INVALID_TYPE: 'La note maximale doit être un nombre',
  MAX_SCORE_POSITIVE: 'La note maximale doit être positive',
  MAX_SCORE_TOO_LOW: 'La note maximale doit être au moins 0,01',
  MAX_SCORE_TOO_HIGH: 'La note maximale ne peut pas dépasser 1000',
  MAX_SCORE_DECIMALS: 'La note maximale doit avoir au maximum 2 décimales',
  MAX_SCORE_ZERO: 'La note maximale doit être supérieure à 0',
  MAX_SCORE_UNREALISTIC: 'Cette note maximale semble peu réaliste pour une évaluation scolaire',
  
  // ========================================
  // VALIDATION ÉVALUATION - COEFFICIENT
  // ========================================
  COEFFICIENT_INVALID_TYPE: 'Le coefficient doit être un nombre',
  COEFFICIENT_POSITIVE: 'Le coefficient doit être positif',
  COEFFICIENT_TOO_LOW: 'Le coefficient doit être au moins 0,01',
  COEFFICIENT_TOO_HIGH: 'Le coefficient ne peut pas dépasser 20',
  COEFFICIENT_DECIMALS: 'Le coefficient doit avoir au maximum 2 décimales',
  COEFFICIENT_UNREALISTIC: 'Ce coefficient semble anormalement élevé',
  
  // ========================================
  // VALIDATION ÉVALUATION - DATE
  // ========================================
  DATE_REQUIRED: 'La date d\'évaluation est obligatoire',
  DATE_INVALID: 'Date d\'évaluation invalide',
  DATE_FUTURE: 'La date d\'évaluation ne peut pas être dans le futur',
  DATE_TOO_OLD: 'La date d\'évaluation ne peut pas être antérieure à 2020',
  DATE_WEEKEND: 'L\'évaluation ne peut pas avoir lieu le week-end (samedi ou dimanche)',
  DATE_VACATION: 'Cette date correspond à une période de vacances scolaires',
  DATE_TOO_RECENT: 'La date d\'évaluation doit être d\'au moins hier',
  
  // ========================================
  // VALIDATION ÉVALUATION - DESCRIPTION
  // ========================================
  DESCRIPTION_TOO_LONG: 'La description ne peut pas dépasser 1000 caractères',
  DESCRIPTION_INVALID_CHARS: 'La description contient des caractères non autorisés',
  
  // ========================================
  // VALIDATION ÉNUMÉRATIONS
  // ========================================
  INVALID_EVALUATION_TYPE: 'Type d\'évaluation invalide. Types autorisés : Contrôle, Devoir, Examen, Oral, TP, Projet, Participation, Quiz, Exercice',
  INVALID_ABSENT_HANDLING: 'Mode de gestion des absents invalide. Options : exclure du classement, note 0, moyenne de classe, décision manuelle, bonus proportionnel',
  INVALID_ABSENT_REASON: 'Raison d\'absence invalide. Raisons autorisées : maladie, raison familiale, activité scolaire, rendez-vous médical, non justifiée, exclusion, autre',
  INVALID_ROUNDING_METHOD: 'Méthode d\'arrondi invalide. Méthodes : aucun, demi-point, quart de point, entier, une décimale, deux décimales, supérieur, inférieur',
  
  // ========================================
  // VALIDATION RÉSULTAT - ÉLÈVE
  // ========================================
  STUDENT_ID_REQUIRED: 'L\'identifiant de l\'élève est obligatoire',
  STUDENT_ID_INVALID: 'L\'identifiant de l\'élève doit être un nombre entier',
  STUDENT_ID_INTEGER: 'L\'identifiant de l\'élève doit être un entier',
  STUDENT_ID_POSITIVE: 'L\'identifiant de l\'élève doit être positif',
  STUDENT_NOT_IN_CLASS: 'Cet élève n\'appartient pas à la classe',
  
  // ========================================
  // VALIDATION RÉSULTAT - SCORE
  // ========================================
  SCORE_INVALID_TYPE: 'La note doit être un nombre',
  SCORE_NEGATIVE: 'La note ne peut pas être négative',
  SCORE_TOO_HIGH: 'La note ne peut pas dépasser {max}',
  SCORE_DECIMALS: 'La note doit avoir au maximum 2 décimales',
  SCORE_SUSPICIOUS: 'Cette note semble anormalement élevée pour une évaluation sur {max}',
  SCORE_REQUIRED_FOR_PRESENT: 'Une note est obligatoire pour un élève présent',
  SCORE_NOT_ALLOWED_FOR_ABSENT: 'Un élève absent ne peut pas avoir de note',
  
  // ========================================
  // VALIDATION RÉSULTAT - ABSENCE
  // ========================================
  ABSENT_REQUIRED: 'Le statut d\'absence est obligatoire',
  ABSENT_INVALID: 'Le statut d\'absence doit être vrai ou faux',
  ABSENT_WITH_SCORE: 'Un élève absent ne peut pas avoir de note',
  ABSENT_WITHOUT_REASON: 'Une raison d\'absence est requise pour les élèves absents',
  PRESENT_WITHOUT_SCORE: 'Une note est requise pour les élèves présents',
  PRESENT_WITH_REASON: 'Un élève présent ne peut pas avoir de raison d\'absence',
  REASON_REQUIRED_IF_ABSENT: 'La raison d\'absence est obligatoire quand l\'élève est absent',
  
  // ========================================
  // VALIDATION RÉSULTAT - NOTES/REMARQUES
  // ========================================
  NOTES_TOO_LONG: 'Les remarques ne peuvent pas dépasser 500 caractères',
  NOTES_INVALID_CHARS: 'Les remarques contiennent des caractères non autorisés',
  NOTES_INAPPROPRIATE: 'Ces remarques semblent inappropriées pour un contexte scolaire',
  
  // ========================================
  // VALIDATION OPÉRATIONS EN LOT
  // ========================================
  BULK_EMPTY: 'Au moins un résultat est requis dans le lot',
  BULK_TOO_LARGE: 'Maximum 100 résultats par lot pour des raisons de performance',
  BULK_DUPLICATE_STUDENTS: 'Chaque élève ne peut apparaître qu\'une seule fois dans le lot',
  BULK_INVALID_STUDENTS: 'Certains élèves du lot n\'appartiennent pas à cette classe',
  BULK_MIXED_EVALUATIONS: 'Tous les résultats du lot doivent concerner la même évaluation',
  BULK_INCONSISTENT_DATA: 'Les données du lot sont incohérentes',
  
  // ========================================
  // VALIDATION RÈGLES MÉTIER
  // ========================================
  FINALIZED_MODIFICATION: 'Impossible de modifier ces champs sur une évaluation finalisée. Seuls la description et l\'affichage du classement peuvent être modifiés',
  FINALIZED_CANNOT_ADD_RESULTS: 'Impossible d\'ajouter des résultats à une évaluation finalisée',
  FINALIZED_CANNOT_DELETE_RESULTS: 'Impossible de supprimer des résultats d\'une évaluation finalisée',
  
  // Règles spécifiques par type d'évaluation
  PARTICIPATION_COEFFICIENT: 'Le coefficient pour une note de participation ne devrait pas dépasser 1',
  PARTICIPATION_MAX_SCORE: 'La note maximale pour une participation ne devrait pas dépasser 5',
  EXAM_COEFFICIENT: 'Le coefficient pour un examen devrait être au moins 2',
  EXAM_MIN_SCORE: 'La note maximale pour un examen devrait être au moins 10',
  ORAL_MAX_SCORE: 'La note maximale pour un oral ne devrait pas dépasser 20',
  TP_COEFFICIENT: 'Le coefficient pour des travaux pratiques devrait être entre 1 et 3',
  PROJECT_COEFFICIENT: 'Le coefficient pour un projet devrait être au moins 1,5',
  
  // ========================================
  // VALIDATION FILTRES ET RECHERCHE
  // ========================================
  SEARCH_TOO_SHORT: 'La recherche doit contenir au moins 2 caractères',
  SEARCH_TOO_LONG: 'La recherche ne peut pas dépasser 100 caractères',
  SEARCH_INVALID_CHARS: 'La recherche contient des caractères non autorisés',
  DATE_RANGE_INVALID: 'La période de dates est invalide',
  DATE_RANGE_TOO_LARGE: 'La période de recherche ne peut pas dépasser 2 ans',
  DATE_RANGE_START_AFTER_END: 'La date de début doit être antérieure à la date de fin',
  
  // ========================================
  // VALIDATION PAGINATION
  // ========================================
  PAGE_INVALID: 'Le numéro de page doit être un entier positif',
  PAGE_TOO_HIGH: 'Le numéro de page est trop élevé',
  LIMIT_INVALID: 'La limite doit être un entier entre 1 et 100',
  LIMIT_TOO_HIGH: 'La limite ne peut pas dépasser 100 éléments par page',
  OFFSET_INVALID: 'Le décalage doit être un entier positif ou zéro',
  
  // ========================================
  // VALIDATION IMPORT/EXPORT
  // ========================================
  FILE_REQUIRED: 'Un fichier est requis',
  FILE_TOO_LARGE: 'Le fichier est trop volumineux (maximum {size})',
  FILE_INVALID_TYPE: 'Type de fichier non supporté. Types autorisés : {types}',
  FILE_CORRUPTED: 'Le fichier semble corrompu ou illisible',
  EXPORT_FORMAT_REQUIRED: 'Le format d\'export est obligatoire',
  EXPORT_NO_DATA: 'Aucune donnée à exporter',
  EXPORT_TOO_LARGE: 'Export trop volumineux, veuillez filtrer les données',
  
  // ========================================
  // VALIDATION PERMISSIONS
  // ========================================
  UNAUTHORIZED_ACCESS: 'Vous n\'avez pas l\'autorisation d\'accéder à cette ressource',
  UNAUTHORIZED_MODIFICATION: 'Vous n\'avez pas l\'autorisation de modifier cette ressource',
  UNAUTHORIZED_DELETION: 'Vous n\'avez pas l\'autorisation de supprimer cette ressource',
  CLASS_NOT_OWNED: 'Cette classe ne vous appartient pas',
  EVALUATION_NOT_OWNED: 'Cette évaluation ne vous appartient pas',
  
  // ========================================
  // VALIDATION SYSTÈME
  // ========================================
  CONCURRENT_MODIFICATION: 'Cette ressource a été modifiée par un autre utilisateur. Veuillez actualiser et réessayer',
  RESOURCE_NOT_FOUND: 'Ressource introuvable',
  RESOURCE_DELETED: 'Cette ressource a été supprimée',
  SYSTEM_ERROR: 'Une erreur système s\'est produite. Veuillez réessayer plus tard',
  NETWORK_ERROR: 'Erreur de connexion. Vérifiez votre connexion internet',
  TIMEOUT_ERROR: 'L\'opération a pris trop de temps. Veuillez réessayer',
  
} as const;

// Type pour autocomplétion des messages
export type ValidationMessage = keyof typeof VALIDATION_MESSAGES;

// Messages d'erreur avec paramètres dynamiques
export const getValidationMessage = (
  key: ValidationMessage,
  params?: Record<string, string | number>
): string => {
  let message: string = VALIDATION_MESSAGES[key];
  
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      message = message.replace(`{${param}}`, String(value));
    });
  }
  
  return message;
};

// Catégories de messages pour l'organisation
export const VALIDATION_CATEGORIES = {
  EVALUATION: [
    'TITLE_TOO_SHORT', 'TITLE_TOO_LONG', 'TITLE_INVALID_CHARS',
    'SUBJECT_TOO_SHORT', 'SUBJECT_TOO_LONG', 'SUBJECT_INVALID_CHARS',
    'MAX_SCORE_REQUIRED', 'MAX_SCORE_INVALID_TYPE', 'MAX_SCORE_POSITIVE',
    'COEFFICIENT_INVALID_TYPE', 'COEFFICIENT_POSITIVE',
    'DATE_REQUIRED', 'DATE_INVALID', 'DATE_FUTURE'
  ],
  RESULT: [
    'STUDENT_ID_REQUIRED', 'STUDENT_ID_INVALID', 'STUDENT_ID_POSITIVE',
    'SCORE_INVALID_TYPE', 'SCORE_NEGATIVE', 'SCORE_TOO_HIGH',
    'ABSENT_REQUIRED', 'ABSENT_INVALID', 'ABSENT_WITH_SCORE'
  ],
  BUSINESS_RULES: [
    'FINALIZED_MODIFICATION', 'PARTICIPATION_COEFFICIENT', 'EXAM_COEFFICIENT',
    'PARTICIPATION_MAX_SCORE', 'EXAM_MIN_SCORE'
  ],
  SYSTEM: [
    'UNAUTHORIZED_ACCESS', 'RESOURCE_NOT_FOUND', 'SYSTEM_ERROR',
    'NETWORK_ERROR', 'TIMEOUT_ERROR'
  ]
} as const;

// Helper pour obtenir des messages par catégorie
export const getMessagesByCategory = (category: keyof typeof VALIDATION_CATEGORIES): string[] => {
  return VALIDATION_CATEGORIES[category].map(key => VALIDATION_MESSAGES[key as ValidationMessage]);
};
