import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Space,
  Button,
  Select,
  Spin,
  Alert,
  Typography,
  Empty
} from 'antd';
import {
  TrophyOutlined,
  UserOutlined,
  BookOutlined,
  BarChartOutlined,
  FileTextOutlined,
  StarOutlined
} from '@ant-design/icons';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { ClassService, Class } from '../services/classService';
import { StudentService, Student } from '../services/studentService';
import { evaluationService } from '../services/evaluationService';
import { moyenneService, MoyenneWithDetails } from '../services/moyenneService';
import { noteService } from '../services/noteService';
import { subjectService, Subject } from '../services/subjectService';
import { schoolYearService } from '../services/schoolYearService';
import { useAuth } from '../context/AuthContext';
import type { EvaluationSimple, SchoolYear } from '@edustats/shared';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  ChartTitle,
  ChartTooltip,
  Legend
);

const { Title, Text } = Typography;

interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  totalEvaluations: number;
  averageScore: number;
}

interface TopStudent {
  student: Student;
  moyenne: number;
  rang: number;
  evaluationName: string;
}

interface SubjectLeader {
  subject: Subject;
  topStudents: {
    student: Student;
    moyenne: number;
  }[];
  maxMoyenne: number;
}


export function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États des données
  const [classes, setClasses] = useState<Class[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [evaluations, setEvaluations] = useState<EvaluationSimple[]>([]);
  const [moyennes, setMoyennes] = useState<MoyenneWithDetails[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<number | null>(null);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number | null>(null);
  
  // Nouvelles données pour les statistiques
  const [top5Students, setTop5Students] = useState<TopStudent[]>([]);
  const [subjectLeaders, setSubjectLeaders] = useState<SubjectLeader[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingLeaders, setLoadingLeaders] = useState(false);

  // Charger les données initiales
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadDashboardData();
    }
  }, [authLoading, isAuthenticated]);

  // Recharger quand l'année scolaire change
  useEffect(() => {
    if (selectedSchoolYearId) {
      loadDashboardData();
    }
  }, [selectedSchoolYearId]);

  // Charger les statistiques quand l'évaluation change
  useEffect(() => {
    console.log('🔄 useEffect triggered - selectedEvaluationId:', selectedEvaluationId);
    if (selectedEvaluationId) {
      console.log('✅ Chargement des statistiques pour l\'évaluation:', selectedEvaluationId);
      // Charger les top 5 élèves (nécessite les moyennes)
      if (moyennes.length > 0) {
        loadTopStudentsForEvaluation(selectedEvaluationId);
      }
      // Charger les leaders par matière (charge directement les notes)
      loadSubjectLeadersForEvaluation(selectedEvaluationId);
    } else {
      console.log('❌ Aucune évaluation sélectionnée');
    }
  }, [selectedEvaluationId, moyennes]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les années scolaires
      const schoolYearsData = await schoolYearService.getAll();
      setSchoolYears(schoolYearsData.schoolYears);
      
      // Sélectionner l'année active par défaut
      if (!selectedSchoolYearId && schoolYearsData.activeSchoolYear) {
        setSelectedSchoolYearId(schoolYearsData.activeSchoolYear.id);
      }

      // Charger les classes
      const classesResponse = await ClassService.getClasses();
      if (classesResponse.success) {
        setClasses(classesResponse.data.classes);

        // Charger les étudiants pour chaque classe
        let studentCount = 0;
        const allEvaluations: EvaluationSimple[] = [];
        const allMoyennes: MoyenneWithDetails[] = [];

        for (const cls of classesResponse.data.classes) {
          try {
            // Étudiants
            const studentsResponse = await StudentService.getStudentsByClass(cls.id);
            if (studentsResponse.success) {
              studentCount += studentsResponse.data.length;
            }

            // Évaluations
            const classEvals = await evaluationService.getEvaluationsByClass(cls.id);
            allEvaluations.push(...classEvals);

            // Moyennes
            const classMoyennes = await moyenneService.getMoyennesByClass(cls.id);
            allMoyennes.push(...classMoyennes);
          } catch (err) {
            console.error(`Erreur pour la classe ${cls.id}:`, err);
          }
        }

        setTotalStudents(studentCount);
        setEvaluations(allEvaluations);
        setMoyennes(allMoyennes);
        
        // Sélectionner la première évaluation par défaut
        if (allEvaluations.length > 0 && !selectedEvaluationId) {
          const latestEvaluation = allEvaluations.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
          console.log('🎯 Sélection de l\'évaluation par défaut:', latestEvaluation.id);
          setSelectedEvaluationId(latestEvaluation.id);
        } else if (selectedEvaluationId) {
          console.log('🎯 Utilisation de l\'évaluation déjà sélectionnée:', selectedEvaluationId);
        } else {
          console.log('❌ Aucune évaluation disponible');
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Charger les meilleurs élèves pour une évaluation spécifique
  const loadTopStudentsForEvaluation = async (evaluationId: number) => {
    try {
      const evaluation = evaluations.find(e => e.id === evaluationId);
      if (!evaluation) return;

      // Filtrer les moyennes pour cette évaluation
      const evaluationMoyennes = moyennes
        .filter(m => m.evaluationId === evaluationId)
        .sort((a, b) => b.moyenne - a.moyenne);

      // Top 5
      const top5 = evaluationMoyennes.slice(0, 5).map((m, index) => ({
        student: m.student!,
        moyenne: m.moyenne,
        rang: index + 1,
        evaluationName: evaluation.nom
      }));
      setTop5Students(top5);
    } catch (err) {
      console.error('Erreur lors du chargement des meilleurs élèves:', err);
    }
  };

  // Charger les leaders par matière pour une évaluation spécifique
  const loadSubjectLeadersForEvaluation = async (evaluationId: number) => {
    try {
      setLoadingLeaders(true);
      console.log('🔍 Chargement des leaders par matière pour l\'évaluation:', evaluationId);
      
      // Charger toutes les matières
      const allSubjects = await subjectService.getSubjects();
      console.log('📚 Matières disponibles:', allSubjects.length);
      setSubjects(allSubjects);

      if (allSubjects.length === 0) {
        console.log('❌ Aucune matière disponible');
        setSubjectLeaders([]);
        return;
      }

      const leaders: SubjectLeader[] = [];
      
      // Pour chaque matière, trouver les meilleures notes pour cette évaluation
      for (const subject of allSubjects) {
        console.log(`🔍 Traitement de la matière: ${subject.name} (ID: ${subject.id})`);
        
        try {
          // Récupérer toutes les notes pour cette matière
          const subjectNotes = await noteService.getNotesBySubject(subject.id);
          console.log(`📝 Notes trouvées pour ${subject.name}:`, subjectNotes.length);
          
          // Filtrer les notes pour cette évaluation spécifique
          const evaluationNotes = subjectNotes.filter(note => 
            note.evaluationId === evaluationId &&
            !note.isAbsent && 
            note.isActive && 
            Number(note.value) > 0
          );
          
          console.log(`📝 Notes valides pour ${subject.name} dans cette évaluation:`, evaluationNotes.length);
          if (evaluationNotes.length > 0) {
            console.log(`📋 Exemple de note pour ${subject.name}:`, evaluationNotes[0]);
          }
          
          if (evaluationNotes.length > 0) {
            // Trouver la note maximale (convertir en nombre)
            const maxNote = Math.max(...evaluationNotes.map(note => Number(note.value)));
            console.log(`🏆 Note maximale pour ${subject.name}:`, maxNote);
            
            // Trouver tous les étudiants avec cette note maximale
            const topStudents = evaluationNotes
              .filter(note => Number(note.value) === maxNote)
              .map(note => ({
                student: {
                  id: note.studentId,
                  name: note.student?.name || 'Étudiant inconnu'
                } as Student,
                moyenne: Number(note.value)
              }));
            
            // Éliminer les doublons (même étudiant avec plusieurs notes identiques)
            const uniqueTopStudents = topStudents.filter((student, index, self) => 
              index === self.findIndex(s => s.student.id === student.student.id)
            );
            
            if (uniqueTopStudents.length > 0) {
              leaders.push({
                subject,
                topStudents: uniqueTopStudents,
                maxMoyenne: maxNote
              });
              console.log(`✅ Ajouté ${subject.name} avec note ${maxNote} - ${uniqueTopStudents.length} étudiant(s)`);
            }
          } else {
            console.log(`❌ Aucune note valide trouvée pour ${subject.name} dans cette évaluation`);
          }
        } catch (error) {
          console.error(`Erreur lors du chargement des notes pour ${subject.name}:`, error);
        }
      }
      
      console.log('🏆 Leaders finaux:', leaders.length);
      setSubjectLeaders(leaders.sort((a, b) => b.maxMoyenne - a.maxMoyenne));
    } catch (err) {
      console.error('Erreur lors du chargement des leaders par matière:', err);
      setSubjectLeaders([]);
    } finally {
      setLoadingLeaders(false);
    }
  };

  // Charger les leaders par matière basés sur les plus fortes notes (ancienne version - gardée pour compatibilité)
  const loadSubjectLeaders = async (allMoyennes: MoyenneWithDetails[]) => {
    try {
      console.log('🔍 Chargement des leaders par matière (NOTES INDIVIDUELLES)...');
      
      // Charger toutes les matières
      const allSubjects = await subjectService.getSubjects();
      console.log('📚 Matières disponibles:', allSubjects.length);
      setSubjects(allSubjects);

      const leaders: SubjectLeader[] = [];
      
      // Pour chaque matière, trouver les plus fortes notes
      for (const subject of allSubjects) {
        console.log(`🔍 Traitement de la matière: ${subject.name} (ID: ${subject.id})`);
        
        try {
          // Récupérer toutes les notes pour cette matière
          const subjectNotes = await noteService.getNotesBySubject(subject.id);
          console.log(`📝 Notes trouvées pour ${subject.name}:`, subjectNotes.length);
          
          if (subjectNotes.length > 0) {
            // Filtrer les notes valides (non absents et actives)
            const validNotes = subjectNotes.filter(note => 
              !note.isAbsent && 
              note.isActive && 
              Number(note.value) > 0
            );
            
            if (validNotes.length > 0) {
              // Trouver la note maximale (convertir en nombre)
              const maxNote = Math.max(...validNotes.map(note => Number(note.value)));
              console.log(`🏆 Note maximale pour ${subject.name}:`, maxNote);
              
              // Trouver tous les étudiants avec cette note maximale
              const topStudents = validNotes
                .filter(note => Number(note.value) === maxNote)
                .map(note => {
                  // Utiliser directement les informations de l'étudiant depuis la note
                  const studentInfo = {
                    id: note.studentId,
                    name: note.student?.name || 'Étudiant inconnu'
                  };
                  
                  console.log(`👤 Informations étudiant pour ${subject.name}:`, studentInfo);
                  
                  return {
                    student: studentInfo,
                    moyenne: Number(note.value)
                  };
                });
              
              // Éliminer les doublons (même étudiant avec plusieurs notes identiques)
              const uniqueTopStudents = topStudents.filter((student, index, self) => 
                index === self.findIndex(s => s.student.id === student.student.id)
              );
              
              if (uniqueTopStudents.length > 0) {
                leaders.push({
                  subject,
                  topStudents: uniqueTopStudents,
                  maxMoyenne: maxNote
                });
                console.log(`✅ Ajouté ${subject.name} avec note ${maxNote} - ${uniqueTopStudents.length} étudiant(s)`);
                console.log(`👑 Meilleurs étudiants pour ${subject.name}:`, uniqueTopStudents.map(s => s.student.name));
              }
            } else {
              console.log(`❌ Aucune note valide trouvée pour ${subject.name}`);
            }
          } else {
            console.log(`❌ Aucune note trouvée pour ${subject.name}`);
          }
        } catch (error) {
          console.error(`Erreur lors du chargement des notes pour ${subject.name}:`, error);
        }
      }
      
      console.log('🏆 Leaders finaux:', leaders.length);
      setSubjectLeaders(leaders.sort((a, b) => b.maxMoyenne - a.maxMoyenne));
    } catch (err) {
      console.error('Erreur lors du chargement des leaders par matière:', err);
    }
  };

  // Calcul des statistiques principales
  const dashboardStats: DashboardStats = useMemo(() => {
    console.log('🔢 Calcul des statistiques:', {
      selectedEvaluationId,
      totalMoyennes: moyennes.length,
      evaluationsAvailable: evaluations.map(e => ({ id: e.id, nom: e.nom })),
      moyennesPreview: moyennes.slice(0, 5).map(m => ({ 
        evaluationId: m.evaluationId, 
        moyenne: m.moyenne,
        studentId: m.studentId,
        studentName: m.student?.name
      }))
    });

    // Calculer la moyenne générale pour l'évaluation sélectionnée
    let averageScore = 0;
    if (selectedEvaluationId && moyennes.length > 0) {
      const evaluationMoyennes = moyennes.filter(m => m.evaluationId === selectedEvaluationId);
      console.log('📊 Moyennes filtrées pour l\'évaluation:', {
        evaluationId: selectedEvaluationId,
        moyennesFiltered: evaluationMoyennes.length,
        moyennesDetails: evaluationMoyennes.map(m => ({ studentId: m.studentId, moyenne: m.moyenne })),
        allEvaluationIds: [...new Set(moyennes.map(m => m.evaluationId))],
        selectedEvaluationType: typeof selectedEvaluationId
      });
      
      if (evaluationMoyennes.length > 0) {
        // Filtrer les moyennes valides (non nulles, non NaN)
        const validMoyennes = evaluationMoyennes.filter(m => 
          m.moyenne !== null && 
          m.moyenne !== undefined && 
          !isNaN(m.moyenne) && 
          m.moyenne > 0
        );
        
        console.log('📊 Moyennes valides:', {
          total: evaluationMoyennes.length,
          valid: validMoyennes.length,
          moyennes: validMoyennes.map(m => ({ studentId: m.studentId, moyenne: m.moyenne }))
        });
        
        if (validMoyennes.length > 0) {
          averageScore = validMoyennes.reduce((sum, m) => sum + m.moyenne, 0) / validMoyennes.length;
          console.log('✅ Moyenne générale calculée:', {
            evaluationId: selectedEvaluationId,
            moyennesCount: validMoyennes.length,
            averageScore: averageScore,
            rounded: Math.round(averageScore * 100) / 100
          });
        } else {
          console.log('❌ Aucune moyenne valide trouvée pour l\'évaluation:', selectedEvaluationId);
        }
      } else {
        console.log('❌ Aucune moyenne trouvée pour l\'évaluation:', selectedEvaluationId);
      }
    } else {
      console.log('❌ Conditions non remplies:', {
        selectedEvaluationId,
        moyennesLength: moyennes.length
      });
    }

    return {
      totalClasses: classes.length,
      totalStudents,
      totalEvaluations: evaluations.length,
      averageScore: isNaN(averageScore) ? 0 : Math.round(averageScore * 100) / 100
    };
  }, [classes, totalStudents, evaluations, moyennes, selectedEvaluationId]);






  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Chargement du tableau de bord...</Text>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Alert
        message="Non authentifié"
        description="Vous devez être connecté pour accéder au tableau de bord."
        type="warning"
        showIcon
      />
    );
  }

  if (error) {
    return (
      <Alert
        message="Erreur"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={loadDashboardData}>
            Réessayer
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* En-tête */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <BarChartOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Tableau de Bord
          </Title>
          <Text type="secondary">
            Visualisez les performances avec des graphiques détaillés et intuitifs
          </Text>
        </Col>
        <Col>
          <Space>
            <Select
              value={selectedSchoolYearId}
              onChange={setSelectedSchoolYearId}
              style={{ width: 200 }}
              placeholder="Année scolaire"
            >
              {schoolYears.map(year => (
                <Select.Option key={year.id} value={year.id}>
                  {year.name} {year.isActive && <Tag color="success">Active</Tag>}
                </Select.Option>
              ))}
            </Select>
            <Select
              value={selectedEvaluationId}
              onChange={setSelectedEvaluationId}
              style={{ width: 200 }}
              placeholder="Sélectionner une évaluation"
            >
              {evaluations.map(evaluation => (
                <Select.Option key={evaluation.id} value={evaluation.id}>
                  {evaluation.nom}
                </Select.Option>
              ))}
            </Select>
          </Space>
        </Col>
      </Row>

      {/* KPIs Principaux */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Classes Actives"
              value={dashboardStats.totalClasses}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Total Élèves"
              value={dashboardStats.totalStudents}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Évaluations"
              value={dashboardStats.totalEvaluations}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Moyenne Générale"
              value={isNaN(dashboardStats.averageScore) ? 0 : dashboardStats.averageScore}
              suffix="/20"
              prefix={<TrophyOutlined />}
              valueStyle={{ 
                color: (isNaN(dashboardStats.averageScore) ? 0 : dashboardStats.averageScore) >= 10 ? '#52c41a' : '#ff4d4f' 
              }}
            />
          </Card>
        </Col>
      </Row>



      {/* Nouvelles statistiques */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>

        {/* Top 5 élèves */}
        <Col xs={24} lg={12}>
          <Card
            title={
            <Space>
              <StarOutlined style={{ color: '#1890ff' }} />
              Top 5 Élèves
            </Space>
          }
          extra={
            top5Students.length > 0 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {top5Students[0]?.evaluationName}
              </Text>
            )
          }
        >
          {top5Students.length > 0 ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              {top5Students.map((student, index) => (
                <div key={student.student.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: index < top5Students.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}>
                  <Space>
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: index < 3 ? (index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32') : '#1890ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 10,
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <Text style={{ fontSize: 13 }}>{student.student.name}</Text>
                      <br />
                    </div>
                  </Space>
                  <div style={{ textAlign: 'right' }}>
                    <Text style={{ 
                      color: Number(student.moyenne) >= 16 ? '#52c41a' : Number(student.moyenne) >= 12 ? '#1890ff' : '#faad14',
                      fontSize: 14
                    }}>
                      {Number(student.moyenne).toFixed(2)}/20
                    </Text>
                  </div>
                </div>
              ))}
            </Space>
          ) : (
            <Empty description="Aucune donnée disponible" />
          )}
        </Card>
        </Col>

        {/* Leaders par matière */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <TrophyOutlined style={{ color: '#52c41a' }} />
                Leaders par Matière
              </Space>
            }
          >
            {loadingLeaders ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Spin size="small" />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Chargement des leaders...
                  </Text>
                </div>
              </div>
            ) : subjectLeaders.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {subjectLeaders.slice(0, 5).map((leader, index) => (
                    <div key={leader.subject.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: index < Math.min(subjectLeaders.length, 5) - 1 ? '1px solid #f0f0f0' : 'none'
                    }}>
                      <div>
                        <Text strong style={{ fontSize: 13 }}>{leader.subject.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {leader.topStudents.map(s => s.student.name).join(', ')}
                        </Text>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Text strong style={{ 
                          color: Number(leader.maxMoyenne) >= 16 ? '#52c41a' : Number(leader.maxMoyenne) >= 12 ? '#1890ff' : '#faad14',
                          fontSize: 14
                        }}>
                          {Number(leader.maxMoyenne).toFixed(2)}/20
                        </Text>
                      </div>
                    </div>
                ))}
              </Space>
            ) : (
              <Empty description="Aucune donnée disponible" />
            )}
          </Card>
        </Col>
      </Row>

    </div>
  );
}
