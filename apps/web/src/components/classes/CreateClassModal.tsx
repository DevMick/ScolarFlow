import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { classService, type CreateClassData } from '../../services/classService';
import toast from 'react-hot-toast';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassCreated: () => void;
}

interface FormData {
  name: string;
  studentCount: number;
}

interface FormErrors {
  name?: string;
  studentCount?: string;
}

export function CreateClassModal({ isOpen, onClose, onClassCreated }: CreateClassModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    studentCount: 0,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation côté client
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de la classe est requis';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Le nom ne peut pas dépasser 100 caractères';
    }
    
    if (formData.studentCount < 0) {
      newErrors.studentCount = 'Le nombre d\'élèves ne peut pas être négatif';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      
      try {
        const createData: CreateClassData = {
          name: formData.name.trim(),
          studentCount: formData.studentCount,
        };
        
        const response = await classService.createClass(createData);
        
        if (response.success) {
          toast.success('Classe créée avec succès !');
          onClassCreated();
          handleClose();
        } else {
          toast.error(response.message || 'Erreur lors de la création de la classe');
        }
      } catch (error: any) {
        console.error('Erreur lors de la création:', error);
        
        // Gestion des erreurs spécifiques
        if (error.status === 422 && error.errors) {
          const serverErrors: FormErrors = {};
          Object.keys(error.errors).forEach(key => {
            if (key in formData) {
              serverErrors[key as keyof FormData] = error.errors[key][0];
            }
          });
          setErrors(serverErrors);
        } else if (error.status === 409) {
          setErrors({ name: 'Une classe avec ce nom existe déjà' });
        } else {
          toast.error('Erreur de connexion au serveur. Veuillez réessayer.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'studentCount' ? parseInt(value) || 0 : value;
    
    setFormData({
      ...formData,
      [name]: finalValue
    });
    
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      studentCount: 0,
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Créer une nouvelle classe
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nom de la classe */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la classe <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className={`block w-full appearance-none rounded-lg border px-4 py-3 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all duration-200 sm:text-sm ${
                errors.name 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              placeholder="Ex: CM2-A, CE1-B, CP1..."
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Nombre d'élèves */}
          <div>
            <label htmlFor="studentCount" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre d'élèves (optionnel)
            </label>
            <input
              id="studentCount"
              name="studentCount"
              type="number"
              min="0"
              value={formData.studentCount}
              onChange={handleChange}
              className={`block w-full appearance-none rounded-lg border px-4 py-3 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all duration-200 sm:text-sm ${
                errors.studentCount 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              placeholder="0"
            />
            {errors.studentCount && <p className="mt-1 text-sm text-red-600">{errors.studentCount}</p>}
            <p className="mt-1 text-sm text-gray-500">
              Laissez 0 si vous ajouterez les élèves plus tard
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              } text-white py-3 px-4 rounded-lg font-semibold shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 transition-all duration-200`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création...
                </>
              ) : (
                'Créer la classe'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
