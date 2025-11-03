import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChartBarIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  PencilIcon,
  CalculatorIcon,
  DocumentChartBarIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  CreditCardIcon,
  BanknotesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Années Scolaires', href: '/school-years', icon: CalendarDaysIcon },
  { name: 'Classes', href: '/classes', icon: AcademicCapIcon },
  { name: 'Matières', href: '/subjects', icon: BookOpenIcon },
  { name: 'Élèves', href: '/students', icon: UserGroupIcon },
  { name: 'Évaluations', href: '/evaluations', icon: ClipboardDocumentListIcon },
  { name: 'Moyennes', href: '/notes', icon: CalculatorIcon },
  { name: 'Affichage des moyennes', href: '/moyennes', icon: DocumentChartBarIcon },
  { name: 'Seuils de Classe', href: '/class-thresholds', icon: AdjustmentsHorizontalIcon },
  { name: 'Bilan Annuel', href: '/bilan-annuel', icon: ChartBarIcon },
  { name: 'Paiement', href: '/payment', icon: BanknotesIcon },
  { name: 'Historique Paiements', href: '/payment-history', icon: ClockIcon },
  { name: 'Administration Paiements', href: '/admin/payments', icon: CreditCardIcon },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user, isPaid, subscriptionEndDate } = useAuth() as any; // Extension du type AuthContextType
  
  // Déterminer si c'est l'admin (a toujours accès à tous les menus)
  const isAdmin = user?.email === 'mickael.andjui.21@gmail.com';
  // Les menus sont accessibles si : admin OU paiement validé
  const hasAccessToMenus = isAdmin || isPaid;
  
  // Désactiver le menu Paiement si un abonnement actif existe
  const hasActiveSubscription = isPaid && subscriptionEndDate && new Date(subscriptionEndDate) > new Date();

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
        <Link to="/" className="flex items-center space-x-3" onClick={onClose}>
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xs">SF</span>
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-left">
            <span className="text-lg font-bold text-gray-900">ScolarFlow</span>
            <p className="text-xs text-gray-500 font-medium -mt-0.5">Gestion Scolaire</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-6 py-6">
        <ul role="list" className="flex flex-1 flex-col gap-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            // Masquer "Administration Paiements" si ce n'est pas l'admin
            const isAdminMenu = item.href === '/admin/payments';
            if (isAdminMenu && !isAdmin) {
              return null;
            }
            
            // Menu de paiement : désactiver si un abonnement actif existe
            const isPaymentMenu = item.href === '/payment';
            const isPaymentDisabled = isPaymentMenu && hasActiveSubscription;
            // Menu historique paiements : toujours accessible
            const isHistoryMenu = item.href === '/payment-history';
            // Si le paiement n'est pas validé et que ce n'est pas l'admin, désactiver les menus sauf Dashboard, Paiement et Historique Paiements
            const isDisabled = (!hasAccessToMenus && item.href !== '/dashboard' && item.href !== '/payment' && item.href !== '/payment-history') || isPaymentDisabled;
            
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  onClick={(e) => {
                    if (isDisabled) {
                      e.preventDefault();
                      return;
                    }
                    onClose();
                  }}
                  className={clsx(
                    'group flex gap-x-3 rounded-md p-3 text-sm font-semibold leading-6 transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : isDisabled
                      ? 'text-gray-400 cursor-not-allowed opacity-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  )}
                  title={
                    isPaymentDisabled 
                      ? `Vous avez déjà un abonnement actif jusqu'au ${subscriptionEndDate ? new Date(subscriptionEndDate).toLocaleDateString('fr-FR') : ''}. Vous pourrez renouveler après cette date.`
                      : isDisabled 
                      ? 'Paiement requis pour accéder à ce menu' 
                      : undefined
                  }
                >
                  <item.icon
                    className={clsx(
                      'h-6 w-6 shrink-0',
                      isActive ? 'text-primary-600' : isDisabled ? 'text-gray-400' : 'text-gray-400 group-hover:text-primary-600'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Footer du sidebar */}
        <div className="mt-auto pt-6 border-t border-gray-200">
          <div className="flex items-center gap-x-3 p-3 text-sm text-gray-500 hover:bg-gray-50 rounded-md transition-colors cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-xs font-medium text-primary-600">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">Utilisateur</p>
              <p className="text-xs text-gray-500 truncate">Enseignant</p>
            </div>
            <svg
              className="h-4 w-4 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </nav>
    </div>
  );

  return (
    <>
      {/* Sidebar mobile */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={onClose}>
                      <span className="sr-only">Fermer le sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white">
                  <SidebarContent />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>
    </>
  );
}
