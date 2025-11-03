import { useState } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Spin,
  Alert,
  Empty
} from 'antd';
import { 
  WarningOutlined
} from '@ant-design/icons';
import { ClassThresholdCard } from '../components/class-thresholds/ClassThresholdCard';
import { ClassThresholdForm } from '../components/class-thresholds/ClassThresholdForm';
import { ConfirmationModal } from '../components/modals/ConfirmationModal';
import { useClassThresholds, CreateThresholdData } from '../hooks/useClassThresholds';
import { useConfirmation } from '../hooks/useConfirmation';
import { Class } from '../services/classService';

const { Title, Text } = Typography;

export default function ClassThresholdsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  
  // Hook de confirmation personnalisé
  const confirmation = useConfirmation();

  const {
    classes,
    thresholds,
    loading: isLoading,
    error,
    refreshData,
    createThreshold,
    updateThreshold,
    deleteThreshold,
    getThresholdByClass,
  } = useClassThresholds();

  const handleCreateThreshold = (classItem: Class) => {
    setEditingClass(classItem);
    setShowForm(true);
  };

  const handleEditThreshold = (classItem: Class) => {
    setEditingClass(classItem);
    setShowForm(true);
  };

  const handleSubmitThreshold = async (data: CreateThresholdData): Promise<boolean> => {
    const threshold = getThresholdByClass(data.classId);
    
    if (threshold) {
      return await updateThreshold(data.classId, data);
    } else {
      return await createThreshold(data);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingClass(null);
  };

  const handleDeleteThreshold = async (classId: number) => {
    const classItem = classes.find(c => c.id === classId);
    const className = classItem?.name || 'cette classe';
    
    const confirmed = await confirmation.confirm({
      title: 'Supprimer les seuils',
      message: `Êtes-vous sûr de vouloir supprimer les seuils de la classe "${className}" ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    });

    if (confirmed) {
      try {
        confirmation.setLoading(true);
        await deleteThreshold(classId);
        confirmation.close();
      } catch (error) {
        confirmation.setLoading(false);
      }
    }
  };


  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <Card className="mb-6">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} className="mb-2">Gestion des Seuils de Classe</Title>
            <Text type="secondary">
              Définissez les moyennes d'admission et de redoublement pour vos classes
            </Text>
            {classes.length > 0 && (
              <div className="mt-2">
                <Text type="secondary">
                  {thresholds.length} / {classes.length} classe{classes.length > 1 ? 's' : ''} configurée{thresholds.length > 1 ? 's' : ''}
                </Text>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text type="secondary">Chargement des données...</Text>
            </div>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert
          message="Erreur"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={refreshData}>
              Réessayer
            </Button>
          }
          className="mb-6"
        />
      )}

      {/* Classes Grid */}
      {!isLoading && !error && classes.length > 0 && (
        <Row gutter={[16, 16]}>
          {classes.map((classItem) => (
            <Col xs={24} sm={12} lg={8} key={classItem.id}>
              <ClassThresholdCard
                classItem={classItem}
                threshold={getThresholdByClass(classItem.id)}
                onCreateThreshold={handleCreateThreshold}
                onEditThreshold={handleEditThreshold}
                onDeleteThreshold={handleDeleteThreshold}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Empty State */}
      {!isLoading && classes.length === 0 && (
        <Card>
          <Empty
            image={<WarningOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
            description={
              <div>
                <Title level={4}>Aucune classe</Title>
                <Text type="secondary">
                  Commencez par créer des classes dans la section Classes.
                </Text>
              </div>
            }
          />
        </Card>
      )}

      {/* Threshold Form Modal */}
      {showForm && editingClass && (
        <ClassThresholdForm
          visible={showForm}
          classItem={editingClass}
          threshold={getThresholdByClass(editingClass.id)}
          onSubmit={handleSubmitThreshold}
          onCancel={handleCancelForm}
          loading={isLoading}
        />
      )}

      {/* Modal de confirmation personnalisée */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={confirmation.close}
        onConfirm={confirmation.onConfirm || (() => {})}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        type={confirmation.type}
        isLoading={confirmation.isLoading}
      />
    </div>
  );
}
