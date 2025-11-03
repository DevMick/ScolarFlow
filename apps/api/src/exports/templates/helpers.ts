import * as handlebars from 'handlebars';

// Helper pour formater les dates
handlebars.registerHelper('formatDate', function(date: string) {
  return new Date(date).toLocaleDateString('fr-FR');
});

// Helper pour formater les nombres
handlebars.registerHelper('formatNumber', function(num: number, decimals: number = 2) {
  return num.toFixed(decimals);
});

// Helper pour obtenir la couleur selon la moyenne
handlebars.registerHelper('getGradeColor', function(moyenne: number) {
  if (moyenne >= 16) return 'grade-excellent';
  if (moyenne >= 12) return 'grade-good';
  if (moyenne >= 10) return 'grade-average';
  return 'grade-poor';
});

// Helper pour obtenir le statut selon la moyenne
handlebars.registerHelper('getGradeStatus', function(moyenne: number) {
  if (moyenne >= 16) return 'Excellent';
  if (moyenne >= 12) return 'Bien';
  if (moyenne >= 10) return 'Passable';
  return 'Insuffisant';
});

// Helper pour comparer les nombres (greater than or equal)
handlebars.registerHelper('gte', function(a: number, b: number) {
  return a >= b;
});

// Helper pour comparer les nombres (greater than)
handlebars.registerHelper('gt', function(a: number, b: number) {
  return a > b;
});

// Helper pour comparer les nombres (less than)
handlebars.registerHelper('lt', function(a: number, b: number) {
  return a < b;
});

// Helper pour comparer les nombres (less than or equal)
handlebars.registerHelper('lte', function(a: number, b: number) {
  return a <= b;
});

// Helper pour faire une recherche dans un objet
handlebars.registerHelper('lookup', function(obj: any, key: any) {
  return obj && obj[key];
});

// Helper pour calculer un pourcentage
handlebars.registerHelper('percentage', function(value: number, total: number) {
  if (total === 0) return '0%';
  return Math.round((value / total) * 100) + '%';
});

// Helper pour formater une note avec couleur
handlebars.registerHelper('formatGrade', function(grade: number) {
  const formatted = grade.toFixed(2);
  if (grade >= 16) return `<span class="grade-excellent">${formatted}</span>`;
  if (grade >= 12) return `<span class="grade-good">${formatted}</span>`;
  if (grade >= 10) return `<span class="grade-average">${formatted}</span>`;
  return `<span class="grade-poor">${formatted}</span>`;
});

// Helper pour générer un QR code (placeholder)
handlebars.registerHelper('qrCode', function(text: string) {
  return `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="white"/>
      <text x="50" y="50" text-anchor="middle" font-size="10" fill="black">QR</text>
    </svg>
  `).toString('base64')}`;
});

// Helper pour tronquer un texte
handlebars.registerHelper('truncate', function(text: string, length: number) {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
});

// Helper pour capitaliser
handlebars.registerHelper('capitalize', function(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
});

// Helper pour uppercase
handlebars.registerHelper('uppercase', function(text: string) {
  return text.toUpperCase();
});

// Helper pour lowercase
handlebars.registerHelper('lowercase', function(text: string) {
  return text.toLowerCase();
});

// Helper pour compter les éléments
handlebars.registerHelper('count', function(array: any[]) {
  return array ? array.length : 0;
});

// Helper pour vérifier si un élément existe dans un tableau
handlebars.registerHelper('contains', function(array: any[], value: any) {
  return array && array.includes(value);
});

// Helper pour les opérations mathématiques
handlebars.registerHelper('add', function(a: number, b: number) {
  return a + b;
});

handlebars.registerHelper('subtract', function(a: number, b: number) {
  return a - b;
});

handlebars.registerHelper('multiply', function(a: number, b: number) {
  return a * b;
});

handlebars.registerHelper('divide', function(a: number, b: number) {
  return b !== 0 ? a / b : 0;
});

// Helper pour les conditions logiques
handlebars.registerHelper('and', function(a: any, b: any) {
  return a && b;
});

handlebars.registerHelper('or', function(a: any, b: any) {
  return a || b;
});

handlebars.registerHelper('not', function(a: any) {
  return !a;
});

// Helper pour les comparaisons d'égalité
handlebars.registerHelper('eq', function(a: any, b: any) {
  return a === b;
});

handlebars.registerHelper('ne', function(a: any, b: any) {
  return a !== b;
});

// Helper pour extraire le numéro d'une évaluation
handlebars.registerHelper('extractNumber', function(text: string) {
  if (!text) return '';
  
  // Chercher un numéro dans le texte (ex: "EVALUATION N°1", "EVALUATION 2", "N°3", etc.)
  const match = text.match(/(?:N°|n°|N\s*°|n\s*°|#)?\s*(\d+)/i);
  if (match) {
    return match[1];
  }
  
  // Si pas de numéro trouvé, retourner le texte original ou "1" par défaut
  return '1';
});

export default handlebars;
