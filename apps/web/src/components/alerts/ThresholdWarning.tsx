import React from 'react';
import { Alert } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface ThresholdWarningProps {
  classId: number;
  className: string;
  hasThreshold: boolean;
}

export const ThresholdWarning: React.FC<ThresholdWarningProps> = ({
  classId,
  className,
  hasThreshold,
}) => {
  const navigate = useNavigate();

  if (hasThreshold) {
    return null; // Ne rien afficher si les seuils sont configurés
  }

  return (
    <Alert
      message="Seuils non configurés"
      description={
        <div>
          Les seuils d'admission et de redoublement ne sont pas configurés pour la classe <strong>{className}</strong>.
          <br />
          Veuillez les configurer avant d'exporter le bilan annuel.
          <br />
          <a
            onClick={(e) => {
              e.preventDefault();
              navigate('/class-thresholds');
            }}
            style={{ textDecoration: 'underline', cursor: 'pointer', color: '#1890ff' }}
          >
            Configurer les seuils maintenant →
          </a>
        </div>
      }
      type="warning"
      icon={<ExclamationCircleOutlined />}
      showIcon
      style={{ marginBottom: '16px' }}
      closable
    />
  );
};

