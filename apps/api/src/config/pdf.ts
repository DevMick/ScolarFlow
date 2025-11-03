export const PDF_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['application/pdf'],
  uploadDir: './uploads/temp',
  processTimeout: 30000, // 30 secondes
  
  // Patterns de reconnaissance des noms
  namePatterns: [
    // Pattern de base: Prénom Nom
    /(\w+)\s+(\w+)/g,
    // Pattern: Nom, Prénom
    /(\w+),\s*(\w+)/g,
    // Pattern avec numéro: 1. Prénom Nom
    /\d+\.\s*(\w+)\s+(\w+)/g,
    // Pattern avec date: Prénom Nom 01/01/2015
    /(\w+)\s+(\w+)\s+\d{2}\/\d{2}\/\d{4}/g,
    // Pattern parenthèses: Nom, Prénom (né le...)
    /(\w+),\s*(\w+)\s*\(/g,
    // Pattern tiret: Martin - Jean
    /(\w+)\s*-\s*(\w+)/g,
    // Pattern avec majuscules: MARTIN Jean
    /([A-ZÀ-Ÿ]{2,})\s+([A-ZÀ-Ÿ][a-zà-ÿ]+)/g,
  ],
  
  // Patterns pour extraire dates de naissance
  datePatterns: [
    /\d{2}\/\d{2}\/\d{4}/g,
    /\d{2}-\d{2}-\d{4}/g,
    /\d{2}\.\d{2}\.\d{4}/g,
  ],
  
  // Mots à ignorer lors du parsing
  stopWords: [
    'classe', 'élève', 'élèves', 'liste', 'école', 'primaire',
    'année', 'scolaire', 'académique', 'enseignant', 'professeur',
    'CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2', 'effectif', 'total',
    'garçon', 'garçons', 'fille', 'filles', 'né', 'née', 'le',
    'adresse', 'téléphone', 'parents', 'responsable', 'contact',
    'date', 'naissance', 'lieu', 'page', 'numéro', 'janvier',
    'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
    'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ],
  
  // Seuil de confiance minimum pour accepter un nom
  confidenceThreshold: 0.7,
  
  // Configuration pour la détection de doublons
  duplicateDetection: {
    // Seuil de similarité pour considérer comme doublon (0-1)
    similarityThreshold: 0.85,
    // Comparaison phonétique (Soundex-like)
    usePhoneticMatching: true,
    // Tolérance pour les différences d'orthographe
    fuzzyMatchThreshold: 0.8,
  },
};

export const UPLOAD_CONFIG = {
  dest: './uploads/temp',
  limits: {
    fileSize: PDF_CONFIG.maxFileSize,
    files: 1,
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (PDF_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont autorisés'), false);
    }
  },
};
