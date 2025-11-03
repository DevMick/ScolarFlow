import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export function DocumentationPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageClick = (src: string) => {
    setSelectedImage(src);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
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
                  <p className="text-xs text-gray-500 font-medium">Gestion Scolaire</p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                to="/documentation" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                Documentation
              </Link>
              <Link 
                to="/tarif" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                Tarif
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                Contact
              </Link>
            </nav>

            {/* Boutons d'action */}
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                Se connecter
              </Link>
              <Link 
                to="/tarif" 
                className="inline-flex items-center px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
              >
                Commencer
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Guide Utilisateur ScolarFlow
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez comment utiliser ScolarFlow pour gérer efficacement vos évaluations scolaires, 
            du début à la fin de votre processus pédagogique.
          </p>
        </div>


        {/* Section 1: Premiers pas */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">1. Premiers pas</h2>
          
          {/* Inscription */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">1.1 Inscription</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Comment s'inscrire</h4>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                    <span>Accédez à la page d'inscription via le bouton "Commencer" sur la page d'accueil</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                    <span>Remplissez tous les champs obligatoires : prénom, nom, email, mot de passe, genre, établissement, direction régionale et secteur pédagogique</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                    <span>Assurez-vous que votre mot de passe respecte les exigences de sécurité</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                    <span>Cliquez sur "Créer mon compte" pour finaliser votre inscription</span>
                  </li>
                </ol>
              </div>
              <div className="flex justify-center">
                <img 
                  src="/docs/register.png" 
                  alt="Page d'inscription ScolarFlow" 
                  className="rounded-lg shadow-md max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick('/docs/register.png')}
                />
              </div>
            </div>
          </div>

          {/* Connexion */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">1.2 Connexion</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Comment se connecter</h4>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                    <span>Accédez à la page de connexion via le bouton "Se connecter"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                    <span>Entrez votre adresse email et votre mot de passe</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                    <span>Optionnel : cochez "Se souvenir de moi" pour rester connecté</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                    <span>Cliquez sur "Se connecter" pour accéder à votre tableau de bord</span>
                  </li>
                </ol>
              </div>
              <div className="flex justify-center">
                <img 
                  src="/docs/login-page.png" 
                  alt="Page de connexion ScolarFlow" 
                  className="rounded-lg shadow-md max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick('/docs/login-page.png')}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Configuration */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">2. Configuration de votre environnement</h2>
          
          {/* Années Scolaires */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">2.1 Années Scolaires</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Créer une année scolaire</h4>
                <p className="text-gray-700 mb-4">
                  L'année scolaire est la base de votre organisation. Elle définit la période d'enseignement 
                  et permet de structurer toutes vos données pédagogiques.
                </p>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                    <span>Accédez au menu "Années Scolaires" depuis la barre de navigation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                    <span>Cliquez sur "Créer une année scolaire"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                    <span>Indiquez l'année de début (ex: 2024)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                    <span>Indiquez l'année de fin (ex: 2025)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</span>
                    <span>Cliquez sur "Créer" pour valider</span>
                  </li>
                </ol>
              </div>
              <div className="flex justify-center">
                <img 
                  src="/docs/gestion-annees-scolaires.png" 
                  alt="Gestion des Années Scolaires" 
                  className="rounded-lg shadow-md max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick('/docs/gestion-annees-scolaires.png')}
                />
              </div>
            </div>
          </div>

          {/* Classes */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">2.2 Classes</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Gérer vos classes</h4>
                <p className="text-gray-700 mb-4">
                  Les classes représentent les groupes d'élèves que vous enseignez. 
                  Vous pouvez créer plusieurs classes et y ajouter vos élèves.
                </p>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                    <span>Accédez au menu "Classes" depuis la barre de navigation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                    <span>Cliquez sur "Nouvelle Classe" pour créer une classe</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                    <span>Donnez un nom à votre classe (ex: "CM1", "CP2")</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                    <span>Ajoutez une description optionnelle</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</span>
                    <span>Validez la création de votre classe</span>
                  </li>
                </ol>
              </div>
              <div className="flex justify-center">
                <img 
                  src="/docs/mes-classes.png" 
                  alt="Mes Classes" 
                  className="rounded-lg shadow-md max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick('/docs/mes-classes.png')}
                />
              </div>
            </div>
          </div>

          {/* Matières */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">2.3 Matières</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Configurer les matières</h4>
                <p className="text-gray-700 mb-4">
                  Les matières définissent les disciplines que vous enseignez. 
                  Vous pouvez configurer le diviseur de calcul pour chaque matière.
                </p>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                    <span>Accédez au menu "Matières" depuis la barre de navigation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                    <span>Cliquez sur "Nouvelle Matière" pour ajouter une matière</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                    <span>Donnez un nom à votre matière (ex: "Mathématiques", "Français")</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                    <span>Configurez le diviseur de calcul (coefficient de la matière)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</span>
                    <span>Activez la configuration pour finaliser</span>
                  </li>
                </ol>
              </div>
              <div className="space-y-4">
                <img 
                  src="/docs/configurer-diviseur-calcul.png" 
                  alt="Configurer le diviseur de calcul" 
                  className="rounded-lg shadow-md max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick('/docs/configurer-diviseur-calcul.png')}
                />
                <img 
                  src="/docs/configuration-activee.png" 
                  alt="Configuration activée" 
                  className="rounded-lg shadow-md max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick('/docs/configuration-activee.png')}
                />
              </div>
            </div>
          </div>

          {/* Élèves */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">2.4 Élèves</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Ajouter des élèves</h4>
                <p className="text-gray-700 mb-4">
                  Les élèves constituent la base de votre classe. Vous pouvez les ajouter 
                  individuellement ou par import en masse.
                </p>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                    <span>Accédez au menu "Élèves" depuis la barre de navigation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                    <span>Sélectionnez la classe concernée</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                    <span>Cliquez sur "Ajouter des Élèves"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                    <span>Remplissez les informations de l'élève</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</span>
                    <span>Validez l'ajout de l'élève</span>
                  </li>
                </ol>
              </div>
              <div className="flex justify-center">
                <img 
                  src="/docs/ajouter-eleves.png" 
                  alt="Ajouter des Élèves" 
                  className="rounded-lg shadow-md max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick('/docs/ajouter-eleves.png')}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Gestion pédagogique */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">3. Gestion pédagogique</h2>
          
          {/* Évaluations */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">3.1 Évaluations</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Créer et gérer les évaluations</h4>
                <p className="text-gray-700 mb-4">
                  Les évaluations sont les contrôles, devoirs et examens que vous organisez 
                  pour vos élèves. Elles permettent de mesurer les acquis.
                </p>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                    <span>Accédez au menu "Évaluations" depuis la barre de navigation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                    <span>Cliquez sur "Nouvelle Évaluation"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                    <span>Choisissez la classe et la matière concernées</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                    <span>Définissez le type d'évaluation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</span>
                    <span>Validez la création de l'évaluation</span>
                  </li>
                </ol>
              </div>
              <div className="flex justify-center">
                <img 
                  src="/docs/gestion-evaluations.png" 
                  alt="Gestion des Évaluations" 
                  className="rounded-lg shadow-md max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick('/docs/gestion-evaluations.png')}
                />
              </div>
            </div>
          </div>

          {/* Moyennes */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">3.2 Moyennes</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Enregistrer les notes et calculer les moyennes</h4>
            <p className="text-gray-700 mb-4">
              Saisissez les notes des élèves pour chaque évaluation. 
              Les moyennes sont calculées automatiquement en fonction des notes 
              saisies et des coefficients des évaluations.
            </p>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                <span>Accédez au menu "Moyennes" depuis la barre de navigation</span>
              </li>
              <li className="flex items-start">
                <span className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                <span>Sélectionnez la classe et la période souhaitées</span>
              </li>
              <li className="flex items-start">
                <span className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                <span>Saisissez les notes de chaque élève pour les évaluations</span>
              </li>
              <li className="flex items-start">
                <span className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                <span>Les moyennes sont calculées et mises à jour automatiquement</span>
              </li>
            </ol>
              </div>
              <div className="flex justify-center">
                <img 
                  src="/docs/moyennes.png" 
                  alt="Moyennes" 
                  className="rounded-lg shadow-md max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick('/docs/moyennes.png')}
                />
              </div>
            </div>
          </div>

          {/* Affichage des moyennes */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">3.3 Affichage des moyennes</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Visualiser et exporter les moyennes</h4>
                <p className="text-gray-700 mb-4">
                  L'affichage des moyennes vous permet de consulter les résultats 
                  de vos élèves et d'exporter les données.
                </p>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                    <span>Accédez au menu "Affichage des moyennes"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                    <span>Sélectionnez la classe et la période</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                    <span>Consultez le tableau des moyennes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                    <span>Utilisez les options d'exportation si nécessaire</span>
                  </li>
                </ol>
              </div>
              <div className="space-y-4">
                <img 
                  src="/docs/affichage-moyennes.png" 
                  alt="Affichage des Moyennes" 
                  className="rounded-lg shadow-md max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick('/docs/affichage-moyennes.png')}
                />
                <img 
                  src="/docs/exportation-evaluation.png" 
                  alt="Exportation EVALUATION"
                  className="rounded-lg shadow-md max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick('/docs/exportation-evaluation.png')}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Rapports */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">4. Rapports et analyses</h2>
          
          {/* Seuils de Classe */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">4.1 Seuils de Classe</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Configurer les seuils de réussite</h4>
                <p className="text-gray-700 mb-4">
                  Les seuils de classe permettent de définir les critères de réussite 
                  et d'échec pour chaque classe.
                </p>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                    <span>Accédez au menu "Seuils de Classe"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                    <span>Sélectionnez la classe concernée</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                    <span>Définissez le seuil de réussite (ex: 10/20)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                    <span>Configurez les seuils par matière si nécessaire</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">5</span>
                    <span>Sauvegardez la configuration</span>
                  </li>
                </ol>
              </div>
              <div className="flex justify-center">
                <img 
                  src="/docs/gestion-seuils-classe.png" 
                  alt="Gestion des Seuils de Classe" 
                  className="rounded-lg shadow-md max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick('/docs/gestion-seuils-classe.png')}
                />
              </div>
            </div>
          </div>

          {/* Bilan Annuel */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">4.2 Bilan Annuel</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Générer le bilan annuel</h4>
                <p className="text-gray-700 mb-4">
                  Le bilan annuel fournit une vue d'ensemble des performances 
                  de vos élèves sur toute l'année scolaire.
                </p>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="bg-cyan-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                    <span>Accédez au menu "Bilan Annuel"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-cyan-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                    <span>Sélectionnez l'année scolaire et la classe</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-cyan-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                    <span>Consultez les statistiques et analyses</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-cyan-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                    <span>Exportez le bilan en Word (.docx)</span>
                  </li>
                </ol>
              </div>
              <div className="space-y-4">
                <img 
                  src="/docs/bilan-annuel.png" 
                  alt="Bilan Annuel" 
                  className="rounded-lg shadow-md max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick('/docs/bilan-annuel.png')}
                />
                <img 
                  src="/docs/exportation-bilan-annuel.png" 
                  alt="Exportation BILAN ANNUEL"
                  className="rounded-lg shadow-md max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick('/docs/exportation-bilan-annuel.png')}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section Conclusion */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
            <h2 className="text-3xl font-bold mb-6">Félicitations !</h2>
            <p className="text-xl mb-6">
              Vous maîtrisez maintenant toutes les fonctionnalités de ScolarFlow. 
              Cette application vous accompagne dans la gestion complète de vos évaluations scolaires.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Organisation</h3>
                <p className="text-blue-100">Structurez vos données pédagogiques efficacement</p>
              </div>
              <div className="text-center">
                <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Suivi</h3>
                <p className="text-blue-100">Suivez les progrès de vos élèves en temps réel</p>
              </div>
              <div className="text-center">
                <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H8zm2 0a1 1 0 100 2h.01a1 1 0 100-2H10zm2 0a1 1 0 100 2h.01a1 1 0 100-2H12z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Rapports</h3>
                <p className="text-blue-100">Générez des rapports détaillés et professionnels</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-600">
            Pour toute question ou assistance, n'hésitez pas à nous contacter.
          </p>
          <div className="mt-4">
            <Link 
              to="/contact" 
              className="inline-flex items-center px-6 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Logo et description */}
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center space-x-3 mb-4 bg-white rounded-2xl px-6 py-4 shadow-lg border border-gray-100 w-fit">
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
                  <h3 className="text-xl font-bold text-gray-900">ScolarFlow</h3>
                  <p className="text-xs text-blue-600 font-medium italic">Gestion Scolaire</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4 max-w-md text-sm">
                La plateforme moderne pour la gestion et l'analyse des évaluations scolaires.
              </p>
            </div>

            {/* Liens rapides */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Liens rapides</h4>
              <ul className="space-y-3">
                <li>
                  <Link 
                    to="/" 
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Accueil
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/login" 
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Connexion
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/register" 
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Inscription
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/contact" 
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Ressources</h4>
              <ul className="space-y-3">
                <li>
                  <Link 
                    to="/documentation" 
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/tarif" 
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Tarifs
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Ligne de séparation */}
          <div className="border-t border-gray-800 mt-8 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2025 ScolarFlow. Tous droits réservés.
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold text-sm">Ingénieur Développeur d'Application</div>
                    <div className="text-gray-400 text-xs">Mickael Ange ANDJUI</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal pour agrandir les images */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={closeModal}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-4xl font-bold z-10"
            >
              ×
            </button>
            <img 
              src={selectedImage} 
              alt="Image agrandie" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
