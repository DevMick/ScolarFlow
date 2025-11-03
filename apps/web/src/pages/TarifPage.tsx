import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LandingHeader } from '../components/layout/LandingHeader';
import { Footer } from '../components/layout/Footer';
import { Button, Card, Typography, Badge } from 'antd';
import { 
  CheckCircleOutlined, 
  StarOutlined, 
  ClockCircleOutlined,
  UserOutlined,
  BookOutlined,
  BarChartOutlined,
  SafetyOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export function TarifPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'starter',
      name: 'Formule Démarrage',
      price: 'Gratuit',
      period: '14 jours',
      description: 'Parfait pour : Découvrir et explorer toutes les fonctionnalités de ScolarFlow',
      badge: 'Nouveaux comptes uniquement',
      badgeColor: 'green',
      popular: false,
      features: [
        'Gestion d\'une classe',
        'Nombre d\'élèves illimité',
        '4 évaluations par année scolaire',
        'Gestion des matières',
        'Exportation Word des compositions',
        'Exportation du bilan annuel de la classe',
        'Statistiques de classe'
      ],
      limitations: [],
      buttonText: 'Commencer l\'essai',
      buttonType: 'default' as const,
      icon: <ClockCircleOutlined className="text-2xl" />
    },
    {
      id: 'single',
      name: 'Formule 1 Classe',
      price: '3 000',
      currency: 'FCFA',
      period: 'par an',
      description: 'Recommandée si : Vous êtes satisfait de la plateforme et souhaitez continuer',
      badge: 'Économique',
      badgeColor: 'blue',
      popular: true,
      features: [
        'Gestion d\'une classe',
        'Nombre d\'élèves illimité',
        '4 évaluations par année scolaire',
        'Gestion des matières',
        'Exportation Word des compositions',
        'Exportation du bilan annuel de la classe',
        'Statistiques de classe',
        'Mises à jour incluses'
      ],
      limitations: [],
      buttonText: 'Choisir ce plan',
      buttonType: 'primary' as const,
      icon: <UserOutlined className="text-2xl" />
    }
  ];

  const handleSelectPlan = (planId: string) => {
    console.log('Plan sélectionné:', planId);
    setSelectedPlan(planId);
    
    if (planId === 'starter') {
      // Rediriger vers la page d'inscription pour l'essai gratuit
      console.log('Redirection vers /register');
      window.location.href = '/register';
    } else if (planId === 'single') {
      // Rediriger vers la page de connexion, puis vers le paiement
      // Stocker l'intention de paiement dans le localStorage
      console.log('Redirection vers /login avec intention de paiement');
      localStorage.setItem('redirectAfterLogin', '/payment');
      window.location.href = '/login';
    } else {
      console.log('Plan non reconnu:', planId);
    }
  };

  const benefits = [
    {
      icon: <BarChartOutlined className="text-3xl text-blue-600" />,
      title: 'Statistiques Avancées',
      description: 'Analysez les performances de vos élèves avec des graphiques détaillés'
    },
    {
      icon: <SafetyOutlined className="text-3xl text-green-600" />,
      title: 'Sécurité Garantie',
      description: 'Vos données sont protégées avec les plus hauts standards de sécurité'
    },
    {
      icon: <CustomerServiceOutlined className="text-3xl text-purple-600" />,
      title: 'Support Dédié',
      description: 'Notre équipe vous accompagne dans l\'utilisation de la plateforme'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Title level={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Tarifs ScolarFlow
          </Title>
          <Text className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto block">
            Choisissez la formule qui correspond à vos besoins. Tous nos tarifs sont annuels.
          </Text>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.popular 
                    ? 'ring-2 ring-blue-500 shadow-2xl' 
                    : 'shadow-lg hover:shadow-xl'
                } transition-all duration-300 border-0 h-full`}
                bodyStyle={{ padding: '24px' }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge 
                      count="Recommandée" 
                      style={{ 
                        backgroundColor: '#3b82f6',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    />
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                      {plan.icon}
                    </div>
                  </div>
                  
                  <Title level={3} className="mb-2 text-lg">{plan.name}</Title>
                  <Text className="text-gray-600 mb-4 block text-sm">{plan.description}</Text>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      {plan.currency && (
                        <span className="text-lg text-gray-600 ml-2">{plan.currency}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{plan.period}</div>
                  </div>
                  
                  {plan.badge && (
                    <Badge 
                      count={plan.badge} 
                      style={{ 
                        backgroundColor: plan.badgeColor === 'green' ? '#10b981' : 
                                        plan.badgeColor === 'blue' ? '#3b82f6' : '#8b5cf6',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    />
                  )}
                </div>

                <div className="mb-6 flex-grow">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircleOutlined className="text-green-500 mr-2 mt-0.5 flex-shrink-0 text-sm" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.limitations.length > 0 && (
                  <div className="mb-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Text className="text-xs text-yellow-800 font-medium block mb-2">Important :</Text>
                    <ul className="space-y-1">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="text-xs text-yellow-700">• {limitation}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  type={plan.buttonType}
                  size="large"
                  className="w-full h-10 text-base font-semibold"
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {plan.buttonText}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Title level={2} className="text-4xl font-bold text-gray-900 mb-6">
              Pourquoi choisir ScolarFlow ?
            </Title>
            <Text className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des fonctionnalités puissantes pour simplifier votre gestion scolaire et améliorer l'expérience d'enseignement
            </Text>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <Title level={4} className="text-xl font-semibold text-gray-900 mb-3">
                  {benefit.title}
                </Title>
                <Text className="text-gray-600">
                  {benefit.description}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Title level={2} className="text-4xl font-bold text-gray-900 mb-6">
              Questions fréquentes
            </Title>
            <Text className="text-xl text-gray-600">
              Tout ce que vous devez savoir sur nos formules
            </Text>
          </div>
          
          <div className="space-y-6">
            <Card className="shadow-sm">
              <Title level={4} className="text-lg font-semibold text-gray-900 mb-3">
                Puis-je changer de formule à tout moment ?
              </Title>
              <Text className="text-gray-600">
                Oui, vous pouvez passer d'une formule à l'autre selon vos besoins. 
                Les tarifs sont calculés au prorata.
              </Text>
            </Card>
            
            <Card className="shadow-sm">
              <Title level={4} className="text-lg font-semibold text-gray-900 mb-3">
                La formule de démarrage est-elle vraiment gratuite ?
              </Title>
              <Text className="text-gray-600">
                Absolument ! La formule de démarrage vous donne accès à toutes les fonctionnalités 
                pendant 14 jours, sans aucun coût. Elle est disponible uniquement pour les nouveaux comptes.
              </Text>
            </Card>
            
            <Card className="shadow-sm">
              <Title level={4} className="text-lg font-semibold text-gray-900 mb-3">
                Quelle formule me recommandez-vous ?
              </Title>
              <Text className="text-gray-600">
                <strong>Commencez par la Formule Démarrage</strong> pour explorer toutes les fonctionnalités gratuitement. 
                Si vous êtes satisfait après 14 jours, nous vous recommandons la <strong>Formule 1 Classe</strong> 
                qui offre la solution complète pour votre gestion scolaire au tarif économique de 3 000 FCFA par an.
              </Text>
            </Card>
            
            <Card className="shadow-sm">
              <Title level={4} className="text-lg font-semibold text-gray-900 mb-3">
                Que se passe-t-il après les 14 jours d'essai ?
              </Title>
              <Text className="text-gray-600">
                Après la période d'essai, vous devrez choisir une formule payante pour continuer 
                à utiliser ScolarFlow. Vos données seront conservées.
              </Text>
            </Card>
            
            <Card className="shadow-sm">
              <Title level={4} className="text-lg font-semibold text-gray-900 mb-3">
                Les tarifs incluent-ils les mises à jour ?
              </Title>
              <Text className="text-gray-600">
                Oui, toutes les mises à jour et nouvelles fonctionnalités sont incluses 
                dans votre abonnement annuel.
              </Text>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-5xl mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 text-white">
            <Title level={2} className="text-4xl font-bold mb-6 text-white">
              Prêt à commencer ?
            </Title>
            <Text className="text-2xl mb-8 opacity-95 block max-w-3xl mx-auto">
              Rejoignez des milliers d'enseignants qui font confiance à ScolarFlow pour simplifier leur gestion scolaire
            </Text>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center px-10 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-100 transition-all duration-300 text-lg shadow-lg hover:shadow-xl"
              >
                <StarOutlined className="mr-3 text-xl" />
                Commencer l'essai gratuit
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center px-10 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300 text-lg"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
