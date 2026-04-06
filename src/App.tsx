import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useNotifications } from './hooks/useNotifications';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { usePageTitle } from './hooks/usePageTitle';
import ErrorBoundary from './components/ErrorBoundary';

// Critical path — loaded eagerly
import Feed from './pages/Feed';

// Lazy-loaded routes — code split by route
const MapView         = lazy(() => import('./pages/MapView'));
const PartnerDashboard= lazy(() => import('./pages/PartnerDashboard'));
const Venues          = lazy(() => import('./pages/Venues'));
const Auth            = lazy(() => import('./pages/Auth'));
const OnboardingTour  = lazy(() => import('./components/OnboardingTour'));
const EventDetail     = lazy(() => import('./components/EventDetail'));
const Tourist         = lazy(() => import('./pages/Tourist'));
const Profile         = lazy(() => import('./pages/Profile'));
const Communities     = lazy(() => import('./pages/Communities'));
const NotFound        = lazy(() => import('./pages/NotFound'));
const ResetPassword   = lazy(() => import('./pages/ResetPassword'));
const VenueDetail     = lazy(() => import('./pages/VenueDetail'));
const Search          = lazy(() => import('./pages/Search'));
const Agenda          = lazy(() => import('./pages/Agenda'));
const Onboarding      = lazy(() => import('./pages/Onboarding'));

function RouteLoader() {
  return <div className="loading loading-page">Carregando...</div>;
}
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { api } from './services/api';
import type { EventOut } from './services/api';
import { MantineProvider, createTheme } from '@mantine/core';
import {
  IconHome, IconCalendar, IconMap2, IconUsers, IconUser,
  IconSearch, IconBriefcase, IconPlane, IconBellRinging,
  IconLogout, IconMapPin,
} from '@tabler/icons-react';
import './App.css';

const mantineTheme = createTheme({
  primaryColor: 'teal',
  fontFamily: 'DM Sans, sans-serif',
});

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const path = location.pathname;

  const items = user ? [
    { icon: <IconHome size={22} />,     label: 'Início',      to: '/' },
    { icon: <IconCalendar size={22} />, label: 'Agenda',      to: '/agenda' },
    { icon: <IconMap2 size={22} />,     label: 'Mapa',        to: '/mapa' },
    { icon: <IconUsers size={22} />,    label: 'Comunidades', to: '/comunidades' },
    { icon: <IconUser size={22} />,     label: user.name.split(' ')[0], to: '/perfil' },
  ] : [
    { icon: <IconHome size={22} />,       label: 'Início',  to: '/' },
    { icon: <IconCalendar size={22} />,   label: 'Agenda',  to: '/agenda' },
    { icon: <IconMap2 size={22} />,       label: 'Mapa',    to: '/mapa' },
    { icon: <IconPlane size={22} />,      label: 'Turista', to: '/turista' },
    { icon: <IconBriefcase size={22} />,  label: 'Parceiro', to: '/parceiro' },
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
    { icon: <IconHome size={18} />,       label: 'Início',       to: '/' },
    { icon: <IconSearch size={18} />,     label: 'Busca',        to: '/busca' },
    { icon: <IconCalendar size={18} />,   label: 'Agenda',       to: '/agenda' },
    { icon: <IconMapPin size={18} />,     label: 'Locais',       to: '/locais' },
    { icon: <IconMap2 size={18} />,       label: 'Mapa',         to: '/mapa' },
    { icon: <IconPlane size={18} />,      label: 'Turista',      to: '/turista' },
    { icon: <IconUsers size={18} />,      label: 'Comunidades',  to: '/comunidades' },
    { icon: <IconBriefcase size={18} />,  label: 'Parceiros',    to: '/parceiro' },
    ...(user ? [{ icon: <IconUser size={18} />, label: user.name.split(' ')[0], to: '/perfil' }] : []),
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
            <IconLogout size={16} />
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
  const { unread, items, fetchAll, markAllRead } = useNotifications(!!user);
  const { show: showInstall, install, dismiss: dismissInstall } = useInstallPrompt();
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Close bell dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    if (bellOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  function handleBellClick() {
    if (!bellOpen) { fetchAll(); markAllRead(); }
    setBellOpen(o => !o);
  }

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
          ><IconSearch size={18} /></button>
          {user && (
            <div className="bell-wrap" ref={bellRef}>
              <button
                className="topbar-bell-btn"
                onClick={handleBellClick}
                aria-label="Notificações"
                title="Notificações"
              >
                <IconBellRinging size={18} />
                {unread > 0 && (
                  <span className="bell-badge">{unread > 9 ? '9+' : unread}</span>
                )}
              </button>
              {bellOpen && (
                <div className="bell-dropdown" role="dialog" aria-label="Notificações">
                  <div className="bell-dropdown-header">
                    <span>Notificações</span>
                    <button className="bell-read-all" onClick={markAllRead}>Marcar lidas</button>
                  </div>
                  {items.length === 0 ? (
                    <div className="bell-empty">Nenhuma notificação</div>
                  ) : (
                    <div className="bell-list">
                      {items.map(n => (
                        <button
                          key={n.id}
                          className={`bell-item${n.read ? '' : ' unread'}`}
                          onClick={() => { setBellOpen(false); if (n.url) navigate(n.url); }}
                        >
                          <div className="bell-item-title">{n.title}</div>
                          <div className="bell-item-body">{n.body}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
          {showInstall && (
            <div className="pwa-install-banner">
              <span>📲 Adicionar Bora Floripa à tela inicial</span>
              <div className="pwa-install-actions">
                <button className="pwa-install-btn" onClick={install}>Instalar</button>
                <button className="pwa-dismiss-btn" onClick={dismissInstall}>✕</button>
              </div>
            </div>
          )}
        </main>
      </div>
      <BottomNav />
      <BackToTopBtn />
      {user && (
        <Suspense fallback={null}>
          <OnboardingTour user={user} />
        </Suspense>
      )}
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

  // Inject og meta tags for social sharing
  useEffect(() => {
    if (!event) return;
    const url = window.location.href;
    const desc = event.description
      ? event.description.slice(0, 160)
      : `${event.title} em ${event.venue.name} — ${new Date(event.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`;

    const metas: Record<string, string> = {
      'og:title': `${event.title} — Bora Floripa`,
      'og:description': desc,
      'og:url': url,
      'og:type': 'event',
      'og:site_name': 'Bora Floripa',
      ...(event.cover_url ? { 'og:image': event.cover_url } : {}),
      'twitter:card': 'summary_large_image',
      'twitter:title': `${event.title} — Bora Floripa`,
      'twitter:description': desc,
    };

    const inserted: HTMLMetaElement[] = [];
    for (const [prop, content] of Object.entries(metas)) {
      let el = document.querySelector<HTMLMetaElement>(`meta[property="${prop}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', prop);
        document.head.appendChild(el);
        inserted.push(el);
      }
      el.setAttribute('content', content);
    }

    return () => {
      inserted.forEach(el => el.remove());
    };
  }, [event]);

  if (notFound) return <NotFound />;
  if (!event) return <div className="loading loading-page">Carregando...</div>;

  return (
    <EventDetail
      event={event}
      onClose={() => navigate(-1)}
      boraCount={0}
      boraReacted={false}
      onBora={() => {}}
    />
  );
}

function AppInner() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout onAuthOpen={() => setShowAuth(true)}>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/onboarding" element={<Onboarding />} />
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
            onClose={() => setShowAuth(false)}
            initialTab="login"
          />
        </Suspense>
      )}
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <MantineProvider theme={mantineTheme} defaultColorScheme="dark">
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <AppInner />
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </MantineProvider>
  );
}
