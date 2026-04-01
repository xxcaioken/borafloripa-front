import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import Feed from './pages/Feed';
import MapView from './pages/MapView';
import PartnerDashboard from './pages/PartnerDashboard';
import Venues from './pages/Venues';
import Onboarding from './pages/Onboarding';
import Auth from './pages/Auth';
import EventDetail from './components/EventDetail';
import Tourist from './pages/Tourist';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import './App.css';

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const path = location.pathname;

  const items = [
    { icon: '🏠', label: 'Início',  to: '/' },
    { icon: '🍸', label: 'Locais',  to: '/locais' },
    { icon: '🗺️', label: 'Mapa',   to: '/mapa' },
    { icon: '✈️', label: 'Turista', to: '/turista' },
    { icon: user ? '👤' : '💼', label: user ? user.name.split(' ')[0] : 'Parceiro', to: '/parceiro' },
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

function Sidebar({ onAuthOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const path = location.pathname;

  const items = [
    { icon: '🏠', label: 'Início',    to: '/' },
    { icon: '🍸', label: 'Locais',    to: '/locais' },
    { icon: '🗺️', label: 'Mapa',     to: '/mapa' },
    { icon: '✈️', label: 'Turista',   to: '/turista' },
    { icon: '💼', label: 'Parceiros', to: '/parceiro' },
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
            Entrar
          </button>
        )}
        <div className="sidebar-city">📍 Floripa</div>
      </div>
    </aside>
  );
}

function Layout({ children, onAuthOpen }) {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="topbar">
        <div className="topbar-brand">Bora <span>Floripa</span></div>
        <div className="topbar-actions">
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
    </>
  );
}

function EventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then(r => setEvent(r.data))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <NotFound />;
  if (!event) return <div className="loading" style={{ padding: 40 }}>Carregando...</div>;

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
  const [onboardPrefs, setOnboardPrefs] = useState(null);

  function handleOnboardComplete(prefs) {
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
      <Layout onAuthOpen={() => setShowAuth(true)}>
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/locais" element={<Venues />} />
          <Route path="/mapa" element={<MapView />} />
          <Route path="/parceiro" element={<PartnerDashboard onAuthOpen={() => setShowAuth(true)} />} />
          <Route path="/turista" element={<Tourist />} />
          <Route path="/evento/:id" element={<EventPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      {showAuth && (
        <Auth
          onClose={() => { setShowAuth(false); setOnboardPrefs(null); }}
          initialTab={onboardPrefs ? 'register' : 'login'}
          prefMusic={onboardPrefs?.music ? JSON.stringify(onboardPrefs.music) : null}
          prefVibes={onboardPrefs?.vibes ? JSON.stringify(onboardPrefs.vibes) : null}
        />
      )}
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppInner />
      </ErrorBoundary>
    </AuthProvider>
  );
}
