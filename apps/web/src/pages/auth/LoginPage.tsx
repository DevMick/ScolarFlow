import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Checkbox, Space, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import type { LoginData } from '../../services/authService';

const { Title, Text } = Typography;

interface FormData {
  email: string;
  password: string;
  remember?: boolean;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: FormData) => {
    console.log('🔐 LOGIN - Form values received:', values);
    setIsLoading(true);
    
    try {
      // Utiliser le contexte d'authentification standard pour tous les utilisateurs (y compris admin)
      const loginResponse = await login(values as LoginData);
      
      // Si c'est l'utilisateur admin, rediriger immédiatement vers la page admin
      if (values.email === 'mickael.andjui.21@gmail.com') {
            message.success('Connexion admin réussie !');
        // Redirection immédiate sans délai
        navigate('/admin/payments', { replace: true });
          return;
      }
      
      message.success('Connexion réussie !');
      
      // Vérifier s'il y a une redirection prévue après connexion
      const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
      if (redirectAfterLogin) {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectAfterLogin, { replace: true });
      } else {
        // Rediriger vers le dashboard par défaut
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      
      // Gestion des erreurs spécifiques
      if (error.status === 401) {
        message.error('Email ou mot de passe incorrect');
      } else if (error.status === 403) {
        message.error('Compte désactivé');
      } else {
        message.error('Erreur de connexion. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Logo centré en haut */}
      <div className="flex justify-center mb-8">
        <Link to="/" className="flex items-center space-x-3 bg-white rounded-2xl px-6 py-4 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">SF</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold text-gray-900">ScolarFlow</h2>
            <p className="text-xs text-blue-600 font-medium italic">Gestion Scolaire</p>
          </div>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Title level={2} className="text-center mb-2">
          Connexion à votre compte
        </Title>
        <Text className="text-center block text-gray-600">
          Ou{' '}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            créez un nouveau compte enseignant
          </Link>
        </Text>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card 
          className="shadow-xl border-gray-100"
          bodyStyle={{ padding: '32px' }}
        >
          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            initialValues={{ remember: false }}
          >
            <Form.Item
              name="email"
              label="Adresse email"
              rules={[
                { required: true, message: 'Veuillez saisir votre email !' },
                { type: 'email', message: 'Veuillez saisir un email valide !' }
              ]}
              validateTrigger={['onChange', 'onBlur']}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="votre.email@exemple.com"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mot de passe"
              rules={[
                { required: true, message: 'Veuillez saisir votre mot de passe !' }
              ]}
              validateTrigger={['onChange', 'onBlur']}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked" className="mb-4">
              <div className="flex items-center justify-between">
                <Checkbox>Se souvenir de moi</Checkbox>
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Mot de passe oublié ?
                </a>
              </div>
            </Form.Item>

            <Form.Item className="mb-6">
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                icon={<LoginOutlined />}
                className="w-full h-12 text-base font-semibold"
                size="large"
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </Form.Item>
          </Form>

          <Divider>Nouveau sur ScolarFlow ?</Divider>

          <Button
            type="default"
            icon={<UserAddOutlined />}
            className="w-full h-12 text-base font-semibold"
            size="large"
            onClick={() => navigate('/register')}
          >
            Créer un compte enseignant
          </Button>
        </Card>
      </div>
    </div>
  );
}