import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import * as createCsvWriter from 'csv-writer';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, BorderStyle } from 'docx';
import { PrismaClient } from '@prisma/client';
import { EXPORT_CONFIG, FILE_PATHS } from '../config/export';
import { generateExportFilename } from '../utils/fileUpload';
import { Logger } from '../utils/logger';
import type { 
  Student
} from '@edustats/shared';

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'word';
  template?: 'standard' | 'administrative' | 'parent_contact';
  includeInactive?: boolean;
  customFields?: string[];
}

interface ExportResult {
  filename: string;
  filepath: string;
  fileSize: number;
  format: string;
  downloadUrl: string;
}

interface MoyenneData {
  student: Student;
  notes: Record<number, number>;
  total: number;
  moyenne: number;
  rang: number;
}

interface MoyennesExportData {
  classData: any;
  evaluationData: any;
  subjects: any[];
  studentsData: MoyenneData[];
  statistics: {
    moyenneClasse: number;
    totalMax: number;
    moyenneMax: number;
    totalMin: number;
    moyenneMin: number;
  };
  academicYear?: string;
  recapStats?: {
    garconsInscrits: number;
    fillesInscrites: number;
    totalInscrits: number;
    garconsPresents: number;
    fillesPresentes: number;
    totalPresents: number;
    garconsAdmis: number;
    fillesAdmises: number;
    totalAdmis: number;
    pourcentageAdmis: number;
  };
}

export class ExportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Exporte les moyennes au format Word
   */
  async exportMoyennesToWord(
    classId: number,
    evaluationId: number,
    userId: number
  ): Promise<ExportResult> {
    try {
      // Récupérer les données de la classe
      const classData = await this.prisma.classes.findFirst({
        where: { id: classId },
        include: { user: true }
      });

      if (!classData) {
        throw new Error('Classe non trouvée');
      }

      // Récupérer les données de l'évaluation
      const evaluationData = await this.prisma.evaluations.findFirst({
        where: { id: evaluationId }
      });

      if (!evaluationData) {
        throw new Error('Évaluation non trouvée');
      }

      // Récupérer l'année scolaire active de l'utilisateur
      const activeSchoolYear = await this.prisma.schoolYear.findFirst({
        where: { 
          userId: userId,
          isActive: true 
        }
      });

      const academicYear = activeSchoolYear 
        ? `${activeSchoolYear.startYear}-${activeSchoolYear.endYear}`
        : new Date().getFullYear() + '-' + (new Date().getFullYear() + 1);

      // Récupérer les matières
      const subjects = await this.prisma.subject.findMany({
        where: { class_id: classId }
      });

      if (subjects.length === 0) {
        throw new Error('Aucune matière trouvée pour cette classe');
      }

      // Récupérer les élèves avec leurs notes et moyennes depuis la base de données
      const studentsData: MoyenneData[] = [];
      const students = await this.prisma.students.findMany({
        where: { class_id: classId }
      });

      for (const student of students) {
        const notesMap: Record<number, number> = {};
        let isStudentAbsent = false;
        
        for (const subject of subjects) {
          const note = await this.prisma.note.findFirst({
            where: {
              studentId: student.id,
              subjectId: subject.id,
              evaluationId: evaluationId
            }
          });
          
          if (note) {
            // Vérifier si l'élève est absent
            if (note.isAbsent) {
              isStudentAbsent = true;
            }
            
            notesMap[subject.id] = typeof note.value === 'number' 
              ? note.value 
              : parseFloat(note.value.toString());
          }
        }

        // Si l'élève est absent, ne pas l'inclure dans le document
        if (isStudentAbsent) {
          continue;
        }

        // Récupérer la moyenne depuis la table moyennes
        const moyenneRecord = await this.prisma.moyenne.findFirst({
          where: {
            studentId: student.id,
            evaluationId: evaluationId
          }
        });

        // Utiliser la moyenne enregistrée, ou calculer si elle n'existe pas
        const total = Object.values(notesMap).reduce((sum, note) => sum + note, 0);
        const moyenne = moyenneRecord 
          ? (typeof moyenneRecord.moyenne === 'number' 
              ? moyenneRecord.moyenne 
              : parseFloat(moyenneRecord.moyenne.toString()))
          : (total / subjects.length);

        studentsData.push({
          student: {
            ...student,
            gender: student.gender as 'M' | 'F' | undefined,
            student_number: student.studentNumber || undefined
          },
          notes: notesMap,
          total,
          moyenne,
          rang: 0
        });
      }

      // Calculer les rangs
      const sortedStudents = [...studentsData].sort((a, b) => b.moyenne - a.moyenne);
      sortedStudents.forEach((studentData, index) => {
        studentData.rang = index + 1;
      });

      // Calculer les statistiques
      const moyennes = studentsData.map(s => s.moyenne);
      const totaux = studentsData.map(s => s.total);
      const statistics = {
        moyenneClasse: Math.round((moyennes.reduce((a, b) => a + b, 0) / moyennes.length) * 100) / 100,
        totalMax: Math.max(...totaux),
        moyenneMax: Math.max(...moyennes),
        totalMin: Math.min(...totaux),
        moyenneMin: Math.min(...moyennes)
      };

      // Récupérer TOUS les élèves de la classe pour les statistiques
      const allStudents = await this.prisma.students.findMany({
        where: { class_id: classId }
      });
      
      // Calculer les statistiques par genre pour le récapitulatif
      const garconsInscrits = allStudents.filter(s => s.gender === 'M');
      const fillesInscrites = allStudents.filter(s => s.gender === 'F');
      const totalInscrits = allStudents.length;
      
      const garconsPresents = studentsData.filter(s => s.student.gender === 'M');
      const fillesPresentes = studentsData.filter(s => s.student.gender === 'F');
      const totalPresents = studentsData.length;
      
      const totalAdmis = studentsData.filter(s => s.moyenne >= 10).length;
      const garconsAdmis = garconsPresents.filter(s => s.moyenne >= 10).length;
      const fillesAdmises = fillesPresentes.filter(s => s.moyenne >= 10).length;
      const pourcentageAdmis = totalInscrits > 0 ? Math.round((totalAdmis / totalInscrits) * 100) : 0;

      // Générer le document Word
      const exportData: MoyennesExportData = {
        classData,
        evaluationData,
        subjects,
        studentsData: sortedStudents,
        statistics,
        academicYear,
        // Ajouter les statistiques pour le récapitulatif
        recapStats: {
          garconsInscrits: garconsInscrits.length,
          fillesInscrites: fillesInscrites.length,
          totalInscrits,
          garconsPresents: garconsPresents.length,
          fillesPresentes: fillesPresentes.length,
          totalPresents,
          garconsAdmis,
          fillesAdmises,
          totalAdmis,
          pourcentageAdmis
        }
      };

      return await this.exportMoyennesToWordDocument(exportData);
    } catch (error) {
      Logger.error('Erreur lors de l\'export Word des moyennes:', error);
      throw new Error('Erreur lors de l\'export Word des moyennes');
    }
  }

  /**
   * Exporte les moyennes au format PDF
   */
  async exportMoyennesToPDF(
    classId: number,
    evaluationId: number,
    userId: number
  ): Promise<ExportResult> {
    try {
      // Récupérer les données de la classe
      const classData = await this.prisma.classes.findFirst({
        where: { id: classId },
        include: { user: true }
      });

      if (!classData) {
        throw new Error('Classe non trouvée');
      }

      // Récupérer les données de l'évaluation
      const evaluationData = await this.prisma.evaluations.findFirst({
        where: { id: evaluationId }
      });

      if (!evaluationData) {
        throw new Error('Évaluation non trouvée');
      }

      // Récupérer les matières de la classe
      const subjects = await this.prisma.subject.findMany({
        where: { class_id: classId }
      });

      // Récupérer les élèves de la classe
      const students = await this.prisma.students.findMany({
        where: { class_id: classId }
      });

      // Récupérer les notes et moyennes depuis la base de données
      const studentsData: MoyenneData[] = [];
      
      for (const student of students) {
        const notesMap: Record<number, number> = {};
        let isStudentAbsent = false;
        
        for (const subject of subjects) {
          const note = await this.prisma.note.findFirst({
            where: {
              studentId: student.id,
              subjectId: subject.id,
              evaluationId: evaluationId
            }
          });
          
          if (note) {
            // Vérifier si l'élève est absent
            if (note.isAbsent) {
              isStudentAbsent = true;
            }
            
            notesMap[subject.id] = typeof note.value === 'number' 
              ? note.value 
              : parseFloat(note.value.toString());
          }
        }
        
        // Si l'élève est absent, ne pas l'inclure dans le document
        if (isStudentAbsent) {
          continue;
        }

        // Récupérer la moyenne depuis la table moyennes
        const moyenneRecord = await this.prisma.moyenne.findFirst({
          where: {
            studentId: student.id,
            evaluationId: evaluationId
          }
        });
        
        const total = Object.values(notesMap).reduce((sum, note) => sum + note, 0);
        const moyenne = moyenneRecord 
          ? (typeof moyenneRecord.moyenne === 'number' 
              ? moyenneRecord.moyenne 
              : parseFloat(moyenneRecord.moyenne.toString()))
          : (subjects.length > 0 ? total / subjects.length : 0);
        
        studentsData.push({
          student: {
            ...student,
            gender: student.gender as 'M' | 'F' | undefined,
            student_number: student.studentNumber || undefined
          },
          notes: notesMap,
          total,
          moyenne: Math.round(moyenne * 100) / 100,
          rang: 0
        });
      }

      // Calculer les rangs
      const sortedStudents = [...studentsData].sort((a, b) => b.moyenne - a.moyenne);
      sortedStudents.forEach((studentData, index) => {
        studentData.rang = index + 1;
      });

      // Calculer les statistiques
      const moyennes = studentsData.map(s => s.moyenne);
      const totaux = studentsData.map(s => s.total);
      
      const statistics = {
        moyenneClasse: Math.round((moyennes.reduce((a, b) => a + b, 0) / moyennes.length) * 100) / 100,
        totalMax: Math.max(...totaux),
        moyenneMax: Math.max(...moyennes),
        totalMin: Math.min(...totaux),
        moyenneMin: Math.min(...moyennes)
      };

      // Générer le PDF
      const exportData: MoyennesExportData = {
        classData,
        evaluationData,
        subjects,
        studentsData: sortedStudents,
        statistics
      };

      return await this.exportMoyennesToPDFDocument(exportData);
    } catch (error) {
      Logger.error('Erreur lors de l\'export des moyennes:', error);
      throw new Error('Erreur lors de l\'export des moyennes');
    }
  }

  /**
   * Génère le document Word pour les moyennes
   */
  private async exportMoyennesToWordDocument(
    data: MoyennesExportData
  ): Promise<ExportResult> {
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
                      new Paragraph({ children: [new TextRun({ text: `DIRECTION REGIONALE ${data.classData.user.directionRegionale.toUpperCase()}`, bold: true, size: 20 })] }),
                      new Paragraph({ children: [new TextRun({ text: "------------", size: 20 })] }),
                      new Paragraph({ children: [new TextRun({ text: "INSPECTION DE L'ENSEIGNEMENT", bold: true, size: 20 })] }),
                      new Paragraph({ children: [new TextRun({ text: `PRESCOLAIRE ET PRIMAIRE ${data.classData.user.directionRegionale.toUpperCase()}`, bold: true, size: 20 })] })
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
                          new TextRun({ text: data.academicYear || "2025-2026", bold: true, size: 20 })
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 300 }
                      })
                    ],
                    width: { size: 40, type: WidthType.PERCENTAGE },
                  })
                ]
              })
            ]
          }),

          // Ligne Ecole
          new Paragraph({
            children: [new TextRun({ text: `Ecole : ${data.classData.user.establishment || 'Non renseigné'}`, bold: true, size: 22 })],
            spacing: { before: 200, after: 100 },
            alignment: AlignmentType.LEFT
          }),

          // Ligne Secteur Pédagogique, Classe, Maître/Maîtresse
          new Paragraph({
            children: [
              new TextRun({ text: `Secteur Pédagogique : ${data.classData.user.secteurPedagogique}      `, size: 22 }),
              new TextRun({ text: `Classe : ${data.classData.name}      `, size: 22 }),
              new TextRun({ text: `${data.classData.user.gender === 'F' ? 'Maîtresse' : 'Maître'} : ${data.classData.user.lastName.toUpperCase()} ${data.classData.user.firstName.toUpperCase()}`, size: 22 })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 200 }
          }),
          
          // Titre évaluation
          new Paragraph({
            children: [
              new TextRun({
                text: `${data.evaluationData.nom} DU ${new Date(data.evaluationData.date).toLocaleDateString('fr-FR')}`,
                bold: true,
                size: 24
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 }
          }),
          
          // Tableau des notes - Structure exacte du template Handlebars
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              // En-tête du tableau
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [new TextRun({ text: "N°", bold: true })] 
                    })],
                    width: { size: 8, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [new TextRun({ text: "Nom et Prénoms", bold: true })],
                      alignment: AlignmentType.LEFT
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
                    width: { size: 6, type: WidthType.PERCENTAGE }
                  }),
                  ...data.subjects.map(subject => 
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: subject.name, bold: true })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 10, type: WidthType.PERCENTAGE }
                    })
                  ),
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [new TextRun({ text: "TOTAL", bold: true })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 10, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [new TextRun({ text: "MOY", bold: true })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 8, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [new TextRun({ text: "OBS", bold: true })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 6, type: WidthType.PERCENTAGE }
                  })
                ]
              }),
              // Lignes des élèves
              ...data.studentsData.map((studentData, index) => 
                new TableRow({
                  children: [
                     new TableCell({
                       children: [new Paragraph({ 
                         children: [new TextRun({ 
                           text: index < 9 ? `0${index + 1}` : `${index + 1}`,
                           size: 22
                         })]
                       })]
                     }),
                     new TableCell({
                       children: [new Paragraph({ 
                         children: [new TextRun({ text: studentData.student.name, size: 22 })],
                         alignment: AlignmentType.LEFT
                       })]
                     }),
                     new TableCell({
                       children: [new Paragraph({ 
                         children: [new TextRun({ text: studentData.student.studentNumber || '-', size: 22 })],
                         alignment: AlignmentType.CENTER
                       })]
                     }),
                     new TableCell({
                       children: [new Paragraph({ 
                         children: [new TextRun({ text: studentData.student.gender === 'M' ? 'M' : 'F', size: 22 })],
                         alignment: AlignmentType.CENTER
                       })]
                     }),
                    ...data.subjects.map(subject => 
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ 
                            text: studentData.notes[subject.id] ? studentData.notes[subject.id].toFixed(0) : '-',
                            size: 22
                          })],
                          alignment: AlignmentType.CENTER
                        })]
                      })
                    ),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: studentData.total.toFixed(0), size: 22 })],
                        alignment: AlignmentType.CENTER
                      })]
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: studentData.moyenne.toFixed(2), size: 22 })],
                        alignment: AlignmentType.CENTER
                      })]
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: studentData.moyenne >= 10 ? 'A' : 'R', size: 22 })],
                        alignment: AlignmentType.CENTER
                      })]
                    })
                  ]
                })
              )
            ]
          }),
          
          // RÉCAPITULATIF DES RÉSULTATS
          new Paragraph({
            children: [
              new TextRun({
                text: "RÉCAPITULATIF DES RÉSULTATS",
                bold: true,
                size: 24
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 800, after: 400 }
          }),
          
          // Calculer les statistiques par genre
          (() => {
            const stats = data.recapStats || {
              garconsInscrits: 0,
              fillesInscrites: 0,
              totalInscrits: 0,
              garconsPresents: 0,
              fillesPresentes: 0,
              totalPresents: 0,
              garconsAdmis: 0,
              fillesAdmises: 0,
              totalAdmis: 0,
              pourcentageAdmis: 0
            };

            return new Table({
              width: {
                size: 60,
                type: WidthType.PERCENTAGE,
              },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
              },
              rows: [
                // En-tête
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "", bold: true, size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      borders: {
                        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
                      }
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "Garç.", bold: true, size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      margins: { top: 50, bottom: 50, left: 50, right: 50 }
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "Fille", bold: true, size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      margins: { top: 50, bottom: 50, left: 50, right: 50 }
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "Total", bold: true, size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      margins: { top: 50, bottom: 50, left: 50, right: 50 }
                    })
                  ]
                }),
                // Inscrits
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "Inscrits", bold: true, size: 22 })],
                        alignment: AlignmentType.LEFT
                      })],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      margins: { top: 50, bottom: 50, left: 50, right: 50 }
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: stats.garconsInscrits.toString(), size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      margins: { top: 50, bottom: 50, left: 50, right: 50 }
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: stats.fillesInscrites.toString(), size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      margins: { top: 50, bottom: 50, left: 50, right: 50 }
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: stats.totalInscrits.toString(), size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      margins: { top: 50, bottom: 50, left: 50, right: 50 }
                    })
                  ]
                }),
                // Présents
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "Présents", bold: true, size: 22 })],
                        alignment: AlignmentType.LEFT
                      })],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      margins: { top: 50, bottom: 50, left: 50, right: 50 }
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: stats.garconsPresents.toString(), size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      margins: { top: 50, bottom: 50, left: 50, right: 50 }
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: stats.fillesPresentes.toString(), size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      margins: { top: 50, bottom: 50, left: 50, right: 50 }
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: stats.totalPresents.toString(), size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      margins: { top: 50, bottom: 50, left: 50, right: 50 }
                    })
                  ]
                }),
                // Admis
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: "Admis", bold: true, size: 22 })],
                        alignment: AlignmentType.LEFT
                      })],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      margins: { top: 50, bottom: 50, left: 50, right: 50 }
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: stats.garconsAdmis.toString(), size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      margins: { top: 50, bottom: 50, left: 50, right: 50 }
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: stats.fillesAdmises.toString(), size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      margins: { top: 50, bottom: 50, left: 50, right: 50 }
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: stats.totalAdmis.toString(), size: 22 })],
                        alignment: AlignmentType.CENTER
                      })],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      margins: { top: 50, bottom: 50, left: 50, right: 50 }
                    })
                  ]
                })
              ]
            });
          })(),
          
          // Pourcentage d'admis
          new Paragraph({
            children: [
              new TextRun({
                text: `% Admis : ${data.recapStats?.pourcentageAdmis || 0}`,
                bold: true,
                size: 22
              })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { before: 400, after: 400 }
          }),

          // Section des signatures
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
                  // Colonne gauche - Directeur
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "LE DIRECTEUR", bold: true, size: 22 })],
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 800, after: 400 }
                      })
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE }
                  }),
                  // Colonne droite - Chef de circonscription
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "Le chef de circonscription", bold: true, size: 22 })],
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 800, after: 400 }
                      })
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE }
                  })
                ]
              })
            ]
          })
        ]
      }]
    });

    // Générer le fichier
    const buffer = await Packer.toBuffer(doc);
    
    // Créer le nom de fichier basé sur l'évaluation (format cohérent avec PDF)
    const evaluationDate = new Date(data.evaluationData.date).toLocaleDateString('fr-FR').replace(/\//g, '-');
    const cleanEvaluationName = data.evaluationData.nom.replace(/[<>:"/\\|?*\s]/g, '_');
    const filename = `moyennes-${data.classData.name}-${cleanEvaluationName}-${evaluationDate}.docx`;
    const filepath = path.join(FILE_PATHS.exports, filename);
    
    // S'assurer que le dossier existe
    await fs.promises.mkdir(FILE_PATHS.exports, { recursive: true });
    
    // Écrire le fichier
    await fs.promises.writeFile(filepath, buffer);
    
    const stats = await fs.promises.stat(filepath);
    
    return {
      filename,
      filepath,
      fileSize: stats.size,
      format: 'word',
      downloadUrl: `/api/exports/download/${filename}`
    };
  }

  /**
   * Génère le document PDF pour les moyennes
   */
  private async exportMoyennesToPDFDocument(
    data: MoyennesExportData
  ): Promise<ExportResult> {
    const doc = new jsPDF({
      orientation: 'portrait', // Portrait comme l'exemple
      unit: 'mm',
      format: 'a4'
    });

    const config = EXPORT_CONFIG.pdf;
    let yPosition = config.margin.top;

    // ========================================
    // EN-TÊTE OFFICIEL - STRUCTURE EXACTE
    // ========================================
    
    // 1. Bloc supérieur institutionnel
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('MINISTERE DE L\'EDUCATION NATIONALE', config.margin.left, yPosition);
    yPosition += 3;
    doc.text('DE L\'ALPHABETISATIONUNION-DISCIPLINE-TRAVAIL', config.margin.left, yPosition);
    yPosition += 6;

    // République de Côte d'Ivoire - côté droit (même niveau)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('REPUBLIQUE DE COTE D\'IVOIRE', 140, 15);

    // 2. Bloc identification de la direction
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('DIRECTION REGIONALE D\'ABOISSO', config.margin.left, yPosition);
    yPosition += 8; // Augmentation de l'espacement de 3 à 8
    doc.text('INSPECTION DE L\'ENSEIGNEMENT', config.margin.left, yPosition);
    yPosition += 3;
    doc.text('PRESCOLAIRE ET PRIMAIRE D\'ABOISSO', config.margin.left, yPosition);
    yPosition += 6;

    // 3. Année scolaire (droite, même niveau)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('ANNEE SCOLAIRE : 2024-2025', 140, 35);

    // 4. Code de l'école (avec soulignement)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const schoolCodeText = 'EPP EBOAKRO1';
    doc.text(schoolCodeText, config.margin.left, yPosition);
    
    // Ajouter le soulignement
    const schoolCodeWidth = doc.getTextWidth(schoolCodeText);
    doc.setLineWidth(0.5);
    doc.line(config.margin.left, yPosition + 1, config.margin.left + schoolCodeWidth, yPosition + 1);
    
    yPosition += 8;

    // Ligne d'identification de la classe supprimée pour éviter la redondance

    // 5. Titre de l'évaluation (centré et souligné)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const evalDate = new Date(data.evaluationData.date).toLocaleDateString('fr-FR');
    const evalTitle = `EVALUATION N°2 DU ${evalDate}`;
    
    // Centrer le texte
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth(evalTitle);
    const centerX = (pageWidth - textWidth) / 2;
    
    doc.text(evalTitle, centerX, yPosition);
    
    // Ajouter le soulignement sous le texte uniquement (pas sur toute la largeur)
    const underlineY = yPosition + 1;
    doc.setLineWidth(0.5);
    doc.line(centerX, underlineY, centerX + textWidth, underlineY);
    
    yPosition += 15;

    // Tableau des moyennes - style officiel
    const tableStartY = yPosition;
    
    // Calculer les largeurs de colonnes pour le format A4 portrait
    const tableWidth = 210 - config.margin.left - config.margin.right;
    const colWidths = [
      8,   // N°
      35,  // Nom et Prénoms
      8,   // Sexe
      ...data.subjects.map(() => 15), // Matières (largeur fixe)
      12,  // Total
      12,  // Moyen
      8    // Obs
    ];
    
    // Ajuster les largeurs si nécessaire
    const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);
    if (totalWidth > tableWidth) {
      const ratio = tableWidth / totalWidth;
      colWidths.forEach((width, index) => {
        colWidths[index] = width * ratio;
      });
    }

    // En-têtes du tableau
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    let xPosition = config.margin.left;
    
    const headers = [
      'N°',
      'Nom et Prénoms',
      'SEXE',
      ...data.subjects.map(s => s.name.toUpperCase().substring(0, 12)), // Limiter la longueur
      'TOTAL',
      'MOYEN',
      'OBS'
    ];

    headers.forEach((header, index) => {
      // Dessiner la bordure de la cellule d'en-tête
      doc.rect(xPosition, yPosition - 4, colWidths[index], 8);
      
      // Centrer le texte dans la cellule
      const textX = xPosition + colWidths[index] / 2;
      doc.text(header, textX, yPosition, { align: 'center' });
      
      xPosition += colWidths[index];
    });
    
    yPosition += 4;

    // Données des élèves
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    data.studentsData.forEach((studentData, index) => {
      // Vérifier si on a besoin d'une nouvelle page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = config.margin.top;
      }

      xPosition = config.margin.left;
      
      // Dessiner la ligne de données avec bordures
      colWidths.forEach((width, colIndex) => {
        // Dessiner la bordure de la cellule
        doc.rect(xPosition, yPosition - 3, width, 6);
        
        let cellText = '';
        let textAlign: 'left' | 'center' | 'right' = 'center';
        
        switch (colIndex) {
          case 0: // N°
            cellText = (index + 1).toString().padStart(2, '0');
            textAlign = 'center';
            break;
          case 1: // Nom et Prénoms
            cellText = studentData.student.name.toUpperCase();
            textAlign = 'left';
            break;
          case 2: // Sexe
            cellText = studentData.student.gender || 'N/A';
            textAlign = 'center';
            break;
          default:
            if (colIndex < 3 + data.subjects.length) {
              // Notes par matière
              const subjectIndex = colIndex - 3;
              const subject = data.subjects[subjectIndex];
              const note = studentData.notes[subject.id];
              cellText = note !== undefined ? note.toString() : '-';
              textAlign = 'center';
            } else if (colIndex === 3 + data.subjects.length) {
              // Total
              cellText = studentData.total.toFixed(0);
              textAlign = 'center';
            } else if (colIndex === 4 + data.subjects.length) {
              // Moyenne
              cellText = studentData.moyenne.toFixed(2);
              textAlign = 'center';
            } else if (colIndex === 5 + data.subjects.length) {
              // Observation
              cellText = studentData.moyenne >= 10 ? 'A' : 'NA'; // A = Admis, NA = Non Admis
              textAlign = 'center';
            }
            break;
        }
        
        // Positionner le texte dans la cellule
        let textX: number;
        const align = textAlign as 'left' | 'center' | 'right';
        if (align === 'left') {
          textX = xPosition + 1;
        } else if (align === 'right') {
          textX = xPosition + width - 1;
        } else {
          textX = xPosition + width / 2; // center par défaut
        }
        
        doc.text(cellText, textX, yPosition, { align: textAlign });
        
        xPosition += width;
      });
      
      yPosition += 6;
    });

    // Générer le nom du fichier (format cohérent avec Word)
    const evaluationDate = new Date(data.evaluationData.date).toLocaleDateString('fr-FR').replace(/\//g, '-');
    const cleanEvaluationName = data.evaluationData.nom.replace(/[<>:"/\\|?*\s]/g, '_');
    const filename = `moyennes-${data.classData.name}-${cleanEvaluationName}-${evaluationDate}.pdf`;
    const filepath = path.join(FILE_PATHS.temp, filename);

    // Sauvegarder le PDF
    const pdfBuffer = doc.output('arraybuffer');
    await fs.promises.writeFile(filepath, Buffer.from(pdfBuffer));

    return {
      filename,
      filepath,
      fileSize: pdfBuffer.byteLength,
      format: 'pdf',
      downloadUrl: `/api/exports/download/${filename}`
    };
  }

  /**
   * Exporte les élèves au format demandé
   */
async exportStudents(
    classId: number,
    userId: number,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      Logger.info('Starting student export', { classId, userId, format: options.format });

      // Vérifier que la classe appartient à l'utilisateur
      await this.verifyClassOwnership(classId, userId);

      // Récupérer les données de la classe et des élèves
      const classData = await this.getClassData(classId);
      const students = await this.getStudentsForExport(classId, options);

      // Générer le fichier selon le format
      let result: ExportResult;
      
      switch (options.format) {
        case 'pdf':
          result = await this.exportToPDF(classData, students, options);
          break;
        case 'excel':
          result = await this.exportToExcel(classData, students, options);
          break;
        case 'csv':
          result = await this.exportToCSV(classData, students, options);
          break;
        default:
          throw new Error(`Format d'export non supporté: ${options.format}`);
      }

      Logger.info('Export completed successfully', { 
        classId, 
        userId, 
        format: options.format,
        filename: result.filename 
      });

      return result;
    } catch (error) {
      Logger.error('Export failed', error);
      throw error;
    }
  }

  /**
   * Exporte au format PDF
   */
  private async exportToPDF(
    classData: any,
    students: Student[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const config = EXPORT_CONFIG.pdf;
    let yPosition = config.margin.top;

    // En-tête
    doc.setFontSize(config.header.fontSize);
    doc.setFont('helvetica', 'bold');
    doc.text('Liste des élèves', config.margin.left, yPosition);
    yPosition += 10;

    doc.setFontSize(config.fontSize);
    doc.setFont('helvetica', 'normal');
    doc.text(`Classe: ${classData.name}`, config.margin.left, yPosition);
    yPosition += 6;
    doc.text(`Enseignant: ${classData.user.firstName} ${classData.user.lastName}`, config.margin.left, yPosition);
    yPosition += 10;

    // Date d'export
    doc.setFontSize(10);
    doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, config.margin.left, yPosition);
    yPosition += 15;

    // Tableau des élèves
    doc.setFontSize(config.fontSize);
    const template = EXPORT_CONFIG.templates[options.template || 'standard'];
    
    // En-têtes du tableau
    doc.setFont('helvetica', 'bold');
    let xPosition = config.margin.left;
    const colWidth = (210 - config.margin.left - config.margin.right) / template.fields.length;

    template.fields.forEach(field => {
      const header = this.getFieldLabel(field);
      doc.text(header, xPosition, yPosition);
      xPosition += colWidth;
    });
    
    yPosition += 8;

    // Ligne de séparation
    doc.line(config.margin.left, yPosition - 2, 210 - config.margin.right, yPosition - 2);
    yPosition += 3;

    // Données des élèves
    doc.setFont('helvetica', 'normal');
    students.forEach((student, index) => {
      if (yPosition > 250) { // Nouvelle page si nécessaire
        doc.addPage();
        yPosition = config.margin.top;
      }

      xPosition = config.margin.left;
      template.fields.forEach(field => {
        const value = this.getFieldValue(student, field);
        doc.text(value, xPosition, yPosition);
        xPosition += colWidth;
      });
      
      yPosition += 6;
    });

    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(config.footer.fontSize);
      doc.text(
        `Page ${i} sur ${pageCount}`,
        210 - config.margin.right - 20,
        297 - config.margin.bottom
      );
    }

    // Sauvegarder le fichier
    const fileName = generateExportFilename('pdf', 'students');
    const filePath = path.join(FILE_PATHS.exports, fileName);
    
    if (!fs.existsSync(FILE_PATHS.exports)) {
      fs.mkdirSync(FILE_PATHS.exports, { recursive: true });
    }

    const pdfBuffer = doc.output('arraybuffer');
    fs.writeFileSync(filePath, Buffer.from(pdfBuffer));

    return {
      filename: fileName,
      filepath: filePath,
      fileSize: Buffer.from(pdfBuffer).length,
      format: 'pdf',
      downloadUrl: `/api/exports/${fileName}`
    };
  }

  /**
   * Exporte au format Excel
   */
  private async exportToExcel(
    classData: any,
    students: Student[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const workbook = XLSX.utils.book_new();
    const template = EXPORT_CONFIG.templates[options.template || 'standard'];

    // Préparer les données
    const headers = template.fields.map(field => this.getFieldLabel(field));
    const data = students.map(student => 
      template.fields.map(field => this.getFieldValue(student, field))
    );

    // Ajouter les métadonnées en haut
    const metaData = [
      [`Classe: ${classData.name}`],
      [`Enseignant: ${classData.user.firstName} ${classData.user.lastName}`],
      [`Exporté le: ${new Date().toLocaleDateString('fr-FR')}`],
      [''], // Ligne vide
      headers
    ];

    const allData = [...metaData, ...data];
    const worksheet = XLSX.utils.aoa_to_sheet(allData);

    // Styliser les en-têtes
    const headerRow = 5; // Index de la ligne d'en-têtes
    template.fields.forEach((field, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: headerRow, c: index });
      if (!worksheet[cellRef]) return;
      
      worksheet[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'F0F0F0' } }
      };
    });

    // Ajuster la largeur des colonnes
    const colWidths = template.fields.map(field => 
      EXPORT_CONFIG.excel.columnWidths[field as keyof typeof EXPORT_CONFIG.excel.columnWidths] || 15
    );
    worksheet['!cols'] = colWidths.map(w => ({ width: w }));

    XLSX.utils.book_append_sheet(workbook, worksheet, EXPORT_CONFIG.excel.sheetName);

    // Sauvegarder le fichier
    const fileName = generateExportFilename('xlsx', 'students');
    const filePath = path.join(FILE_PATHS.exports, fileName);
    
    if (!fs.existsSync(FILE_PATHS.exports)) {
      fs.mkdirSync(FILE_PATHS.exports, { recursive: true });
    }

    XLSX.writeFile(workbook, filePath);
    const stats = fs.statSync(filePath);

    return {
      filename: fileName,
      filepath: filePath,
      fileSize: stats.size,
      format: 'excel',
      downloadUrl: `/api/exports/${fileName}`
    };
  }

  /**
   * Exporte au format CSV
   */
  private async exportToCSV(
    classData: any,
    students: Student[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const template = EXPORT_CONFIG.templates[options.template || 'standard'];
    const fileName = generateExportFilename('csv', 'students');
    const filePath = path.join(FILE_PATHS.exports, fileName);
    
    if (!fs.existsSync(FILE_PATHS.exports)) {
      fs.mkdirSync(FILE_PATHS.exports, { recursive: true });
    }

    // Configuration du writer CSV
    const csvWriter = createCsvWriter.createObjectCsvWriter({
      path: filePath,
      header: template.fields.map(field => ({
        id: field,
        title: this.getFieldLabel(field)
      })),
      encoding: EXPORT_CONFIG.csv.encoding
    });

    // Préparer les données
    const records = students.map(student => {
      const record: any = {};
      template.fields.forEach(field => {
        record[field] = this.getFieldValue(student, field);
      });
      return record;
    });

    // Écrire le fichier
    await csvWriter.writeRecords(records);

    // Ajouter les métadonnées en commentaires au début du fichier
    const metadata = [
      `# Classe: ${classData.name}`,
      `# Enseignant: ${classData.user.firstName} ${classData.user.lastName}`,
      `# Exporté le: ${new Date().toLocaleDateString('fr-FR')}`,
      ''
    ].join('\n');

    const csvContent = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(filePath, metadata + '\n' + csvContent);

    const stats = fs.statSync(filePath);

    return {
      filename: fileName,
      filepath: filePath,
      fileSize: stats.size,
      format: 'csv',
      downloadUrl: `/api/exports/${fileName}`
    };
  }

  /**
   * Récupère les données de la classe
   */
  private async getClassData(classId: number) {
    return await this.prisma.classes.findUniqueOrThrow({
      where: { id: classId },
      include: {
          users: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Récupère les élèves à exporter selon les options
   */
  private async getStudentsForExport(
    classId: number,
    options: ExportOptions
  ): Promise<Student[]> {
    const students = await this.prisma.students.findMany({
      where: {
        classId,
        ...(options.includeInactive ? {} : { isActive: true })
      },
      orderBy: {
        name: 'asc'
      }
    });

    return students as Student[];
  }

  /**
   * Obtient le libellé d'un champ
   */
  private getFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      name: 'Nom',
      gender: 'Genre',
      studentNumber: 'Numéro élève'
    };

    return labels[field] || field;
  }

  /**
   * Obtient la valeur d'un champ pour un élève
   */
  private getFieldValue(student: Student, field: string): string {
    switch (field) {
      case 'name':
        return student.name || '';
      case 'gender':
        return student.gender === 'M' ? 'M' : 
               student.gender === 'F' ? 'F' : '';
      case 'studentNumber':
        return student.studentNumber || '';
      default:
        return (student as any)[field] || '';
    }
  }

  /**
   * Vérifie qu'une classe appartient à l'utilisateur
   */
  private async verifyClassOwnership(classId: number, userId: number): Promise<void> {
    const classExists = await this.prisma.classes.findFirst({
      where: {
        id: classId,
        userId,
        isActive: true
      }
    });

    if (!classExists) {
      throw new Error('Classe non trouvée ou non autorisée');
    }
  }
}
