// ========================================
// PAGE DE GESTION DES ÉLÈVES
// ========================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Table, 
  Button, 
  Input, 
  Select, 
  Space, 
  Card, 
  Typography, 
  Row, 
  Col, 
  message,
  Popconfirm,
  Tag,
  Tooltip,
  InputNumber
} from 'antd';
import { 
  PlusOutlined, 
  ArrowLeftOutlined, 
  CheckOutlined, 
  EditOutlined, 
  DeleteOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useStudents } from '../hooks/useStudents';
import { CreateStudentData } from '../services/studentService';
import { ClassService } from '../services/classService';
import { Class } from '../services/classService';
import { schoolYearService } from '../services/schoolYearService';
import type { SchoolYear } from '@edustats/shared';

interface StudentFormData extends CreateStudentData {
  id?: number;
}

export function StudentsPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [students, setStudents] = useState<StudentFormData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [classLoading, setClassLoading] = useState(true);
  const [classError, setClassError] = useState<string | null>(null);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<number | null>(null);
  const [rowsToAdd, setRowsToAdd] = useState<number>(1);

  const {
    students: existingStudents,
    loading: studentsLoading,
    error,
    filters,
    setFilters,
    createBulkStudents,
    createStudent,
    updateStudent,
    refreshStudents
  } = useStudents(parseInt(classId || '0'));

  // Charger les années scolaires au montage
  useEffect(() => {
    const loadSchoolYears = async () => {
      try {
        const data = await schoolYearService.getAll();
        setSchoolYears(data.schoolYears);
        
        // Sélectionner l'année active par défaut
        if (data.activeSchoolYear) {
          setSelectedSchoolYearId(data.activeSchoolYear.id);
          // Appliquer le filtre par défaut pour l'année active
          setFilters({ ...filters, schoolYearId: data.activeSchoolYear.id });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des années scolaires:', error);
      }
    };

    loadSchoolYears();
  }, []);

  // Charger les informations de la classe
  useEffect(() => {
    const loadClassInfo = async () => {
      if (!classId) {
        setClassLoading(false);
        return;
      }
      
      try {
        setClassLoading(true);
        setClassError(null);
        const response = await ClassService.getClassById(parseInt(classId));
        if (response.success) {
          setClassInfo(response.data);
        } else {
          setClassError(response.message || 'Erreur lors du chargement de la classe');
          message.error(response.message || 'Erreur lors du chargement de la classe');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de la classe';
        console.error('Erreur lors du chargement de la classe:', err);
        setClassError(errorMessage);
        message.error(errorMessage);
      } finally {
        setClassLoading(false);
      }
    };

    loadClassInfo();
  }, [classId]);

  // Charger les élèves existants ou générer des champs vides
  useEffect(() => {
    if (!classInfo) return; // Attendre que les infos de la classe soient chargées
    
    if (existingStudents && existingStudents.length > 0) {
      // Charger les élèves existants dans le formulaire
      const formStudents: StudentFormData[] = existingStudents.map(student => ({
        id: student.id,
        name: student.name,
        gender: student.gender,
        studentNumber: student.studentNumber || ''
      }));
      setStudents(formStudents);
      setIsEditing(true);
    } else if (existingStudents && existingStudents.length === 0 && !studentsLoading) {
      // Aucun élève existant, démarrer avec un tableau vide
      setStudents([]);
      setIsEditing(false);
    }
  }, [existingStudents, classInfo, studentsLoading]);

  const handleInputChange = (index: number, field: keyof StudentFormData, value: string) => {
    setStudents(prev => prev.map((student, i) => 
      i === index ? { ...student, [field]: value } : student
    ));
  };

  const handleGenderChange = (index: number, value: 'M' | 'F' | '') => {
    setStudents(prev => prev.map((student, i) => 
      i === index ? { 
        ...student, 
        gender: value === '' ? undefined : value as 'M' | 'F'
      } : student
    ));
  };

  const addStudentRow = () => {
    const numberOfRows = rowsToAdd || 1;
    const newRows = Array.from({ length: numberOfRows }, () => ({
      name: '',
      gender: undefined,
      studentNumber: '',
      schoolYearId: selectedSchoolYearId!
    }));
    setStudents(prev => [...prev, ...newRows]);
    message.success(`${numberOfRows} ligne${numberOfRows > 1 ? 's' : ''} ajoutée${numberOfRows > 1 ? 's' : ''}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const validStudents = students.filter(student => student.name.trim() !== '');
    
    if (validStudents.length === 0) {
      message.error('Veuillez saisir au moins un nom d\'élève');
      return;
    }

    // Vérifier les noms vides
    const emptyNames = students.some(student => student.name.trim() === '');
    if (emptyNames) {
      message.error('Tous les élèves doivent avoir un nom');
      return;
    }

    // Vérifier les genres manquants
    const emptyGenders = students.some(student => !student.gender);
    if (emptyGenders) {
      message.error('Tous les élèves doivent avoir un genre sélectionné');
      return;
    }

    setLoading(true);
    
    try {
      if (isEditing) {
        // Mode modification : mettre à jour les élèves existants
        const updatePromises = validStudents.map(async (student) => {
          if (student.id) {
            // Mettre à jour un élève existant
            const updateData = {
              name: student.name.trim(),
              gender: student.gender,
              studentNumber: student.studentNumber.trim() || undefined
            };
            return updateStudent(student.id, updateData);
          } else {
            // Créer un nouvel élève (si ajouté dans le formulaire)
            if (!selectedSchoolYearId) {
              throw new Error('Veuillez sélectionner une année scolaire');
            }
            const createData = {
              name: student.name.trim(),
              schoolYearId: selectedSchoolYearId,
              gender: student.gender,
              studentNumber: student.studentNumber.trim() || undefined
            };
            return createStudent(createData);
          }
        });

        const results = await Promise.all(updatePromises);
        const successCount = results.filter(Boolean).length;
        
        if (successCount === validStudents.length) {
          message.success(`${successCount} élève(s) mis à jour avec succès !`);
          await refreshStudents();
        } else {
          message.error('Certains élèves n\'ont pas pu être mis à jour');
        }
      } else {
        // Mode création : créer de nouveaux élèves
        if (!selectedSchoolYearId) {
          message.error('Veuillez sélectionner une année scolaire');
          return;
        }
        
        const studentsToCreate = validStudents.map(student => ({
          name: student.name.trim(),
          schoolYearId: selectedSchoolYearId,
          gender: student.gender,
          studentNumber: student.studentNumber.trim() || undefined
        }));

        const success = await createBulkStudents(studentsToCreate);
        
        if (success) {
          message.success(`${validStudents.length} élève(s) créé(s) avec succès !`);
          await refreshStudents();
          setIsEditing(true);
        }
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des élèves:', err);
      message.error('Erreur lors de la sauvegarde des élèves');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/classes');
  };

  if (classLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des informations de la classe...</p>
        </div>
      </div>
    );
  }

  if (classError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{classError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Classe non trouvée</h2>
          <p className="text-gray-600 mb-4">La classe demandée n'existe pas ou vous n'y avez pas accès.</p>
          <button
            onClick={() => navigate('/classes')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retour aux classes
          </button>
        </div>
      </div>
    );
  }

  const { Title, Text } = Typography;

  // Configuration des colonnes du tableau
  const columns = [
    {
      title: 'N°',
      dataIndex: 'index',
      key: 'index',
      width: 50,
      render: (text: any, record: any, index: number) => index + 1,
    },
    {
      title: 'Nom complet',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (text: string, record: StudentFormData, index: number) => (
        <Input
          value={text}
          onChange={(e) => handleInputChange(index, 'name', e.target.value)}
          size="large"
        />
      ),
    },
    {
      title: 'Genre',
      dataIndex: 'gender',
      key: 'gender',
      width: 150,
      render: (value: string, record: StudentFormData, index: number) => (
        <Select
          value={value || undefined}
          onChange={(val) => handleGenderChange(index, val as 'M' | 'F' | '')}
          size="large"
          style={{ width: '100%' }}
        >
          <Select.Option value="M">M</Select.Option>
          <Select.Option value="F">F</Select.Option>
        </Select>
      ),
    },
    {
      title: 'Matricule',
      dataIndex: 'studentNumber',
      key: 'studentNumber',
      width: 200,
      render: (text: string, record: StudentFormData, index: number) => (
        <Input
          value={text || ''}
          onChange={(e) => handleInputChange(index, 'studentNumber', e.target.value)}
          size="large"
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (text: any, record: StudentFormData, index: number) => (
        <Tooltip title="Supprimer">
          <DeleteOutlined 
            style={{ 
              color: '#ff4d4f', 
              cursor: 'pointer',
              fontSize: '16px'
            }}
            onClick={() => {
              setStudents(prev => prev.filter((_, i) => i !== index));
            }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                type="text"
              />
              <div>
                <Title level={2} className="mb-0">
                  Élèves - {classInfo.name}
                </Title>
              </div>
            </Space>
          </Col>
          
          <Col>
            <Space>
              <Text type="secondary">
                {students.length} élève{students.length !== 1 ? 's' : ''}
              </Text>
              <InputNumber
                min={1}
                max={100}
                value={rowsToAdd}
                onChange={(value) => setRowsToAdd(value || 1)}
                placeholder="Nombre"
                size="large"
                style={{ width: 100 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addStudentRow}
                size="large"
              >
                Ajouter {rowsToAdd > 1 ? `${rowsToAdd} lignes` : ''}
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Tableau des élèves */}
      <>
        <div className="mb-4">
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} className="mb-1">
                {isEditing ? 'Modifier les élèves' : 'Créer les élèves'}
              </Title>
              <Text type="secondary">
                {isEditing 
                  ? 'Modifiez les informations des élèves existants'
                  : 'Ajoutez des élèves à cette classe'
                }
              </Text>
            </Col>
            <Col>
              <Space align="center">
                <CalendarOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                <Text strong style={{ fontSize: '14px' }}>
                  Année scolaire :
                </Text>
                <Select
                  value={selectedSchoolYearId}
                  onChange={(value) => {
                    console.log('📅 StudentsPage - Année scolaire sélectionnée:', value);
                    setSelectedSchoolYearId(value);
                    console.log('🔄 StudentsPage - Calling setFilters with:', { schoolYearId: value });
                    setFilters({ schoolYearId: value });
                  }}
                  style={{ width: 180 }}
                  placeholder="Sélectionner l'année"
                  size="large"
                  allowClear
                  onClear={() => {
                    console.log('❌ StudentsPage - Filtre année scolaire effacé');
                    setSelectedSchoolYearId(null);
                    setFilters({ schoolYearId: undefined });
                  }}
                >
                  {schoolYears.map((year) => (
                    <Select.Option key={year.id} value={year.id}>
                      {year.name} {year.isActive && <Tag color="success" style={{ marginLeft: 4 }}>Active</Tag>}
                    </Select.Option>
                  ))}
                </Select>
              </Space>
            </Col>
          </Row>
        </div>

        <Table
          columns={columns}
          dataSource={students}
          rowKey={(record, index) => index?.toString() || '0'}
          pagination={false}
          size="large"
          className="mb-4"
          scroll={{ x: 800 }}
          bordered={false}
        />

        {/* Boutons d'action */}
        <Row justify="end" className="mt-4">
          <Space>
            <Button onClick={handleBack} size="large">
              Annuler
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={loading}
              disabled={students.length === 0}
              onClick={handleSubmit}
              size="large"
            >
              Enregistrer
            </Button>
          </Space>
        </Row>
      </>

      {/* Message d'erreur */}
      {error && (
        <div className="card border-red-200 bg-red-50">
          <div className="text-red-800">
            <Text strong>Erreur :</Text> {error}
          </div>
        </div>
      )}
    </div>
  );
}