import { useState } from 'react';
import { message } from 'antd';
import { noteService } from '../services/noteService';
import { moyenneService, type CreateMoyenneData } from '../services/moyenneService';
import { classAverageConfigService, type ClassAverageConfig } from '../services/classAverageConfigService';
import type { Student, Subject } from '@edustats/shared';

export interface StudentMoyenneData {
  student: Student;
  notes: Record<number, number>; // subjectId -> note
  total: number;
  moyenne: number;
  rang: number;
}

/**
 * Hook personnalisé pour le calcul et l'enregistrement des moyennes
 */
export const useMoyenneCalculation = () => {
  const [calculating, setCalculating] = useState(false);

  /**
   * Calcule la moyenne selon la configuration de la classe
   */
  const calculateMoyenneWithConfig = (
    notes: Record<number, number>,
    config: ClassAverageConfig,
    subjects: Subject[]
  ): number => {
    try {
      console.log('=== DÉBUT CALCUL MOYENNE ===');
      console.log('Configuration:', config);
      console.log('Notes:', notes);
      
      // Extraire la formule de configuration
      let formulaText = config.formula;
      
      // Nettoyer la formule : enlever le "=" au début s'il existe
      if (formulaText.startsWith('=')) {
        formulaText = formulaText.substring(1);
      }
      
      // Remplacer le symbole de division ÷ par / (opérateur JavaScript)
      formulaText = formulaText.replace(/÷/g, '/');
      
      // Remplacer le symbole de multiplication × par * (opérateur JavaScript)
      formulaText = formulaText.replace(/×/g, '*');
      
      console.log('Formule nettoyée:', formulaText);
      
      // Identifier les matières mentionnées dans la formule
      const subjectsInFormula = subjects.filter(subject => 
        config.formula.includes(subject.name)
      );
      
      console.log('Matières dans la formule:', subjectsInFormula.map(s => s.name));
      
      // Remplacer UNIQUEMENT les noms de matières présentes dans la formule par leurs notes
      subjectsInFormula.forEach(subject => {
        const note = notes[subject.id];
        
        // Si la note n'existe pas pour cette matière, utiliser 0
        const noteValue = (note !== undefined && note !== null) ? note : 0;
        
        // Échapper les caractères spéciaux pour regex
        const escapedName = subject.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Remplacer toutes les occurrences du nom de la matière par sa note
        const regex = new RegExp(escapedName, 'g');
        formulaText = formulaText.replace(regex, noteValue.toString());
      });
      
      console.log('Formule après remplacement:', formulaText);
      
      // Évaluer la formule mathématique
      try {
        // Nettoyer les espaces et parenthèses
        formulaText = formulaText.trim();
        
        // Sécuriser l'évaluation en utilisant Function au lieu de eval
        const result = new Function('return ' + formulaText)();
        const moyenne = Number(result);
        
        if (isNaN(moyenne) || !isFinite(moyenne)) {
          throw new Error('Résultat invalide');
        }
        
        console.log('Moyenne calculée:', moyenne);
        return Math.round(moyenne * 100) / 100; // Arrondir à 2 décimales
      } catch (error) {
        console.error('Erreur lors de l\'évaluation de la formule:', error);
        console.error('Formule problématique:', formulaText);
        
        // Calcul par défaut : utiliser UNIQUEMENT les matières de la formule
        const subjectIds = subjectsInFormula.map(s => s.id);
        const notesValues = subjectIds
          .map(id => notes[id])
          .filter(note => note !== undefined && note !== null);
        
        if (notesValues.length > 0) {
          const sum = notesValues.reduce((sum, note) => sum + note, 0);
          const divisor = Number(config.divisor); // S'assurer que le diviseur est un nombre
          const avg = sum / divisor;
          return Math.round(avg * 100) / 100;
        }
        return 0;
      }
    } catch (error) {
      console.error('Erreur lors du calcul de la moyenne:', error);
      return 0;
    }
  };

  /**
   * Calcule les moyennes pour tous les élèves d'une évaluation
   */
  const calculateMoyennes = async (
    classId: number,
    evaluationId: number,
    students: Student[],
    subjects: Subject[]
  ): Promise<StudentMoyenneData[]> => {
    try {
      setCalculating(true);
      
      console.log('Début du calcul des moyennes:', {
        classId,
        evaluationId,
        studentsCount: students.length,
        subjectsCount: subjects.length
      });
      
      // Charger toutes les notes de l'évaluation
      const allNotes = await noteService.getNotesByClassAndEvaluation(classId, evaluationId);
      
      console.log('Notes chargées:', allNotes);
      
      // Charger les configurations de classe
      const configs = await classAverageConfigService.getConfigs();
      const classConfig = configs.find(config => config.classId === classId);
      
      // Organiser les notes par élève
      const studentsWithNotes: StudentMoyenneData[] = [];
      
      for (const student of students) {
        const notesMap: Record<number, number> = {};
        let isStudentAbsent = false;
        
        // Récupérer les notes de l'élève
        const studentNotes = allNotes.filter(note => note.studentId === student.id);
        
        // Vérifier si l'élève est absent
        const hasAbsentMark = studentNotes.some(note => note.isAbsent === true);
        if (hasAbsentMark) {
          isStudentAbsent = true;
          console.log(`Élève ${student.name} est marqué absent`);
        }
        
        // Si l'élève n'est pas absent, traiter ses notes
        if (!isStudentAbsent) {
          for (const note of studentNotes) {
            if (note.value !== null && note.value !== undefined) {
              const noteValue = typeof note.value === 'number' 
                ? note.value 
                : parseFloat(note.value.toString());
              
              if (!isNaN(noteValue)) {
                notesMap[note.subjectId] = noteValue;
              }
            }
          }
        }
        
        // Si l'élève n'a aucune note ou est absent, passer au suivant
        if (Object.keys(notesMap).length === 0 || isStudentAbsent) {
          continue;
        }
        
        // Calculer le total
        const total = Object.values(notesMap).reduce((sum, note) => sum + note, 0);
        
        // Calculer la moyenne selon la configuration de la classe
        let moyenne = 0;
        if (classConfig) {
          moyenne = calculateMoyenneWithConfig(notesMap, classConfig, subjects);
        } else {
          // Calcul simple par défaut (moyenne arithmétique)
          const notesValues = Object.values(notesMap);
          if (notesValues.length > 0) {
            moyenne = Math.round((notesValues.reduce((sum, note) => sum + note, 0) / notesValues.length) * 100) / 100;
          }
        }
        
        studentsWithNotes.push({
          student,
          notes: notesMap,
          total,
          moyenne,
          rang: 0 // Sera calculé après le tri
        });
      }
      
      // Calculer les rangs (tri décroissant par moyenne)
      const sortedStudents = [...studentsWithNotes].sort((a, b) => b.moyenne - a.moyenne);
      sortedStudents.forEach((studentData, index) => {
        studentData.rang = index + 1;
      });
      
      console.log('Moyennes calculées:', sortedStudents);
      
      return sortedStudents;
    } catch (error) {
      console.error('Erreur lors du calcul des moyennes:', error);
      message.error('Erreur lors du calcul des moyennes');
      throw error;
    } finally {
      setCalculating(false);
    }
  };

  /**
   * Enregistre les moyennes dans la base de données
   */
  const saveMoyennes = async (
    evaluationId: number,
    studentsData: StudentMoyenneData[]
  ): Promise<void> => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Préparer les données à enregistrer
      const moyennes: CreateMoyenneData[] = studentsData.map(studentData => ({
        studentId: studentData.student.id,
        evaluationId,
        moyenne: studentData.moyenne,
        date: currentDate
      }));
      
      // Enregistrer les moyennes
      await moyenneService.upsertMoyennes(moyennes);
      
      console.log(`${moyennes.length} moyennes enregistrées avec succès`);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des moyennes:', error);
      message.error('Erreur lors de l\'enregistrement des moyennes');
      throw error;
    }
  };

  /**
   * Calcule et enregistre les moyennes en une seule opération
   */
  const calculateAndSaveMoyennes = async (
    classId: number,
    evaluationId: number,
    students: Student[],
    subjects: Subject[]
  ): Promise<StudentMoyenneData[]> => {
    try {
      // Calculer les moyennes
      const studentsData = await calculateMoyennes(classId, evaluationId, students, subjects);
      
      if (studentsData.length > 0) {
        // Enregistrer les moyennes
        await saveMoyennes(evaluationId, studentsData);
        message.success(`Moyennes calculées et enregistrées pour ${studentsData.length} élève(s)`);
      } else {
        message.info('Aucune moyenne à calculer pour cette évaluation');
      }
      
      return studentsData;
    } catch (error) {
      console.error('Erreur lors du calcul et de l\'enregistrement des moyennes:', error);
      throw error;
    }
  };

  return {
    calculating,
    calculateMoyennes,
    saveMoyennes,
    calculateAndSaveMoyennes
  };
};

