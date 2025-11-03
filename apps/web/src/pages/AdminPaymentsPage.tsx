import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Modal, Image, Card, Row, Col, Select, Typography, Spin, Empty } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PaymentService } from '../services/paymentService';

const { Title, Text } = Typography;
const { Option } = Select;

interface Payment {
  id: number;
  userId: number;
  datePaiement: string;
  isPaid: boolean;
  hasScreenshot: boolean;
  screenshotType?: string | null;
  screenshotUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'validated'>('all');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadPayments();
  }, [filterStatus]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      // Déterminer le paramètre validated selon le filtre
      let validatedOnly: boolean | undefined;
      if (filterStatus === 'validated') {
        validatedOnly = true;
      } else if (filterStatus === 'pending') {
        validatedOnly = false;
      } else {
        validatedOnly = undefined; // 'all' - récupérer tous les paiements
      }
      
      const result = await PaymentService.getAllPayments(validatedOnly);
      
      if (result.success && result.payments) {
        setPayments(result.payments);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error);
      setError('Erreur lors du chargement des paiements');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId: number, status: 'validated' | 'rejected') => {
    try {
      await PaymentService.updatePaymentStatus(paymentId, status);
      
      // Recharger les paiements après mise à jour
      await loadPayments();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  // Charger et afficher l'image dans un modal
  const showScreenshot = async (paymentId: number) => {
    try {
      setPreviewLoading(true);
      setPreviewVisible(true);
      
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = sessionStorage.getItem('auth_token');
      
      if (!token) {
        setError('Token d\'authentification manquant');
        setPreviewVisible(false);
        return;
      }
      
      const fullUrl = `${baseUrl}/admin/payments/${paymentId}/screenshot`;
      
      // Charger l'image avec fetch pour inclure le token
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setPreviewImage(imageUrl);
      } else {
        setError('Impossible de charger l\'image');
        setPreviewVisible(false);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'image:', error);
      setError('Erreur lors du chargement de l\'image');
      setPreviewVisible(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Nettoyer l'URL blob quand le modal se ferme
  const handleClosePreview = () => {
    if (previewImage && previewImage.startsWith('blob:')) {
      URL.revokeObjectURL(previewImage);
    }
    setPreviewVisible(false);
    setPreviewImage(null);
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Définir les colonnes du tableau avec responsive
  const columns: ColumnsType<Payment> = [
    {
      title: 'Utilisateur',
      key: 'user',
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900" style={{ fontSize: '14px' }}>
            {record.user?.firstName && record.user?.lastName
              ? `${record.user.firstName} ${record.user.lastName}`
              : record.user?.email || `Utilisateur ${record.userId}`}
          </div>
          <div className="text-sm text-gray-500" style={{ fontSize: '12px' }}>{record.user?.email}</div>
        </div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'datePaiement',
      key: 'datePaiement',
      width: 150,
      render: (date: string) => (
        <span style={{ fontSize: '13px' }}>{formatDate(date)}</span>
      ),
      sorter: (a, b) => new Date(a.datePaiement).getTime() - new Date(b.datePaiement).getTime(),
    },
    {
      title: 'Statut',
      dataIndex: 'isPaid',
      key: 'status',
      width: 100,
      render: (isPaid: boolean) => (
        <Tag color={isPaid ? 'success' : 'warning'}>
          {isPaid ? 'Validé' : 'En attente'}
        </Tag>
      ),
      filters: [
        { text: 'Validé', value: true },
        { text: 'En attente', value: false },
      ],
      onFilter: (value, record) => record.isPaid === value,
    },
        {
          title: 'Actions',
          key: 'actions',
          width: 200,
          render: (_, record) => (
            <Space size="small" wrap>
              {record.hasScreenshot && (
                <Button
                  type="default"
                  icon={<EyeOutlined />}
                  size="small"
                  onClick={() => showScreenshot(record.id)}
                  title="Voir la capture d'écran"
                />
              )}
              {!record.isPaid && (
                <Button
                  type="primary"
                  size="small"
                  onClick={() => updatePaymentStatus(record.id, 'validated')}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                  Valider
                </Button>
              )}
            </Space>
          ),
        },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', padding: '20px' }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <Text type="danger" style={{ fontSize: '16px', display: 'block', marginBottom: '16px' }}>{error}</Text>
            <Button type="primary" onClick={loadPayments}>
              Réessayer
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '16px' }}>
      {/* Header */}
      <Card className="mb-4" style={{ marginBottom: '16px' }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Title level={2} className="mb-2" style={{ marginBottom: '8px' }}>Administration des Paiements</Title>
            <Text type="secondary">Gérez les paiements des utilisateurs</Text>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Select
                value={filterStatus}
                onChange={(value) => setFilterStatus(value as 'all' | 'pending' | 'validated')}
                style={{ width: '100%', maxWidth: '250px' }}
                size="large"
              >
                <Option value="all">Tous les paiements</Option>
                <Option value="pending">En attente</Option>
                <Option value="validated">Validés</Option>
              </Select>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        {payments.length === 0 ? (
          <Empty
            description={
              <div>
                <Title level={4}>Aucun paiement trouvé</Title>
                <Text type="secondary">
                  {filterStatus === 'all' 
                    ? "Il n'y a aucun paiement dans le système."
                    : filterStatus === 'pending'
                    ? "Il n'y a aucun paiement en attente."
                    : "Il n'y a aucun paiement validé."}
                </Text>
              </div>
            }
          />
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table
              columns={columns}
              dataSource={payments}
              rowKey="id"
              loading={loading}
              scroll={{ 
                x: 'max-content',
                y: undefined
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total: ${total} paiement(s)`,
                responsive: true,
                size: 'small',
              }}
              locale={{
                emptyText: 'Aucun paiement trouvé'
              }}
              size="small"
            />
          </div>
        )}
      </Card>

      {/* Modal pour afficher la capture d'écran */}
      <Modal
        open={previewVisible}
        title="Capture d'écran du paiement"
        footer={null}
        onCancel={handleClosePreview}
        width="90%"
        style={{ maxWidth: 800 }}
        centered
      >
        {previewLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <Spin size="large" />
          </div>
        ) : previewImage ? (
          <div style={{ textAlign: 'center' }}>
            <Image
              src={previewImage}
              alt="Capture d'écran du paiement"
              style={{ maxWidth: '100%', maxHeight: '70vh', width: 'auto' }}
              preview={false}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', color: '#999' }}>
            <Text type="secondary">Aucune image disponible</Text>
          </div>
        )}
      </Modal>
    </div>
  );
}
