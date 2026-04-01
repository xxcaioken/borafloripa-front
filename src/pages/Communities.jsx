import { usePageTitle } from '../hooks/usePageTitle';
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const TAG_EMOJI = {
  'Funk': '🎤', 'Eletrônico': '🎧', 'Pagode': '🥁', 'Sertanejo': '🤠',
  'Rock': '🎸', 'MPB': '🎵', 'Reggae': '🌿',
  'Rooftop': '🌆', 'Pet Friendly': '🐾', 'Happy Hour': '🥂',
  'Chopp Artesanal': '🍻', 'Comer e Beber': '🍔', 'TV com Esportes': '⚽',
};

export default function Communities({ onAuthOpen }) {
  usePageTitle('Comunidades');
  const { user } = useAuth();
  const toast = useToast();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/communities')
      .then(r => setCommunities(r.data))
      .catch(() => setCommunities([]))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleJoin(id) {
    if (!user) { onAuthOpen?.(); return; }
    setJoining(id);
    try {
      const { data } = await api.post(`/communities/${id}/join`);
      setCommunities(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      const community = communities.find(c => c.id === id);
      toast?.show(`Bem-vindo(a) ao ${community?.name}! 🎉`, 'success');
    } catch {}
    setJoining(null);
  }

  function copyCode(code, id) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
      toast?.show(`Código ${code} copiado! 📋`, 'success');
    });
  }

  const myCommunities = communities.filter(c => c.is_member);
  const others = communities.filter(c => !c.is_member);

  return (
    <div className="communities-page">
      <div className="communities-header">
        <div className="section-title">Comunidades</div>
        <p className="communities-sub">
          Junte-se a grupos por estilo e ganhe descontos exclusivos 🎁
        </p>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <>
          {myCommunities.length > 0 && (
            <>
              <div className="communities-section-label">Você faz parte</div>
              <div className="community-list">
                {myCommunities.map(c => (
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

function CommunityCard({ community: c, joining, copied, onJoin, onCopy }) {
  return (
    <div className={`community-card${c.is_member ? ' member' : ''}`}>
      <div className="community-card-icon">{TAG_EMOJI[c.tag_name] || '🎭'}</div>
      <div className="community-card-body">
        <div className="community-card-name">{c.name}</div>
        {c.description && <div className="community-card-desc">{c.description}</div>}
        <div className="community-card-meta">
          <span className="community-members">👥 {c.member_count} membros</span>
          {c.is_member && c.discount_code && (
            <button
              className={`community-code${copied ? ' copied' : ''}`}
              onClick={() => onCopy(c.discount_code, c.id)}
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
