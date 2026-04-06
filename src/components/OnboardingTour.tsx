import React, { useState, useEffect } from 'react';
import type { UserOut } from '../services/api';

const TOUR_KEY = 'bf_tour_done';

interface Step {
  title: string;
  body: string;
  // data-tour attribute no elemento alvo (opcional — sem target = modal centrado)
  target?: string;
  position?: 'top' | 'bottom' | 'center';
}

const USER_STEPS: Step[] = [
  {
    title: 'Bem-vindo ao Bora Floripa!',
    body: 'Aqui você descobre os melhores rolês de Floripa — bares, baladas, shows e muito mais. Tudo personalizado para o seu estilo.',
    position: 'center',
  },
  {
    title: 'Feed personalizado',
    body: 'O feed mostra eventos do seu estilo musical e bairro favorito. Use os filtros de bairro e categoria para afinar ainda mais.',
    target: 'feed-filter',
    position: 'bottom',
  },
  {
    title: 'Bora! e Seguir locais',
    body: 'Clique em "Bora lá!" para mostrar que vai. Siga seus bares favoritos e receba notificação quando tiver evento novo.',
    position: 'center',
  },
  {
    title: 'Agenda e Mapa',
    body: 'Na Agenda veja os próximos 7 dias de uma vez. No Mapa, descubra onde está rolando agora com os Hot Zones em tempo real.',
    position: 'center',
  },
  {
    title: 'Comunidades',
    body: 'Entre nas comunidades do seu estilo musical e acesse cupons exclusivos de desconto nos parceiros. Só para membros!',
    position: 'center',
  },
];

const PARTNER_STEPS: Step[] = [
  {
    title: 'Bem-vindo, parceiro!',
    body: 'Aqui você gerencia seu estabelecimento no Bora Floripa — publique eventos, acompanhe métricas e fidelize sua galera.',
    position: 'center',
  },
  {
    title: 'Vincule seu local',
    body: 'Na aba Locais, clique em "+ Vincular" para buscar e associar seu estabelecimento ao seu perfil de parceiro.',
    position: 'center',
  },
  {
    title: 'Publique eventos',
    body: 'Na aba Eventos, crie rolês com título, data, descrição, preço e foto de capa. Eventos recorrentes (semanais, mensais) são configurados com um clique.',
    position: 'center',
  },
  {
    title: 'Acompanhe Analytics',
    body: 'Na aba Analytics veja views, reações "Bora!" e check-ins de cada evento. Dados reais para decisões certeiras.',
    position: 'center',
  },
  {
    title: 'Crie cupons exclusivos',
    body: 'Na aba Cupons, crie códigos de desconto vinculados a uma comunidade. Só membros daquela comunidade verão e usarão o cupom.',
    position: 'center',
  },
];

interface OnboardingTourProps {
  user: UserOut;
}

export default function OnboardingTour({ user }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      // Pequeno delay para o app terminar de renderizar
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const isPartner = user.role === 'partner' || user.role === 'admin';
  const steps = isPartner ? PARTNER_STEPS : USER_STEPS;
  const current = steps[step];

  function next() {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      finish();
    }
  }

  function finish() {
    localStorage.setItem(TOUR_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-label="Tutorial de uso">
      <div className="tour-card">
        <div className="tour-step-indicator">
          {steps.map((_, i) => (
            <div key={i} className={`tour-dot${i === step ? ' active' : i < step ? ' done' : ''}`} />
          ))}
        </div>

        <div className="tour-icon">
          {isPartner
            ? ['🏪', '🔗', '📢', '📊', '🎟️'][step] || '✨'
            : ['👋', '🎯', '🚀', '🗺️', '🤝'][step] || '✨'
          }
        </div>

        <h2 className="tour-title">{current.title}</h2>
        <p className="tour-body">{current.body}</p>

        <div className="tour-actions">
          <button className="btn-ghost tour-skip" onClick={finish}>
            Pular tutorial
          </button>
          <button className="btn-primary tour-next" onClick={next}>
            {step < steps.length - 1 ? 'Próximo →' : 'Entendido! 🎉'}
          </button>
        </div>
      </div>
    </div>
  );
}
