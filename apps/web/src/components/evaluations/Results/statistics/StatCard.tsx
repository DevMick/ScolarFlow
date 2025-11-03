// ========================================
// STAT CARD - CARTE DE STATISTIQUE
// ========================================

import React from 'react';
import { cn } from '../../../../utils/classNames';

/**
 * Props du composant StatCard
 */
interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple';
  trend?: 'up' | 'down' | 'stable';
  icon?: string;
  compact?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Composant carte de statistique
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  color,
  trend,
  icon,
  compact = false,
  className = '',
  onClick
}) => {
  // ========================================
  // CONFIGURATION DES COULEURS
  // ========================================

  const colorConfigs = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      subText: 'text-blue-700',
      icon: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      subText: 'text-green-700',
      icon: 'text-green-600'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      subText: 'text-yellow-700',
      icon: 'text-yellow-600'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      subText: 'text-red-700',
      icon: 'text-red-600'
    },
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-900',
      subText: 'text-gray-700',
      icon: 'text-gray-600'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-900',
      subText: 'text-purple-700',
      icon: 'text-purple-600'
    }
  };

  const config = colorConfigs[color];

  // ========================================
  // ICÔNE DE TENDANCE
  // ========================================

  const TrendIcon = () => {
    if (!trend || trend === 'stable') return null;

    if (trend === 'up') {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7m0 10H7" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7l9.2 9.2M17 7v10m0-10H7" />
      </svg>
    );
  };

  // ========================================
  // RENDU
  // ========================================

  const cardContent = (
    <>
      {/* Header avec icône et tendance */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {icon && (
            <span className={cn('text-lg mr-2', config.icon)}>
              {icon}
            </span>
          )}
          <span className={cn(
            'font-medium',
            compact ? 'text-xs' : 'text-sm',
            config.text
          )}>
            {label}
          </span>
        </div>
        <TrendIcon />
      </div>

      {/* Valeur principale */}
      <div className={cn(
        'font-bold',
        compact ? 'text-lg' : 'text-2xl',
        config.text
      )}>
        {value}
      </div>

      {/* Valeur secondaire */}
      {subValue && (
        <div className={cn(
          'mt-1',
          compact ? 'text-xs' : 'text-sm',
          config.subText
        )}>
          {subValue}
        </div>
      )}
    </>
  );

  // ========================================
  // RENDU AVEC OU SANS CLIC
  // ========================================

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left rounded-lg border transition-all duration-200',
          'hover:shadow-md hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          compact ? 'p-3' : 'p-4',
          config.bg,
          config.border,
          className
        )}
      >
        {cardContent}
      </button>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border',
        compact ? 'p-3' : 'p-4',
        config.bg,
        config.border,
        className
      )}
    >
      {cardContent}
    </div>
  );
};

export default StatCard;
