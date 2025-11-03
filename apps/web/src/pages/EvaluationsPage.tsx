import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Row,
  Col,
  Spin,
  Alert,
  Empty,
  Select,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  BookOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { evaluationService } from '../services/evaluationService';
import { ClassService } from '../services/classService';
import { schoolYearService } from '../services/schoolYearService';
import { EvaluationSimple, CreateEvaluationSimpleData, UpdateEvaluationSimpleData, SchoolYear } from '@edustats/shared';
import { useAuth } from '../context/AuthContext';
// Utilisation du format de date natif JavaScript

const { Title, Text } = Typography;
const { Option } = Select;

// Types d'évaluation prédéfinis
const EVALUATION_TYPES = [
  'EVALUATION N°1',
  'EVALUATION N°2', 
  'EVALUATION N°3',
  'COMPOSITION DE PASSAGE'
];

const EvaluationsPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [evaluations, setEvaluations] = useState<EvaluationSimple[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [activeSchoolYear, setActiveSchoolYear] = useState<SchoolYear | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(
    classId ? parseInt(classId) : null
  );
  const [selectedSchoolYearFilter, setSelectedSchoolYearFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<EvaluationSimple | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    // Attendre que l'authentification soit prête avant de charger les données
    if (!authLoading && isAuthenticated) {
      loadClasses();
      loadSchoolYears();
    }
  }, [authLoading, isAuthenticated]);

  const loadSchoolYears = async () => {
    try {
      const data = await schoolYearService.getAll();
      setSchoolYears(data.schoolYears);
      if (data.activeSchoolYear) {
        setActiveSchoolYear(data.activeSchoolYear);
        // Définir par défaut l'année active dans le formulaire ET dans le filtre
        form.setFieldValue('schoolYearId', data.activeSchoolYear.id);
        setSelectedSchoolYearFilter(data.activeSchoolYear.id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des années scolaires:', error);
    }
  };

  useEffect(() => {
    if (classes.length > 0) {
      loadEvaluations();
    }
  }, [classes]);

  const loadClasses = async () => {
    setClassesLoading(true);
    try {
      const response = await ClassService.getClasses();
      setClasses(response.data.classes);
      
      // Sélectionner automatiquement la classe s'il n'y en a qu'une seule
      if (response.data.classes.length === 1) {
        setSelectedClassId(response.data.classes[0].id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des classes:', error);
      message.error('Erreur lors du chargement des classes');
    } finally {
      setClassesLoading(false);
    }
  };

  const loadEvaluations = async () => {
    setLoading(true);
    try {
      // Charger toutes les évaluations de toutes les classes
      const allEvaluations = [];
      for (const classItem of classes) {
        try {
          const evaluationsData = await evaluationService.getEvaluationsByClass(classItem.id);
          if (Array.isArray(evaluationsData)) {
            allEvaluations.push(...evaluationsData);
          } else {
            console.warn(`Données d'évaluations invalides pour la classe ${classItem.id}:`, evaluationsData);
          }
        } catch (error) {
          console.error(`Erreur lors du chargement des évaluations pour la classe ${classItem.id}:`, error);
          // Continuer avec les autres classes même si une échoue
        }
      }
      setEvaluations(allEvaluations);
    } catch (error) {
      console.error('Erreur lors du chargement des évaluations:', error);
      message.error('Erreur lors du chargement des évaluations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvaluation = async (values: any) => {
    try {
      // Convertir la date en format ISO si c'est un objet dayjs
      const createData: CreateEvaluationSimpleData = {
        classId: values.classId,
        schoolYearId: values.schoolYearId,
        nom: values.nom,
        date: values.date ? (values.date.toISOString ? values.date.toISOString() : values.date) : new Date().toISOString()
      };
      
      const newEvaluation = await evaluationService.createEvaluation(createData);
      setEvaluations([...evaluations, newEvaluation]);
      setModalVisible(false);
      form.resetFields();
      // Remettre l'année active par défaut pour la prochaine création
      if (activeSchoolYear) {
        form.setFieldValue('schoolYearId', activeSchoolYear.id);
      }
      message.success('Évaluation créée avec succès');
    } catch (error) {
      console.error('Erreur lors de la création de l\'évaluation:', error);
      message.error('Erreur lors de la création de l\'évaluation');
    }
  };

  const handleUpdateEvaluation = async (values: any) => {
    if (!editingEvaluation) return;
    
    try {
      // Convertir la date en format ISO si c'est un objet dayjs
      const updateData: UpdateEvaluationSimpleData = {
        nom: values.nom,
        date: values.date ? (values.date.toISOString ? values.date.toISOString() : values.date) : undefined,
        schoolYearId: values.schoolYearId
      };
      
      const updatedEvaluation = await evaluationService.updateEvaluation(editingEvaluation.id, updateData);
      setEvaluations(evaluations.map(evaluation => 
        evaluation.id === editingEvaluation.id ? updatedEvaluation : evaluation
      ));
      setModalVisible(false);
      setEditingEvaluation(null);
      form.resetFields();
      // Remettre l'année active par défaut pour la prochaine création
      if (activeSchoolYear) {
        form.setFieldValue('schoolYearId', activeSchoolYear.id);
      }
      message.success('Évaluation modifiée avec succès');
    } catch (error) {
      console.error('Erreur lors de la modification de l\'évaluation:', error);
      message.error('Erreur lors de la modification de l\'évaluation');
    }
  };

  const handleDeleteEvaluation = async (id: number) => {
    Modal.confirm({
      title: 'Supprimer l\'évaluation',
      content: 'Êtes-vous sûr de vouloir supprimer cette évaluation ?',
      okText: 'Supprimer',
      cancelText: 'Annuler',
      okType: 'danger',
      onOk: async () => {
        try {
          await evaluationService.deleteEvaluation(id);
          setEvaluations(evaluations.filter(evaluation => evaluation.id !== id));
          message.success('Évaluation supprimée avec succès');
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'évaluation:', error);
          message.error('Erreur lors de la suppression de l\'évaluation');
        }
      }
    });
  };

  const openCreateModal = () => {
    if (classesLoading) {
      message.warning('Chargement des classes en cours...');
      return;
    }
    if (classes.length === 0) {
      message.error('Aucune classe trouvée');
      return;
    }
    if (!canCreateEvaluation) {
      message.warning('Tous les types d\'évaluation ont déjà été créés pour cette classe');
      return;
    }
    setEditingEvaluation(null);
    setModalVisible(true);
    form.resetFields();
    
    // Pré-remplir avec les filtres sélectionnés
    if (selectedClassId) {
      form.setFieldValue('classId', selectedClassId);
    }
    if (selectedSchoolYearFilter) {
      form.setFieldValue('schoolYearId', selectedSchoolYearFilter);
    }
    
    // Sélectionner automatiquement le premier type d'évaluation disponible
    if (availableTypes.length > 0) {
      form.setFieldValue('nom', availableTypes[0]);
    }
  };

  const openEditModal = (evaluation: EvaluationSimple) => {
    setEditingEvaluation(evaluation);
    setModalVisible(true);
    form.setFieldsValue({
      classId: evaluation.classId,
      schoolYearId: evaluation.schoolYearId,
      nom: evaluation.nom,
      date: evaluation.date ? dayjs(evaluation.date) : null,
    });
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingEvaluation(null);
    form.resetFields();
  };

  // Filtrer les évaluations
  // Les deux filtres (classe ET année) sont obligatoires pour afficher les évaluations
  const filteredEvaluations = selectedClassId && selectedSchoolYearFilter 
    ? evaluations.filter(evaluation => {
        const matchesClass = evaluation.classId === selectedClassId;
        const matchesSchoolYear = evaluation.schoolYearId === selectedSchoolYearFilter;
        return matchesClass && matchesSchoolYear;
      })
    : []; // Si classe OU année non sélectionnée, afficher une liste vide

  const selectedClass = classes.find(c => c.id === selectedClassId);

  // Obtenir les types d'évaluation disponibles pour la classe sélectionnée
  const getAvailableEvaluationTypes = () => {
    if (!selectedClassId || !selectedSchoolYearFilter) return EVALUATION_TYPES;
    
    const usedTypes = filteredEvaluations.map(evaluation => evaluation.nom);
    return EVALUATION_TYPES.filter(type => !usedTypes.includes(type));
  };

  const availableTypes = getAvailableEvaluationTypes();
  const canCreateEvaluation = availableTypes.length > 0;

  // Afficher un spinner pendant le chargement de l'authentification
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, ne pas afficher le contenu
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert
          message="Non authentifié"
          description="Vous devez être connecté pour accéder à cette page."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <Card className="mb-6">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} className="mb-2">Gestion des Évaluations</Title>
            <Text type="secondary">Gérez les évaluations de vos classes</Text>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
                disabled={!selectedClassId || !selectedSchoolYearFilter || !canCreateEvaluation}
                title={
                  !selectedClassId || !selectedSchoolYearFilter 
                    ? "Veuillez sélectionner une classe et une année" 
                    : !canCreateEvaluation 
                      ? "Tous les types d'évaluation ont été créés pour cette classe" 
                      : ""
                }
              >
                Nouvelle Évaluation
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Filtres */}
      <Card className="mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12}>
            <Text strong>Filtrer par classe <span style={{ color: '#ff4d4f' }}>*</span> :</Text>
            <Select
              placeholder="Sélectionner une classe"
              value={selectedClassId}
              onChange={setSelectedClassId}
              style={{ width: '100%' }}
              size="large"
              loading={classesLoading}
              notFoundContent={classesLoading ? "Chargement..." : "Aucune classe trouvée"}
            >
              {classes.map(classItem => (
                <Option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Filtrer par année <span style={{ color: '#ff4d4f' }}>*</span> :</Text>
            <Select
              placeholder="Sélectionner une année"
              value={selectedSchoolYearFilter}
              onChange={setSelectedSchoolYearFilter}
              style={{ width: '100%' }}
              size="large"
            >
              {schoolYears.map(year => (
                <Option key={year.id} value={year.id}>
                  <Space>
                    <span>{year.startYear}-{year.endYear}</span>
                    {year.isActive && <Tag color="success">Active</Tag>}
                  </Space>
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Contenu principal */}
      <Card>
        {loading ? (
          <div className="text-center py-8">
            <Spin size="large" />
          </div>
        ) : selectedClassId && selectedSchoolYearFilter ? (
          <>
            {/* Informations sur les types d'évaluation */}
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <Text strong className="text-blue-800">Types d'évaluation pour {selectedClass?.name}:</Text>
              <div className="mt-2">
                <Text className="text-blue-700">
                  <strong>Disponibles:</strong> {availableTypes.length > 0 ? availableTypes.join(', ') : 'Aucun'}
                </Text>
                <br />
                <Text className="text-blue-700">
                  <strong>Créés:</strong> {filteredEvaluations.length > 0 ? filteredEvaluations.map(e => e.nom).join(', ') : 'Aucun'}
                </Text>
              </div>
            </div>
            
            <EvaluationsList
              evaluations={filteredEvaluations}
              classes={classes}
              onEdit={openEditModal}
              onDelete={handleDeleteEvaluation}
            />
          </>
        ) : (
          <EvaluationsList
            evaluations={filteredEvaluations}
            classes={classes}
            onEdit={openEditModal}
            onDelete={handleDeleteEvaluation}
          />
        )}
      </Card>

      {/* Modal */}
      <Modal
        title={editingEvaluation ? 'Modifier l\'évaluation' : 'Nouvelle évaluation'}
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingEvaluation ? handleUpdateEvaluation : handleCreateEvaluation}
        >
          <Form.Item
            name="classId"
            label="Classe"
            rules={[
              { required: true, message: 'Veuillez sélectionner une classe' },
            ]}
          >
            <Select
              placeholder="Sélectionner une classe"
              size="large"
              disabled={!!editingEvaluation}
              loading={classesLoading}
              notFoundContent={classesLoading ? "Chargement..." : "Aucune classe trouvée"}
            >
              {classes.map(classItem => (
                <Option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="schoolYearId"
            label="Année scolaire"
            rules={[
              { required: true, message: 'Veuillez sélectionner une année scolaire' },
            ]}
          >
            <Select
              placeholder="Sélectionner une année scolaire"
              size="large"
            >
              {schoolYears.map(year => (
                <Option key={year.id} value={year.id}>
                  {year.startYear}-{year.endYear} {year.isActive && <Tag color="success">Active</Tag>}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="nom"
            label="Type d'évaluation"
            rules={[
              { required: true, message: 'Veuillez sélectionner un type d\'évaluation' },
            ]}
          >
            <Select
              placeholder="Sélectionner un type d'évaluation"
              size="large"
              disabled={editingEvaluation ? false : availableTypes.length === 0}
              notFoundContent={availableTypes.length === 0 ? "Tous les types ont été créés" : "Aucun type disponible"}
            >
              {availableTypes.map(type => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="date"
            label="Date de l'évaluation"
            rules={[
              { required: true, message: 'Veuillez sélectionner la date' },
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              size="large"
              format="DD/MM/YYYY"
              placeholder="Sélectionner une date"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={handleModalCancel}>
                Annuler
              </Button>
              <Button type="primary" htmlType="submit">
                {editingEvaluation ? 'Modifier' : 'Créer'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Composant pour la liste des évaluations
const EvaluationsList: React.FC<{
  evaluations: EvaluationSimple[];
  classes: any[];
  onEdit: (evaluation: EvaluationSimple) => void;
  onDelete: (id: number) => void;
}> = ({ evaluations, classes, onEdit, onDelete }) => {
  const { Title, Text } = Typography;
  
  if (evaluations.length === 0) {
    return (
      <Empty
        image={<FilterOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
        description={
          <div>
            <Title level={4}>
              Sélectionnez une classe et une année
            </Title>
            <Text type="secondary">
              Utilisez les filtres ci-dessus pour afficher les évaluations.
            </Text>
          </div>
        }
      />
    );
  }

  return (
    <>
      <div className="mb-4">
        <Text strong>
          {evaluations.length} évaluation{evaluations.length > 1 ? 's' : ''} trouvée{evaluations.length > 1 ? 's' : ''}
        </Text>
      </div>
      <Row gutter={[16, 16]}>
        {evaluations.map((evaluation) => {
          const classInfo = classes.find(c => c.id === evaluation.classId);
          return (
            <Col xs={24} sm={12} lg={8} key={evaluation.id}>
              <Card
                hoverable
                actions={[
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => onEdit(evaluation)}
                    title="Modifier"
                  />,
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onDelete(evaluation.id)}
                    title="Supprimer"
                  />
                ]}
              >
                <Card.Meta
                  avatar={<BookOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                  title={evaluation.nom}
                  description={
                    <div>
                      <CalendarOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                      <Tag color="blue">
                        {new Date(evaluation.date).toLocaleDateString('fr-FR')}
                      </Tag>
                    </div>
                  }
                />
              </Card>
            </Col>
          );
        })}
      </Row>
    </>
  );
};

export default EvaluationsPage;