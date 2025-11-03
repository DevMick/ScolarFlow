import React, { useState, useEffect, useRef } from 'react';
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
  InputNumber,
  Modal,
  Checkbox
} from 'antd';
import { 
  CalculatorOutlined,
  UserOutlined,
  SaveOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { noteService, type CreateNoteData } from '../services/noteService';
import { subjectService, type Subject } from '../services/subjectService';
import { ClassService, type Class } from '../services/classService';
import { StudentService, type Student } from '../services/studentService';
import { evaluationService } from '../services/evaluationService';
import { schoolYearService } from '../services/schoolYearService';
import { useMoyenneCalculation } from '../hooks/useMoyenneCalculation';
import { useAuth } from '../context/AuthContext';
import type { EvaluationSimple, SchoolYear } from '@edustats/shared';

const { Title, Text } = Typography;

const NotesPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { calculating, calculateAndSaveMoyennes } = useMoyenneCalculation();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationSimple[]>([]);
  const [allEvaluations, setAllEvaluations] = useState<EvaluationSimple[]>([]); // Toutes les évaluations
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<number>(0); // 0 = toutes les années
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number>(0);
  const [editingNotes, setEditingNotes] = useState<Record<number, Record<number, number>>>({}); // studentId -> subjectId -> note
  const [originalNotes, setOriginalNotes] = useState<Record<number, Record<number, number>>>({}); // Notes originales pour comparaison
  const [absentStudents, setAbsentStudents] = useState<Set<number>>(new Set()); // Set des élèves absents (studentId)
  const [originalAbsentStudents, setOriginalAbsentStudents] = useState<Set<number>>(new Set()); // État original des absences
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [modifiedCells, setModifiedCells] = useState<Set<string>>(new Set()); // Set des cellules modifiées (studentId-subjectId)
  const beforeUnloadRef = useRef<(() => void) | null>(null);

  // Charger les données initiales
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadClasses();
      loadSchoolYears();
    }
  }, [authLoading, isAuthenticated]);

  // Charger les évaluations quand une classe est sélectionnée
  useEffect(() => {
    if (selectedClassId) {
      loadEvaluations();
      loadSubjects();
    }
  }, [selectedClassId]);

  // Filtrer les évaluations en fonction de l'année scolaire sélectionnée
  useEffect(() => {
    if (selectedSchoolYearId === 0) {
      // Toutes les années
      setEvaluations(allEvaluations);
    } else {
      // Filtrer par année scolaire
      const filtered = allEvaluations.filter(
        evaluation => evaluation.schoolYearId === selectedSchoolYearId
      );
      setEvaluations(filtered);
    }

    // Si l'évaluation sélectionnée n'est plus dans la liste filtrée, la réinitialiser
    if (selectedEvaluationId > 0) {
      const evaluationExists = allEvaluations.some(
        e => e.id === selectedEvaluationId && 
            (selectedSchoolYearId === 0 || e.schoolYearId === selectedSchoolYearId)
      );
      if (!evaluationExists) {
        setSelectedEvaluationId(0);
      }
    }
  }, [selectedSchoolYearId, allEvaluations]);

  // Charger les élèves et notes quand une évaluation est sélectionnée
  useEffect(() => {
    if (selectedClassId && selectedEvaluationId) {
      loadStudents();
    }
  }, [selectedClassId, selectedEvaluationId]);

  // Charger les notes quand les élèves et matières sont chargés
  useEffect(() => {
    if (selectedClassId && selectedEvaluationId && students.length > 0 && subjects.length > 0) {
      loadNotes();
    }
  }, [selectedClassId, selectedEvaluationId, students, subjects]);

  // Gérer les modifications non sauvegardées
  useEffect(() => {
    const hasNoteChanges = modifiedCells.size > 0;
    const hasAbsenceChanges = !areSetsEqual(absentStudents, originalAbsentStudents);
    const hasAnyChanges = hasNoteChanges || hasAbsenceChanges;
    setHasUnsavedChanges(hasAnyChanges);
  }, [modifiedCells, absentStudents, originalAbsentStudents]);

  // Fonction utilitaire pour comparer deux Sets
  const areSetsEqual = (setA: Set<number>, setB: Set<number>): boolean => {
    if (setA.size !== setB.size) return false;
    for (const item of setA) {
      if (!setB.has(item)) return false;
    }
    return true;
  };

  // Gérer la confirmation avant de quitter la page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    beforeUnloadRef.current = () => {
      if (hasUnsavedChanges) {
        return 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?';
      }
    };

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);


  const loadSchoolYears = async () => {
    try {
      setLoading(true);
      const { schoolYears, activeSchoolYear } = await schoolYearService.getAll();
      setSchoolYears(schoolYears);
      
      // Sélectionner automatiquement l'année scolaire active
      if (activeSchoolYear) {
        setSelectedSchoolYearId(activeSchoolYear.id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des années scolaires:', error);
      message.error('Erreur lors du chargement des années scolaires');
    } finally {
      setLoading(false);
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

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      const evaluationsData = await evaluationService.getEvaluationsByClass(selectedClassId);
      
      // Stocker toutes les évaluations
      setAllEvaluations(evaluationsData);
      
      // Filtrer par année scolaire si une année est sélectionnée
      const filteredEvaluations = selectedSchoolYearId === 0
        ? evaluationsData
        : evaluationsData.filter(e => e.schoolYearId === selectedSchoolYearId);
      
      setEvaluations(filteredEvaluations);
      
      // Sélectionner automatiquement la dernière évaluation créée (la plus récente) parmi les évaluations filtrées
      if (filteredEvaluations.length > 0) {
        // Trier par date de création (createdAt) ou par date d'évaluation
        const sortedEvaluations = [...filteredEvaluations].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date);
          const dateB = new Date(b.createdAt || b.date);
          return dateB.getTime() - dateA.getTime(); // Plus récent en premier
        });
        setSelectedEvaluationId(sortedEvaluations[0].id);
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

  const loadNotes = async () => {
    try {
      setLoading(true);
      
      if (!selectedClassId || !selectedEvaluationId) {
        console.warn('classId ou evaluationId manquant');
        return;
      }
      
      // Charger toutes les notes de l'évaluation en une seule requête
      const allNotes = await noteService.getNotesByClassAndEvaluation(selectedClassId, selectedEvaluationId);
      
      console.log('Notes chargées pour l\'évaluation:', allNotes);
      
      // Organiser les notes par élève et par matière
      const notesMap: Record<number, Record<number, number>> = {};
      const absentSet = new Set<number>();
      
      // Initialiser la structure pour tous les élèves
      for (const student of students) {
        notesMap[student.id] = {};
      }
      
      // Remplir les notes et détecter les absences
      for (const note of allNotes) {
        // Vérifier si l'élève est absent
        if (note.isAbsent) {
          absentSet.add(note.studentId);
        }
        
        // Ajouter la note si elle existe et que l'élève n'est pas absent
        if (!note.isAbsent && note.value !== null && note.value !== undefined) {
          // Convertir en nombre (pour gérer les Decimal de Prisma)
          const noteValue = typeof note.value === 'number' 
            ? note.value 
            : parseFloat(String(note.value));
          
          if (!isNaN(noteValue) && notesMap[note.studentId]) {
            notesMap[note.studentId][note.subjectId] = noteValue;
          }
        }
      }
      
      console.log('Notes organisées:', notesMap);
      console.log('Élèves absents:', Array.from(absentSet));
      
      setEditingNotes(notesMap);
      setOriginalNotes(JSON.parse(JSON.stringify(notesMap))); // Copie profonde des notes originales
      setAbsentStudents(absentSet);
      setOriginalAbsentStudents(new Set(absentSet)); // Sauvegarder l'état original des absences
      setModifiedCells(new Set()); // Réinitialiser les cellules modifiées
      setHasUnsavedChanges(false); // Réinitialiser l'état des modifications
    } catch (error) {
      console.error('Erreur lors du chargement des notes:', error);
      message.error('Erreur lors du chargement des notes');
    } finally {
      setLoading(false);
    }
  };

  const handleNoteChange = (studentId: number, subjectId: number, value: number | null) => {
    const cellKey = `${studentId}-${subjectId}`;
    const newValue = value !== null ? value : 0;
    
    setEditingNotes(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectId]: newValue
      }
    }));

    // Vérifier si la valeur a changé par rapport à l'original
    const originalValue = originalNotes[studentId]?.[subjectId];
    const hasChanged = originalValue !== newValue;
    
    setModifiedCells(prev => {
      const newSet = new Set(prev);
      if (hasChanged) {
        newSet.add(cellKey);
      } else {
        newSet.delete(cellKey);
      }
      return newSet;
    });

    // Mettre à jour l'état des modifications non sauvegardées
    const hasAnyChanges = Array.from(modifiedCells).length > 0 || hasChanged;
    setHasUnsavedChanges(hasAnyChanges);
  };

  const handleToggleAbsent = (studentId: number, checked: boolean) => {
    setAbsentStudents(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(studentId);
      } else {
        newSet.delete(studentId);
      }
      return newSet;
    });
  };


  const handleSaveAllNotes = async () => {
    try {
      if (!user) {
        message.error('Utilisateur non connecté');
        return;
      }

      if (!selectedClassId || !selectedEvaluationId) {
        message.error('Veuillez sélectionner une classe et une évaluation');
        return;
      }

      setLoading(true);
      const notesToSave: CreateNoteData[] = [];
      let savedCount = 0;
      
      // Étape 1: Préparer les données de notes à sauvegarder
      for (const student of students) {
        const isAbsent = absentStudents.has(student.id);
        
        for (const subject of subjects) {
          const value = editingNotes[student.id]?.[subject.id];
          
          // Si l'élève est absent, créer/mettre à jour toutes ses notes avec isAbsent = true
          // Sinon, sauvegarder uniquement si une valeur existe (y compris 0)
          if (isAbsent || (value !== undefined && value >= 0)) {
            const noteData: CreateNoteData = {
              studentId: student.id,
              subjectId: subject.id,
              evaluationId: selectedEvaluationId,
              value: value !== undefined ? value : 0, // Valeur par défaut 0 si absent sans note
              isAbsent: isAbsent
            };
            notesToSave.push(noteData);
            savedCount++;
          }
        }
      }

      console.log(`Sauvegarde de ${savedCount} notes...`);
      
      // Fonction pour attendre un délai
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Fonction pour sauvegarder une note avec retry
      const saveNoteWithRetry = async (noteData: CreateNoteData, maxRetries: number = 2): Promise<any> => {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            return await noteService.upsertNote(noteData);
          } catch (error: any) {
            const isRateLimit = error?.response?.status === 429 || 
                               error?.message?.includes('429') ||
                               error?.message?.includes('Too Many Requests');
            
            if (isRateLimit && attempt < maxRetries) {
              // Attendre plus longtemps à chaque tentative
              const waitTime = (attempt + 1) * 2000; // 2s, 4s
              console.log(`Rate limiting détecté, attente de ${waitTime}ms avant retry ${attempt + 1}/${maxRetries}...`);
              await delay(waitTime);
              continue;
            }
            throw error; // Si ce n'est pas un rate limit ou qu'on a épuisé les retries
          }
        }
      };
      
      // Fonction pour traiter les notes par lots avec gestion du rate limiting
      const processNotesInBatches = async (notes: CreateNoteData[], batchSize: number = 10) => {
        const results: any[] = [];
        const errors: { note: CreateNoteData; error: any }[] = [];
        let processedCount = 0;
        
        // Traiter les notes par lots
        for (let i = 0; i < notes.length; i += batchSize) {
          const batch = notes.slice(i, i + batchSize);
          
          try {
            // Sauvegarder chaque note du lot avec retry
            for (const noteData of batch) {
              try {
                await delay(100); // Petit délai entre chaque note
                const result = await saveNoteWithRetry(noteData);
                results.push(result);
                processedCount++;
                
                // Afficher le progrès toutes les 10 notes
                if (processedCount % 10 === 0) {
                  console.log(`${processedCount}/${notes.length} notes sauvegardées...`);
                }
              } catch (error) {
                console.error('Erreur lors de la sauvegarde d\'une note:', error);
                errors.push({ note: noteData, error });
              }
            }
            
            // Délai entre les lots pour éviter le rate limiting (300ms)
            if (i + batchSize < notes.length) {
              await delay(300);
            }
          } catch (error) {
            console.error('Erreur lors du traitement du lot:', error);
          }
        }
        
        return { results, errors };
      };
      
      // Traiter les notes par lots
      const { results, errors } = await processNotesInBatches(notesToSave, 10);
      
      if (errors.length > 0) {
        console.warn(`${errors.length} note(s) n'ont pas pu être sauvegardées`, errors);
        message.warning(
          `${results.length} note(s) sauvegardée(s), ${errors.length} erreur(s). ` +
          'Si le problème persiste, attendez quelques instants et réessayez.'
        );
      } else {
        message.success(`${savedCount} note(s) sauvegardée(s) avec succès !`);
      }
      
      // Étape 2: Calculer et enregistrer les moyennes automatiquement
      try {
        console.log('Calcul des moyennes en cours...');
        await calculateAndSaveMoyennes(selectedClassId, selectedEvaluationId, students, subjects);
      } catch (moyenneError) {
        console.error('Erreur lors du calcul des moyennes:', moyenneError);
        // Ne pas bloquer le flux si le calcul des moyennes échoue
        message.warning('Notes sauvegardées, mais erreur lors du calcul des moyennes');
      }
      
      // Réinitialiser les états après sauvegarde
      setOriginalNotes(JSON.parse(JSON.stringify(editingNotes))); // Copie profonde
      setOriginalAbsentStudents(new Set(absentStudents));
      setModifiedCells(new Set());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des notes:', error);
      message.error('Erreur lors de la sauvegarde des notes');
    } finally {
      setLoading(false);
    }
  };

  // Créer les colonnes dynamiquement
  const createColumns = () => {
    const baseColumns = [
    {
      title: 'N°',
      key: 'index',
      width: 50,
      render: (_record: Student, _: any, index: number) => (
        <Text strong>{index + 1}</Text>
      ),
    },
    {
      title: 'Nom de l\'élève',
      dataIndex: 'name',
      key: 'name',
        width: 200,
      render: (name: string) => (
        <Text strong>{name}</Text>
      ),
    },
    {
      title: 'Sexe',
      dataIndex: 'gender',
      key: 'gender',
        width: 80,
      render: (gender: string) => (
        <Text style={{ color: '#000000', fontWeight: 'normal' }}>
          {gender === 'M' ? 'M' : 'F'}
        </Text>
      ),
    },
    ];

    // Ajouter une colonne pour chaque matière
    const subjectColumns = (subjects || []).map(subject => ({
      title: subject.name,
      key: `subject_${subject.id}`,
      width: 150,
      render: (record: Student) => {
        const cellKey = `${record.id}-${subject.id}`;
        const isModified = modifiedCells.has(cellKey);
        const isAbsent = absentStudents.has(record.id);
        
        return (
          <InputNumber
            min={0}
            step={0.25}
            precision={2}
            value={editingNotes[record.id]?.[subject.id]}
            onChange={(value) => handleNoteChange(record.id, subject.id, value)}
            disabled={isAbsent}
            style={{ 
              width: '100px',
              borderColor: isModified ? '#ff4d4f' : undefined,
              boxShadow: isModified ? '0 0 0 2px rgba(255, 77, 79, 0.2)' : undefined,
              backgroundColor: isAbsent ? '#f5f5f5' : undefined,
              opacity: isAbsent ? 0.6 : 1
            }}
            placeholder={isAbsent ? "Absent" : "Note"}
          />
        );
      },
    }));

    // Colonne Absence pour marquer absent
    const absenceColumn = {
      title: 'Absence',
      key: 'absence',
      width: 100,
      align: 'center' as const,
      render: (record: Student) => {
        const isAbsent = absentStudents.has(record.id);
        
        return (
          <Checkbox
            checked={isAbsent}
            onChange={(e) => handleToggleAbsent(record.id, e.target.checked)}
          />
        );
      },
    };

    return [...baseColumns, ...subjectColumns, absenceColumn];
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
            Moyennes
          </Title>
          <Text type="secondary">
            Sélectionnez une classe et une évaluation pour saisir les notes et calculer les moyennes
          </Text>
        </div>

        {/* Filtres */}
        <Card size="small" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]} align="top">
            <Col xs={24} sm={12} md={6}>
              <Text strong>Année scolaire :</Text>
              <Select
                value={selectedSchoolYearId || undefined}
                onChange={(value) => {
                  if (hasUnsavedChanges) {
                    Modal.confirm({
                      title: 'Modifications non sauvegardées',
                      icon: <ExclamationCircleOutlined />,
                      content: 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment changer d\'année scolaire ?',
                      okText: 'Changer',
                      cancelText: 'Annuler',
                      okType: 'danger',
                      onOk: () => {
                        setSelectedSchoolYearId(value);
                        setSelectedEvaluationId(0);
                        setStudents([]);
                        setEditingNotes({});
                        setOriginalNotes({});
                        setAbsentStudents(new Set());
                        setOriginalAbsentStudents(new Set());
                        setModifiedCells(new Set());
                        setHasUnsavedChanges(false);
                      },
                    });
                  } else {
                    setSelectedSchoolYearId(value);
                    setSelectedEvaluationId(0);
                    setStudents([]);
                    setEditingNotes({});
                    setOriginalNotes({});
                    setAbsentStudents(new Set());
                    setOriginalAbsentStudents(new Set());
                    setModifiedCells(new Set());
                    setHasUnsavedChanges(false);
                  }
                }}
                style={{ width: '100%', marginTop: '8px' }}
                placeholder="Sélectionner une année"
              >
                {schoolYears.map((year) => (
                  <Select.Option key={year.id} value={year.id}>
                    {year.name || `${year.startYear}-${year.endYear}`}
                  </Select.Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Text strong>Classe :</Text>
              <Select
                value={selectedClassId || undefined}
                onChange={(value) => {
                  if (hasUnsavedChanges) {
                    Modal.confirm({
                      title: 'Modifications non sauvegardées',
                      icon: <ExclamationCircleOutlined />,
                      content: 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment changer de classe ?',
                      okText: 'Changer',
                      cancelText: 'Annuler',
                      okType: 'danger',
                      onOk: () => {
                        setSelectedClassId(value);
                        setSelectedEvaluationId(0);
                        setEvaluations([]);
                        setAllEvaluations([]);
                        setSubjects([]);
                        setStudents([]);
                        setEditingNotes({});
                        setOriginalNotes({});
                        setAbsentStudents(new Set());
                        setOriginalAbsentStudents(new Set());
                        setModifiedCells(new Set());
                        setHasUnsavedChanges(false);
                      },
                    });
                  } else {
                    setSelectedClassId(value);
                    setSelectedEvaluationId(0);
                    setEvaluations([]);
                    setAllEvaluations([]);
                    setSubjects([]);
                    setStudents([]);
                    setEditingNotes({});
                    setOriginalNotes({});
                    setAbsentStudents(new Set());
                    setOriginalAbsentStudents(new Set());
                    setModifiedCells(new Set());
                    setHasUnsavedChanges(false);
                  }
                }}
                style={{ width: '100%', marginTop: '8px' }}
                placeholder="Sélectionner une classe"
              >
                {classes.map((cls) => (
                  <Select.Option key={cls.id} value={cls.id}>
                    {cls.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Text strong>Évaluation :</Text>
              <Select
                value={selectedEvaluationId || undefined}
                onChange={(value) => {
                  if (hasUnsavedChanges) {
                    Modal.confirm({
                      title: 'Modifications non sauvegardées',
                      icon: <ExclamationCircleOutlined />,
                      content: 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment changer d\'évaluation ?',
                      okText: 'Changer',
                      cancelText: 'Annuler',
                      okType: 'danger',
                      onOk: () => {
                        setSelectedEvaluationId(value);
                        setStudents([]);
                        setEditingNotes({});
                        setOriginalNotes({});
                        setAbsentStudents(new Set());
                        setOriginalAbsentStudents(new Set());
                        setModifiedCells(new Set());
                        setHasUnsavedChanges(false);
                      },
                    });
                  } else {
                    setSelectedEvaluationId(value);
                    setStudents([]);
                    setEditingNotes({});
                    setOriginalNotes({});
                    setAbsentStudents(new Set());
                    setOriginalAbsentStudents(new Set());
                    setModifiedCells(new Set());
                    setHasUnsavedChanges(false);
                  }
                }}
                style={{ width: '100%', marginTop: '8px' }}
                placeholder="Sélectionner une évaluation"
                disabled={!selectedClassId}
              >
                {evaluations.map((evaluation) => (
                  <Select.Option key={evaluation.id} value={evaluation.id}>
                    {evaluation.nom} - {new Date(evaluation.date).toLocaleDateString('fr-FR')}
                  </Select.Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div style={{ marginTop: '28px' }}>
                <Button
                  type="primary"
                  icon={calculating ? <CalculatorOutlined spin /> : <SaveOutlined />}
                  onClick={handleSaveAllNotes}
                  disabled={!selectedClassId || !selectedEvaluationId || Object.keys(editingNotes).length === 0 || !hasUnsavedChanges}
                  loading={loading || calculating}
                >
                  {calculating ? 'Calcul en cours...' : 'Enregistrer et calculer'}
                </Button>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Indicateur des modifications non sauvegardées */}
        {hasUnsavedChanges && (() => {
          const noteChanges = modifiedCells.size;
          const absenceChanges = Array.from(absentStudents).filter(
            studentId => !originalAbsentStudents.has(studentId)
          ).length + Array.from(originalAbsentStudents).filter(
            studentId => !absentStudents.has(studentId)
          ).length;
          const totalChanges = noteChanges + absenceChanges;
          
          return (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#fff2e8',
              border: '1px solid #ffd591',
              borderRadius: '6px',
              marginBottom: '16px'
            }}>
              <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
              <Text style={{ color: '#fa8c16', fontSize: '14px', fontWeight: 500 }}>
                {totalChanges} modification(s) non sauvegardée(s)
                {noteChanges > 0 && ` (${noteChanges} note${noteChanges > 1 ? 's' : ''})`}
                {absenceChanges > 0 && ` (${absenceChanges} absence${absenceChanges > 1 ? 's' : ''})`}
              </Text>
            </div>
          );
        })()}

        {/* Tableau des notes */}
        {selectedClassId && selectedEvaluationId ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <Title level={4}>
                Notes - {evaluations.find(e => e.id === selectedEvaluationId)?.nom}
              </Title>
              <Text type="secondary">
                {students.length} élève(s) - Classe {classes.find(c => c.id === selectedClassId)?.name}
                {subjects.length > 0 && ` - ${subjects.length} matière(s)`}
              </Text>
            </div>

            {students.length === 0 ? (
              <div className="card">
                <Empty
                  image={<UserOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
                  description="Aucun élève avec matricule trouvé dans cette classe"
                />
              </div>
            ) : subjects.length === 0 ? (
              <div className="card">
                <Empty
                  image={<CalculatorOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
                  description="Aucune matière trouvée pour cette classe"
                />
              </div>
            ) : (
              <Table
                dataSource={students}
                columns={createColumns()}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
                bordered
                rowClassName={(record) => 
                  absentStudents.has(record.id) ? 'bg-red-50 opacity-60' : ''
                }
              />
            )}
          </>
        ) : (
          <div className="card">
            <Empty
              image={<CalculatorOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
              description="Sélectionnez une classe et une évaluation pour commencer la saisie des notes"
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default NotesPage;
