import { Link, useLocation } from 'react-router-dom';
import { Menu, Button, Space, Typography, Layout } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  UserOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  BarChartOutlined,
  LoginOutlined
} from '@ant-design/icons';

const { Header } = Layout;
const { Title } = Typography;

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: DashboardOutlined },
  { name: 'Classes', href: '/classes', icon: BookOutlined },
  { name: 'Élèves', href: '/students', icon: UserOutlined },
  { name: 'Matières', href: '/subjects', icon: FileTextOutlined },
  { name: 'Bilan Annuel', href: '/bilan-annuel', icon: CalculatorOutlined },
];

export function Navbar() {
  const location = useLocation();

  const menuItems = navigation.map((item) => ({
    key: item.href,
    icon: <item.icon />,
    label: <Link to={item.href}>{item.name}</Link>,
  }));

  return (
    <Header className="bg-white shadow-sm border-b border-gray-200 px-0">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <BookOutlined className="text-2xl text-blue-600" />
              <Title level={3} className="mb-0 text-gray-900">
                ScolarFlow
              </Title>
            </Link>
          </div>

          {/* Navigation Menu */}
          <div className="hidden md:block flex-1 mx-8">
            <Menu
              mode="horizontal"
              selectedKeys={[location.pathname]}
              items={menuItems}
              className="border-0 bg-transparent"
              style={{ lineHeight: '64px' }}
            />
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            <Space>
              <Button type="primary" icon={<LoginOutlined />}>
                Connexion
              </Button>
            </Space>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden py-3 border-t border-gray-200">
          <Menu
            mode="vertical"
            selectedKeys={[location.pathname]}
            items={menuItems}
            className="border-0 bg-transparent"
          />
        </div>
      </div>
    </Header>
  );
}