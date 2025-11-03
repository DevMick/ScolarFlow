import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TrialRestrictionWrapper } from '../common/TrialRestrictionWrapper';
import { TrialWarningBanner } from '../common/TrialWarningBanner';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <TrialRestrictionWrapper>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar pour desktop */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        {/* Layout principal */}
        <div className="lg:pl-64">
          {/* Header */}
          <Header onMenuClick={() => setSidebarOpen(true)} />
          
          {/* Banner d'avertissement pour les comptes gratuits */}
          <TrialWarningBanner />
          
          {/* Contenu principal */}
          <main className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TrialRestrictionWrapper>
  );
}
