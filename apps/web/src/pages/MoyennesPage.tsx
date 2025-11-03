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
  CalendarOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { noteService } from '../services/noteService';
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
import type { EvaluationSimple, SchoolYear } from '@edustats/shared';

const { Title, Text } = Typography;

interface StudentMoyenneData {
  student: Student;
  notes: Record<number, number>; // subjectId -> note
  total: number;
  moyenne: number;
  rang: number;
}

const MoyennesPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationSimple[]>([]);
  const [classConfigs, setClassConfigs] = useState<ClassAverageConfig[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number | null>(null);
  const [selectedFormulaId, setSelectedFormulaId] = useState<number>(0);
  const [studentsData, setStudentsData] = useState<StudentMoyenneData[]>([]);
  const [exportingWord, setExportingWord] = useState(false);
  const [noDataMessage, setNoDataMessage] = useState<string>('');

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
    }
  }, [selectedClassId, selectedSchoolYearId]);

  // Charger les élèves et notes quand une évaluation est sélectionnée
  useEffect(() => {
    if (selectedClassId && selectedEvaluationId) {
      loadStudents();
    }
  }, [selectedClassId, selectedEvaluationId]);

  // Charger les moyennes depuis la base de données
  useEffect(() => {
    if (selectedClassId && selectedEvaluationId && students.length > 0 && subjects.length > 0) {
      loadMoyennesFromDatabase();
      }
  }, [selectedClassId, selectedEvaluationId, students, subjects]);

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
        setSelectedEvaluationId(null);
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

  // Charger les moyennes depuis la base de données
  const loadMoyennesFromDatabase = async () => {
    try {
      setLoading(true);
      setNoDataMessage('');
      
      if (!selectedClassId || !selectedEvaluationId) {
        console.warn('classId ou evaluationId manquant');
        return;
      }
      
      console.log('Chargement des moyennes depuis la base de données:', {
        selectedClassId,
        selectedEvaluationId,
        studentsCount: students.length
      });
      
      // Charger les notes pour avoir les détails
      const allNotes = await noteService.getNotesByClassAndEvaluation(selectedClassId, selectedEvaluationId);
      
      // Charger les moyennes enregistrées
      const moyennesData = await moyenneService.getMoyennesByEvaluation(selectedEvaluationId);
      
      console.log('Moyennes chargées:', moyennesData);
      
      if (!moyennesData || moyennesData.length === 0) {
        setNoDataMessage('Aucune moyenne calculée pour cette évaluation. Veuillez d\'abord saisir les notes dans la page "Moyennes".');
        setStudentsData([]);
        return;
      }
      
      // Construire les données des élèves avec moyennes
      const studentsWithMoyennes: StudentMoyenneData[] = [];
      
      for (const student of students) {
        // Trouver la moyenne de l'élève
        const moyenneRecord = moyennesData.find(m => m.studentId === student.id);
        
        if (!moyenneRecord) {
          console.log(`Pas de moyenne pour ${student.name}`);
          continue;
        }
        
        // Récupérer les notes de l'élève
        const studentNotes = allNotes.filter(note => note.studentId === student.id && !note.isAbsent);
        const notesMap: Record<number, number> = {};
        
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
        
        // Calculer le total
        const total = Object.values(notesMap).reduce((sum, note) => sum + note, 0);
        
        // Utiliser la moyenne enregistrée
        const moyenne = typeof moyenneRecord.moyenne === 'number'
          ? moyenneRecord.moyenne
          : parseFloat(moyenneRecord.moyenne.toString());
        
        studentsWithMoyennes.push({
          student,
          notes: notesMap,
          total,
          moyenne,
          rang: 0 // Sera calculé après
        });
      }
      
      if (studentsWithMoyennes.length === 0) {
        setNoDataMessage('Aucune moyenne disponible pour cette évaluation.');
        setStudentsData([]);
        return;
      }
      
      // Calculer les rangs (tri décroissant par moyenne)
      const sortedStudents = [...studentsWithMoyennes].sort((a, b) => b.moyenne - a.moyenne);
      sortedStudents.forEach((studentData, index) => {
        studentData.rang = index + 1;
      });
      
      setStudentsData(sortedStudents);
      console.log('Données des moyennes chargées:', sortedStudents);
    } catch (error) {
      console.error('Erreur lors du chargement des moyennes:', error);
      message.error('Erreur lors du chargement des moyennes');
      setNoDataMessage('Erreur lors du chargement des moyennes');
    } finally {
      setLoading(false);
    }
  };


  // Fonction d'exportation des moyennes
  const handleExportMoyennes = async () => {
    if (!selectedClassId || !selectedEvaluationId || studentsData.length === 0) {
      message.warning('Veuillez sélectionner une classe et une évaluation avec des données');
      return;
    }

    try {
      setExportingWord(true);
      message.loading('Génération des moyennes en cours...', 0);
      
      await MoyenneExportService.exportAndDownloadWord(selectedClassId, selectedEvaluationId);
      
      message.destroy();
      message.success('Moyennes générées et téléchargées avec succès');
    } catch (error: any) {
      message.destroy();
      console.error('Erreur lors de l\'export des moyennes:', error);
      message.error(error.message || 'Erreur lors de la génération des moyennes');
    } finally {
      setExportingWord(false);
    }
  };

  // Fonction de calcul supprimée - cette page affiche maintenant les moyennes déjà calculées



  // Créer les colonnes du tableau
  const createColumns = () => {
    const baseColumns = [
      {
        title: 'N°',
        key: 'index',
        width: 60,
        render: (record: StudentMoyenneData, _: any, index: number) => (
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
    ];

    // Ajouter une colonne pour chaque matière
    const subjectColumns = (subjects || []).map(subject => ({
      title: subject.name,
      key: `subject_${subject.id}`,
      width: 100,
      render: (record: StudentMoyenneData) => (
        <Text strong style={{ color: '#000000' }}>
          {record.notes[subject.id] !== undefined ? record.notes[subject.id].toFixed(2) : '-'}
        </Text>
      ),
    }));

    // Colonnes Total, Moyenne et Rang
    const calculatedColumns = [
      {
        title: 'Total',
        dataIndex: 'total',
        key: 'total',
        width: 100,
        render: (total: number) => (
          <Text strong style={{ color: '#000000', fontSize: '14px' }}>
            {total.toFixed(2)}
          </Text>
        ),
      },
      {
        title: 'Moyenne',
        dataIndex: 'moyenne',
        key: 'moyenne',
        width: 100,
        render: (moyenne: number) => (
          <Text strong style={{ color: '#000000', fontSize: '14px' }}>
            {moyenne.toFixed(2)}
          </Text>
        ),
      },
      {
        title: 'OBS',
        key: 'observation',
        width: 70,
        render: (record: StudentMoyenneData) => (
          <Text strong style={{ 
            color: '#000000', 
            fontSize: '14px' 
          }}>
            {record.moyenne >= 10 ? 'A' : 'R'}
          </Text>
        ),
      },
    ];

    return [...baseColumns, ...subjectColumns, ...calculatedColumns];
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
            Affichage des Moyennes
          </Title>
          <Text type="secondary">
            Visualisez les moyennes calculées des élèves avec classement automatique
          </Text>
        </div>

        {/* Filtres */}
        <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#fafafa' }}>
          <Row gutter={[16, 16]} align="top">
            <Col xs={24} sm={12} md={6}>
              <Text strong>
                <CalendarOutlined style={{ marginRight: '4px' }} />
                Année scolaire :
              </Text>
              <Select
                value={selectedSchoolYearId || undefined}
                onChange={(value) => {
                  setSelectedSchoolYearId(value);
                  setSelectedEvaluationId(null);
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

            <Col xs={24} sm={12} md={6}>
              <Text strong>Classe :</Text>
              <Select
                value={selectedClassId || undefined}
                onChange={(value) => {
                  setSelectedClassId(value);
                  setSelectedEvaluationId(null);
                  setSelectedFormulaId(0);
                  setEvaluations([]);
                  setSubjects([]);
                  setStudents([]);
                  setStudentsData([]);
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
                  setSelectedEvaluationId(value);
                  setStudents([]);
                  setStudentsData([]);
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
                  icon={<FileWordOutlined />}
                  loading={exportingWord}
                  onClick={handleExportMoyennes}
                  disabled={!selectedClassId || !selectedEvaluationId || studentsData.length === 0}
                  style={{
                    backgroundColor: '#0078d4',
                    borderColor: '#0078d4',
                    width: '100%'
                  }}
                >
                  {exportingWord ? 'Génération...' : 'Exporter les Moyennes'}
                </Button>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Message d'information si pas de configuration */}
        {selectedClassId && selectedEvaluationId && !findConfigForClass(selectedClassId) ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <CalculatorOutlined style={{ fontSize: '64px', color: '#faad14', marginBottom: '16px' }} />
              <Title level={3} style={{ color: '#faad14', marginBottom: '16px' }}>
                Configuration de calcul manquante
              </Title>
              <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '24px' }}>
                Pour calculer les moyennes de cette classe, vous devez d'abord configurer la formule de calcul.
                <br />
                La configuration détermine quelles matières sont incluses et comment elles sont combinées.
                <br />
                Veuillez vous rendre sur la page "Matières" pour configurer le calcul.
              </Text>
              <Button 
                type="primary" 
                size="large"
                icon={<BookOutlined />}
                onClick={() => navigate('/subjects')}
                style={{ marginTop: '16px', backgroundColor: '#faad14', borderColor: '#faad14' }}
              >
                Aller à la page Matières
              </Button>
            </div>
          </Card>
        ) : selectedClassId && selectedEvaluationId && findConfigForClass(selectedClassId) ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <Title level={4}>
                Moyennes - {evaluations.find(e => e.id === selectedEvaluationId)?.nom}
              </Title>
              <Text type="secondary">
                {studentsData.length} élève(s) - Classe {classes.find(c => c.id === selectedClassId)?.name}
                {subjects.length > 0 && ` - ${subjects.length} matière(s)`}
                {findConfigForClass(selectedClassId) && ` - Configuration: Diviseur ${findConfigForClass(selectedClassId)?.divisor}`}
              </Text>
            </div>

            {studentsData.length === 0 ? (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <CalculatorOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '16px' }} />
                  <Title level={3} style={{ color: '#1890ff', marginBottom: '16px' }}>
                    {noDataMessage || 'Aucune moyenne calculée pour cette évaluation'}
                  </Title>
                  <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '24px' }}>
                    {noDataMessage 
                      ? 'Les moyennes sont calculées automatiquement lors de l\'enregistrement des notes.' 
                      : 'Pour voir les moyennes, vous devez d\'abord saisir et enregistrer les notes dans la page "Moyennes".'
                    }
                    <br />
                    Cliquez sur le bouton ci-dessous pour accéder à la saisie des notes.
                  </Text>
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<EditOutlined />}
                    onClick={() => navigate('/notes')}
                    style={{ marginTop: '16px' }}
                  >
                    Aller à la saisie des notes
                  </Button>
                </div>
              </Card>
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
                            {studentsData.filter(s => s.student.gender === 'M').length}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Filles</p>
                          <p className="text-lg font-bold text-pink-600">
                            {studentsData.filter(s => s.student.gender === 'F').length}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-lg font-bold text-gray-900">
                            {studentsData.length}
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
                            {studentsData.filter(s => s.moyenne >= 10 && s.student.gender === 'M').length}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Filles</p>
                          <p className="text-lg font-bold text-pink-600">
                            {studentsData.filter(s => s.moyenne >= 10 && s.student.gender === 'F').length}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-lg font-bold text-gray-900">
                            {studentsData.filter(s => s.moyenne >= 10).length}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Taux de Réussite */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col items-center justify-center">
                      <h4 className="text-xs font-medium text-gray-600 mb-1">Taux de Réussite</h4>
                      <p className="text-3xl font-bold text-green-600">
                        {(() => {
                          const totalAdmis = studentsData.filter(s => s.moyenne >= 10).length;
                          const totalInscrits = students.length;
                          return totalInscrits > 0 ? Math.round((totalAdmis / totalInscrits) * 100) : 0;
                        })()}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {studentsData.filter(s => s.moyenne >= 10).length}/{students.length} admis
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tableau des moyennes */}
                <Table
                  dataSource={studentsData}
                  columns={createColumns()}
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
              description="Sélectionnez une classe et une évaluation pour calculer les moyennes"
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default MoyennesPage;

