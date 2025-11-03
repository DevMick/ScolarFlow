export const PDF_CONFIG = {
  // Format et marges
  format: 'a4',
  orientation: 'portrait',
  unit: 'mm',
  
  // Marges du document
  margins: {
    top: 15,
    right: 15,
    bottom: 15,
    left: 15
  },
  
  // Styles de l'en-tête officiel
  header: {
    ministere: {
      fontSize: 10,
      font: 'helvetica',
      fontStyle: 'bold',
      color: [0, 0, 0]
    },
    sousTexte: {
      fontSize: 8,
      font: 'helvetica',
      fontStyle: 'normal',
      color: [0, 0, 0]
    },
    direction: {
      fontSize: 9,
      font: 'helvetica',
      fontStyle: 'bold',
      color: [0, 0, 0]
    },
    republique: {
      fontSize: 10,
      font: 'helvetica',
      fontStyle: 'bold',
      color: [0, 0, 0]
    },
    anneeScolaire: {
      fontSize: 9,
      font: 'helvetica',
      fontStyle: 'normal',
      color: [0, 0, 0]
    }
  },
  
  // Styles des informations école/classe
  infoSection: {
    fontSize: 9,
    font: 'helvetica',
    fontStyle: 'normal',
    lineHeight: 5
  },
  
  // Styles du titre de l'évaluation
  evaluationTitle: {
    fontSize: 14,
    font: 'helvetica',
    fontStyle: 'bold',
    color: [0, 0, 0]
  },
  
  // Configuration du tableau autoTable
  table: {
    theme: 'grid' as const,
    
    // Styles de l'en-tête du tableau
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: [0, 0, 0],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center' as const,
      valign: 'middle' as const,
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    
    // Styles du corps du tableau
    bodyStyles: {
      fontSize: 8,
      textColor: [0, 0, 0],
      halign: 'center' as const,
      valign: 'middle' as const,
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    
    // Styles alternés pour les lignes (optionnel)
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    
    // Styles des colonnes spécifiques
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },  // N°
      1: { cellWidth: 40, halign: 'left' },    // Nom et Prénoms
      2: { cellWidth: 12, halign: 'center' }   // Sexe
      // Les autres colonnes seront calculées automatiquement
    }
  },
  
  // Styles de la section statistiques
  statistics: {
    fontSize: 10,
    font: 'helvetica',
    fontStyle: 'bold',
    lineHeight: 6,
    boxPadding: 5,
    boxColor: [240, 240, 240]
  }
};
