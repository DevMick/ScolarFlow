// ========================================
// PAGE D'AJOUT D'ÉLÈVES
// ========================================

import { useState, useEffect } from 'react';
import { 
  Card,
  Form,
  Select,
  Button,
  Table,
  Typography,
  Space,
  message,
  Row,
  Col,
  Spin,
  Tag,
  Tabs,
  Popconfirm,
  InputNumber
} from 'antd';
import { 
  UserAddOutlined,
  SaveOutlined,
  CalendarOutlined,
  BookOutlined,
  DatabaseOutlined,
  PlusOutlined,
  DeleteOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { ClassService } from '../services/classService';
import type { Class } from '../services/classService';
import { schoolYearService } from '../services/schoolYearService';
import { StudentService } from '../services/studentService';
import type { SchoolYear, CreateStudentData } from '@edustats/shared';

// Interface locale pour les étudiants avec classe
interface StudentWithClass {
  id: number;
  name: string;
  gender: string;
  studentNumber?: string;
  class: {
    id: number;
    name: string;
  };
  schoolYear: {
    id: number;
    name: string;
  };
}

const { Title, Text } = Typography;

interface StudentFormData {
  id?: number;
  name: string;
  gender?: 'M' | 'F';
  studentNumber?: string;
  schoolYearId?: number;
}

export function StudentsOverviewPage() {
  const [form] = Form.useForm();
  const [classes, setClasses] = useState<Class[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentFormData[]>([]);
  const [existingStudents, setExistingStudents] = useState<StudentWithClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [rowsToAdd, setRowsToAdd] = useState<number>(1);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [classesResponse, schoolYearsData] = await Promise.all([
        ClassService.getClasses(),
        schoolYearService.getAll()
      ]);

      if (classesResponse.success) {
        setClasses(classesResponse.data.classes);
        
        // Sélectionner automatiquement la classe s'il n'y en a qu'une seule
        if (classesResponse.data.classes.length === 1) {
          const singleClass = classesResponse.data.classes[0];
          setSelectedClassId(singleClass.id);
          form.setFieldValue('classId', singleClass.id);
        }
      }

      setSchoolYears(schoolYearsData.schoolYears);

      // Sélectionner l'année active par défaut
      if (schoolYearsData.activeSchoolYear) {
        setSelectedSchoolYearId(schoolYearsData.activeSchoolYear.id);
        form.setFieldValue('schoolYearId', schoolYearsData.activeSchoolYear.id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      message.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };


  const loadExistingStudents = async () => {
    if (!selectedClassId || !selectedSchoolYearId) {
      setExistingStudents([]);
      return;
    }

    try {
      setLoadingExisting(true);
      const response = await StudentService.getStudentsByClass(selectedClassId, {
        schoolYearId: selectedSchoolYearId
      });

      if (response.success) {
        setExistingStudents(response.data as unknown as StudentWithClass[]);
      } else {
        setExistingStudents([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des élèves existants:', error);
      setExistingStudents([]);
    } finally {
      setLoadingExisting(false);
    }
  };

  // Charger les élèves existants quand la classe ou l'année change
  useEffect(() => {
    loadExistingStudents();
    
    // Charger aussi dans l'onglet Saisie
    if (selectedClassId && selectedSchoolYearId) {
      loadStudentsForEditing();
    }
  }, [selectedClassId, selectedSchoolYearId]);

  // Charger les élèves existants dans l'onglet Saisie
  const loadStudentsForEditing = async () => {
    if (!selectedClassId || !selectedSchoolYearId) {
      return;
    }

    try {
      const response = await StudentService.getStudentsByClass(selectedClassId, {
        schoolYearId: selectedSchoolYearId
      });

      if (response.success && response.data) {
        // Charger les élèves existants comme éditables
        const formStudents: StudentFormData[] = response.data.map(student => ({
          id: student.id,
          name: student.name,
          gender: student.gender as 'M' | 'F',
          studentNumber: student.studentNumber || ''
        }));
        setStudents(formStudents);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des élèves:', error);
    }
  };

  const handleInputChange = (index: number, field: keyof StudentFormData, value: any) => {
    setStudents(prev => prev.map((student, i) => 
      i === index ? { ...student, [field]: value } : student
    ));
  };


  const handleSubmit = async () => {
    if (!selectedClassId) {
      message.error('Veuillez sélectionner une classe');
      return;
    }

    if (!selectedSchoolYearId) {
      message.error('Veuillez sélectionner une année scolaire');
      return;
    }

    // Validation
    const validStudents = students.filter(s => s.name.trim() !== '');
    
    if (validStudents.length === 0) {
      message.error('Veuillez saisir au moins un nom d\'élève');
      return;
    }

    // Vérifier que tous les élèves ont un genre
    const missingGender = validStudents.some(s => !s.gender);
    if (missingGender) {
      message.error('Tous les élèves doivent avoir un genre sélectionné');
      return;
    }

    setSaving(true);

    try {
      // Séparer les nouveaux élèves et les élèves existants
      const newStudents = validStudents.filter(s => !s.id);
      const existingStudentsToUpdate = validStudents.filter(s => s.id);

      const promises = [];

      // Créer les nouveaux élèves
      if (newStudents.length > 0) {
        const studentsToCreate: CreateStudentData[] = newStudents.map(student => ({
          name: student.name.trim(),
          schoolYearId: selectedSchoolYearId,
          gender: student.gender,
          studentNumber: student.studentNumber?.trim() || undefined
        }));

        promises.push(StudentService.createBulkStudents(selectedClassId, studentsToCreate));
      }

      // Mettre à jour les élèves existants
      if (existingStudentsToUpdate.length > 0) {
        const updatePromises = existingStudentsToUpdate.map(student =>
          StudentService.updateStudent(student.id!, {
            name: student.name.trim(),
            gender: student.gender,
            studentNumber: student.studentNumber?.trim() || undefined
          })
        );
        promises.push(...updatePromises);
      }

      await Promise.all(promises);
      
      const createdCount = newStudents.length;
      const updatedCount = existingStudentsToUpdate.length;
      
      if (createdCount > 0 && updatedCount > 0) {
        message.success(`${createdCount} élève(s) créé(s) et ${updatedCount} élève(s) modifié(s) avec succès !`);
      } else if (createdCount > 0) {
        message.success(`${createdCount} élève(s) créé(s) avec succès !`);
      } else if (updatedCount > 0) {
        message.success(`${updatedCount} élève(s) modifié(s) avec succès !`);
      }
      
      // Recharger les élèves
      loadStudentsForEditing();
      loadExistingStudents();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      message.error('Erreur lors de la sauvegarde des élèves');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async (studentId: number, index: number) => {
    try {
      await StudentService.deleteStudent(studentId);
      message.success('Élève supprimé avec succès');
      
      // Retirer de la liste locale
      setStudents(prev => prev.filter((_, i) => i !== index));
      
      // Recharger les élèves existants
      loadExistingStudents();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      message.error('Erreur lors de la suppression de l\'élève');
    }
  };

  const handleAddNewRow = () => {
    const numberOfRows = rowsToAdd || 1;
    const newRows = Array.from({ length: numberOfRows }, () => ({
      name: '',
      gender: undefined,
      studentNumber: ''
    }));
    setStudents(prev => [...prev, ...newRows]);
    message.success(`${numberOfRows} ligne${numberOfRows > 1 ? 's' : ''} ajoutée${numberOfRows > 1 ? 's' : ''}`);
  };

  const columns = [
    {
      title: 'N°',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: 'Nom de l\'élève *',
      key: 'name',
      render: (_: any, record: StudentFormData, index: number) => (
        <input
          type="text"
          value={record.name}
          onChange={(e) => handleInputChange(index, 'name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: KOUASSI Jean"
        />
      )
    },
    {
      title: 'Genre *',
      key: 'gender',
      width: 120,
      render: (_: any, record: StudentFormData, index: number) => (
        <Select
          value={record.gender}
          onChange={(value) => handleInputChange(index, 'gender', value)}
          style={{ width: '100%' }}
          placeholder="Sélectionner"
        >
          <Select.Option value="M">M</Select.Option>
          <Select.Option value="F">F</Select.Option>
        </Select>
      )
    },
    {
      title: 'Matricule',
      key: 'studentNumber',
      width: 150,
      render: (_: any, record: StudentFormData, index: number) => (
        <input
          type="text"
          value={record.studentNumber}
          onChange={(e) => handleInputChange(index, 'studentNumber', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: 2024001"
        />
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: StudentFormData, index: number) => {
        if (record.id) {
          // Élève existant - bouton supprimer
          return (
            <Popconfirm
              title="Supprimer cet élève ?"
              description="Cette action est irréversible."
              onConfirm={() => handleDeleteStudent(record.id!, index)}
              okText="Supprimer"
              cancelText="Annuler"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          );
        } else {
          // Nouvelle ligne - bouton retirer
          return (
            <Button
              type="text"
              danger
              icon={<CloseOutlined />}
              size="small"
              onClick={() => setStudents(prev => prev.filter((_, i) => i !== index))}
            />
          );
        }
      }
    }
  ];

  const existingColumns = [
    {
      title: 'N°',
      key: 'index',
      width: 60,
      fixed: 'left' as const,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      minWidth: 150,
      render: (name: string) => (
        <span style={{ wordBreak: 'break-word' }}>{name}</span>
      )
    },
    {
      title: 'Genre',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (gender: string) => (
        <span style={{ textAlign: 'center', display: 'block' }}>
          {gender === 'M' ? 'M' : 'F'}
        </span>
      )
    },
    {
      title: 'Matricule',
      dataIndex: 'studentNumber',
      key: 'studentNumber',
      width: 120,
      render: (studentNumber: string) => (
        <span style={{ wordBreak: 'break-word' }}>
          {studentNumber || '-'}
        </span>
      )
    },
    {
      title: 'Classe',
      dataIndex: ['class', 'name'],
      key: 'class',
      width: 120,
      render: (className: string) => (
        <span style={{ wordBreak: 'break-word' }}>{className}</span>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

    return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '16px' }}>
      {/* Header */}
      <Card className="mb-4">
        <Row justify="space-between" align="middle">
          <Col xs={24} sm={24} md={18}>
            <Title level={2} className="mb-2">Ajouter des Élèves</Title>
            <Text type="secondary">Sélectionnez une classe et ajoutez des élèves pour l'année scolaire en cours</Text>
          </Col>
        </Row>
      </Card>

      {/* Onglets */}
      <Card>
        <Tabs
          defaultActiveKey="input"
          items={[
            {
              key: 'input',
              label: (
                <Space>
                  <UserAddOutlined />
                  <span>Saisie des informations des élèves</span>
                </Space>
              ),
              children: (
                <div>
                  {/* Formulaire de sélection */}
                  <Card className="mb-6">
                    <Form form={form} layout="vertical">
                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            label={
                              <Space>
                                <BookOutlined />
                                <span>Classe</span>
                              </Space>
                            }
                            name="classId"
                            rules={[{ required: true, message: 'Veuillez sélectionner une classe' }]}
                          >
                            <Select
                              placeholder="Sélectionnez une classe"
                              size="large"
                              onChange={setSelectedClassId}
                              value={selectedClassId}
                            >
                              {classes.map((cls) => (
                                <Select.Option key={cls.id} value={cls.id}>
                                  {cls.name}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                          <Form.Item
                            label={
                              <Space>
                                <CalendarOutlined />
                                <span>Année scolaire</span>
                              </Space>
                            }
                            name="schoolYearId"
                            rules={[{ required: true, message: 'Veuillez sélectionner une année scolaire' }]}
                          >
                            <Select
                              placeholder="Sélectionnez l'année"
                              size="large"
                              onChange={setSelectedSchoolYearId}
                              value={selectedSchoolYearId}
                            >
                              {schoolYears.map((year) => (
                                <Select.Option key={year.id} value={year.id}>
                                  {year.name} {year.isActive && <Tag color="success">Active</Tag>}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                    </Form>
                  </Card>

                  {/* Tableau des élèves */}
                  {selectedClassId && selectedSchoolYearId ? (
                    <Card
                      title={
                        <Space>
                          <UserAddOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                          <span>Gestion des élèves ({students.length} élève{students.length > 1 ? 's' : ''})</span>
                        </Space>
                      }
                      extra={
                        <Space>
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
                            icon={<PlusOutlined />}
                            onClick={handleAddNewRow}
                            size="large"
                          >
                            Ajouter {rowsToAdd > 1 ? `${rowsToAdd} lignes` : 'une ligne'}
                          </Button>
                          <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={handleSubmit}
                            loading={saving}
                            size="large"
                            disabled={students.length === 0}
                          >
                            Enregistrer tout
                          </Button>
                        </Space>
                      }
                    >
                      {students.length > 0 ? (
                        <Table
                          columns={columns}
                          dataSource={students}
                          rowKey={(record, index) => record.id?.toString() || `new-${index}`}
                          pagination={false}
                          bordered
                          scroll={{ x: 800 }}
                          rowClassName={(record) => 
                            !record.id ? 'bg-blue-50' : ''
                          }
                        />
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                          <UserAddOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
                          <Title level={4}>Aucun élève</Title>
                          <Text type="secondary">
                            Cliquez sur "Ajouter une ligne" pour commencer à ajouter des élèves.
                          </Text>
                        </div>
                      )}
                    </Card>
                  ) : (
                    <Card>
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <UserAddOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
                        <Title level={4}>Prêt à gérer les élèves</Title>
                        <Text type="secondary">
                          Sélectionnez une classe et une année scolaire pour commencer.
                        </Text>
                      </div>
                    </Card>
                  )}
            </div>
              )
            },
            {
              key: 'existing',
              label: (
                <Space>
                  <DatabaseOutlined />
                  <span>Liste des élèves</span>
                </Space>
              ),
              children: (
                <div>
                  {/* Formulaire de sélection */}
                  <Card className="mb-4">
                    <Form layout="vertical">
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <Space>
                                <BookOutlined />
                                <span>Classe</span>
                              </Space>
                            }
                          >
                            <Select
                              placeholder="Sélectionnez une classe"
                              size="large"
                              onChange={setSelectedClassId}
                              value={selectedClassId}
                            >
                              {classes.map((cls) => (
                                <Select.Option key={cls.id} value={cls.id}>
                                  {cls.name}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={
                              <Space>
                                <CalendarOutlined />
                                <span>Année scolaire</span>
                              </Space>
                            }
                          >
                            <Select
                              placeholder="Sélectionnez l'année"
                              size="large"
                              onChange={setSelectedSchoolYearId}
                              value={selectedSchoolYearId}
                            >
                              {schoolYears.map((year) => (
                                <Select.Option key={year.id} value={year.id}>
                                  {year.name} {year.isActive && <Tag color="success">Active</Tag>}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                    </Form>
                  </Card>

                  {selectedClassId && selectedSchoolYearId ? (
                    <Card
                      title={
                        <Space>
                          <DatabaseOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
                          <span>Élèves enregistrés</span>
                        </Space>
                      }
                    >
                      <Spin spinning={loadingExisting}>
                        <div style={{ overflowX: 'auto' }}>
                          <Table
                            columns={existingColumns}
                            dataSource={existingStudents}
                            rowKey="id"
                            pagination={{
                              current: pagination.current,
                              pageSize: pagination.pageSize,
                              total: existingStudents.length,
                              pageSizeOptions: ['10', '20', '50', '100'],
                              showSizeChanger: true,
                              showQuickJumper: true,
                              showTotal: (total, range) => 
                                `${range[0]}-${range[1]} sur ${total} élèves`,
                              onChange: (page, pageSize) => {
                                setPagination({
                                  current: page,
                                  pageSize: pageSize || 10,
                                });
                              },
                              onShowSizeChange: (current, size) => {
                                setPagination({
                                  current: 1,
                                  pageSize: size,
                                });
                              },
                            }}
                            bordered
                            size="middle"
                            scroll={{ x: 'max-content' }}
                            style={{ minWidth: '600px' }}
                          />
                </div>
                      </Spin>
                    </Card>
                  ) : (
                    <Card>
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <DatabaseOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
                        <Title level={4}>Sélectionnez une classe et une année</Title>
                        <Text type="secondary">
                          Choisissez une classe et une année scolaire pour voir les élèves enregistrés.
                        </Text>
              </div>
                    </Card>
        )}
      </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}

export default StudentsOverviewPage;
