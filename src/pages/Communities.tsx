import { usePageTitle } from '../hooks/usePageTitle';
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const TAG_EMOJI: Record<string, string> = {
  'Funk': '🎤', 'Eletrônico': '🎧', 'Pagode': '🥁', 'Sertanejo': '🤠',
  'Rock': '🎸', 'MPB': '🎵', 'Reggae': '🌿',
  'Rooftop': '🌆', 'Pet Friendly': '🐾', 'Happy Hour': '🥂',
  'Chopp Artesanal': '🍻', 'Comer e Beber': '🍔', 'TV com Esportes': '⚽',
};

interface Community {
  id: number;
  name: string;
  tag_name: string;
  description?: string;
  member_count: number;
  is_member: boolean;
  discount_code?: string;
}

interface CommunitiesProps {
  onAuthOpen: () => void;
}

interface CouponItem {
  id: number;
  code: string;
  description: string;
  discount_pct: number;
  used_count: number;
  max_uses: number;
}

export default function Communities({ onAuthOpen }: CommunitiesProps) {
  usePageTitle('Comunidades');
  const { user } = useAuth();
  const toast = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [communityCoupons, setCommunityCoupons] = useState<Record<number, CouponItem[]>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    api.get('/communities')
      .then(r => setCommunities(r.data))
      .catch(() => setCommunities([]))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleJoin(id: number) {
    if (!user) { onAuthOpen?.(); return; }
    setJoining(id);
    try {
      const { data } = await api.post(`/communities/${id}/join`);
      setCommunities(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      const community = communities.find(c => c.id === id);
      toast?.show(`Bem-vindo(a) ao ${community?.name}! 🎉`, 'success');
    } catch { /* join failed — UI stays unchanged */ }
    setJoining(null);
  }

  function copyCode(code: string, id: number) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
      toast?.show(`Código ${code} copiado! 📋`, 'success');
    });
  }

  const myCommunities = communities.filter(c => c.is_member);
  const others = communities.filter(c => !c.is_member);

  // Fetch coupons for communities the user is member of
  useEffect(() => {
    if (!user || myCommunities.length === 0) return;
    myCommunities.forEach(c => {
      api.get(`/coupons/community/${c.id}`)
        .then(r => setCommunityCoupons(prev => ({ ...prev, [c.id]: r.data })))
        .catch(() => {});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, myCommunities.length]);

  return (
    <div className="communities-page">
      <div className="communities-header">
        <div className="section-title">Comunidades</div>
        <p className="communities-sub">
          Junte-se a grupos por estilo e ganhe descontos exclusivos 🎁
        </p>
      </div>

      {loading ? (
        <div className="community-list">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-card skeleton-community" aria-hidden="true">
              <div className="skeleton-cover skeleton-community-icon" />
              <div className="skeleton-body">
                <div className="skeleton-line w-70" />
                <div className="skeleton-line w-55" />
                <div className="skeleton-line w-45" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {myCommunities.length > 0 && (
            <>
              <div className="communities-section-label">Você faz parte</div>
              <div className="community-list">
                {myCommunities.map(c => (
                  <React.Fragment key={c.id}>
                  <CommunityCard
                    community={c}
                    joining={joining === c.id}
                    copied={copied === c.id}
                    onJoin={handleJoin}
                    onCopy={copyCode}
                  />
                  {communityCoupons[c.id]?.length > 0 && (
                    <div className="community-coupons">
                      <div className="community-coupons-title">🎟️ Cupons exclusivos</div>
                      {communityCoupons[c.id].map(cp => (
                        <div key={cp.id} className="community-coupon-row">
                          <div className="community-coupon-info">
                            <span className="community-coupon-code">{cp.code}</span>
                            <span className="community-coupon-desc">{cp.description}</span>
                          </div>
                          <div className="community-coupon-right">
                            <span className="community-coupon-pct">-{cp.discount_pct}%</span>
                            <button
                              className="community-coupon-copy"
                              onClick={() => { navigator.clipboard.writeText(cp.code); toast?.show(`Código ${cp.code} copiado! 🎟️`, 'success'); }}
                            >Copiar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  </React.Fragment>
                ))}
              </div>
            </>
          )}

          {others.length > 0 && (
            <>
              <div className="communities-section-label communities-section-label-mt">
                {myCommunities.length > 0 ? 'Outras comunidades' : 'Todas as comunidades'}
              </div>
              <div className="community-list">
                {others.map(c => (
                  <CommunityCard
                    key={c.id}
                    community={c}
                    joining={joining === c.id}
                    copied={copied === c.id}
                    onJoin={handleJoin}
                    onCopy={copyCode}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

const MEMBER_MILESTONES = [10, 50, 100, 500, 1000];
function memberProgress(count: number) {
  const next = MEMBER_MILESTONES.find(m => m > count) || count * 2;
  const prev = MEMBER_MILESTONES.slice().reverse().find(m => m <= count) || 0;
  return { pct: Math.min(100, Math.round(((count - prev) / (next - prev)) * 100)), next };
}

interface CommunityCardProps {
  community: Community;
  joining: boolean;
  copied: boolean;
  onJoin: (id: number) => void;
  onCopy: (code: string, id: number) => void;
}

function CommunityCard({ community: c, joining, copied, onJoin, onCopy }: CommunityCardProps) {
  const { pct, next } = memberProgress(c.member_count || 0);
  return (
    <div className={`community-card${c.is_member ? ' member' : ''}`}>
      <div className="community-card-icon">{TAG_EMOJI[c.tag_name] || '🎭'}</div>
      <div className="community-card-body">
        <div className="community-card-name">{c.name}</div>
        {c.description && <div className="community-card-desc">{c.description}</div>}
        <div className="community-progress">
          <div className="community-progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <div className="community-card-meta">
          <span className="community-members">👥 {c.member_count} membros</span>
          <span className="community-next">próx. marco: {next}</span>
          {c.is_member && c.discount_code && (
            <button
              className={`community-code${copied ? ' copied' : ''}`}
              onClick={() => onCopy(c.discount_code!, c.id)}
              aria-label="Copiar código de desconto"
            >
              {copied ? '✓ Copiado!' : `🎁 ${c.discount_code}`}
            </button>
          )}
        </div>
      </div>
      <button
        className={`community-join-btn${c.is_member ? ' joined' : ''}`}
        onClick={() => !c.is_member && onJoin(c.id)}
        disabled={joining || c.is_member}
        aria-label={c.is_member ? 'Já é membro' : `Entrar em ${c.name}`}
      >
        {joining ? '...' : c.is_member ? '✓' : 'Entrar'}
      </button>
    </div>
  );
}
