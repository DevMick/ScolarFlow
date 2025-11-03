import { useEffect } from 'react';
import { Modal, Form, InputNumber, Select, Row, Col, Typography } from 'antd';
import { Class } from '../../services/classService';
import { ClassThreshold, CreateThresholdData } from '../../hooks/useClassThresholds';

const { Text } = Typography;

interface ClassThresholdFormProps {
  visible: boolean;
  classItem: Class;
  threshold?: ClassThreshold;
  onSubmit: (data: CreateThresholdData) => Promise<boolean>;
  onCancel: () => void;
  loading: boolean;
}

export function ClassThresholdForm({
  visible,
  classItem,
  threshold,
  onSubmit,
  onCancel,
  loading,
}: ClassThresholdFormProps) {
  const [form] = Form.useForm();
  const isEditing = !!threshold;

  // Réinitialiser le formulaire avec les bonnes valeurs quand le modal s'ouvre
  useEffect(() => {
    if (visible) {
      const defaultValues = threshold
        ? {
            moyenneAdmission: threshold.moyenneAdmission,
            moyenneRedoublement: threshold.moyenneRedoublement,
            maxNote: threshold.maxNote,
          }
        : {
            moyenneAdmission: 10,
            moyenneRedoublement: 8.5,
            maxNote: 20,
          };
      
      form.setFieldsValue(defaultValues);
    }
  }, [visible, threshold, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      const data: CreateThresholdData = {
        classId: classItem.id,
        moyenneAdmission: parseFloat(values.moyenneAdmission),
        moyenneRedoublement: parseFloat(values.moyenneRedoublement),
        maxNote: values.maxNote,
      };

      const success = await onSubmit(data);
      if (success) {
        form.resetFields();
        onCancel();
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={isEditing ? 'Modifier les seuils' : 'Configurer les seuils'}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Enregistrer"
      cancelText="Annuler"
      confirmLoading={loading}
      width={600}
    >
      <div style={{ marginBottom: '16px' }}>
        <Text strong>
          Classe : {classItem.name}
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Moyenne d'admission"
              name="moyenneAdmission"
              rules={[
                { required: true, message: 'Requis' },
                {
                  validator: (_, value) => {
                    const maxNote = form.getFieldValue('maxNote') || 20;
                    if (value > maxNote) {
                      return Promise.reject(`Max ${maxNote}`);
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                min={0}
                max={20}
                step={0.5}
                precision={2}
                style={{ width: '100%' }}
                placeholder="Ex: 10.00"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Moyenne de redoublement"
              name="moyenneRedoublement"
              rules={[
                { required: true, message: 'Requis' },
                {
                  validator: (_, value) => {
                    const maxNote = form.getFieldValue('maxNote') || 20;
                    if (value > maxNote) {
                      return Promise.reject(`Max ${maxNote}`);
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                min={0}
                max={20}
                step={0.5}
                precision={2}
                style={{ width: '100%' }}
                placeholder="Ex: 8.50"
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              label="Moyenne maximale"
              name="maxNote"
              rules={[{ required: true, message: 'Requis' }]}
            >
              <Select placeholder="Sélectionnez">
                <Select.Option value={10}>Sur 10</Select.Option>
                <Select.Option value={20}>Sur 20</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <div
        style={{
          backgroundColor: '#e6f7ff',
          border: '1px solid #91d5ff',
          borderRadius: '6px',
          padding: '12px',
          marginTop: '16px',
        }}
      >
        <Text strong style={{ color: '#1890ff', display: 'block', marginBottom: '8px' }}>
          Informations
        </Text>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#666' }}>
          <li>La moyenne d'admission est la note minimale pour passer en classe supérieure</li>
          <li>La moyenne de redoublement doit être inférieure à celle d'admission</li>
          <li>Ces seuils seront utilisés dans les bilans annuels</li>
        </ul>
      </div>
    </Modal>
  );
}

