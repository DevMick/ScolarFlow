import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Select, message, Collapse } from 'antd';
import { useAuth } from '../../context/AuthContext';
import type { RegisterData } from '../../services/authService';

interface FormData {
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  email: string;
  password: string;
  establishment: string;
  directionRegionale: string;
  secteurPedagogique: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    gender: '' as any,
    email: '',
    password: '',
    establishment: '',
    directionRegionale: '',
    secteurPedagogique: ''
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation simple
    const newErrors: Partial<FormData> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!formData.gender) newErrors.gender = 'Le genre est requis';
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Format email invalide';
    }
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre';
    }
    if (!formData.establishment.trim()) newErrors.establishment = 'L\'établissement est requis';
    if (!formData.directionRegionale.trim()) newErrors.directionRegionale = 'La direction régionale est requise';
    if (!formData.secteurPedagogique.trim()) newErrors.secteurPedagogique = 'Le secteur pédagogique est requis';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      
      try {
        // Préparer les données pour l'API
        const registerData = formData;
        
        // Utiliser le contexte d'authentification
        await register(registerData as RegisterData);
        
        // Afficher un message de succès
        message.success({
          content: '🎉 Votre compte a été créé avec succès ! Vous pouvez maintenant vous connecter.',
          duration: 3,
          style: {
            marginTop: '20vh',
            fontSize: '16px',
          },
        });
        
        // Rediriger vers la page de connexion après un court délai
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } catch (error: any) {
        console.error('Erreur d\'enregistrement:', error);
        
        // Gestion des erreurs spécifiques
        if (error.status === 422 && error.errors) {
          // Erreurs de validation du serveur
          const serverErrors: Partial<FormData> = {};
          Object.keys(error.errors).forEach(key => {
            if (key in formData) {
              serverErrors[key as keyof FormData] = error.errors[key][0];
            }
          });
          setErrors(serverErrors);
          message.error('Veuillez corriger les erreurs dans le formulaire');
        } else if (error.status === 409) {
          // Email déjà utilisé
          setErrors({ email: 'Cette adresse email est déjà utilisée' });
          message.error('Cette adresse email est déjà utilisée');
        } else {
          // Erreur générique
          message.error('Une erreur est survenue lors de la création du compte. Veuillez réessayer.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
    
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[name as keyof FormData]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
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

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-2">
          Créer votre compte enseignant
        </h2>
        <p className="text-center text-sm text-gray-600">
          Déjà inscrit ?{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Connectez-vous ici
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Nom et Prénom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`block w-full appearance-none rounded-xl border px-4 py-3 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all duration-200 sm:text-sm ${
                    errors.firstName 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Votre prénom"
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`block w-full appearance-none rounded-xl border px-4 py-3 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all duration-200 sm:text-sm ${
                    errors.lastName 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Votre nom"
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`block w-full appearance-none rounded-xl border px-4 py-3 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all duration-200 sm:text-sm ${
                  errors.email 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="votre.email@exemple.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Mot de passe et Genre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full appearance-none rounded-xl border px-4 py-3 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all duration-200 sm:text-sm ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Entrez votre mot de passe"
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                <div className="mt-2">
                  <Collapse
                    size="small"
                    items={[
                      {
                        key: '1',
                        label: <span className="text-xs font-medium text-gray-700">Voir les exigences du mot de passe</span>,
                        children: (
                          <ul className="space-y-1 text-xs text-gray-600">
                            <li className="flex items-center">
                              <span className="mr-1.5 text-blue-500">✓</span>
                              <span>Au moins 8 caractères</span>
                            </li>
                            <li className="flex items-center">
                              <span className="mr-1.5 text-blue-500">✓</span>
                              <span>Au moins 1 lettre majuscule (A-Z)</span>
                            </li>
                            <li className="flex items-center">
                              <span className="mr-1.5 text-blue-500">✓</span>
                              <span>Au moins 1 lettre minuscule (a-z)</span>
                            </li>
                            <li className="flex items-center">
                              <span className="mr-1.5 text-blue-500">✓</span>
                              <span>Au moins 1 chiffre (0-9)</span>
                            </li>
                          </ul>
                        ),
                      },
                    ]}
                    ghost
                    expandIconPosition="end"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Genre <span className="text-red-500">*</span>
                </label>
                <Select
                  id="gender"
                  value={formData.gender || undefined}
                  onChange={(value) => {
                    setFormData({ ...formData, gender: value as 'M' | 'F' });
                    // Effacer l'erreur
                    if (errors.gender) {
                      setErrors({ ...errors, gender: undefined });
                    }
                  }}
                  placeholder="Sélectionner votre genre"
                  className={`w-full ant-select-custom ${errors.gender ? 'ant-select-error' : ''}`}
                  size="large"
                  options={[
                    { value: 'M', label: 'Masculin' },
                    { value: 'F', label: 'Féminin' }
                  ]}
                  style={{ 
                    height: '48px',
                  }}
                />
                {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
              </div>
            </div>

            {/* Établissement */}
            <div>
              <label htmlFor="establishment" className="block text-sm font-medium text-gray-700 mb-1">
                Établissement scolaire <span className="text-red-500">*</span>
              </label>
              <input
                id="establishment"
                name="establishment"
                type="text"
                required
                value={formData.establishment}
                onChange={handleChange}
                className={`block w-full appearance-none rounded-xl border px-4 py-3 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all duration-200 sm:text-sm ${
                  errors.establishment 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                placeholder="Nom de votre établissement"
              />
              {errors.establishment && <p className="mt-1 text-sm text-red-600">{errors.establishment}</p>}
            </div>

            {/* Direction Régionale et Secteur Pédagogique */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="directionRegionale" className="block text-sm font-medium text-gray-700 mb-1">
                  Direction Régionale <span className="text-red-500">*</span>
                </label>
                <input
                  id="directionRegionale"
                  name="directionRegionale"
                  type="text"
                  required
                  value={formData.directionRegionale}
                  onChange={handleChange}
                  className={`block w-full appearance-none rounded-xl border px-4 py-3 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all duration-200 sm:text-sm ${
                    errors.directionRegionale 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Direction Régionale"
                />
                {errors.directionRegionale && <p className="mt-1 text-sm text-red-600">{errors.directionRegionale}</p>}
              </div>

              <div>
                <label htmlFor="secteurPedagogique" className="block text-sm font-medium text-gray-700 mb-1">
                  Secteur Pédagogique <span className="text-red-500">*</span>
                </label>
                <input
                  id="secteurPedagogique"
                  name="secteurPedagogique"
                  type="text"
                  required
                  value={formData.secteurPedagogique}
                  onChange={handleChange}
                  className={`block w-full appearance-none rounded-xl border px-4 py-3 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all duration-200 sm:text-sm ${
                    errors.secteurPedagogique 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  placeholder="Secteur Pédagogique"
                />
                {errors.secteurPedagogique && <p className="mt-1 text-sm text-red-600">{errors.secteurPedagogique}</p>}
              </div>
            </div>

            {/* Bouton de soumission */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex w-full justify-center items-center rounded-xl border border-transparent py-3 px-4 text-sm font-semibold text-white shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 transition-all duration-200 ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02]'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Création du compte...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Créer mon compte
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Déjà inscrit ?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="flex w-full justify-center items-center rounded-xl border border-gray-300 bg-white py-3 px-4 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all duration-200 hover:shadow-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}