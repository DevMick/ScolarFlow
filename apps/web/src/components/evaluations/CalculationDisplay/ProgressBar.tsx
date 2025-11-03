// ========================================
// PROGRESS BAR - BARRE DE PROGRESSION SAISIE
// ========================================

import React, { useEffect, useState } from 'react';
import { cn } from '../../../utils/classNames';

/**
 * Props du composant ProgressBar
 */
interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  showNumbers?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  className?: string;
  onComplete?: () => void;
}

/**
 * Composant de barre de progression avec animations
 */
export const ProgressBar = React.memo<ProgressBarProps>(({
  current,
  total,
  label,
  showPercentage = true,
  showNumbers = true,
  animated = true,
  size = 'md',
  color = 'blue',
  className = '',
  onComplete
}) => {
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // ========================================
  // CALCULS
  // ========================================

  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const isFullyComplete = current >= total && total > 0;

  // ========================================
  // ANIMATIONS
  // ========================================

  useEffect(() => {
    if (animated) {
      // Animation progressive de la barre
      const animationDuration = 500; // 500ms
      const steps = 30;
      const stepValue = percentage / steps;
      const stepDuration = animationDuration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const newProgress = Math.min(stepValue * currentStep, percentage);
        setDisplayedProgress(newProgress);

        if (currentStep >= steps || newProgress >= percentage) {
          clearInterval(timer);
          setDisplayedProgress(percentage);
        }
      }, stepDuration);

      return () => clearInterval(timer);
    } else {
      setDisplayedProgress(percentage);
    }
  }, [percentage, animated]);

  // ========================================
  // EFFET DE COMPLETION
  // ========================================

  useEffect(() => {
    if (isFullyComplete && !isComplete) {
      setIsComplete(true);
      onComplete?.();
      
      // Animation de célébration
      if (animated) {
        setTimeout(() => {
          setIsComplete(false);
        }, 2000);
      }
    } else if (!isFullyComplete && isComplete) {
      setIsComplete(false);
    }
  }, [isFullyComplete, isComplete, onComplete, animated]);

  // ========================================
  // STYLES
  // ========================================

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Couleur dynamique basée sur le pourcentage
  const dynamicColor = 
    percentage >= 100 ? 'green' :
    percentage >= 75 ? 'blue' :
    percentage >= 50 ? 'yellow' :
    percentage >= 25 ? 'yellow' : 'red';

  const finalColor = color === 'blue' ? dynamicColor : color;

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className={cn('w-full', className)}>
      {/* Header avec label et statistiques */}
      {(label || showPercentage || showNumbers) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className={cn('font-medium text-gray-700', textSizeClasses[size])}>
              {label}
            </span>
          )}
          
          <div className="flex items-center space-x-2">
            {showNumbers && (
              <span className={cn('text-gray-600', textSizeClasses[size])}>
                {current}/{total}
              </span>
            )}
            
            {showPercentage && (
              <span className={cn(
                'font-semibold',
                textSizeClasses[size],
                finalColor === 'green' ? 'text-green-600' :
                finalColor === 'blue' ? 'text-blue-600' :
                finalColor === 'yellow' ? 'text-yellow-600' :
                finalColor === 'red' ? 'text-red-600' : 'text-purple-600'
              )}>
                {Math.round(displayedProgress)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Barre de progression */}
      <div className="relative">
        <div className={cn(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          sizeClasses[size],
          isComplete && animated && 'animate-pulse'
        )}>
          <div 
            className={cn(
              'h-full rounded-full transition-all duration-300 ease-out',
              colorClasses[finalColor],
              animated && 'transition-all duration-500',
              isComplete && 'animate-pulse'
            )}
            style={{ width: `${displayedProgress}%` }}
          />
          
          {/* Effet de brillance en mouvement */}
          {animated && displayedProgress > 0 && displayedProgress < 100 && (
            <div 
              className="absolute top-0 h-full w-4 bg-white bg-opacity-30 skew-x-12 animate-pulse"
              style={{ 
                left: `${displayedProgress - 2}%`,
                animationDuration: '1.5s',
                animationIterationCount: 'infinite'
              }}
            />
          )}
        </div>

        {/* Message de completion */}
        {isComplete && animated && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-xs animate-bounce">
              ✨ Terminé !
            </span>
          </div>
        )}
      </div>

      {/* Messages d'encouragement */}
      {percentage > 0 && (
        <div className="mt-2">
          {percentage === 100 && (
            <div className={cn(
              'text-center font-medium',
              textSizeClasses[size],
              'text-green-600 animate-pulse'
            )}>
              🎉 Toutes les notes ont été saisies !
            </div>
          )}
          
          {percentage >= 75 && percentage < 100 && (
            <div className={cn(
              'text-center',
              textSizeClasses[size],
              'text-blue-600'
            )}>
              👍 Presque terminé ! Plus que {total - current} note(s)
            </div>
          )}
          
          {percentage >= 50 && percentage < 75 && (
            <div className={cn(
              'text-center',
              textSizeClasses[size],
              'text-yellow-600'
            )}>
              ⚡ Bon rythme ! Continue comme ça
            </div>
          )}
          
          {percentage >= 25 && percentage < 50 && (
            <div className={cn(
              'text-center',
              textSizeClasses[size],
              'text-yellow-600'
            )}>
              📚 C'est parti ! {current} note(s) déjà saisie(s)
            </div>
          )}
          
          {percentage > 0 && percentage < 25 && (
            <div className={cn(
              'text-center',
              textSizeClasses[size],
              'text-gray-600'
            )}>
              🚀 Excellent début !
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

/**
 * Version circulaire de la barre de progression
 */
export const CircularProgressBar = React.memo<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}>(({ 
  percentage, 
  size = 60, 
  strokeWidth = 6, 
  color = '#3B82F6',
  className = '' 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Cercle de fond */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        {/* Cercle de progression */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {/* Pourcentage au centre */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-gray-700">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
});

CircularProgressBar.displayName = 'CircularProgressBar';

export default ProgressBar;
