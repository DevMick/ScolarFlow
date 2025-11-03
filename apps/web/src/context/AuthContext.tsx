import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { authService } from '../services/authService';
import { PaymentService } from '../services/paymentService';
import type { 
  User, 
  LoginCredentials, 
  RegisterData, 
  UpdateProfileData,
  AuthContextType 
} from '@edustats/shared';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);

  const isAuthenticated = !!(user && token);

  // Initialisation au chargement de l'app
  useEffect(() => {
    initializeAuth();
  }, []);
  
  // Surveiller les changements de sessionStorage (entre onglets du même site)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' && !e.newValue) {
        // Le token a été supprimé dans un autre onglet
        console.log('🔐 Token removed from storage, logging out...');
        setToken(null);
        setUser(null);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Vérifier périodiquement l'expiration de la session
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const expires = sessionStorage.getItem('auth_expires');
      const storedToken = sessionStorage.getItem('auth_token');
      
      // Vérifier l'expiration de la session
      if (expires && Date.now() > parseInt(expires)) {
        console.log('⚠️ Session expired, logging out...');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('user_data');
        sessionStorage.removeItem('auth_expires');
        setToken(null);
        setUser(null);
        setIsPaid(false);
        return;
      }
      
      // Vérifier que le token existe toujours dans sessionStorage
      if (!storedToken && token) {
        console.log('⚠️ Token removed from sessionStorage, logging out...');
        setToken(null);
        setUser(null);
        setIsPaid(false);
      }
    }, 1000); // Vérifier toutes les secondes
    
    return () => {
      clearInterval(checkInterval);
    };
  }, [token]);

  // Fonction pour vérifier le statut de paiement
  const checkPaymentStatus = React.useCallback(async () => {
    try {
      const paymentStatus = await PaymentService.checkPaymentStatus();
      if (paymentStatus.success) {
        setIsPaid(paymentStatus.isPaid);
        setSubscriptionEndDate(paymentStatus.subscriptionEndDate || null);
        console.log('💳 PAYMENT STATUS - isPaid:', paymentStatus.isPaid, 'subscriptionEndDate:', paymentStatus.subscriptionEndDate);
      } else {
        setIsPaid(false);
        setSubscriptionEndDate(null);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut de paiement:', error);
      setIsPaid(false);
      setSubscriptionEndDate(null);
    }
  }, []);

  // Vérifier périodiquement le statut de paiement (toutes les 5 minutes)
  useEffect(() => {
    // Ne vérifier que si l'utilisateur est connecté et n'est pas l'admin
    if (!isAuthenticated || !user || user.email === 'mickael.andjui.21@gmail.com') {
      return;
    }

    const paymentCheckInterval = setInterval(() => {
      checkPaymentStatus();
    }, 5 * 60 * 1000); // Vérifier toutes les 5 minutes (au lieu de 30 secondes)

    return () => {
      clearInterval(paymentCheckInterval);
    };
  }, [isAuthenticated, user, checkPaymentStatus]);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Utiliser uniquement sessionStorage (pas de persistance entre sessions)
      const storedToken = sessionStorage.getItem('auth_token');
      const storedUser = sessionStorage.getItem('user_data');
      const expires = sessionStorage.getItem('auth_expires');
      
      console.log('🔐 AUTH INIT - Token exists in sessionStorage:', !!storedToken);
      console.log('🔐 AUTH INIT - User exists in sessionStorage:', !!storedUser);
      
      // Vérifier l'expiration de la session
      if (expires && Date.now() > parseInt(expires)) {
        console.log('⚠️ AUTH INIT - Session expired, cleaning up...');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('user_data');
        sessionStorage.removeItem('auth_expires');
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Nettoyer localStorage s'il existe (migration vers sessionStorage uniquement)
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('user_data');
      localStorage.removeItem('auth_expires');
      
      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
          console.log('✅ AUTH INIT - User authenticated from sessionStorage:', userData.email);
          
          // Vérifier le statut de paiement si ce n'est pas l'admin
          if (userData.email !== 'mickael.andjui.21@gmail.com') {
            // Vérifier le statut de paiement de manière asynchrone
            PaymentService.checkPaymentStatus().then((paymentStatus) => {
              if (paymentStatus.success) {
                setIsPaid(paymentStatus.isPaid);
                setSubscriptionEndDate(paymentStatus.subscriptionEndDate || null);
                console.log('💳 PAYMENT STATUS - isPaid:', paymentStatus.isPaid, 'subscriptionEndDate:', paymentStatus.subscriptionEndDate);
              } else {
                setIsPaid(false);
                setSubscriptionEndDate(null);
              }
            }).catch((error) => {
              console.error('Erreur lors de la vérification du statut de paiement:', error);
              setIsPaid(false);
              setSubscriptionEndDate(null);
            });
          } else {
            // L'admin a toujours accès à tous les menus
            setIsPaid(true);
          }
        } catch (parseError) {
          console.error('❌ AUTH INIT - Failed to parse user data:', parseError);
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('user_data');
          sessionStorage.removeItem('auth_expires');
          setToken(null);
          setUser(null);
          setIsPaid(false);
        }
      } else {
        // Pas de token ou d'utilisateur dans sessionStorage
        setToken(null);
        setUser(null);
        setIsPaid(false);
        console.log('❌ AUTH INIT - No credentials in sessionStorage');
      }
    } catch (error) {
      console.error('❌ AUTH INIT - Failed:', error);
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_data');
      sessionStorage.removeItem('auth_expires');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
      console.log('🔐 AUTH INIT - Loading finished');
    }
  };

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await authService.login(credentials);
      
      // La réponse a la structure { success: boolean, token, user, message: string }
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        
        // Sauvegarder le token et les données utilisateur dans le sessionStorage
        sessionStorage.setItem('auth_token', response.token);
        sessionStorage.setItem('user_data', JSON.stringify(response.user));
        // Ajouter un timestamp d'expiration (24h)
        sessionStorage.setItem('auth_expires', (Date.now() + 24 * 60 * 60 * 1000).toString());
        
        // Vérifier le statut de paiement si ce n'est pas l'admin
        if (response.user.email !== 'mickael.andjui.21@gmail.com') {
          await checkPaymentStatus();
        } else {
          // L'admin a toujours accès à tous les menus
          setIsPaid(true);
        }
        
        toast.success(`Bienvenue ${response.user.firstName} !`);
      } else {
        throw new Error(response.message || 'Erreur lors de la connexion');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erreur lors de la connexion';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await authService.register(data);
      
      // La réponse a la structure { success: boolean, token, user, message: string }
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        
        // Sauvegarder le token et les données utilisateur dans le sessionStorage
        sessionStorage.setItem('auth_token', response.token);
        sessionStorage.setItem('user_data', JSON.stringify(response.user));
        // Ajouter un timestamp d'expiration (24h)
        sessionStorage.setItem('auth_expires', (Date.now() + 24 * 60 * 60 * 1000).toString());
        
        toast.success(`Bienvenue ${response.user.firstName} ! Votre compte a été créé.`);
      } else {
        throw new Error(response.message || 'Erreur lors de l\'inscription');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erreur lors de l\'inscription';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    handleLogout();
    toast.success('Vous êtes déconnecté');
  };

  const handleLogout = (): void => {
    authService.logout();
    setUser(null);
    setToken(null);
    setIsPaid(false);
    
    // Nettoyer le sessionStorage uniquement
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_data');
    sessionStorage.removeItem('auth_expires');
    
    // Nettoyer aussi localStorage s'il existe (nettoyage complet)
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_data');
    localStorage.removeItem('auth_expires');
  };

  const updateProfile = async (data: UpdateProfileData): Promise<void> => {
    try {
      setIsLoading(true);
      
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      
      toast.success('Profil mis à jour avec succès');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erreur lors de la mise à jour';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const response = await authService.refreshToken();
      setToken(response.token);
    } catch (error) {
      console.error('Token refresh failed:', error);
      handleLogout();
      throw error;
    }
  };

  // Étendre l'interface AuthContextType pour inclure isPaid
  const value = {
    user,
    isLoading,
    isAuthenticated,
    token,
    isPaid,
    subscriptionEndDate,
    checkPaymentStatus,
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
  } as AuthContextType & { 
    isPaid: boolean; 
    subscriptionEndDate: string | null;
    checkPaymentStatus: () => Promise<void>;
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
