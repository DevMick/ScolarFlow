import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Button, Space, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface CreateClassFormProps {
  onClassCreated: (data: { name: string; studentCount?: number }) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
}

export function CreateClassForm({ onClassCreated, onCancel }: CreateClassFormProps) {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: FormData) => {
    setIsLoading(true);
    
    try {
      const createData = {
        name: values.name.trim()
      };
      
      onClassCreated(createData);
      
      // Réinitialiser le formulaire
      form.resetFields();
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="Créer une nouvelle classe"
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
          name: ''
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
          <Input placeholder="Ex: CM2-A, CE1-B, CP1..." size="large" />
        </Form.Item>

        <Form.Item className="mb-0">
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel} disabled={isLoading} size="large">
              Annuler
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isLoading}
              size="large"
            >
              {isLoading ? 'Création...' : 'Créer la classe'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
