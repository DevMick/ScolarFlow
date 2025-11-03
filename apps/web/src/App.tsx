import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { SimpleLayout } from './components/layout/SimpleLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
import { SpecialUserRoute } from './components/auth/SpecialUserRoute';
import { AdminUserRoute } from './components/auth/AdminUserRoute';
import { useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ContactPage } from './pages/ContactPage';
import { TarifPage } from './pages/TarifPage';
import { PaymentPage } from './pages/PaymentPage';
import PaymentHistory from './components/PaymentHistory';
import { DocumentationPage } from './pages/DocumentationPage';
import { DashboardPage } from './pages/DashboardPage';
import { SchoolYearsPage } from './pages/SchoolYearsPage';
import { ClassesPage } from './pages/ClassesPage';
import { StudentsPage } from './pages/StudentsPage';
import { StudentsOverviewPage } from './pages/StudentsOverviewPage';
import SubjectsPage from './pages/SubjectsPage';
import NotesPage from './pages/NotesPage';
import MoyennesPage from './pages/MoyennesPage';
import BilanAnnuelPage from './pages/BilanAnnuelPage';
import EvaluationsPage from './pages/EvaluationsPage';
import ClassThresholdsPage from './pages/ClassThresholdsPage';
import { AdminPaymentsPage } from './pages/AdminPaymentsPage';

// Composant pour déterminer le layout selon l'utilisateur
function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Utilisateur spécial qui ne doit voir que la page de paiement (mais pas l'admin)
  const isSpecialUser = user?.email === 'mickael.andjui.21@gmail.com' && user?.role !== 'admin';
  
  if (isSpecialUser) {
    return <SimpleLayout>{children}</SimpleLayout>;
  }
  
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Pages publiques */}
        <Route path="/" element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        } />
        <Route path="/login" element={
          <PublicRoute restricted>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute restricted>
            <RegisterPage />
          </PublicRoute>
        } />
        <Route path="/contact" element={
          <PublicRoute>
            <ContactPage />
          </PublicRoute>
        } />
        <Route path="/tarif" element={
          <PublicRoute>
            <TarifPage />
          </PublicRoute>
        } />
        <Route path="/payment" element={
          <ProtectedRoute>
            <LayoutWrapper>
              <PaymentPage />
            </LayoutWrapper>
          </ProtectedRoute>
        } />
        <Route path="/payment-history" element={
          <ProtectedRoute>
            <LayoutWrapper>
              <PaymentHistory />
            </LayoutWrapper>
          </ProtectedRoute>
        } />
        <Route path="/documentation" element={
          <PublicRoute>
            <DocumentationPage />
          </PublicRoute>
        } />
        
        {/* Pages protégées avec layout */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/school-years" element={
          <ProtectedRoute>
            <Layout>
              <SchoolYearsPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/classes" element={
          <ProtectedRoute>
            <Layout>
              <ClassesPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/students" element={
          <ProtectedRoute>
            <Layout>
              <StudentsOverviewPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/students/:classId" element={
          <ProtectedRoute>
            <Layout>
              <StudentsPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/subjects" element={
          <ProtectedRoute>
            <Layout>
              <SubjectsPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/notes" element={
          <ProtectedRoute>
            <Layout>
              <NotesPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/moyennes" element={
          <ProtectedRoute>
            <Layout>
              <MoyennesPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/bilan-annuel" element={
          <ProtectedRoute>
            <Layout>
              <BilanAnnuelPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/evaluations" element={
          <ProtectedRoute>
            <Layout>
              <EvaluationsPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/class-thresholds" element={
          <ProtectedRoute>
            <Layout>
              <ClassThresholdsPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/payments" element={
          <AdminUserRoute>
            <AdminLayout>
              <AdminPaymentsPage />
            </AdminLayout>
          </AdminUserRoute>
        } />
        
        {/* Route de redirection pour l'utilisateur spécial */}
        <Route path="*" element={<SpecialUserRedirect />} />
      </Routes>
    </Router>
  );
}

// Composant de redirection pour l'utilisateur spécial
function SpecialUserRedirect() {
  const { user, isAuthenticated } = useAuth();
  
  console.log('🔐 SPECIAL REDIRECT - User:', user);
  console.log('🔐 SPECIAL REDIRECT - IsAuthenticated:', isAuthenticated);
  
  if (!isAuthenticated) {
    console.log('🔐 SPECIAL REDIRECT - Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Si c'est l'utilisateur admin, rediriger vers la page d'administration des paiements
  if (user?.email === 'mickael.andjui.21@gmail.com') {
    console.log('🔐 SPECIAL REDIRECT - Admin user detected, redirecting to admin payments');
    return <Navigate to="/admin/payments" replace />;
  }
  
  // Sinon, rediriger vers le dashboard
  console.log('🔐 SPECIAL REDIRECT - Regular user, redirecting to dashboard');
  return <Navigate to="/dashboard" replace />;
}

export default App;