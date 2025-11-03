import { useState } from 'react';
import { LandingHeader } from '../components/layout/LandingHeader';
import { Footer } from '../components/layout/Footer';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, MailOutlined, MessageOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

export function ContactPage() {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setIsLoading(true);
    
    try {
      // Ici vous pouvez ajouter la logique pour envoyer le formulaire
      console.log('Formulaire soumis:', values);
      message.success('Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.');
      form.resetFields();
    } catch (error) {
      message.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Title level={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Contactez-nous
          </Title>
          <Text className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto block">
            Partagez vos préoccupations, suggestions ou questions pour améliorer ScolarFlow
          </Text>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card 
            className="shadow-xl border-gray-100"
            bodyStyle={{ padding: '32px' }}
          >
            <Title level={2} className="text-center mb-8">
              Envoyez-nous un message
            </Title>
            
            <Form
              form={form}
              name="contact"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="name"
                label="Nom complet"
                rules={[
                  { required: true, message: 'Veuillez saisir votre nom !' }
                ]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="Votre nom complet"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="Adresse email"
                rules={[
                  { required: true, message: 'Veuillez saisir votre email !' },
                  { type: 'email', message: 'Veuillez saisir un email valide !' }
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-gray-400" />}
                  placeholder="votre.email@exemple.com"
                />
              </Form.Item>

              <Form.Item
                name="subject"
                label="Sujet"
                rules={[
                  { required: true, message: 'Veuillez saisir le sujet !' }
                ]}
              >
                <Input
                  placeholder="Sujet de votre message"
                />
              </Form.Item>

              <Form.Item
                name="message"
                label="Message"
                rules={[
                  { required: true, message: 'Veuillez saisir votre message !' }
                ]}
              >
                <TextArea
                  rows={6}
                  placeholder="Décrivez vos préoccupations, suggestions ou questions..."
                />
              </Form.Item>

              <Form.Item className="text-center">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  size="large"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 border-none hover:from-blue-700 hover:to-indigo-700"
                >
                  Envoyer le message
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
