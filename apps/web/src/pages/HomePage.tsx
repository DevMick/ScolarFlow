import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Gestion des Classes',
    description: 'Organisez et gérez facilement vos classes par niveau scolaire.',
    icon: AcademicCapIcon,
    href: '/classes'
  },
  {
    name: 'Suivi des Élèves',
    description: 'Suivez les progrès individuels de chaque élève.',
    icon: UserGroupIcon,
    href: '/students'
  },
  {
    name: 'Évaluations',
    description: 'Créez et gérez les évaluations avec facilité.',
    icon: ClipboardDocumentListIcon,
    href: '/evaluations'
  },
  {
    name: 'Statistiques Avancées',
    description: 'Analysez les performances avec des graphiques détaillés.',
    icon: ChartBarIcon,
    href: '/dashboard'
  }
];

const benefits = [
  {
    name: 'Interface Intuitive',
    description: 'Design moderne et facile à utiliser pour tous les enseignants.',
    icon: SparklesIcon
  },
  {
    name: 'Données Sécurisées',
    description: 'Vos données sont protégées et sauvegardées en toute sécurité.',
    icon: ShieldCheckIcon
  }
];

export function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4">
            Bienvenue sur{' '}
            <span className="text-primary-600">ScolarFlow</span>
          </h1>
          <p className="text-lg lg:text-xl text-primary-600 font-semibold mb-6 italic">
            "La gestion scolaire en toute fluidité"
          </p>
          <p className="text-lg lg:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            L'application web moderne pour la gestion et l'analyse des évaluations scolaires. 
            Simplifiez votre travail d'enseignant avec des outils puissants et intuitifs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/tarif" className="btn-primary text-lg px-8 py-3">
              Commencer
            </Link>
            <Link to="/classes" className="btn-secondary text-lg px-8 py-3">
              Voir les Classes
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Fonctionnalités Principales
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez tous les outils dont vous avez besoin pour gérer efficacement 
            vos classes et évaluations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <Link
              key={feature.name}
              to={feature.href}
              className="card hover:shadow-md transition-shadow duration-200 group"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4 group-hover:bg-primary-200 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.name}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-100 -mx-4 px-4 py-16 rounded-xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Pourquoi Choisir ScolarFlow ?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {benefits.map((benefit) => (
            <div key={benefit.name} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
                  <benefit.icon className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {benefit.name}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 bg-primary-50 -mx-4 px-4 rounded-xl">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Prêt à Commencer ?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Rejoignez les enseignants qui utilisent déjà ScolarFlow pour simplifier 
            leur gestion pédagogique.
          </p>
          <Link to="/dashboard" className="btn-primary text-lg px-8 py-3">
            Accéder au Tableau de Bord
          </Link>
        </div>
      </section>
    </div>
  );
}
