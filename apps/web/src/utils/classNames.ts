// ========================================
// CLASS NAMES UTILITY - UTILITAIRE POUR LES CLASSES CSS
// ========================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitaire pour combiner et fusionner les classes CSS avec Tailwind
 * 
 * @param inputs - Classes CSS à combiner
 * @returns Classes CSS fusionnées
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utilitaire pour créer des variantes de composants
 * 
 * @param base - Classes de base
 * @param variants - Variantes possibles
 * @param defaultVariant - Variante par défaut
 */
export function createVariants<T extends Record<string, Record<string, string>>>(
  base: string,
  variants: T,
  defaultVariant?: Partial<{ [K in keyof T]: keyof T[K] }>
) {
  return (props?: Partial<{ [K in keyof T]: keyof T[K] }>) => {
    const variantClasses = Object.entries(variants).map(([key, variantOptions]) => {
      const selectedVariant = props?.[key as keyof T] || defaultVariant?.[key as keyof T];
      return selectedVariant ? variantOptions[selectedVariant as string] : '';
    });

    return cn(base, ...variantClasses);
  };
}

/**
 * Utilitaire pour les classes conditionnelles
 */
export function conditionalClass(condition: boolean, trueClass: string, falseClass?: string) {
  return condition ? trueClass : falseClass || '';
}

/**
 * Utilitaire pour les classes de focus
 */
export const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';

/**
 * Utilitaire pour les classes de transition
 */
export const transitionClasses = 'transition-colors duration-200 ease-in-out';

/**
 * Utilitaire pour les classes de bouton de base
 */
export const buttonBaseClasses = cn(
  'inline-flex items-center justify-center rounded-md font-medium',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  focusClasses,
  transitionClasses
);

/**
 * Variantes de boutons
 */
export const buttonVariants = createVariants(
  buttonBaseClasses,
  {
    variant: {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
      ghost: 'text-gray-700 hover:bg-gray-100',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    },
    size: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    },
  },
  {
    variant: 'primary',
    size: 'md',
  }
);

/**
 * Utilitaire pour les classes d'input
 */
export const inputBaseClasses = cn(
  'block w-full rounded-md border-gray-300 shadow-sm',
  'focus:border-blue-500 focus:ring-blue-500',
  'disabled:bg-gray-50 disabled:text-gray-500',
  'placeholder:text-gray-400'
);

/**
 * Variantes d'input
 */
export const inputVariants = createVariants(
  inputBaseClasses,
  {
    size: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    },
    state: {
      default: 'border-gray-300',
      error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
      success: 'border-green-300 focus:border-green-500 focus:ring-green-500',
    },
  },
  {
    size: 'md',
    state: 'default',
  }
);

/**
 * Utilitaire pour les classes de card
 */
export const cardClasses = 'bg-white rounded-lg border border-gray-200 shadow-sm';

/**
 * Utilitaire pour les classes de badge
 */
export const badgeVariants = createVariants(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variant: {
      default: 'bg-gray-100 text-gray-800',
      primary: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
    },
  },
  {
    variant: 'default',
  }
);

/**
 * Utilitaire pour les classes d'alerte
 */
export const alertVariants = createVariants(
  'rounded-md p-4',
  {
    variant: {
      info: 'bg-blue-50 border border-blue-200 text-blue-900',
      success: 'bg-green-50 border border-green-200 text-green-900',
      warning: 'bg-yellow-50 border border-yellow-200 text-yellow-900',
      error: 'bg-red-50 border border-red-200 text-red-900',
    },
  },
  {
    variant: 'info',
  }
);

/**
 * Classes pour les états de chargement
 */
export const loadingClasses = {
  spinner: 'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
  pulse: 'animate-pulse bg-gray-200 rounded',
  skeleton: 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]',
};

/**
 * Classes pour les animations
 */
export const animationClasses = {
  fadeIn: 'animate-in fade-in-0 duration-200',
  fadeOut: 'animate-out fade-out-0 duration-200',
  slideIn: 'animate-in slide-in-from-bottom-2 duration-300',
  slideOut: 'animate-out slide-out-to-bottom-2 duration-300',
  zoomIn: 'animate-in zoom-in-95 duration-200',
  zoomOut: 'animate-out zoom-out-95 duration-200',
};

/**
 * Classes pour la responsive
 */
export const responsiveClasses = {
  container: 'container mx-auto px-4 sm:px-6 lg:px-8',
  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
  flex: 'flex flex-col sm:flex-row items-start sm:items-center gap-4',
};

/**
 * Classes pour l'accessibilité
 */
export const a11yClasses = {
  srOnly: 'sr-only',
  focusVisible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded',
};

export default cn;