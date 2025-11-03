import { PDF_CONFIG } from '../config/pdf';

export class TextCleaner {
  /**
   * Nettoie le texte extrait du PDF
   */
  static cleanText(text: string): string {
    if (!text) return '';

    return text
      // Normaliser les espaces et retours à la ligne
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      // Supprimer les caractères de contrôle
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Nettoyer les caractères d'encodage problématiques
      .replace(/[^\w\s\-',\.éèêëàâäôöîïùûüÿñçÉÈÊËÀÂÄÔÖÎÏÙÛÜŸÑÇ]/g, ' ')
      // Supprimer les espaces multiples
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * Extrait les lignes pertinentes du texte
   */
  static extractRelevantLines(text: string): string[] {
    const lines = text.split('\n')
      .map(line => this.cleanText(line))
      .filter(line => line.length > 0);

    return lines.filter(line => this.isRelevantLine(line));
  }

  /**
   * Détermine si une ligne contient probablement des noms d'élèves
   */
  static isRelevantLine(line: string): boolean {
    // Ignorer les lignes trop courtes ou trop longues
    if (line.length < 3 || line.length > 100) return false;

    // Ignorer les lignes qui contiennent uniquement des stop words
    const words = line.toLowerCase().split(/\s+/);
    const stopWords = PDF_CONFIG.stopWords.map(w => w.toLowerCase());
    const hasOnlyStopWords = words.every(word => 
      stopWords.includes(word) || /^\d+$/.test(word) || word.length < 2
    );
    
    if (hasOnlyStopWords) return false;

    // Ignorer les lignes qui sont clairement des en-têtes ou métadonnées
    const lowerLine = line.toLowerCase();
    const headerKeywords = [
      'école', 'établissement', 'académie', 'inspection',
      'directeur', 'enseignant', 'professeur',
      'année scolaire', 'classe de', 'niveau',
      'adresse', 'téléphone', 'email', 'fax',
      'page', 'total', 'effectif'
    ];

    if (headerKeywords.some(keyword => lowerLine.includes(keyword))) {
      return false;
    }

    // Vérifier si la ligne contient au moins deux mots qui pourraient être des noms
    const possibleNames = words.filter(word => 
      /^[a-zA-ZÀ-ÿ]{2,}$/.test(word) && !stopWords.includes(word.toLowerCase())
    );

    return possibleNames.length >= 2;
  }

  /**
   * Normalise un nom (capitalisation correcte)
   */
  static normalizeName(name: string): string {
    if (!name) return '';

    return name
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase())
      // Gérer les noms composés avec tiret
      .replace(/-\w/g, match => '-' + match[1].toUpperCase())
      // Gérer les apostrophes
      .replace(/'\w/g, match => "'" + match[1].toUpperCase());
  }

  /**
   * Supprime les caractères parasites d'un nom
   */
  static sanitizeName(name: string): string {
    return name
      .replace(/[^\w\s\-'àâäéèêëîïôöùûüÿñçÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÑÇ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Valide qu'un nom est plausible
   */
  static isValidName(name: string): boolean {
    if (!name || name.length < 2 || name.length > 50) return false;

    // Doit contenir au moins une lettre
    if (!/[a-zA-ZÀ-ÿ]/.test(name)) return false;

    // Ne doit pas être entièrement numérique
    if (/^\d+$/.test(name)) return false;

    // Ne doit pas contenir trop de caractères spéciaux
    const specialChars = (name.match(/[^a-zA-ZÀ-ÿ\s\-']/g) || []).length;
    if (specialChars > name.length * 0.3) return false;

    // Ne doit pas être un stop word
    const lowerName = name.toLowerCase();
    if (PDF_CONFIG.stopWords.includes(lowerName)) return false;

    return true;
  }

  /**
   * Extrait les dates de naissance potentielles d'une ligne
   */
  static extractDates(text: string): string[] {
    const dates: string[] = [];
    
    PDF_CONFIG.datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        dates.push(...matches);
      }
    });

    return dates.map(date => this.normalizeDate(date));
  }

  /**
   * Normalise une date au format ISO
   */
  static normalizeDate(dateStr: string): string {
    // Formats supportés: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    const cleaned = dateStr.replace(/[^\d]/g, '');
    if (cleaned.length !== 8) return '';

    const day = cleaned.substring(0, 2);
    const month = cleaned.substring(2, 4);
    const year = cleaned.substring(4, 8);

    // Validation basique
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (dayNum < 1 || dayNum > 31) return '';
    if (monthNum < 1 || monthNum > 12) return '';
    if (yearNum < 2000 || yearNum > new Date().getFullYear()) return '';

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  /**
   * Calcule un score de confiance pour un nom extrait
   */
  static calculateNameConfidence(originalText: string, firstName: string, lastName: string): number {
    let score = 0.5; // Score de base

    // Bonus si les noms sont bien formés
    if (this.isValidName(firstName)) score += 0.2;
    if (this.isValidName(lastName)) score += 0.2;

    // Bonus si les noms ont une longueur raisonnable
    if (firstName.length >= 3 && firstName.length <= 15) score += 0.1;
    if (lastName.length >= 3 && lastName.length <= 15) score += 0.1;

    // Malus si trop de caractères spéciaux dans le texte original
    const specialCharRatio = (originalText.match(/[^a-zA-ZÀ-ÿ\s]/g) || []).length / originalText.length;
    if (specialCharRatio > 0.3) score -= 0.2;

    // Bonus si le contexte semble être une liste d'élèves
    if (/^\d+\./.test(originalText.trim())) score += 0.1; // Commence par un numéro
    if (/\d{2}\/\d{2}\/\d{4}/.test(originalText)) score += 0.1; // Contient une date

    return Math.max(0, Math.min(1, score));
  }
}
