// ========================================
// HOOK POUR GÉRER LES CONFIRMATIONS
// ========================================

import { useState, useCallback } from 'react';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
  isLoading: boolean;
}

export function useConfirmation() {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    type: 'danger',
    onConfirm: null,
    onCancel: null,
    isLoading: false
  });

  const confirm = useCallback((
    options: ConfirmationOptions
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Confirmer',
        cancelText: options.cancelText || 'Annuler',
        type: options.type || 'danger',
        onConfirm: () => {
          setState(prev => ({ ...prev, isLoading: true }));
          resolve(true);
        },
        onCancel: () => {
          setState(prev => ({ ...prev, isOpen: false, isLoading: false }));
          resolve(false);
        },
        isLoading: false
      });
    });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isOpen: false, 
      isLoading: false,
      onConfirm: null,
      onCancel: null
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  return {
    ...state,
    confirm,
    close,
    setLoading
  };
}
