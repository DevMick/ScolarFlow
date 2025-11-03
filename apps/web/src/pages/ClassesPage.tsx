import { useState } from 'react';
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
  Alert,
  Empty,
  Grid
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined,
  BookOutlined,
  UserOutlined
} from '@ant-design/icons';
import { CreateClassForm } from '../components/classes/CreateClassForm';
import { EditClassForm } from '../components/classes/EditClassForm';
import { ClassCard } from '../components/classes/ClassCard';
import { ConfirmationModal } from '../components/modals/ConfirmationModal';
import { useClasses } from '../hooks/useClasses';
import { useConfirmation } from '../hooks/useConfirmation';
import { Class } from '../services/classService';


export function ClassesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Hook de confirmation personnalisé
  const confirmation = useConfirmation();

  const {
    classes,
    loading: isLoading,
    error,
    total,
    filters,
    setFilters,
    refreshClasses,
    createClass,
    updateClass,
    deleteClass,
  } = useClasses();

  const handleClassCreated = async (data: { name: string }) => {
    const success = await createClass(data);
    if (success) {
      setShowCreateForm(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    setShowEditForm(true);
  };

  const handleClassUpdated = async (id: number, data: { name?: string }) => {
    const success = await updateClass(id, data);
    if (success) {
      setShowEditForm(false);
      setEditingClass(null);
    }
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingClass(null);
  };

  const handleDeleteClass = async (id: number) => {
    const classToDelete = classes.find(c => c.id === id);
    const className = classToDelete?.name || 'cette classe';
    
    const confirmed = await confirmation.confirm({
      title: 'Supprimer la classe',
      message: `Êtes-vous sûr de vouloir supprimer la classe "${className}" ? Cette action est irréversible et supprimera également tous les élèves et évaluations associés.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    });

    if (confirmed) {
      try {
        confirmation.setLoading(true);
        await deleteClass(id);
        confirmation.close();
      } catch (error) {
        confirmation.setLoading(false);
        // L'erreur sera gérée par le hook useClasses
      }
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters({ ...filters, search: value });
  };

  const { Title, Text } = Typography;
  const { Search } = Input;

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <Card className="mb-6">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} className="mb-2">Mes Classes</Title>
            <Text type="secondary">
              Gérez vos classes et suivez leur progression
            </Text>
            {total > 0 && (
              <div className="mt-2">
                <Text type="secondary">
                  {total} classe{total > 1 ? 's' : ''} au total
                </Text>
              </div>
            )}
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateForm(true)}
              size="large"
              disabled={classes.length > 0}
              title={classes.length > 0 ? "Vous ne pouvez créer qu'une seule classe. Supprimez la classe existante pour en créer une nouvelle." : "Créer une nouvelle classe"}
            >
              Nouvelle classe
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <Search
          placeholder="Rechercher une classe..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          prefix={<SearchOutlined />}
          size="large"
        />
      </Card>


      {/* Create Class Form */}
      {showCreateForm && (
        <CreateClassForm
          onClassCreated={handleClassCreated}
          onCancel={handleCancelCreate}
        />
      )}

      {/* Edit Class Form */}
      {showEditForm && editingClass && (
        <EditClassForm
          classItem={editingClass}
          onClassUpdated={handleClassUpdated}
          onCancel={handleCancelEdit}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text type="secondary">Chargement des classes...</Text>
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
            <Button size="small" onClick={refreshClasses}>
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
              <ClassCard
                classItem={classItem}
                onEditClass={handleEditClass}
                onDeleteClass={handleDeleteClass}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Empty State */}
      {!isLoading && classes.length === 0 && (
        <Card>
          <Empty
            image={<BookOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
            description={
              <div>
                <Title level={4}>Aucune classe trouvée</Title>
                <Text type="secondary">
                  Vous n'avez pas encore créé de classe.
                </Text>
              </div>
            }
          >
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setShowCreateForm(true)}
              disabled={classes.length > 0}
              title={classes.length > 0 ? "Vous ne pouvez créer qu'une seule classe. Supprimez la classe existante pour en créer une nouvelle." : "Créer ma première classe"}
            >
              Créer ma première classe
            </Button>
          </Empty>
        </Card>
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
