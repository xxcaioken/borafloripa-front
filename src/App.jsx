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
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import './App.css';

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const path = location.pathname;

  const items = [
    { icon: '🏠', label: 'Início',   to: '/' },
    { icon: '🍸', label: 'Locais',   to: '/locais' },
    { icon: '🗺️', label: 'Mapa',    to: '/mapa' },
    { icon: '✈️', label: 'Turista',  to: '/turista' },
    { icon: user ? '👤' : '💼', label: user ? user.name.split(' ')[0] : 'Parceiro', to: '/parceiro' },
  ];

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <button
          key={item.to}
          className={`bnav-item${path === item.to ? ' active' : ''}`}
          onClick={() => navigate(item.to)}
        >
          <span className="bnav-icon">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function Layout({ children, onAuthOpen }) {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="topbar">
        <div className="topbar-brand">Bora <span>Floripa</span></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
      <main className="main-content">{children}</main>
      <BottomNav />
    </>
  );
}

function EventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    api.get(`/events/${id}`).then(r => setEvent(r.data)).catch(() => navigate('/'));
  }, [id]);

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
      <AppInner />
    </AuthProvider>
  );
}
