import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  UserIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { updateProfileSchema } from '@edustats/shared';
import type { UpdateProfileData } from '@edustats/shared';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      establishment: user?.establishment || '',
    },
  });

  const onSubmit = async (data: UpdateProfileData) => {
    try {
      await updateProfile(data);
      reset(data); // Reset le formulaire avec les nouvelles valeurs
    } catch (error) {
      // L'erreur est gérée par le contexte d'auth
    }
  };

  const handleCancel = () => {
    reset({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      establishment: user?.establishment || '',
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-600 mt-2">
          Gérez vos informations personnelles et vos préférences de compte.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Informations personnelles
          </h2>
          <p className="text-sm text-gray-600">
            Mettez à jour vos informations de profil.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Email (lecture seule) */}
          <Input
            label="Adresse email"
            type="email"
            value={user.email}
            disabled
            leftIcon={<EnvelopeIcon className="h-5 w-5" />}
            helperText="L'adresse email ne peut pas être modifiée"
          />

          {/* Prénom et nom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Prénom"
              type="text"
              placeholder="Votre prénom"
              leftIcon={<UserIcon className="h-5 w-5" />}
              error={errors.firstName?.message}
              {...register('firstName')}
            />

            <Input
              label="Nom"
              type="text"
              placeholder="Votre nom"
              leftIcon={<UserIcon className="h-5 w-5" />}
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          {/* Téléphone */}
          <Input
            label="Téléphone"
            type="tel"
            placeholder="01 23 45 67 89"
            leftIcon={<PhoneIcon className="h-5 w-5" />}
            error={errors.phone?.message}
            helperText="Optionnel"
            {...register('phone')}
          />

          {/* Établissement */}
          <Input
            label="Établissement"
            type="text"
            placeholder="École Primaire..."
            leftIcon={<BuildingOfficeIcon className="h-5 w-5" />}
            error={errors.establishment?.message}
            helperText="Optionnel"
            {...register('establishment')}
          />

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={!isDirty || isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={!isDirty || isLoading}
            >
              Sauvegarder
            </Button>
          </div>
        </form>
      </div>

      {/* Informations du compte */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Informations du compte
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <dt className="text-sm font-medium text-gray-500">Membre depuis</dt>
              <dd className="text-sm text-gray-900">
                {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <dt className="text-sm font-medium text-gray-500">Dernière mise à jour</dt>
              <dd className="text-sm text-gray-900">
                {new Date(user.updatedAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <dt className="text-sm font-medium text-gray-500">Statut du compte</dt>
              <dd className="text-sm">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Actif' : 'Inactif'}
                </span>
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Section de sécurité */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Sécurité
          </h2>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Mot de passe</h3>
              <p className="text-sm text-gray-500">
                Dernière modification il y a plus de 90 jours
              </p>
            </div>
            <Button variant="secondary" size="sm">
              Changer le mot de passe
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
