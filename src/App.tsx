import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { usePageTitle } from './hooks/usePageTitle';
import ErrorBoundary from './components/ErrorBoundary';

// Critical path — loaded eagerly
import Feed from './pages/Feed';
import Onboarding from './pages/Onboarding';

// Lazy-loaded routes — code split by route
const MapView         = lazy(() => import('./pages/MapView'));
const PartnerDashboard= lazy(() => import('./pages/PartnerDashboard'));
const Venues          = lazy(() => import('./pages/Venues'));
const Auth            = lazy(() => import('./pages/Auth'));
const EventDetail     = lazy(() => import('./components/EventDetail'));
const Tourist         = lazy(() => import('./pages/Tourist'));
const Profile         = lazy(() => import('./pages/Profile'));
const Communities     = lazy(() => import('./pages/Communities'));
const NotFound        = lazy(() => import('./pages/NotFound'));
const ResetPassword   = lazy(() => import('./pages/ResetPassword'));
const VenueDetail     = lazy(() => import('./pages/VenueDetail'));
const Search          = lazy(() => import('./pages/Search'));
const Agenda          = lazy(() => import('./pages/Agenda'));

function RouteLoader() {
  return <div className="loading loading-page">Carregando...</div>;
}
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { api } from './services/api';
import type { EventOut } from './services/api';
import './App.css';

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const path = location.pathname;

  const items = user ? [
    { icon: '🏠', label: 'Início',       to: '/' },
    { icon: '📅', label: 'Agenda',       to: '/agenda' },
    { icon: '🗺️', label: 'Mapa',        to: '/mapa' },
    { icon: '🤝', label: 'Comunidades',  to: '/comunidades' },
    { icon: '👤', label: user.name.split(' ')[0], to: '/perfil' },
  ] : [
    { icon: '🏠', label: 'Início',  to: '/' },
    { icon: '📅', label: 'Agenda',  to: '/agenda' },
    { icon: '🗺️', label: 'Mapa',   to: '/mapa' },
    { icon: '✈️', label: 'Turista', to: '/turista' },
    { icon: '💼', label: 'Parceiro', to: '/parceiro' },
  ];

  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {items.map(item => (
        <button
          key={item.to}
          className={`bnav-item${path === item.to ? ' active' : ''}`}
          onClick={() => navigate(item.to)}
          aria-label={item.label}
          aria-current={path === item.to ? 'page' : undefined}
        >
          <span className="bnav-icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

interface SidebarProps {
  onAuthOpen: () => void;
}

function Sidebar({ onAuthOpen }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const path = location.pathname;

  const items = [
    { icon: '🏠', label: 'Início',       to: '/' },
    { icon: '🔍', label: 'Busca',        to: '/busca' },
    { icon: '📅', label: 'Agenda',       to: '/agenda' },
    { icon: '🍸', label: 'Locais',       to: '/locais' },
    { icon: '🗺️', label: 'Mapa',        to: '/mapa' },
    { icon: '✈️', label: 'Turista',      to: '/turista' },
    { icon: '🤝', label: 'Comunidades',  to: '/comunidades' },
    { icon: '💼', label: 'Parceiros',    to: '/parceiro' },
    ...(user ? [{ icon: '👤', label: user.name.split(' ')[0], to: '/perfil' }] : []),
  ];

  return (
    <aside className="sidebar" aria-label="Navegação lateral">
      <div className="sidebar-brand" onClick={() => navigate('/')}>
        Bora <span>Floripa</span>
      </div>
      <nav className="sidebar-nav">
        {items.map(item => (
          <button
            key={item.to}
            className={`sidebar-item${path === item.to ? ' active' : ''}`}
            onClick={() => navigate(item.to)}
            aria-current={path === item.to ? 'page' : undefined}
          >
            <span className="sidebar-item-icon" aria-hidden="true">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        {user ? (
          <button className="sidebar-user" onClick={logout}>
            <span>👤</span>
            <span className="sidebar-user-name">{user.name.split(' ')[0]}</span>
            <span className="sidebar-user-out">Sair</span>
          </button>
        ) : (

          <button className="btn-primary sidebar-login" onClick={onAuthOpen}>
            Entrar 2
          </button>

        )}
        <div className="sidebar-city">📍 Floripa</div>
      </div>
    </aside>
  );
}

interface LayoutProps {
  children: React.ReactNode;
  onAuthOpen: () => void;
}

function Layout({ children, onAuthOpen }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <header className="topbar">
        <div className="topbar-brand">Bora <span>Floripa</span></div>
        <div className="topbar-actions">
          <button
            className="topbar-search-btn"
            onClick={() => navigate('/busca')}
            aria-label="Buscar"
            title="Buscar"
          >🔍</button>
          {user ? (
            <button className="topbar-user" onClick={logout} title="Sair">
              👤 {user.name.split(' ')[0]}
            </button>
          ) : (
            <button className="topbar-city" onClick={onAuthOpen}>
              Entrar
            </button>
          )}
          <div className="topbar-city">📍 Floripa</div>
        </div>
      </header>
      <div className="app-layout">
        <Sidebar onAuthOpen={onAuthOpen} />
        <main className="main-content" id="main">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
      <BottomNav />
      <BackToTopBtn />
    </>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function BackToTopBtn() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    function onScroll() { setVisible(window.scrollY > 400); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      className="back-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Voltar ao topo"
    >↑</button>
  );
}

function EventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventOut | null>(null);
  const [notFound, setNotFound] = useState(false);
  usePageTitle(event ? `${event.title} — ${event.venue.name}` : null);

  useEffect(() => {
    const sessionId = localStorage.getItem('bf_session_id') || '';
    api.get(`/events/${id}`, { params: sessionId ? { session_id: sessionId } : {} })
      .then(r => setEvent(r.data))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <NotFound />;
  if (!event) return <div className="loading loading-page">Carregando...</div>;

  return (
    <EventDetail
      event={event}
      onClose={() => navigate('/')}
      boraCount={0}
      boraReacted={false}
      onBora={() => {}}
    />
  );
}

function AppInner() {
  const [onboarded, setOnboarded] = useState(() => !!localStorage.getItem('bf_onboarded'));
  const [showAuth, setShowAuth] = useState(false);
  const [onboardPrefs, setOnboardPrefs] = useState<{ music: string[]; vibes: string[] } | null>(null);

  function handleOnboardComplete(prefs?: { music: string[]; vibes: string[] }) {
    localStorage.setItem('bf_onboarded', '1');
    setOnboarded(true);
    if (prefs) {
      setOnboardPrefs(prefs);
      setShowAuth(true);
    }
  }

  if (!onboarded) {
    return <Onboarding onComplete={handleOnboardComplete} />;
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout onAuthOpen={() => setShowAuth(true)}>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/locais" element={<Venues />} />
            <Route path="/mapa" element={<MapView />} />
            <Route path="/parceiro" element={<PartnerDashboard onAuthOpen={() => setShowAuth(true)} />} />
            <Route path="/turista" element={<Tourist />} />
            <Route path="/comunidades" element={<Communities onAuthOpen={() => setShowAuth(true)} />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/evento/:id" element={<EventPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/venue/:id" element={<VenueDetail />} />
            <Route path="/busca" element={<Search />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
      {showAuth && (
        <Suspense fallback={null}>
          <Auth
            onClose={() => { setShowAuth(false); setOnboardPrefs(null); }}
            initialTab={onboardPrefs ? 'register' : 'login'}
            prefMusic={onboardPrefs?.music ? JSON.stringify(onboardPrefs.music) : null}
            prefVibes={onboardPrefs?.vibes ? JSON.stringify(onboardPrefs.vibes) : null}
          />
        </Suspense>
      )}
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ErrorBoundary>
          <AppInner />
        </ErrorBoundary>
      </ToastProvider>
    </AuthProvider>
  );
}
