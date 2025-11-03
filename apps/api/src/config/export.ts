export const EXPORT_CONFIG = {
  pdf: {
    format: 'A4' as const,
    margin: { 
      top: 20, 
      bottom: 20, 
      left: 20, 
      right: 20 
    },
    fontSize: 12,
    lineHeight: 1.5,
    header: {
      height: 30,
      fontSize: 16,
    },
    footer: {
      height: 20,
      fontSize: 10,
    },
  },
  
  excel: {
    sheetName: 'Liste des élèves',
    headerStyle: {
      bold: true,
      backgroundColor: '#f0f0f0',
      fontSize: 12,
    },
    cellStyle: {
      fontSize: 11,
      alignment: 'left',
    },
    columnWidths: {
      firstName: 20,
      lastName: 20,
      dateOfBirth: 15,
      gender: 10,
      studentNumber: 15,
      parentContact: 30,
      address: 40,
    },
  },
  
  csv: {
    delimiter: ',',
    encoding: 'utf8',
    headers: true,
    quoteColumns: true,
  },
  
  // Durée de rétention des fichiers exportés (24h)
  retention: 24 * 60 * 60 * 1000,
  
  // Dossier de stockage temporaire des exports
  tempDir: './uploads/exports',
  
  // Templates disponibles
  templates: {
    standard: {
      name: 'Liste standard',
      description: 'Liste simple avec nom, prénom et informations de base',
      fields: ['lastName', 'firstName', 'dateOfBirth', 'gender'],
    },
    administrative: {
      name: 'Liste administrative',
      description: 'Liste complète avec tous les champs pour l\'administration',
      fields: ['studentNumber', 'lastName', 'firstName', 'dateOfBirth', 'gender', 'address', 'parentContact'],
    },
    parent_contact: {
      name: 'Contacts parents',
      description: 'Liste orientée contact des parents',
      fields: ['lastName', 'firstName', 'parentContact', 'address'],
    },
  },
  
  // Limites
  maxStudentsPerExport: 1000,
  maxExportsPerHour: 10,
};

// Base d'upload compatible serverless (Vercel: /tmp)
const isServerless = !!process.env.VERCEL || !!process.env.LAMBDA_TASK_ROOT;
const uploadsBase = isServerless ? '/tmp/uploads' : './uploads';

export const FILE_PATHS = {
  uploads: `${uploadsBase}`,
  temp: `${uploadsBase}/temp`,
  exports: `${uploadsBase}/exports`,
  pdfs: `${uploadsBase}/pdfs`,
};
