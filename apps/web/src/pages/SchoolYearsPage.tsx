import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Row, 
  Col, 
  message,
  Spin,
  Empty,
  Modal,
  Form,
  DatePicker,
  Tag
} from 'antd';
import { 
  PlusOutlined, 
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import { schoolYearService } from '../services/schoolYearService';
import type { SchoolYear, CreateSchoolYearData } from '@edustats/shared';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export function SchoolYearsPage() {
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [activeSchoolYear, setActiveSchoolYear] = useState<SchoolYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadSchoolYears();
  }, []);

  const loadSchoolYears = async () => {
    try {
      setLoading(true);
      const data = await schoolYearService.getAll();
      setSchoolYears(data.schoolYears);
      setActiveSchoolYear(data.activeSchoolYear || null);
    } catch (error) {
      console.error('Erreur lors du chargement des années scolaires:', error);
      message.error('Erreur lors du chargement des années scolaires');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      
      // Extraire simplement les années
      const startYear = values.startYear.year();
      const endYear = values.endYear.year();
      
      const createData: CreateSchoolYearData = {
        startYear,
        endYear,
      };

      await schoolYearService.create(createData);
      message.success('Année scolaire créée avec succès');
      setShowCreateModal(false);
      form.resetFields();
      loadSchoolYears();
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      if (error.errorFields) {
        // Erreur de validation du formulaire
        return;
      }
      
      // Extraire le message d'erreur de différentes sources possibles
      const errorMessage = 
        error.response?.data?.message || // Erreur API
        error.message || // Erreur JavaScript
        'Erreur lors de la création de l\'année scolaire';
      
      message.error(errorMessage);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await schoolYearService.activate(id);
      message.success('Année scolaire activée avec succès');
      loadSchoolYears();
    } catch (error: any) {
      console.error('Erreur lors de l\'activation:', error);
      message.error(error.response?.data?.message || 'Erreur lors de l\'activation');
    }
  };

  const handleDelete = async (id: number, yearName: string) => {
    Modal.confirm({
      title: 'Supprimer l\'année scolaire',
      content: `Êtes-vous sûr de vouloir supprimer l'année scolaire ${yearName} ? Cette action supprimera également toutes les classes associées.`,
      okText: 'Supprimer',
      cancelText: 'Annuler',
      okType: 'danger',
      onOk: async () => {
        try {
          await schoolYearService.delete(id);
          message.success('Année scolaire supprimée avec succès');
          loadSchoolYears();
        } catch (error: any) {
          console.error('Erreur lors de la suppression:', error);
          message.error(error.response?.data?.message || 'Erreur lors de la suppression');
        }
      }
    });
  };

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
            <Title level={2} className="mb-2">Gestion des Années Scolaires</Title>
            <Text type="secondary">Gérez les années scolaires de votre établissement</Text>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateModal(true)}
              size="large"
            >
              Nouvelle Année
            </Button>
          </Col>
        </Row>
      </Card>

      <div style={{ padding: '0 24px' }}>
        {/* Année active */}
        {activeSchoolYear && (
          <Card 
            className="mb-6" 
            style={{ 
              borderLeft: '4px solid #52c41a',
              backgroundColor: '#f6ffed'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleOutlined style={{ fontSize: '32px', color: '#52c41a', marginRight: '16px' }} />
                <div>
                  <Text strong style={{ fontSize: '16px', display: 'block', color: '#52c41a' }}>
                    Année Scolaire Active
                  </Text>
                  <Title level={3} style={{ margin: '4px 0', color: '#52c41a' }}>
                    {activeSchoolYear.name}
                  </Title>
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    {activeSchoolYear.startYear} - {activeSchoolYear.endYear}
                  </Text>
                </div>
              </div>
              <Tag color="success" style={{ fontSize: '14px', padding: '6px 16px', height: 'fit-content' }}>
                EN COURS
              </Tag>
            </div>
          </Card>
        )}

        {/* Liste des années scolaires */}
        {schoolYears.length === 0 ? (
          <Empty
            image={<CalendarOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
            description={
              <div>
                <Title level={4}>Aucune année scolaire</Title>
                <Text type="secondary">Commencez par créer une nouvelle année scolaire.</Text>
              </div>
            }
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateModal(true)}
            >
              Créer une année scolaire
            </Button>
          </Empty>
        ) : (
          <Card title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CalendarOutlined style={{ marginRight: '8px', fontSize: '18px' }} />
              Toutes les Années Scolaires
            </div>
          }>
            <Row gutter={[16, 16]}>
              {schoolYears.map((year) => (
                <Col xs={24} sm={12} lg={8} key={year.id}>
                  <Card
                    size="small"
                    hoverable
                    style={{
                      borderLeft: year.isActive ? '4px solid #52c41a' : '4px solid #d9d9d9',
                      backgroundColor: year.isActive ? '#f6ffed' : 'white'
                    }}
                    actions={[
                      !year.isActive ? (
                        <Button
                          type="text"
                          icon={<CheckCircleOutlined />}
                          onClick={() => handleActivate(year.id)}
                        >
                          Activer
                        </Button>
                      ) : (
                        <span></span>
                      ),
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(year.id, year.name || '')}
                      />
                    ]}
                  >
                    <Card.Meta
                      avatar={
                        year.isActive ? (
                          <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                        ) : (
                          <CalendarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                        )
                      }
                      title={
                        <div>
                          <Text strong style={{ fontSize: '16px', color: year.isActive ? '#52c41a' : 'inherit' }}>
                            {year.name}
                          </Text>
                          {year.isActive && (
                            <Tag color="success" size="small" style={{ marginLeft: '8px' }}>Active</Tag>
                          )}
                        </div>
                      }
                      description={
                        <div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {year.startYear} - {year.endYear}
                          </Text>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        )}
      </div>

      {/* Modal de création */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CalendarOutlined style={{ marginRight: '8px', fontSize: '20px', color: '#1890ff' }} />
            Nouvelle Année Scolaire
          </div>
        }
        open={showCreateModal}
        onOk={handleCreate}
        onCancel={() => {
          setShowCreateModal(false);
          form.resetFields();
        }}
        okText="Créer"
        cancelText="Annuler"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Année de début"
            name="startYear"
            rules={[
              { required: true, message: 'Veuillez sélectionner l\'année de début' }
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              picker="year"
              format="YYYY"
              placeholder="Sélectionnez l'année de début"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Année de fin"
            name="endYear"
            rules={[
              { required: true, message: 'Veuillez sélectionner l\'année de fin' },
              {
                validator: (_, value) => {
                  const startYear = form.getFieldValue('startYear');
                  if (!value || !startYear) {
                    return Promise.resolve();
                  }
                  if (value.isBefore(startYear)) {
                    return Promise.reject(new Error('L\'année de fin doit être après ou égale à l\'année de début'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              picker="year"
              format="YYYY"
              placeholder="Sélectionnez l'année de fin"
              size="large"
            />
          </Form.Item>

          <div style={{ 
            backgroundColor: '#e6f7ff', 
            border: '1px solid #91d5ff', 
            borderRadius: '6px', 
            padding: '12px',
            marginTop: '16px'
          }}>
            <Text style={{ fontSize: '13px', color: '#1890ff' }}>
              ℹ️ Exemple : Pour l'année 2024-2025, sélectionnez 2024 comme année de début et 2025 comme année de fin.
            </Text>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default SchoolYearsPage;
