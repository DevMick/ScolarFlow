import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Select, 
  Typography, 
  Row, 
  Col, 
  message,
  Spin,
  Alert,
  Empty,
  Table,
  Tag
} from 'antd';
import { 
  CalculatorOutlined,
  FileWordOutlined,
  BookOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { noteService, type Note } from '../services/noteService';
import { subjectService, type Subject } from '../services/subjectService';
import { ClassService, type Class } from '../services/classService';
import { StudentService, type Student } from '../services/studentService';
import { evaluationService } from '../services/evaluationService';
// import { evaluationFormulaService, type EvaluationFormula } from '../services/evaluationFormulaService';
import { moyenneService, type CreateMoyenneData } from '../services/moyenneService';
import { MoyenneExportService } from '../services/moyenneExportService';
import { classAverageConfigService, type ClassAverageConfig } from '../services/classAverageConfigService';
import { schoolYearService } from '../services/schoolYearService';
import { useAuth } from '../context/AuthContext';
import { useClassThresholds, type ClassThreshold } from '../hooks/useClassThresholds';
import { ThresholdWarning } from '../components/alerts/ThresholdWarning';
import type { EvaluationSimple, SchoolYear } from '@edustats/shared';

const { Title, Text } = Typography;

interface StudentMoyenneData {
  student: Student;
  notes: Record<number, number>; // subjectId -> note
  total: number;
  moyenne: number;
  rang: number;
}

interface StudentBilanData {
  student: Student;
  moyCompo1: number | null;
  moyCompo2: number | null;
  moyCompo3: number | null;
  moyAnnuelle: number | null;
  moyCompoPassage: number | null;
  mga: number | null;
  decision: string;
}

const BilanAnnuelPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { thresholds, getThresholdByClass } = useClassThresholds();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationSimple[]>([]);
  const [classConfigs, setClassConfigs] = useState<ClassAverageConfig[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number>(0);
  const [selectedFormulaId, setSelectedFormulaId] = useState<number>(0);
  const [studentsData, setStudentsData] = useState<StudentMoyenneData[]>([]);
  const [bilanData, setBilanData] = useState<StudentBilanData[]>([]);
  const [savedMoyennes, setSavedMoyennes] = useState<Set<string>>(new Set());
  const [exportingWord, setExportingWord] = useState(false);

  // Charger les données initiales
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadSchoolYears();
      loadClasses();
      loadClassConfigs(); // Priorité aux configurations de classe
      // loadFormulas(); // Désactivé car l'endpoint retourne une erreur 500
    }
  }, [authLoading, isAuthenticated]);

  // Charger les évaluations quand une classe ou une année scolaire est sélectionnée
  useEffect(() => {
    if (selectedClassId) {
      loadEvaluations();
      loadSubjects();
      loadStudents();
    }
  }, [selectedClassId, selectedSchoolYearId]);

  // Charger les données du bilan annuel
  useEffect(() => {
    if (selectedClassId && selectedSchoolYearId && students.length > 0) {
      loadBilanData();
    }
  }, [selectedClassId, selectedSchoolYearId, students]);

  // Trouver la configuration correspondant à une classe
  const findConfigForClass = (classId: number): ClassAverageConfig | null => {
    return classConfigs.find(config => config.classId === classId) || null;
  };

  // Fonction supprimée - on utilise uniquement les configurations de classe

  const loadSchoolYears = async () => {
    try {
      const data = await schoolYearService.getAll();
      setSchoolYears(data.schoolYears);
      
      // Sélectionner l'année active par défaut
      if (data.activeSchoolYear) {
        setSelectedSchoolYearId(data.activeSchoolYear.id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des années scolaires:', error);
      message.error('Erreur lors du chargement des années scolaires');
    }
  };

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await ClassService.getClasses();
      if (response.success) {
        setClasses(response.data.classes);
        
        // Sélectionner automatiquement la classe s'il n'y en a qu'une seule
        if (response.data.classes.length === 1) {
          setSelectedClassId(response.data.classes[0].id);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des classes:', error);
      message.error('Erreur lors du chargement des classes');
    } finally {
      setLoading(false);
    }
  };

  // Fonction supprimée - on utilise uniquement les configurations de classe

  const loadClassConfigs = async () => {
    try {
      const configsData = await classAverageConfigService.getConfigs();
      console.log('Configurations de classe chargées:', configsData);
      setClassConfigs(configsData);
    } catch (error) {
      console.error('Erreur lors du chargement des configurations de classe:', error);
      // Ne pas bloquer l'interface si les configurations ne peuvent pas être chargées
      // L'utilisateur pourra toujours utiliser les formules de fallback
      message.warning('Impossible de charger les configurations de calcul. Utilisation des formules par défaut.');
    }
  };

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      const evaluationsData = await evaluationService.getEvaluationsByClass(selectedClassId);
      
      // Filtrer par année scolaire si une année est sélectionnée
      const filteredEvaluations = selectedSchoolYearId
        ? evaluationsData.filter(evaluation => evaluation.schoolYearId === selectedSchoolYearId)
        : evaluationsData;
      
      setEvaluations(filteredEvaluations);
      
      // Sélectionner automatiquement la dernière évaluation créée (la plus récente)
      if (filteredEvaluations.length > 0) {
        // Trier par date de création (createdAt) ou par date d'évaluation
        const sortedEvaluations = [...filteredEvaluations].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date);
          const dateB = new Date(b.createdAt || b.date);
          return dateB.getTime() - dateA.getTime(); // Plus récent en premier
        });
        setSelectedEvaluationId(sortedEvaluations[0].id);
      } else {
        setSelectedEvaluationId(0);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des évaluations:', error);
      message.error('Erreur lors du chargement des évaluations');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const subjectsData = await subjectService.getSubjects({ classId: selectedClassId });
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Erreur lors du chargement des matières:', error);
      message.error('Erreur lors du chargement des matières');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await StudentService.getStudentsByClass(selectedClassId);
      if (response.success && response.data) {
        setStudents(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des élèves:', error);
      message.error('Erreur lors du chargement des élèves');
    } finally {
      setLoading(false);
    }
  };

  const loadBilanData = async () => {
    try {
      setLoading(true);
      
      // Charger toutes les évaluations de la classe pour l'année sélectionnée
      const allEvaluations = await evaluationService.getEvaluationsByClass(selectedClassId);
      const filteredEvaluations = allEvaluations.filter(evaluation => evaluation.schoolYearId === selectedSchoolYearId);
      
      // Charger les matières de la classe
      const subjectsData = await subjectService.getSubjects({ classId: selectedClassId });
      setSubjects(subjectsData);
      
      // Trouver les évaluations par type
      const compo1 = filteredEvaluations.find(evaluation => evaluation.nom === 'EVALUATION N°1');
      const compo2 = filteredEvaluations.find(evaluation => evaluation.nom === 'EVALUATION N°2');
      const compo3 = filteredEvaluations.find(evaluation => evaluation.nom === 'EVALUATION N°3');
      const compoPassage = filteredEvaluations.find(evaluation => evaluation.nom === 'COMPOSITION DE PASSAGE');
      
      // Précharger et mettre en cache les notes par matière pour éviter des requêtes répétées
      const subjectNotesCache = new Map<number, Note[]>();
      for (const subject of subjectsData) {
        try {
          const notesForSubject = await noteService.getNotesByClassAndSubject(selectedClassId, subject.id);
          subjectNotesCache.set(subject.id, notesForSubject);
        } catch (e) {
          console.warn(`Impossible de charger les notes pour la matière ${subject.name} (${subject.id})`, e);
          subjectNotesCache.set(subject.id, []);
        }
      }

      // Charger les moyennes pour chaque élève
      const bilanStudentsData: StudentBilanData[] = [];
      
      for (const student of students) {
        let moyCompo1: number | null = null;
        let moyCompo2: number | null = null;
        let moyCompo3: number | null = null;
        let moyCompoPassage: number | null = null;
        
        // Calculer la moyenne pour chaque composition
        if (compo1) {
          moyCompo1 = await calculateStudentMoyenne(student.id, compo1.id, subjectsData, subjectNotesCache);
        }
        if (compo2) {
          moyCompo2 = await calculateStudentMoyenne(student.id, compo2.id, subjectsData, subjectNotesCache);
        }
        if (compo3) {
          moyCompo3 = await calculateStudentMoyenne(student.id, compo3.id, subjectsData, subjectNotesCache);
        }
        if (compoPassage) {
          moyCompoPassage = await calculateStudentMoyenne(student.id, compoPassage.id, subjectsData, subjectNotesCache);
        }
        
        // Calculer la moyenne annuelle (moyenne des 3 compos)
        const moyennesCompos = [moyCompo1, moyCompo2, moyCompo3].filter(m => m !== null) as number[];
        const moyAnnuelle = moyennesCompos.length > 0 
          ? moyennesCompos.reduce((sum, m) => sum + m, 0) / moyennesCompos.length 
          : null;
        
        // Calculer la MGA
        let mga: number | null = null;
        if (moyAnnuelle !== null && moyCompoPassage !== null) {
          mga = (moyAnnuelle + (2 * moyCompoPassage)) / 3;
        }
        
        // Récupérer les seuils de la classe
        const classThreshold = getThresholdByClass(selectedClassId);
        const moyenneAdmission = classThreshold?.moyenneAdmission || 10;
        const moyenneRedoublement = classThreshold?.moyenneRedoublement || 8.5;
        
        // Déterminer la décision
        let decision = '';
        if (mga !== null) {
          if (mga >= moyenneAdmission) {
            decision = 'ADMIS';
          } else if (mga >= moyenneRedoublement) {
            decision = 'REDOUBLER';
          } else {
            decision = 'REDOUBLER';
          }
        }
        
        bilanStudentsData.push({
          student,
          moyCompo1,
          moyCompo2,
          moyCompo3,
          moyAnnuelle,
          moyCompoPassage,
          mga,
          decision
        });
      }
      
      // Classer les élèves par MGA décroissante (ceux sans MGA à la fin)
      const sortedBilan = [...bilanStudentsData].sort((a, b) => {
        const aMga = a.mga === null || a.mga === undefined ? -Infinity : a.mga;
        const bMga = b.mga === null || b.mga === undefined ? -Infinity : b.mga;
        return bMga - aMga;
      });

      setBilanData(sortedBilan);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données du bilan:', error);
      message.error('Erreur lors du chargement des données du bilan');
    } finally {
      setLoading(false);
    }
  };

  const calculateStudentMoyenne = async (studentId: number, evaluationId: number, subjects: any[], subjectNotesCache: Map<number, Note[]>): Promise<number | null> => {
    try {
      // Récupérer toutes les notes de l'élève pour cette évaluation
      const studentNotes: Record<number, number> = {};
      
      for (const subject of subjects) {
        const notesData = subjectNotesCache.get(subject.id) || [];
        const studentNote = notesData.find(note => 
          note.studentId === studentId && 
          note.evaluationId === evaluationId &&
          !note.isAbsent
        );
        
        if (studentNote && studentNote.value !== null && studentNote.value !== undefined) {
          const noteValue = typeof studentNote.value === 'number' 
            ? studentNote.value 
            : parseFloat(studentNote.value.toString());
          studentNotes[subject.id] = noteValue;
        }
      }
      
      // Vérifier s'il y a des notes
      if (Object.keys(studentNotes).length === 0) {
        return null;
      }
      
      // Trouver la configuration de calcul pour cette classe
      const classConfig = findConfigForClass(selectedClassId);
      
      if (classConfig) {
        // Utiliser la configuration pour calculer la moyenne
        const moyenne = calculateMoyenneWithConfig(studentNotes, classConfig);
        return Math.round(moyenne * 100) / 100;
      } else {
        // Si pas de configuration, calculer la moyenne simple
        const total = Object.values(studentNotes).reduce((sum, note) => sum + note, 0);
        const count = Object.keys(studentNotes).length;
        return count > 0 ? Math.round((total / count) * 100) / 100 : null;
      }
    } catch (error) {
      console.error(`Erreur lors du calcul de la moyenne pour l'élève ${studentId}:`, error);
      return null;
    }
  };

  const loadNotesAndCalculate = async () => {
    try {
      setLoading(true);
      
      console.log('Début du chargement des notes:', {
        selectedClassId,
        selectedEvaluationId,
        studentsCount: students.length,
        subjectsCount: subjects.length
      });
      
      // Précharger et mettre en cache les notes par matière pour éviter des requêtes répétées
      const subjectNotesCache = new Map<number, Note[]>();
      for (const subject of subjects) {
        try {
          const notesForSubject = await noteService.getNotesByClassAndSubject(selectedClassId, subject.id);
          subjectNotesCache.set(subject.id, notesForSubject);
        } catch (e) {
          console.warn(`Impossible de charger les notes pour la matière ${subject.name} (${subject.id})`, e);
          subjectNotesCache.set(subject.id, []);
        }
      }

      // Charger les notes pour tous les élèves et toutes les matières
      const studentsWithNotes: StudentMoyenneData[] = [];
      
      for (const student of students) {
        const notesMap: Record<number, number> = {};
        let isStudentAbsent = false;
        
        for (const subject of subjects) {
          try {
            const notesData = subjectNotesCache.get(subject.id) || [];
            console.log(`Notes récupérées pour ${student.name} - ${subject.name}:`, notesData);
            
            const studentNote = notesData.find(note => 
              note.studentId === student.id && 
              note.evaluationId === selectedEvaluationId
            );
            
            if (studentNote) {
              console.log(`Note trouvée pour ${student.name} - ${subject.name}:`, studentNote);
              // Vérifier si l'élève est absent
              if (studentNote.isAbsent) {
                isStudentAbsent = true;
              }
              
              // Convertir en nombre (pour gérer les Decimal de Prisma)
              notesMap[subject.id] = typeof studentNote.value === 'number' 
                ? studentNote.value 
                : parseFloat(studentNote.value.toString());
            } else {
              console.log(`Aucune note trouvée pour ${student.name} - ${subject.name} dans l'évaluation ${selectedEvaluationId}`);
            }
          } catch (error) {
            console.warn(`Erreur lors du chargement des notes pour l'élève ${student.id} et la matière ${subject.id}:`, error);
          }
        }
        
        // Si l'élève est absent, on ne le compte pas dans les calculs de moyenne
        if (isStudentAbsent) {
          console.log(`Élève ${student.name} est absent - exclu du calcul des moyennes`);
          continue; // Passer au prochain élève
        }
        
        // Calculer le total (somme des notes)
        const total = Object.values(notesMap).reduce((sum, note) => sum + note, 0);
        
        // Debug: Afficher les notes de l'élève
        console.log(`Élève ${student.name}:`, {
          notesMap,
          total,
          hasNotes: Object.keys(notesMap).length > 0
        });
        
        // Calculer la moyenne selon la configuration de la classe
        let moyenne = 0;
        try {
          const classConfig = findConfigForClass(selectedClassId);
          console.log('Configuration trouvée:', classConfig);
          
          if (classConfig) {
            moyenne = calculateMoyenneWithConfig(notesMap, classConfig);
            console.log(`Moyenne calculée avec config pour ${student.name}:`, moyenne);
          } else {
            // Calcul simple par défaut (moyenne arithmétique) si pas de configuration
            const notesValues = Object.values(notesMap);
            if (notesValues.length > 0) {
              moyenne = notesValues.reduce((sum, note) => sum + note, 0) / notesValues.length;
              console.log(`Moyenne calculée par défaut pour ${student.name}:`, moyenne);
            } else {
              console.log(`Aucune note trouvée pour ${student.name}`);
            }
          }
        } catch (error) {
          console.error('Erreur lors du calcul de la moyenne:', error);
          // Calcul simple par défaut en cas d'erreur
          const notesValues = Object.values(notesMap);
          if (notesValues.length > 0) {
            moyenne = notesValues.reduce((sum, note) => sum + note, 0) / notesValues.length;
          }
        }
        
        studentsWithNotes.push({
          student,
          notes: notesMap,
          total,
          moyenne,
          rang: 0 // Sera calculé après
        });
      }
      
      // Calculer les rangs (tri décroissant par moyenne)
      const sortedStudents = [...studentsWithNotes].sort((a, b) => b.moyenne - a.moyenne);
      sortedStudents.forEach((studentData, index) => {
        studentData.rang = index + 1;
      });
      
      setStudentsData(sortedStudents);
      
      // Enregistrement automatique des moyennes
      await saveMoyennesAutomatically(sortedStudents);
    } catch (error) {
      console.error('Erreur lors du chargement et calcul:', error);
      message.error('Erreur lors du chargement des notes');
    } finally {
      setLoading(false);
    }
  };

  // Enregistrement automatique des moyennes
  const saveMoyennesAutomatically = async (studentsData: StudentMoyenneData[]) => {
    try {
      const evaluationKey = `${selectedClassId}-${selectedEvaluationId}`;
      
      // Vérifier si les moyennes ont déjà été enregistrées pour cette évaluation
      if (savedMoyennes.has(evaluationKey)) {
        return;
      }
      
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Préparer les données à enregistrer
      const moyennes: CreateMoyenneData[] = studentsData.map(studentData => ({
        studentId: studentData.student.id,
        evaluationId: selectedEvaluationId,
        moyenne: studentData.moyenne,
        date: currentDate
      }));
      
      // Enregistrer les moyennes
      await moyenneService.upsertMoyennes(moyennes);
      
      // Marquer comme enregistré
      setSavedMoyennes(prev => new Set([...prev, evaluationKey]));
      
      console.log(`Moyennes enregistrées automatiquement pour l'évaluation ${selectedEvaluationId}`);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement automatique des moyennes:', error);
      // Ne pas afficher d'erreur à l'utilisateur pour l'enregistrement automatique
    }
  };


  // Fonction d'exportation des moyennes
  const handleExportBilan = async () => {
    if (!selectedClassId || !selectedSchoolYearId || bilanData.length === 0) {
      message.warning('Veuillez sélectionner une classe et une année scolaire avec des données');
      return;
    }

    // Vérifier si les seuils sont configurés
    const classThreshold = getThresholdByClass(selectedClassId);
    if (!classThreshold) {
      message.error('Les seuils d\'admission et de redoublement ne sont pas configurés pour cette classe. Veuillez les configurer avant d\'exporter le bilan.');
      return;
    }

    try {
      setExportingWord(true);
      message.loading('Génération du bilan annuel en cours...', 0);
      
      const selectedClass = classes.find(c => c.id === selectedClassId);
      const selectedSchoolYear = schoolYears.find(y => y.id === selectedSchoolYearId);

      if (!selectedClass || !selectedSchoolYear) {
        message.error('Données manquantes pour l\'exportation');
        return;
      }

      // Récupérer les seuils de classe
      const classThreshold = getThresholdByClass(selectedClassId);
      
      // Calculer la moyenne générale de la classe
      const moyennesGenerales = bilanData
        .map(s => s.mga)
        .filter((mga): mga is number => mga !== null);
      const moyenneGeneraleClasse = moyennesGenerales.length > 0
        ? Math.round((moyennesGenerales.reduce((sum, m) => sum + m, 0) / moyennesGenerales.length) * 100) / 100
        : undefined;
      
      // Calculer les statistiques de redoublement
      const studentsRedoublement = bilanData.filter(s => s.decision === 'REDOUBLER');
      const garconsRedoublement = studentsRedoublement.filter(s => s.student.gender === 'M').length;
      const fillesRedoublement = studentsRedoublement.filter(s => s.student.gender === 'F').length;
      const totalRedoublement = studentsRedoublement.length;

      // Calculer les abandons (élèves inscrits mais sans évaluations)
      const totalAbandons = students.length - bilanData.length;
      const garconsAbandons = students.filter(s => s.gender === 'M').length - bilanData.filter(s => s.student.gender === 'M').length;
      const fillesAbandons = students.filter(s => s.gender === 'F').length - bilanData.filter(s => s.student.gender === 'F').length;

      const exportData = {
        className: selectedClass.name,
        schoolYear: selectedSchoolYear.name,
        students: bilanData,
        stats: {
          totalInscrits: students.length,
          garconsInscrits: students.filter(s => s.gender === 'M').length,
          fillesInscrites: students.filter(s => s.gender === 'F').length,
          totalPresents: bilanData.length,
          garconsPresents: bilanData.filter(s => s.student.gender === 'M').length,
          fillesPresentes: bilanData.filter(s => s.student.gender === 'F').length,
          totalAbandons,
          garconsAbandons,
          fillesAbandons,
          totalAdmis: bilanData.filter(s => s.decision === 'ADMIS').length,
          garconsAdmis: bilanData.filter(s => s.decision === 'ADMIS' && s.student.gender === 'M').length,
          fillesAdmises: bilanData.filter(s => s.decision === 'ADMIS' && s.student.gender === 'F').length,
          pourcentageAdmis: students.length > 0 ? Math.round((bilanData.filter(s => s.decision === 'ADMIS').length / students.length) * 100) : 0,
          moyenneGeneraleClasse,
          totalRedoublement,
          garconsRedoublement,
          fillesRedoublement
        },
        classThreshold: classThreshold ? {
          moyenneAdmission: classThreshold.moyenneAdmission,
          moyenneRedoublement: classThreshold.moyenneRedoublement,
          maxNote: classThreshold.maxNote
        } : undefined,
        userData: user ? {
          directionRegionale: user.directionRegionale || 'Non renseigné',
          establishment: user.establishment || 'Non renseigné',
          secteurPedagogique: user.secteurPedagogique || 'Non renseigné',
          lastName: user.lastName || '',
          firstName: user.firstName || '',
          gender: user.gender || 'M'
        } : undefined
      };

      // Appel à l'API pour générer le document Word
      const blob = await MoyenneExportService.exportBilanAnnuelToWord(exportData);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bilan_Annuel_${selectedClass.name}_${selectedSchoolYear.name}_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.destroy();
      message.success('Bilan annuel généré et téléchargé avec succès');
    } catch (error: any) {
      message.destroy();
      console.error('Erreur lors de l\'export du bilan:', error);
      message.error(error.message || 'Erreur lors de la génération du bilan annuel');
    } finally {
      setExportingWord(false);
    }
  };

  // Calculer la moyenne selon une configuration de classe
  const calculateMoyenneWithConfig = (notes: Record<number, number>, config: ClassAverageConfig): number => {
    try {
      console.log('=== DÉBUT CALCUL MOYENNE ===');
      console.log('Configuration:', config);
      console.log('Notes:', notes);
      console.log('Subjects:', subjects);
      
      // Extraire les matières de la formule de configuration
      const formula = config.formula;
      console.log('Formule originale:', formula);
      
      // Remplacer les noms de matières par les notes correspondantes
      let formulaText = formula;
      
      // D'abord remplacer les noms de matières avec échappement des caractères spéciaux
      subjects.forEach(subject => {
        const note = notes[subject.id] || 0;
        console.log(`Remplacement de "${subject.name}" par ${note}`);
        
        // Échapper les caractères spéciaux pour regex
        const escapedName = subject.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Remplacer toutes les occurrences du nom de la matière
        formulaText = formulaText.replace(new RegExp(escapedName, 'g'), note.toString());
        console.log(`Formule après remplacement de "${subject.name}":`, formulaText);
      });
      
      // Nettoyer les fragments de mots qui pourraient rester
      // Par exemple, si on a "ORTHOGRAPHE" dans la formule mais que la matière s'appelle "ORTHO"
      // il peut rester "GRAPHE" dans la formule
      const subjectNames = subjects.map(s => s.name);
      const wordsInFormula = formulaText.match(/[A-Z][A-Z\s\.]+/g) || [];
      
      console.log('Mots trouvés dans la formule après remplacement:', wordsInFormula);
      
      // Supprimer les mots qui ne correspondent à aucune matière
      wordsInFormula.forEach(word => {
        const cleanWord = word.trim();
        const isSubjectName = subjectNames.some(name => name.includes(cleanWord) || cleanWord.includes(name));
        
        if (!isSubjectName && cleanWord.length > 2) {
          console.log(`Suppression du mot orphelin "${cleanWord}" de la formule`);
          formulaText = formulaText.replace(new RegExp(cleanWord, 'g'), '0');
        }
      });
      
      // Remplacer les opérateurs
      formulaText = formulaText.replace(/÷/g, '/');
      formulaText = formulaText.replace(/=/g, '');
      
      // Enlever les espaces
      formulaText = formulaText.trim();
      
      console.log('Formule finale avant évaluation:', formulaText);
      
      // Si la formule est vide ou ne contient que des espaces, retourner 0
      if (!formulaText || formulaText.trim() === '') {
        console.log('Formule vide, retour 0');
        return 0;
      }
      
      // Évaluer la formule (attention: utilisation de eval - à sécuriser en production)
      // eslint-disable-next-line no-eval
      const result = eval(formulaText);
      console.log('Résultat de l\'évaluation:', result);
      
      // Vérifier que le résultat est un nombre valide
      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        console.warn('Résultat de configuration invalide:', result, 'pour la formule:', config.formula);
        return 0;
      }
      
      const finalResult = Math.round(result * 100) / 100; // Arrondir à 2 décimales
      console.log('Résultat final:', finalResult);
      console.log('=== FIN CALCUL MOYENNE ===');
      
      return finalResult;
    } catch (error) {
      console.error('Erreur lors du calcul de la moyenne avec configuration:', error, 'pour la formule:', config.formula);
      console.log('=== FIN CALCUL MOYENNE (ERREUR) ===');
      return 0;
    }
  };

  // Fonction supprimée - on utilise uniquement les configurations de classe



  // Créer les colonnes du tableau pour le bilan annuel
  const createBilanColumns = () => {
    return [
      {
        title: 'N°',
        key: 'index',
        width: 60,
        render: (record: StudentBilanData, _: any, index: number) => (
          <Text strong style={{ color: '#000000' }}>{(index + 1).toString().padStart(2, '0')}</Text>
        ),
      },
      {
        title: 'Nom de l\'élève',
        dataIndex: ['student', 'name'],
        key: 'name',
        width: 200,
        render: (name: string) => (
          <Text strong style={{ color: '#000000' }}>{name}</Text>
        ),
      },
      {
        title: 'Matricule',
        dataIndex: ['student', 'studentNumber'],
        key: 'studentNumber',
        width: 120,
        render: (studentNumber: string) => (
          <Text style={{ color: '#000000' }}>{studentNumber || '-'}</Text>
        ),
      },
      {
        title: 'Sexe',
        dataIndex: ['student', 'gender'],
        key: 'gender',
        width: 70,
        render: (gender: string) => (
          <Text style={{ color: '#000000', fontWeight: 'bold' }}>
            {gender === 'M' ? 'M' : 'F'}
          </Text>
        ),
      },
      {
        title: 'MOY. COMPO N°1',
        dataIndex: 'moyCompo1',
        key: 'moyCompo1',
        width: 120,
        render: (value: number | null) => (
          <Text strong style={{ color: '#000000', fontSize: '14px' }}>
            {value !== null ? value.toFixed(2) : '-'}
          </Text>
        ),
      },
      {
        title: 'MOY. COMPO N°2',
        dataIndex: 'moyCompo2',
        key: 'moyCompo2',
        width: 120,
        render: (value: number | null) => (
          <Text strong style={{ color: '#000000', fontSize: '14px' }}>
            {value !== null ? value.toFixed(2) : '-'}
          </Text>
        ),
      },
      {
        title: 'MOY. COMPO N°3',
        dataIndex: 'moyCompo3',
        key: 'moyCompo3',
        width: 120,
        render: (value: number | null) => (
          <Text strong style={{ color: '#000000', fontSize: '14px' }}>
            {value !== null ? value.toFixed(2) : '-'}
          </Text>
        ),
      },
      {
        title: 'MOY. ANNUELLE',
        dataIndex: 'moyAnnuelle',
        key: 'moyAnnuelle',
        width: 120,
        render: (value: number | null) => (
          <Text strong style={{ color: '#000000', fontSize: '14px' }}>
            {value !== null ? value.toFixed(2) : '-'}
          </Text>
        ),
      },
      {
        title: 'MOY. COMPO DE PASSAGE',
        dataIndex: 'moyCompoPassage',
        key: 'moyCompoPassage',
        width: 150,
        render: (value: number | null) => (
          <Text strong style={{ color: '#000000', fontSize: '14px' }}>
            {value !== null ? value.toFixed(2) : '-'}
          </Text>
        ),
      },
      {
        title: 'MGA',
        dataIndex: 'mga',
        key: 'mga',
        width: 100,
        render: (value: number | null) => (
          <Text strong style={{ color: '#000000', fontSize: '14px' }}>
            {value !== null ? value.toFixed(2) : '-'}
          </Text>
        ),
      },
      {
        title: 'DÉCISION DE FIN D\'ANNEE',
        dataIndex: 'decision',
        key: 'decision',
        width: 150,
        render: (decision: string) => (
          <Text strong style={{ 
            color: decision === 'ADMIS' ? '#52c41a' : '#ff4d4f', 
            fontSize: '14px' 
          }}>
            {decision || '-'}
          </Text>
        ),
      },
    ];
  };

  if (authLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Chargement de l'authentification...</Text>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Alert
          message="Non authentifié"
          description="Vous devez être connecté pour accéder à cette page."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  if (loading && classes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Chargement des données...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>
            <CalculatorOutlined style={{ marginRight: '8px' }} />
            Bilan Annuel
          </Title>
          <Text type="secondary">
            Calculez et visualisez les moyennes des élèves avec classement automatique
          </Text>
        </div>

        {/* Filtres */}
        <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#fafafa' }}>
          <Row gutter={[16, 16]} align="top">
            <Col xs={24} sm={12} md={8}>
              <Text strong>
                <CalendarOutlined style={{ marginRight: '4px' }} />
                Année scolaire :
              </Text>
              <Select
                value={selectedSchoolYearId || undefined}
                onChange={(value) => {
                  setSelectedSchoolYearId(value);
                  setSelectedEvaluationId(0);
                  setEvaluations([]);
                  setStudentsData([]);
                }}
                style={{ width: '100%', marginTop: '8px' }}
                placeholder="Sélectionner une année"
                allowClear
                onClear={() => setSelectedSchoolYearId(null)}
              >
                {schoolYears.map((year) => (
                  <Select.Option key={year.id} value={year.id}>
                    {year.name} {year.isActive && <Tag color="success" style={{ marginLeft: 4 }}>Active</Tag>}
                  </Select.Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Text strong>Classe :</Text>
              <Select
                value={selectedClassId || undefined}
                onChange={(value) => {
                  setSelectedClassId(value);
                  setSelectedEvaluationId(0);
                  setSelectedFormulaId(0);
                  setEvaluations([]);
                  setSubjects([]);
                  setStudents([]);
                  setStudentsData([]);
                }}
                style={{ width: '100%', marginTop: '8px' }}
                placeholder="Sélectionner une classe"
              >
                <Select.Option value={0}>Toutes les classes</Select.Option>
                {classes.map((cls) => (
                  <Select.Option key={cls.id} value={cls.id}>
                    {cls.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <div style={{ marginTop: '28px' }}>
                <Button
                  type="primary"
                  icon={<FileWordOutlined />}
                  loading={exportingWord}
                  onClick={handleExportBilan}
                  disabled={!selectedClassId || !selectedSchoolYearId || bilanData.length === 0 || !getThresholdByClass(selectedClassId)}
                  style={{
                    backgroundColor: '#0078d4',
                    borderColor: '#0078d4',
                    width: '100%'
                  }}
                >
                  {exportingWord ? 'Génération...' : 'Exporter le Bilan Annuel'}
                </Button>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Avertissement pour les seuils non configurés */}
        {selectedClassId && selectedClassId !== 0 && (
          <ThresholdWarning
            classId={selectedClassId}
            className={classes.find(c => c.id === selectedClassId)?.name || ''}
            hasThreshold={!!getThresholdByClass(selectedClassId)}
          />
        )}

        {/* Tableau du bilan annuel */}
        {selectedClassId && selectedSchoolYearId ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <Title level={4}>
                Bilan Annuel - {classes.find(c => c.id === selectedClassId)?.name}
              </Title>
              <Text type="secondary">
                {bilanData.length} élève{bilanData.length > 1 ? 's' : ''}
              </Text>
            </div>

            {bilanData.length === 0 ? (
              <div className="card">
                <Empty
                  image={<CalculatorOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
                  description="Aucune donnée disponible. Vérifiez que des évaluations ont été créées pour cette classe."
                />
              </div>
            ) : (
              <>
                {/* DASHBOARD STATISTIQUES - Version compacte */}
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 text-center">
                    Récapitulatif des Résultats
                  </h3>

                  {/* Grille de statistiques */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Inscrits */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                      <h4 className="text-xs font-medium text-gray-600 mb-2 text-center">Inscrits</h4>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Garç.</p>
                          <p className="text-lg font-bold text-blue-600">
                            {students.filter(s => s.gender === 'M').length}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Filles</p>
                          <p className="text-lg font-bold text-pink-600">
                            {students.filter(s => s.gender === 'F').length}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-lg font-bold text-gray-900">
                            {students.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Présents */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                      <h4 className="text-xs font-medium text-gray-600 mb-2 text-center">Présents</h4>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Garç.</p>
                          <p className="text-lg font-bold text-blue-600">
                            {bilanData.filter(s => s.student.gender === 'M').length}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Filles</p>
                          <p className="text-lg font-bold text-pink-600">
                            {bilanData.filter(s => s.student.gender === 'F').length}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-lg font-bold text-gray-900">
                            {bilanData.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Admis */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                      <h4 className="text-xs font-medium text-gray-600 mb-2 text-center">Admis</h4>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Garç.</p>
                          <p className="text-lg font-bold text-blue-600">
                            {bilanData.filter(s => s.decision === 'ADMIS' && s.student.gender === 'M').length}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Filles</p>
                          <p className="text-lg font-bold text-pink-600">
                            {bilanData.filter(s => s.decision === 'ADMIS' && s.student.gender === 'F').length}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-lg font-bold text-gray-900">
                            {bilanData.filter(s => s.decision === 'ADMIS').length}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Taux de Réussite */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col items-center justify-center">
                      <h4 className="text-xs font-medium text-gray-600 mb-1">Taux de Réussite</h4>
                      <p className="text-3xl font-bold text-green-600">
                        {(() => {
                          const totalAdmis = bilanData.filter(s => s.decision === 'ADMIS').length;
                          const totalInscrits = students.length;
                          return totalInscrits > 0 ? Math.round((totalAdmis / totalInscrits) * 100) : 0;
                        })()}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {bilanData.filter(s => s.decision === 'ADMIS').length}/{students.length} admis
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tableau du bilan annuel */}
                <Table
                  dataSource={bilanData}
                  columns={createBilanColumns()}
                  rowKey={(record) => record.student.id}
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
                  bordered
                  loading={loading}
                />
              </>
            )}
          </>
        ) : (
          <div className="card">
            <Empty
              image={<CalculatorOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
              description="Sélectionnez une classe et une année scolaire pour afficher le bilan annuel"
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default BilanAnnuelPage;

