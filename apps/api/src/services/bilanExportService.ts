import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, BorderStyle } from 'docx';
import { StudentBilanData } from '@edustats/shared';

export interface BilanExportData {
  className: string;
  schoolYear: string;
  students: StudentBilanData[];
  stats: {
    totalInscrits: number;
    garconsInscrits: number;
    fillesInscrites: number;
    totalPresents: number;
    garconsPresents: number;
    fillesPresentes: number;
    totalAbandons?: number;
    garconsAbandons?: number;
    fillesAbandons?: number;
    totalAdmis: number;
    garconsAdmis: number;
    fillesAdmises: number;
    pourcentageAdmis: number;
    moyenneGeneraleClasse?: number;
    totalRedoublement?: number;
    garconsRedoublement?: number;
    fillesRedoublement?: number;
  };
  classThreshold?: {
    moyenneAdmission: number;
    moyenneRedoublement: number;
    maxNote: number;
  };
  userData?: {
    directionRegionale: string;
    establishment: string;
    secteurPedagogique: string;
    lastName: string;
    firstName: string;
    gender: string;
  };
}

export class BilanExportService {
  static async generateBilanWord(data: BilanExportData): Promise<Buffer> {
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 567,    // 2.00 cm
              right: 567,  // 2.00 cm
              bottom: 567, // 2.00 cm
              left: 567    // 2.00 cm
            }
          }
        },
        children: [
          // En-tête officiel – Alignement conforme au modèle Word
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE }
            },
            rows: [
              new TableRow({
                children: [
                  // Colonne gauche
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "MINISTERE DE L'EDUCATION NATIONALE", bold: true, size: 20 })] }),
                      new Paragraph({ children: [new TextRun({ text: "ET DE L'ALPHABETISATION", bold: true, size: 20 })] }),
                      new Paragraph({ children: [new TextRun({ text: "------------", size: 20 })] }),
                      new Paragraph({ children: [new TextRun({ text: `DIRECTION REGIONALE ${data.userData?.directionRegionale?.toUpperCase() || 'NON RENSEIGNÉ'}`, bold: true, size: 20 })] }),
                      new Paragraph({ children: [new TextRun({ text: "------------", size: 20 })] }),
                      new Paragraph({ children: [new TextRun({ text: "INSPECTION DE L'ENSEIGNEMENT", bold: true, size: 20 })] }),
                      new Paragraph({ children: [new TextRun({ text: `PRESCOLAIRE ET PRIMAIRE ${data.userData?.directionRegionale?.toUpperCase() || 'NON RENSEIGNÉ'}`, bold: true, size: 20 })] })
                    ],
                    width: { size: 60, type: WidthType.PERCENTAGE },
                  }),

                  // Colonne droite
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "REPUBLIQUE DE CÔTE D'IVOIRE", bold: true, size: 20 })],
                        alignment: AlignmentType.RIGHT
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: "------------", size: 20 })],
                        alignment: AlignmentType.RIGHT
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: "UNION - DISCIPLINE - TRAVAIL", italics: true, size: 20 })],
                        alignment: AlignmentType.RIGHT
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "ANNEE SCOLAIRE : ", bold: true, size: 20 }),
                          new TextRun({ text: data.schoolYear, bold: true, size: 20 })
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 300, after: 200 }
                      })
                    ],
                    width: { size: 40, type: WidthType.PERCENTAGE },
                  })
                ]
              })
            ]
          }),

          // Espacement avant les informations
          new Paragraph({
            children: [],
            spacing: { before: 200, after: 0 }
          }),

          // Tableau des effectifs - Positionné à droite avec informations à gauche
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  // Colonne gauche - Informations Ecole, Secteur, Classe
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: `Ecole : ${data.userData?.establishment || 'Non renseigné'}`, bold: true, size: 22 })],
                        spacing: { before: 0, after: 100 },
                        alignment: AlignmentType.LEFT
                      }),
          new Paragraph({
            children: [
                          new TextRun({ text: `Secteur Pédagogique : ${data.userData?.secteurPedagogique || 'Non renseigné'}`, size: 22 })
            ],
            alignment: AlignmentType.LEFT,
                        spacing: { after: 0 }
                      })
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE }
                  }),
                  // Colonne droite - Tableau des effectifs
                  new TableCell({
                    children: [
                      new Table({
                        width: {
                          size: 100,
                          type: WidthType.PERCENTAGE,
                        },
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        },
                        rows: [
                          // En-tête du tableau
                          new TableRow({
                            children: [
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: "", size: 22 })],
                                  alignment: AlignmentType.LEFT,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 60, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 },
                                borders: {
                                  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
                                }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: "G", bold: true, size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 13, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: "F", bold: true, size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 13, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: "T", bold: true, size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 14, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              })
                            ]
                          }),
                          // EFFECTIF EN DÉBUT D'ANNÉE
                          new TableRow({
                            children: [
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: "EFFECTIF EN DÉBUT D'ANNÉE", bold: true, size: 18 })],
                                  alignment: AlignmentType.LEFT,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 60, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: data.stats.garconsInscrits?.toString() || "0", size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 13, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: data.stats.fillesInscrites?.toString() || "0", size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 13, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: data.stats.totalInscrits?.toString() || "0", size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 14, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              })
                            ]
                          }),
                          // ABANDON (S)
                          new TableRow({
                            children: [
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: "ABANDON (S)", bold: true, size: 18 })],
                                  alignment: AlignmentType.LEFT,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 60, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: data.stats.garconsAbandons?.toString() || "0", size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 13, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: data.stats.fillesAbandons?.toString() || "0", size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 13, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: data.stats.totalAbandons?.toString() || "0", size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 14, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              })
                            ]
                          }),
                          // EFFECTIF EN FIN D'ANNÉE
                          new TableRow({
                            children: [
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: "EFFECTIF EN FIN D'ANNÉE", bold: true, size: 18 })],
                                  alignment: AlignmentType.LEFT,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 60, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: data.stats.garconsPresents?.toString() || "0", size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 13, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: data.stats.fillesPresentes?.toString() || "0", size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 13, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: data.stats.totalPresents?.toString() || "0", size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 14, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              })
                            ]
                          })
                        ]
                      })
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE }
                  })
                ]
              })
            ]
          }),
          
          // Titre du bilan
          new Paragraph({
            children: [
              new TextRun({
                text: `BILAN ANNUEL - CLASSE DE ${data.className}`,
                bold: true,
                size: 24
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 }
          }),

          // Tableau principal
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            rows: [
              // En-tête du tableau
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "N°", bold: true })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 5, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "Nom de l'élève", bold: true })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 20, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "Matricule", bold: true })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 10, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "Sexe", bold: true })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 5, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "MOY. COMPO N°1", bold: true })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 10, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "MOY. COMPO N°2", bold: true })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 10, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "MOY. COMPO N°3", bold: true })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 10, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "MOY. ANNUELLE", bold: true })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 10, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "MOY. COMPO DE PASSAGE", bold: true })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 12, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "MGA", bold: true })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 8, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "DÉCISION", bold: true })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 10, type: WidthType.PERCENTAGE }
                  })
                ]
              }),
              
              // Lignes des élèves
              ...data.students.map((student, index) => 
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: (index + 1).toString().padStart(2, '0'), size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 5, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: student.student.name, size: 22 })],
                        alignment: AlignmentType.LEFT
                      })],
                      width: { size: 20, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: student.student.studentNumber || '-', size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 10, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: student.student.gender === 'M' ? 'M' : 'F', size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 5, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: student.moyCompo1 !== null ? student.moyCompo1.toFixed(2) : '-', size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 10, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: student.moyCompo2 !== null ? student.moyCompo2.toFixed(2) : '-', size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 10, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: student.moyCompo3 !== null ? student.moyCompo3.toFixed(2) : '-', size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 10, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: student.moyAnnuelle !== null ? student.moyAnnuelle.toFixed(2) : '-', size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 10, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: student.moyCompoPassage !== null ? student.moyCompoPassage.toFixed(2) : '-', size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 12, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: student.mga !== null ? student.mga.toFixed(2) : '-', size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 8, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ 
                          text: student.decision === 'ADMIS' ? 'A' : student.decision === 'REDOUBLER' ? 'R' : (student.decision || '-'), 
                          size: 22,
                          color: '000000',
                          bold: true
                        })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 10, type: WidthType.PERCENTAGE }
                    })
                  ]
                })
              )
            ]
          }),

          // Section récapitulatif avec moyennes générales
          new Paragraph({
            children: [
              new TextRun({
                text: "MOYENNE GENERALE DE LA CLASSE :",
                bold: true,
                size: 22
              }),
              new TextRun({
                text: data.stats.moyenneGeneraleClasse !== undefined
                  ? ` ${data.stats.moyenneGeneraleClasse.toFixed(2)} /${data.classThreshold?.maxNote || 20}`
                  : ` _____ /${data.classThreshold?.maxNote || 20}`,
                size: 22
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 600, after: 200 }
          }),

          // Tableau avec moyennes d'admission et de redoublement
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  // Colonne gauche - Tableau statistiques
                  new TableCell({
                    children: [
                      new Table({
                        width: {
                          size: 100,
                          type: WidthType.PERCENTAGE,
                        },
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        },
                        rows: [
                          new TableRow({
                            children: [
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: "", size: 22 })],
                                  alignment: AlignmentType.LEFT,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 80, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 },
                                borders: {
                                  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
                                }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: "G", bold: true, size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 7, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: "F", bold: true, size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 7, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: "T", bold: true, size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 7, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              })
                            ]
                          }),
                          new TableRow({
                            children: [
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ 
                                    text: data.classThreshold 
                                      ? `MOYENNE D'ADMISSION ${data.classThreshold.moyenneAdmission} /${data.classThreshold.maxNote}`
                                      : "MOYENNE D'ADMISSION _____ /20", 
                                    bold: true, 
                                    size: 18 
                                  })],
                                  alignment: AlignmentType.LEFT,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 80, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: data.stats.garconsAdmis.toString(), size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 7, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: data.stats.fillesAdmises.toString(), size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 7, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: data.stats.totalAdmis.toString(), size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 7, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              })
                            ]
                          }),
                          new TableRow({
                            children: [
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ 
                                    text: data.classThreshold 
                                      ? `MOYENNE DE REDOUBLEMENT ${data.classThreshold.moyenneRedoublement} /${data.classThreshold.maxNote}`
                                      : "MOYENNE DE REDOUBLEMENT _____ /20", 
                                    bold: true, 
                                    size: 18 
                                  })],
                                  alignment: AlignmentType.LEFT,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 80, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: (data.stats.garconsRedoublement || 0).toString(), size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 7, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: (data.stats.fillesRedoublement || 0).toString(), size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 7, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: (data.stats.totalRedoublement || 0).toString(), size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 7, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              })
                            ]
                          })
                        ]
                      })
                    ],
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    margins: {
                      top: 0,
                      bottom: 0,
                      left: 0,
                      right: 400
                    }
                  }),
                  
                  // Colonne droite - Tableau pourcentages
                  new TableCell({
                    children: [
                      new Table({
                        width: {
                          size: 100,
                          type: WidthType.PERCENTAGE,
                        },
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        },
                        rows: [
                          new TableRow({
                            children: [
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: "POURCENTAGE", bold: true, size: 18 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                columnSpan: 3,
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              })
                            ]
                          }),
                          new TableRow({
                            children: [
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: "G", bold: true, size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 33, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: "F", bold: true, size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 33, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ text: "T", bold: true, size: 22 })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 33, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              })
                            ]
                          }),
                          new TableRow({
                            children: [
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ 
                                    text: data.stats.garconsInscrits > 0 ? 
                                      ((data.stats.garconsAdmis / data.stats.garconsInscrits) * 100).toFixed(1).replace('.', ',') + "%" : 
                                      "0%", 
                                    size: 22 
                                  })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 33, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ 
                                    text: data.stats.fillesInscrites > 0 ? 
                                      ((data.stats.fillesAdmises / data.stats.fillesInscrites) * 100).toFixed(1).replace('.', ',') + "%" : 
                                      "0%", 
                                    size: 22 
                                  })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 33, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ 
                                    text: data.stats.totalInscrits > 0 ? 
                                      ((data.stats.totalAdmis / data.stats.totalInscrits) * 100).toFixed(1).replace('.', ',') + "%" : 
                                      "0%", 
                                    size: 22 
                                  })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 33, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              })
                            ]
                          }),
                          new TableRow({
                            children: [
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ 
                                    text: data.stats.garconsInscrits > 0 ? 
                                      (((data.stats.garconsInscrits - data.stats.garconsAdmis) / data.stats.garconsInscrits) * 100).toFixed(1).replace('.', ',') + "%" : 
                                      "0%", 
                                    size: 22 
                                  })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 33, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ 
                                    text: data.stats.fillesInscrites > 0 ? 
                                      (((data.stats.fillesInscrites - data.stats.fillesAdmises) / data.stats.fillesInscrites) * 100).toFixed(1).replace('.', ',') + "%" : 
                                      "0%", 
                                    size: 22 
                                  })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 33, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              }),
                              new TableCell({
                                children: [new Paragraph({
                                  children: [new TextRun({ 
                                    text: data.stats.totalInscrits > 0 ? 
                                      (((data.stats.totalInscrits - data.stats.totalAdmis) / data.stats.totalInscrits) * 100).toFixed(1).replace('.', ',') + "%" : 
                                      "0%", 
                                    size: 22 
                                  })],
                                  alignment: AlignmentType.CENTER,
                                  spacing: { before: 0, after: 0 }
                                })],
                                width: { size: 33, type: WidthType.PERCENTAGE },
                                margins: { top: 50, bottom: 50, left: 50, right: 50 }
                              })
                            ]
                          })
                        ]
                      })
                    ],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    margins: {
                      top: 0,
                      bottom: 0,
                      left: 400,
                      right: 0
                    }
                  })
                ]
              })
            ]
          }),

          // Signatures
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  // Colonne gauche - Directeur
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "LE DIRECTEUR", bold: true, size: 22, underline: {} })],
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 800, after: 200 }
                      })
                    ],
                    width: { size: 40, type: WidthType.PERCENTAGE }
                  }),
                  // Colonne droite - Tenant de la classe
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "LE TENANT DE LA CLASSE", bold: true, size: 22, underline: {} })],
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 800, after: 200 }
                      })
                    ],
                    width: { size: 30, type: WidthType.PERCENTAGE }
                  })
                ]
              })
            ]
          })
        ]
      }]
    });

    return await Packer.toBuffer(doc);
  }
}
