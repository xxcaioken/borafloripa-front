import { usePageTitle } from '../hooks/usePageTitle';
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import type { VenueOut, TagOut, EventOut } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { id: 'bar', label: 'Bar' }, { id: 'balada', label: 'Balada' },
  { id: 'cultura', label: 'Cultura' }, { id: 'rua', label: 'Rolê na Rua' },
];
const VIBES = ['Normal', 'Animado', 'Lotado', 'Quente 🔥'];

interface EventFormData {
  venue_id: number | string;
  title: string;
  description: string;
  date: string;
  vibe_status: string;
  category: string;
  is_temporary: boolean;
  organizers: string;
  price_info: string;
  tag_ids: number[];
}

interface EventFormProps {
  venues: VenueOut[];
  tags: TagOut[];
  onSave: (form: EventFormData) => Promise<void>;
  onCancel: () => void;
  initial: EventFormData | null;
}

function EventForm({ venues, tags, onSave, onCancel, initial }: EventFormProps) {
  const [form, setForm] = useState<EventFormData>(initial || {
    venue_id: venues[0]?.id || '',
    title: '', description: '', date: '',
    vibe_status: 'Normal', category: 'bar',
    is_temporary: false, organizers: '', price_info: '', tag_ids: [],
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof EventFormData>(k: K, v: EventFormData[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function toggleTag(id: number) {
    set('tag_ids', form.tag_ids.includes(id)
      ? form.tag_ids.filter(t => t !== id)
      : [...form.tag_ids, id]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.date || !form.venue_id) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }

  return (
    <form className="event-form" onSubmit={submit}>
      <div className="form-group">
        <label>Local</label>
        <select value={form.venue_id} onChange={e => set('venue_id', Number(e.target.value))} required>
          {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Título do evento</label>
        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Noite de Samba" required />
      </div>
      <div className="form-group">
        <label>Descrição</label>
        <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={3} placeholder="Conta o que vai rolar..." />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Data e hora</label>
          <input type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Categoria</label>
          <select value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Vibe</label>
          <select value={form.vibe_status} onChange={e => set('vibe_status', e.target.value)}>
            {VIBES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Organizador (opcional)</label>
          <input value={form.organizers || ''} onChange={e => set('organizers', e.target.value)} placeholder="Nome do DJ, banda..." />
        </div>
      </div>
      <div className="form-group">
        <label>Entrada / Preço (opcional)</label>
        <input value={form.price_info || ''} onChange={e => set('price_info', e.target.value)} placeholder="Ex: Entrada: R$25 / Open bar: R$60" />
      </div>
      <div className="form-check">
        <input type="checkbox" id="is_temp" checked={form.is_temporary} onChange={e => set('is_temporary', e.target.checked)} />
        <label htmlFor="is_temp">Evento especial / temporário</label>
      </div>
      {tags.length > 0 && (
        <div className="form-group">
          <label>Tags</label>
          <div className="tag-picker">
            {tags.map(t => (
              <button key={t.id} type="button"
                className={`tag-chip${form.tag_ids.includes(t.id) ? ' selected' : ''}`}
                onClick={() => toggleTag(t.id)}
              >{t.name}</button>
            ))}
          </div>
        </div>
      )}
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Salvando...' : initial ? 'Salvar alterações' : 'Publicar evento'}
        </button>
      </div>
    </form>
  );
}

interface ClaimVenueModalProps {
  onClaim: (venue: VenueOut) => void;
  onClose: () => void;
}

function ClaimVenueModal({ onClaim, onClose }: ClaimVenueModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VenueOut[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      setSearching(true);
      api.get(`/events/venues?q=${encodeURIComponent(query)}`)
        .then(r => setResults(r.data.slice(0, 10)))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-body">
          <div className="claim-modal-title">Vincular meu local</div>
          <p className="claim-modal-desc">
            Busque o nome do seu estabelecimento na base de dados do Bora Floripa.
          </p>
          <div className="search-bar claim-search">
            <div className="search-input-wrap">
              <span className="search-icon" aria-hidden="true">🔍</span>
              <input
                className="search-input"
                placeholder="Digite o nome do local..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
                aria-label="Buscar local"
              />
            </div>
          </div>
          {searching && <div className="claim-searching">Buscando...</div>}
          {!searching && results.length > 0 && (
            <div className="venue-list">
              {results.map(v => (
                <div key={v.id} className="venue-row venue-row-clickable" onClick={() => onClaim(v)}>
                  <div className="venue-row-info">
                    <div className="venue-row-name">{v.name}</div>
                    {v.address && <div className="venue-row-addr">{v.address}</div>}
                  </div>
                  <span className="btn-claim">Vincular</span>
                </div>
              ))}
            </div>
          )}
          {!searching && query.length >= 2 && results.length === 0 && (
            <div className="empty-state claim-empty"><p>Nenhum local encontrado</p></div>
          )}
          {query.length < 2 && (
            <div className="claim-hint">Digite pelo menos 2 letras para buscar</div>
          )}
        </div>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
      </div>
    </div>
  );
}

interface PartnerStats {
  total_events: number;
  featured_events: number;
  venues: VenueOut[];
}

interface AnalyticsItem {
  event_id: number;
  title: string;
  date: string;
  view_count: number;
  bora_count: number;
}

function AnalyticsChart({ analytics, mode }: { analytics: AnalyticsItem[]; mode: 'views' | 'boras' }) {
  const sorted = [...analytics]
    .sort((a, b) => (mode === 'views' ? b.view_count - a.view_count : b.bora_count - a.bora_count))
    .slice(0, 8);
  const max = sorted.reduce((m, a) => Math.max(m, mode === 'views' ? a.view_count : a.bora_count), 1);

  if (sorted.length === 0) {
    return (
      <div className="analytics-chart">
        <div className="analytics-chart-empty">Sem dados para exibir</div>
      </div>
    );
  }

  return (
    <div className="analytics-chart">
      <div className="analytics-chart-title">
        {mode === 'views' ? '👁 Views por evento' : '🚀 Boras por evento'}
      </div>
      <div className="analytics-bar-list">
        {sorted.map(a => {
          const val = mode === 'views' ? a.view_count : a.bora_count;
          const pct = Math.round((val / max) * 100);
          const shortTitle = a.title.length > 18 ? a.title.slice(0, 17) + '…' : a.title;
          return (
            <div key={a.event_id} className="analytics-bar-row">
              <div className="analytics-bar-label" title={a.title}>{shortTitle}</div>
              <div className="analytics-bar-track">
                <div
                  className={`analytics-bar-fill ${mode === 'views' ? 'views' : 'boras'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="analytics-bar-val">{val}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PartnerDashboardProps {
  onAuthOpen: () => void;
}

export default function PartnerDashboard({ onAuthOpen }: PartnerDashboardProps) {
  usePageTitle('Área do Parceiro');
  const { user } = useAuth();
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [events, setEvents] = useState<EventOut[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsItem[]>([]);
  const [analyticsDays, setAnalyticsDays] = useState<number | null>(null); // null=all, 7, 30
  const [chartMode, setChartMode] = useState<'views' | 'boras'>('views');
  const [tags, setTags] = useState<TagOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<EventOut | null>(null);
  const [showClaim, setShowClaim] = useState(false);

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      api.get('/partners/stats'),
      api.get('/partners/events'),
      api.get('/partners/analytics', { params: analyticsDays ? { days: analyticsDays } : {} }),
    ])
      .then(([s, e, a]) => {
        setStats(s.data);
        setEvents(e.data);
        setAnalytics(a.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, analyticsDays]);

  useEffect(() => {
    if (!user || loading) return;
    setLoadingAnalytics(true);
    api.get('/partners/analytics', { params: analyticsDays ? { days: analyticsDays } : {} })
      .then(r => setAnalytics(r.data))
      .catch(() => {})
      .finally(() => setLoadingAnalytics(false));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyticsDays]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get('/events/tags-full').then(r => setTags(r.data)).catch(() => {});
  }, []);

  if (!user) {
    return (
      <div className="partner-unauthenticated">
        <div className="partner-unauthenticated-icon">🏪</div>
        <h2>Área do Parceiro</h2>
        <p>Cadastre seu estabelecimento, publique eventos e apareça no feed do Bora Floripa.</p>
        <button className="btn-primary" onClick={onAuthOpen}>Entrar / Cadastrar</button>
      </div>
    );
  }

  if (loading) return <div className="loading">Carregando dashboard...</div>;

  const venues = stats?.venues || [];

  async function handleSaveEvent(form: EventFormData) {
    const payload = { ...form, date: new Date(form.date).toISOString() };
    if (editEvent) {
      await api.put(`/partners/events/${editEvent.id}`, payload);
    } else {
      await api.post('/partners/events', payload);
    }
    setShowForm(false);
    setEditEvent(null);
    load();
  }

  async function handleDelete(eventId: number) {
    if (!window.confirm('Remover este evento?')) return;
    await api.delete(`/partners/events/${eventId}`);
    load();
  }

  async function handleToggleFeature(eventId: number) {
    try {
      const { data } = await api.patch(`/partners/events/${eventId}/feature`);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, is_featured: data.is_featured } : e));
    } catch { /* UI update only — ignore network errors */ }
  }

  async function handleClaim(venue: VenueOut) {
    await api.post(`/partners/claim-venue/${venue.id}`);
    setShowClaim(false);
    load();
  }

  const analyticsMap = Object.fromEntries(analytics.map(a => [a.event_id, a]));
  const totalViews = analytics.reduce((s, a) => s + (a.view_count || 0), 0);
  const totalBoras = analytics.reduce((s, a) => s + (a.bora_count || 0), 0);
  const initials = user.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div>
      <div className="dashboard-header">
        <div className="dashboard-avatar">{initials}</div>
        <div>
          <h2>{user.name}</h2>
          <p className="dashboard-email">{user.email}</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{stats?.total_events ?? 0}</div>
          <div className="stat-label">Eventos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.featured_events ?? 0}</div>
          <div className="stat-label">Destaques</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{venues.length}</div>
          <div className="stat-label">Locais</div>
        </div>
      </div>
      <div className="analytics-period-row">
        {[null, 7, 30].map(d => (
          <button
            key={String(d)}
            className={`sort-chip${analyticsDays === d ? ' active' : ''}`}
            onClick={() => setAnalyticsDays(d)}
          >{d ? `${d}d` : 'Total'}</button>
        ))}
        {loadingAnalytics && <span className="analytics-loading">…</span>}
      </div>
      <div className="stats-row stats-row-mt">
        <div className="stat-card stat-card-accent">
          <div className="stat-value">👁 {totalViews}</div>
          <div className="stat-label">Visualizações</div>
        </div>
        <div className="stat-card stat-card-secondary">
          <div className="stat-value">🚀 {totalBoras}</div>
          <div className="stat-label">Boras{analyticsDays ? ` (${analyticsDays}d)` : ''}</div>
        </div>
      </div>

      {analytics.length > 0 && (
        <>
          <div className="analytics-period-row" style={{ marginTop: 12 }}>
            {(['views', 'boras'] as const).map(m => (
              <button
                key={m}
                className={`sort-chip${chartMode === m ? ' active' : ''}`}
                onClick={() => setChartMode(m)}
              >{m === 'views' ? '👁 Views' : '🚀 Boras'}</button>
            ))}
          </div>
          <AnalyticsChart analytics={analytics} mode={chartMode} />
        </>
      )}

      <div className="section-header section-mt">
        <div className="section-title">Meus Locais</div>
        <button className="btn-link-accent" onClick={() => setShowClaim(true)}>+ Vincular local</button>
      </div>

      {venues.length === 0 ? (
        <div className="empty-state empty-sm">
          <p>Nenhum local vinculado ainda.</p>
          <button className="btn-secondary mt-sm" onClick={() => setShowClaim(true)}>
            Buscar meu estabelecimento
          </button>
        </div>
      ) : (
        <div className="venue-list venue-list-mb">
          {venues.map(v => (
            <div key={v.id} className="venue-row">
              <div className="venue-row-info">
                <div className="venue-row-name">{v.name}</div>
                {v.address && v.address !== 'Florianópolis, SC' && (
                  <div className="venue-row-addr">{v.address.replace(', Florianópolis', '').replace(', SC', '')}</div>
                )}
                <div className="venue-row-meta">
                  {v.instagram && <span className="venue-row-ig">{v.instagram}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section-header">
        <div className="section-title">Meus Eventos</div>
        {venues.length > 0 && !showForm && (
          <button className="btn-primary btn-primary-sm" onClick={() => { setEditEvent(null); setShowForm(true); }}>
            + Novo evento
          </button>
        )}
      </div>

      {(showForm || editEvent) && (
        <EventForm
          venues={venues}
          tags={tags}
          initial={editEvent ? {
            venue_id: editEvent.venue.id,
            title: editEvent.title,
            description: editEvent.description || '',
            date: editEvent.date?.slice(0, 16) || '',
            vibe_status: editEvent.vibe_status,
            category: editEvent.category,
            is_temporary: editEvent.is_temporary,
            organizers: editEvent.organizers || '',
            price_info: editEvent.price_info || '',
            tag_ids: editEvent.tags?.map(t => t.id) || [],
          } : null}
          onSave={handleSaveEvent}
          onCancel={() => { setShowForm(false); setEditEvent(null); }}
        />
      )}

      <div className="partner-events-list">
        {events.map(event => (
          <div key={event.id} className="partner-event-row">
            <div className="pev-info">
              <div className="pev-title">{event.title}</div>
              <div className="pev-meta">
                {event.venue.name} · {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
              <select
                className="pev-vibe-select"
                value={event.vibe_status}
                onChange={async e => {
                  const newVibe = e.target.value;
                  try {
                    await api.patch(`/partners/events/${event.id}/vibe`, { vibe_status: newVibe });
                    setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, vibe_status: newVibe } : ev));
                  } catch { /* UI update only — ignore network errors */ }
                }}
                aria-label="Vibe do evento"
              >
                {['Normal', 'Animado', 'Lotado', 'Quente 🔥'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              {analyticsMap[event.id] && (
                <div className="pev-analytics">
                  <span>👁 {analyticsMap[event.id].view_count}</span>
                  <span>🚀 {analyticsMap[event.id].bora_count}</span>
                </div>
              )}
            </div>
            <div className="pev-actions">
              <button
                className={`pev-feature-btn${event.is_featured ? ' active' : ''}`}
                onClick={() => handleToggleFeature(event.id)}
                title={event.is_featured ? 'Remover destaque' : 'Destacar evento'}
              >
                {event.is_featured ? '★' : '☆'}
              </button>
              <button className="btn-secondary btn-secondary-xs"
                onClick={() => { setEditEvent(event); setShowForm(false); }}>
                Editar
              </button>
              <button className="btn-danger"
                onClick={() => handleDelete(event.id)}>
                Remover
              </button>
            </div>
          </div>
        ))}
        {events.length === 0 && !showForm && (
          <div className="empty-state">
            <p>{venues.length > 0 ? 'Nenhum evento publicado ainda.' : 'Vincule um local para começar a criar eventos.'}</p>
          </div>
        )}
      </div>

      {showClaim && <ClaimVenueModal onClaim={handleClaim} onClose={() => setShowClaim(false)} />}
    </div>
  );
}
