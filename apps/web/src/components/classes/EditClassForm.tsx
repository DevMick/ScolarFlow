import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button, Space, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { Class } from '../../services/classService';

const { Title } = Typography;

interface EditClassFormProps {
  classItem: Class;
  onClassUpdated: (id: number, data: { name?: string }) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
}

export function EditClassForm({ classItem, onClassUpdated, onCancel }: EditClassFormProps) {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      name: classItem.name
    });
  }, [classItem, form]);

  const handleSubmit = async (values: FormData) => {
    setIsLoading(true);
    
    try {
      const updateData = {
        name: values.name.trim()
      };
      
      onClassUpdated(classItem.id, updateData);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="Modifier la classe"
      open={true}
      onCancel={onCancel}
      footer={null}
      width={500}
      closeIcon={<CloseOutlined />}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          name: classItem.name
        }}
      >
        <Form.Item
          label="Nom de la classe"
          name="name"
          rules={[
            { required: true, message: 'Le nom de la classe est requis' },
            { max: 100, message: 'Le nom ne peut pas dépasser 100 caractères' }
          ]}
        >
          <Input placeholder="Ex: CM1" size="large" />
        </Form.Item>

        <Form.Item className="mb-0">
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel} disabled={isLoading} size="large">
              Annuler
            </Button>
            <Button type="primary" htmlType="submit" loading={isLoading} size="large">
              {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
