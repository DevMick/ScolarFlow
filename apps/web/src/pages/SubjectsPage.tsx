import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Select, 
  Space, 
  Typography, 
  Row, 
  Col, 
  message,
  Spin,
  Empty,
  Modal,
  Form,
  Tag,
  InputNumber,
  Divider,
  Checkbox
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined,
  BookOutlined, 
  DeleteOutlined,
  CalculatorOutlined
} from '@ant-design/icons';
import { subjectService, Subject, CreateSubjectData } from '../services/subjectService';
import { evaluationFormulaService, EvaluationFormula, CreateEvaluationFormulaData } from '../services/evaluationFormulaService';
import { classAverageConfigService, ClassAverageConfig, CreateClassAverageConfigData } from '../services/classAverageConfigService';
import { ClassService, Class } from '../services/classService';
import { useAuth } from '../context/AuthContext';

const SubjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  
  // États pour les modales
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showDivisorModal, setShowDivisorModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState<CreateSubjectData>({ classId: 0, name: '' });
  const [divisorValue, setDivisorValue] = useState<number>(1);
  const [selectedClassForDivisor, setSelectedClassForDivisor] = useState<number>(0);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [configuredDivisors, setConfiguredDivisors] = useState<Record<number, { value: number; formula: string; selectedSubjects: number[] }>>({});

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subjectsData, classesResponse, configsData] = await Promise.all([
        subjectService.getSubjects(),
        ClassService.getClasses(),
        classAverageConfigService.getConfigs()
      ]);
      
      const classesData = classesResponse.data.classes;
      
      setSubjects(subjectsData);
      setClasses(classesData);
      
      // Sélectionner automatiquement la première classe (qui est la seule classe de l'enseignant)
      if (classesData.length > 0 && !selectedClassId) {
        setSelectedClassId(classesData[0].id);
      }
      
      // Charger les configurations existantes depuis la base de données
      loadExistingConfigurations(configsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les configurations existantes
  const loadExistingConfigurations = (configs: ClassAverageConfig[]) => {
    const configsMap: Record<number, { value: number; formula: string; selectedSubjects: number[] }> = {};
    
    configs.forEach(config => {
      // Extraire les IDs des matières de la formule (approximation basée sur les noms)
      const selectedSubjects = extractSubjectIdsFromFormula(config.formula, subjects);
      
      configsMap[config.classId] = {
        value: config.divisor,
        formula: config.formula,
        selectedSubjects: selectedSubjects
      };
    });
    
    setConfiguredDivisors(configsMap);
  };

  // Extraire les IDs des matières à partir de la formule
  const extractSubjectIdsFromFormula = (formula: string, allSubjects: Subject[]): number[] => {
    const subjectIds: number[] = [];
    
    allSubjects.forEach(subject => {
      if (formula.includes(subject.name)) {
        subjectIds.push(subject.id);
      }
    });
    
    return subjectIds;
  };

  // Filtrer les matières
  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = !searchTerm || 
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.class?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !selectedClassId || subject.classId === selectedClassId;
    return matchesSearch && matchesClass;
  });

  // Gestion des matières
  const handleCreateSubject = async () => {
    try {
      await subjectService.createSubject(subjectForm);
      setShowSubjectModal(false);
      setSubjectForm({ classId: 0, name: '' });
      loadData();
      
      message.success('Matière créée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création de la matière:', error);
      message.error('Erreur lors de la création de la matière');
    }
  };


  const handleDeleteSubject = async (id: number) => {
    Modal.confirm({
      title: 'Supprimer la matière',
      content: 'Êtes-vous sûr de vouloir supprimer cette matière ?',
      okText: 'Supprimer',
      cancelText: 'Annuler',
      okType: 'danger',
      onOk: async () => {
      try {
        await subjectService.deleteSubject(id);
        loadData();
          message.success('Matière supprimée avec succès !');
      } catch (error) {
        console.error('Erreur lors de la suppression de la matière:', error);
          message.error('Erreur lors de la suppression de la matière');
        }
      }
    });
  };

  // Gestion du diviseur
  const handleUpdateDivisor = async () => {
    try {
      if (!selectedClassForDivisor || selectedClassForDivisor === 0) {
        message.error('Veuillez sélectionner une classe');
        return;
      }
      
      if (selectedSubjects.length === 0) {
        message.error('Veuillez sélectionner au moins une matière');
        return;
      }
      
      // Récupérer les matières sélectionnées
      const selectedSubjectsData = subjects.filter(s => selectedSubjects.includes(s.id));
      
      if (selectedSubjectsData.length === 0) {
        message.error('Aucune matière valide sélectionnée');
        return;
      }
      
      // Créer une formule avec les matières sélectionnées
      const subjectNames = selectedSubjectsData.map(s => s.name);
      const formula = `=(${subjectNames.join(' + ')}) ÷ ${divisorValue}`;
      const className = classes.find(c => c.id === selectedClassForDivisor)?.name || 'Classe';
      
      const configData: CreateClassAverageConfigData = {
        classId: selectedClassForDivisor,
        divisor: divisorValue,
        formula: formula
      };
      
      // Créer ou mettre à jour la configuration
      await classAverageConfigService.createOrUpdateConfig(configData);
      
      // Sauvegarder la configuration du diviseur dans l'état local
      setConfiguredDivisors(prev => ({
        ...prev,
        [selectedClassForDivisor]: {
          value: divisorValue,
          formula: formula,
          selectedSubjects: selectedSubjects
        }
      }));
      
      setShowDivisorModal(false);
      setDivisorValue(1);
      setSelectedClassForDivisor(0);
      setSelectedSubjects([]);
      
      message.success(`Configuration sauvegardée : diviseur ${divisorValue} pour ${selectedSubjectsData.length} matière(s) dans la classe ${className}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du diviseur:', error);
      message.error('Erreur lors de la mise à jour du diviseur');
    }
  };


  // Supprimer la configuration du diviseur
  const handleDeleteDivisor = (classId: number) => {
    Modal.confirm({
      title: 'Supprimer la configuration',
      content: 'Êtes-vous sûr de vouloir supprimer la configuration du diviseur pour cette classe ?',
      okText: 'Supprimer',
      cancelText: 'Annuler',
      okType: 'danger',
      onOk: async () => {
        try {
          // Supprimer la configuration de la base de données
          await classAverageConfigService.deleteConfigByClass(classId);
          
          // Supprimer de l'état local
          setConfiguredDivisors(prev => {
            const newConfig = { ...prev };
            delete newConfig[classId];
            return newConfig;
          });
          
          message.success('Configuration supprimée avec succès');
        } catch (error) {
          console.error('Erreur lors de la suppression de la configuration:', error);
          message.error('Erreur lors de la suppression de la configuration');
        }
      }
    });
  };

  // Ouvrir modales
  const openSubjectModal = () => {
    // Sélectionner automatiquement la première classe (la seule classe de l'enseignant)
    const defaultClassId = classes.length > 0 ? classes[0].id : 0;
    setSubjectForm({ classId: defaultClassId, name: '' });
    setShowSubjectModal(true);
  };

  const openDivisorModal = (classId?: number) => {
    // Si aucune classe n'est fournie, utiliser la première classe (la seule classe de l'enseignant)
    const defaultClassId = classId || (classes.length > 0 ? classes[0].id : 0);
    setSelectedClassForDivisor(defaultClassId);
    
    // Si on modifie une configuration existante, charger sa valeur
    if (defaultClassId && configuredDivisors[defaultClassId]) {
      setDivisorValue(configuredDivisors[defaultClassId].value);
      setSelectedSubjects(configuredDivisors[defaultClassId].selectedSubjects);
    } else {
      setDivisorValue(1);
      setSelectedSubjects([]);
    }
    
    setShowDivisorModal(true);
  };

  const { Title, Text } = Typography;
  const { Search } = Input;

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
            <Title level={2} className="mb-2">Gestion des Matières</Title>
            <Text type="secondary">Gérez vos matières et configurez le calcul des moyennes</Text>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openSubjectModal()}
            >
              Nouvelle Matière
            </Button>
          </Col>
        </Row>
      </Card>

      <div style={{ padding: '0 24px' }}>
        {/* Filtres */}
        <Card className="mb-6">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Search
                placeholder="Rechercher une matière..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={<SearchOutlined />}
                size="large"
              />
            </Col>
            <Col xs={24} sm={12}>
              {classes.length > 0 ? (
                <Input
                  value={classes.find(c => c.id === selectedClassId)?.name || classes[0]?.name || ''}
                  disabled
                  size="large"
                  style={{ width: '100%' }}
                  suffix={<FilterOutlined />}
                />
              ) : (
                <Input
                  value="Aucune classe disponible"
                  disabled
                  size="large"
                  style={{ width: '100%' }}
                  suffix={<FilterOutlined />}
                />
              )}
            </Col>
          </Row>
        </Card>

        {/* Liste des matières */}
        <SubjectsList
          subjects={filteredSubjects}
          onDelete={handleDeleteSubject}
          onConfigureDivisor={openDivisorModal}
          onDeleteDivisor={handleDeleteDivisor}
          configuredDivisors={configuredDivisors}
        />
      </div>

      {/* Modales */}
      {/* Modale de création/modification de matière */}
      <Modal
        title="Nouvelle matière"
        open={showSubjectModal}
        onOk={handleCreateSubject}
        onCancel={() => {
          setShowSubjectModal(false);
          setSubjectForm({ classId: 0, name: '' });
        }}
        okText="Créer"
        cancelText="Annuler"
      >
        <Form layout="vertical">
          <Form.Item label="Classe" required>
            {classes.length > 0 ? (
              <Input
                value={classes.find(c => c.id === subjectForm.classId)?.name || classes[0]?.name || ''}
                disabled
                placeholder="Classe sélectionnée automatiquement"
              />
            ) : (
              <Input
                value="Aucune classe disponible"
                disabled
              />
            )}
          </Form.Item>
          <Form.Item label="Nom de la matière" required>
            <Input
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              placeholder="Ex: Mathématiques, Français, Histoire..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modale de configuration du diviseur */}
      <Modal
        title="Configurer le diviseur de calcul"
        open={showDivisorModal}
        onOk={handleUpdateDivisor}
        onCancel={() => {
          setShowDivisorModal(false);
          setDivisorValue(1);
          setSelectedClassForDivisor(0);
          setSelectedSubjects([]);
        }}
        okText="Enregistrer"
        cancelText="Annuler"
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="Classe" required>
            {classes.length > 0 ? (
              <Input
                value={
                  classes.find(c => c.id === selectedClassForDivisor)?.name || 
                  classes[0]?.name || 
                  ''
                }
                disabled
                placeholder="Classe sélectionnée automatiquement"
                suffix={
                  configuredDivisors[selectedClassForDivisor || classes[0]?.id || 0] 
                    ? ' - Déjà configurée' 
                    : ''
                }
              />
            ) : (
              <Input
                value="Aucune classe disponible"
                disabled
              />
            )}
          </Form.Item>
          
          {selectedClassForDivisor > 0 && (
            <>
              <Form.Item label="Matières à inclure dans le calcul" required>
                <div style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '6px', 
                  padding: '12px',
                  backgroundColor: '#fafafa'
                }}>
                  <Checkbox.Group
                    value={selectedSubjects}
                    onChange={(checkedValues) => setSelectedSubjects(checkedValues as number[])}
                    style={{ width: '100%' }}
                  >
                    <Row gutter={[8, 8]}>
                      {subjects
                        .filter(s => s.classId === selectedClassForDivisor)
                        .map((subject) => (
                          <Col span={24} key={subject.id}>
                            <Checkbox value={subject.id}>
                              <BookOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                              {subject.name}
                            </Checkbox>
                          </Col>
                        ))}
                    </Row>
                  </Checkbox.Group>
                  
                  {subjects.filter(s => s.classId === selectedClassForDivisor).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                      <BookOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                      <div>Aucune matière dans cette classe</div>
                    </div>
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Sélectionnez les matières qui seront prises en compte pour le calcul de la moyenne
                </Text>
              </Form.Item>
              
              <Form.Item label="Diviseur pour le calcul de la moyenne" required>
                <InputNumber
                  min={0.01}
                  step={0.25}
                  precision={2}
                  value={divisorValue}
                  onChange={(value) => setDivisorValue(value || 1)}
                  style={{ width: '100%' }}
                  placeholder="Diviseur"
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Le diviseur sera utilisé pour calculer la moyenne : (Somme des notes sélectionnées) ÷ (Diviseur)
                </Text>
              </Form.Item>
              
              <Divider />
              
              <div style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '6px',
                fontFamily: 'monospace'
              }}>
                <Text strong>Formule générée :</Text>
                <br />
                <Text code>
                  =({subjects
                    .filter(s => s.classId === selectedClassForDivisor && selectedSubjects.includes(s.id))
                    .map(s => s.name)
                    .join(' + ')}) ÷ {divisorValue}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {selectedSubjects.length} matière{selectedSubjects.length > 1 ? 's' : ''} sélectionnée{selectedSubjects.length > 1 ? 's' : ''}
                </Text>
              </div>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

// Composant pour la liste des matières
const SubjectsList: React.FC<{
  subjects: Subject[];
  onDelete: (id: number) => void;
  onConfigureDivisor: (classId: number) => void;
  onDeleteDivisor: (classId: number) => void;
  configuredDivisors: Record<number, { value: number; formula: string; selectedSubjects: number[] }>;
}> = ({ subjects, onDelete, onConfigureDivisor, onDeleteDivisor, configuredDivisors }) => {
  const { Title, Text } = Typography;
  
  // Grouper les matières par classe
  const subjectsByClass = subjects.reduce((acc, subject) => {
    const classId = subject.classId;
    if (!acc[classId]) {
      acc[classId] = {
        class: subject.class,
        subjects: []
      };
    }
    acc[classId].subjects.push(subject);
    return acc;
  }, {} as Record<number, { class: any; subjects: Subject[] }>);
  
  if (subjects.length === 0) {
    return (
      <Empty
        image={<BookOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
        description={
          <div>
            <Title level={4}>Aucune matière</Title>
            <Text type="secondary">Commencez par créer une nouvelle matière.</Text>
          </div>
        }
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {Object.entries(subjectsByClass).map(([classId, { class: classInfo, subjects: classSubjects }]) => {
        const classIdNum = parseInt(classId);
        const isConfigured = configuredDivisors[classIdNum];
        
        return (
          <Card key={classId} title={classInfo?.name}>
            {/* Message explicatif */}
            {!isConfigured && classSubjects.length > 0 && (
              <div style={{ 
                backgroundColor: '#e6f7ff', 
                border: '1px solid #91d5ff', 
                borderRadius: '6px', 
                padding: '16px', 
                marginBottom: '16px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <CalculatorOutlined style={{ fontSize: '20px', color: '#1890ff', marginRight: '8px' }} />
                  <Text strong style={{ color: '#1890ff' }}>Configuration du calcul des moyennes</Text>
                </div>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Pour calculer les moyennes de cette classe, vous devez configurer un diviseur. 
                  Le diviseur détermine comment les notes des différentes matières sont combinées.
                </Text>
                <div style={{ marginTop: '12px' }}>
                  <Button
                    type="primary"
                    icon={<CalculatorOutlined />}
                    onClick={() => onConfigureDivisor(classIdNum)}
                  >
                    Configurer le diviseur ({classSubjects.length} matière{classSubjects.length > 1 ? 's' : ''})
                  </Button>
                </div>
              </div>
            )}
            
            {/* Message pour classe sans matières */}
            {!isConfigured && classSubjects.length === 0 && (
              <div style={{ 
                backgroundColor: '#fff7e6', 
                border: '1px solid #ffd591', 
                borderRadius: '6px', 
                padding: '16px', 
                marginBottom: '16px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <BookOutlined style={{ fontSize: '20px', color: '#faad14', marginRight: '8px' }} />
                  <Text strong style={{ color: '#faad14' }}>Aucune matière dans cette classe</Text>
                </div>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Créez d'abord des matières pour cette classe avant de configurer le calcul des moyennes.
                </Text>
              </div>
            )}
            
            {/* Affichage de la configuration */}
            {isConfigured && (
              <div style={{ 
                backgroundColor: '#f6ffed', 
                border: '1px solid #b7eb8f', 
                borderRadius: '6px', 
                padding: '16px', 
                marginBottom: '16px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <CalculatorOutlined style={{ fontSize: '20px', color: '#52c41a', marginRight: '8px' }} />
                    <Text strong style={{ color: '#52c41a' }}>Configuration activée</Text>
                  </div>
                  <Space>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => onDeleteDivisor(classIdNum)}
                    >
                      Supprimer
                    </Button>
                  </Space>
                </div>
                <div style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  marginTop: '8px'
                }}>
                  <Text strong>Formule de calcul :</Text><br />
                  <Text code>{isConfigured.formula}</Text>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                    Diviseur configuré : <strong>{isConfigured.value}</strong>
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                    Matières incluses : <strong>{isConfigured.selectedSubjects?.length || 0} matière{(isConfigured.selectedSubjects?.length || 0) > 1 ? 's' : ''}</strong>
                  </Text>
                  {isConfigured.selectedSubjects && isConfigured.selectedSubjects.length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                      {isConfigured.selectedSubjects.map(subjectId => {
                        const subject = subjects.find(s => s.id === subjectId);
                        return subject ? (
                          <Tag key={subjectId} size="small" style={{ margin: '2px' }}>
                            {subject.name}
                          </Tag>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <Row gutter={[16, 16]}>
              {classSubjects.map((subject) => (
                <Col xs={24} sm={12} lg={8} key={subject.id}>
                  <Card
                    size="small"
                    hoverable
                    actions={[
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => onDelete(subject.id)}
                      />
                    ]}
                  >
                    <Card.Meta
                      avatar={<BookOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
                      title={subject.name}
                      description={
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          Créée le {new Date(subject.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        );
      })}
    </div>
  );
};



export default SubjectsPage;
