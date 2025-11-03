import { Card, Tag, Button, Space, Typography, Divider } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined, 
  WarningOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { Class } from '../../services/classService';
import { ClassThreshold } from '../../hooks/useClassThresholds';

const { Text, Title } = Typography;

interface ClassThresholdCardProps {
  classItem: Class;
  threshold?: ClassThreshold;
  onEditThreshold: (classItem: Class) => void;
  onDeleteThreshold: (classId: number) => void;
  onCreateThreshold: (classItem: Class) => void;
}

export function ClassThresholdCard({
  classItem,
  threshold,
  onEditThreshold,
  onDeleteThreshold,
  onCreateThreshold,
}: ClassThresholdCardProps) {
  const isConfigured = !!threshold;

  return (
    <Card
      hoverable
      style={{ height: '100%' }}
      actions={[
        <Button
          key="edit"
          type="text"
          icon={isConfigured ? <EditOutlined /> : <PlusOutlined />}
          onClick={() => isConfigured ? onEditThreshold(classItem) : onCreateThreshold(classItem)}
        >
          {isConfigured ? 'Modifier' : 'Configurer'}
        </Button>,
        ...(isConfigured ? [
          <Button
            key="delete"
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDeleteThreshold(classItem.id)}
          >
            Supprimer
          </Button>
        ] : [])
      ]}
    >
      <div style={{ marginBottom: '16px' }}>
        <Title level={4} style={{ marginBottom: '8px' }}>
          {classItem.name}
        </Title>
        {isConfigured ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Configuré
          </Tag>
        ) : (
          <Tag color="warning" icon={<WarningOutlined />}>
            Non configuré
          </Tag>
        )}
      </div>

      {isConfigured ? (
        <div style={{ 
          backgroundColor: '#f6ffed', 
          border: '1px solid #b7eb8f', 
          borderRadius: '6px', 
          padding: '12px'
        }}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>Moyenne d'admission</Text>
              <div>
                <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                  {threshold.moyenneAdmission} / {threshold.maxNote}
                </Text>
              </div>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>Moyenne de redoublement</Text>
              <div>
                <Text strong style={{ fontSize: '16px', color: '#faad14' }}>
                  {threshold.moyenneRedoublement} / {threshold.maxNote}
                </Text>
              </div>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>Moyenne maximale</Text>
              <div>
                <Tag color="blue">{threshold.maxNote === 10 ? 'Sur 10' : 'Sur 20'}</Tag>
              </div>
            </div>
          </Space>
        </div>
      ) : (
        <div style={{ 
          backgroundColor: '#fff7e6', 
          border: '1px solid #ffd591', 
          borderRadius: '6px', 
          padding: '12px',
          textAlign: 'center'
        }}>
          <WarningOutlined style={{ fontSize: '24px', color: '#faad14', marginBottom: '8px' }} />
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Aucun seuil défini pour cette classe
            </Text>
          </div>
        </div>
      )}
    </Card>
  );
}

