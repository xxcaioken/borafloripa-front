import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { id: 'bar', label: 'Bar' },
  { id: 'balada', label: 'Balada' },
  { id: 'cultura', label: 'Cultura' },
  { id: 'rua', label: 'Rolê na Rua' },
];

const VIBES = ['Normal', 'Animado', 'Lotado', 'Quente 🔥'];

function EventForm({ venues, tags, onSave, onCancel, initial }) {
  const [form, setForm] = useState(initial || {
    venue_id: venues[0]?.id || '',
    title: '',
    description: '',
    date: '',
    vibe_status: 'Normal',
    category: 'bar',
    is_temporary: false,
    organizers: '',
    price_info: '',
    tag_ids: [],
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function toggleTag(id) {
    set('tag_ids', form.tag_ids.includes(id)
      ? form.tag_ids.filter(t => t !== id)
      : [...form.tag_ids, id]);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.title || !form.date || !form.venue_id) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
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
        <input
          value={form.price_info || ''}
          onChange={e => set('price_info', e.target.value)}
          placeholder="Ex: Entrada: R$25 / Open bar: R$60"
        />
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
              <button
                key={t.id}
                type="button"
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

function ClaimVenueModal({ onClaim, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      setLoading(true);
      api.get(`/events/venues?q=${encodeURIComponent(query)}`)
        .then(r => setResults(r.data.slice(0, 10)))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-body">
          <div className="modal-title" style={{ fontSize: 20, marginBottom: 6 }}>Vincular meu local</div>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>
            Busque o nome do seu estabelecimento na base de dados do Bora Floripa.
          </p>
          <div className="search-bar" style={{ marginBottom: 16 }}>
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Digite o nome do local..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          {loading && <div style={{ textAlign: 'center', padding: 12, color: 'var(--muted)', fontSize: 14 }}>Buscando...</div>}
          <div className="venue-list">
            {results.map(v => (
              <div key={v.id} className="venue-row" style={{ cursor: 'pointer' }} onClick={() => onClaim(v)}>
                <div className="venue-row-info">
                  <div className="venue-row-name">{v.name}</div>
                  {v.address && <div className="venue-row-addr">{v.address}</div>}
                </div>
                <span className="btn-primary" style={{ fontSize: 13, padding: '4px 12px', flexShrink: 0 }}>Vincular</span>
              </div>
            ))}
          </div>
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="empty-state" style={{ padding: '24px 0' }}><p>Nenhum local encontrado com esse nome</p></div>
          )}
          {query.length < 2 && (
            <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '24px 0' }}>
              Digite pelo menos 2 letras para buscar
            </div>
          )}
        </div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
    </div>
  );
}

export default function PartnerDashboard({ onAuthOpen }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [showClaim, setShowClaim] = useState(false);

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      api.get('/partners/stats'),
      api.get('/partners/events'),
      api.get('/events/tags'),
      api.get('/partners/analytics'),
    ])
      .then(([s, e, t, a]) => {
        setStats(s.data);
        setEvents(e.data);
        setTags(t.data.map((name, i) => ({ id: i + 1, name })));
        setAnalytics(a.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Fetch real tag objects with IDs
  useEffect(() => {
    api.get('/events/tags-full').then(r => setTags(r.data)).catch(() => {});
  }, []);

  if (!user) {
    return (
      <div className="empty-state" style={{ paddingTop: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
        <h2 style={{ marginBottom: 8 }}>Área do Parceiro</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
          Cadastre seu estabelecimento, publique eventos e apareça no feed do Bora Floripa.
        </p>
        <button className="btn-primary" onClick={onAuthOpen}>Entrar / Cadastrar</button>
      </div>
    );
  }

  if (loading) return <div className="loading">Carregando dashboard...</div>;

  const venues = stats?.venues || [];

  async function handleSaveEvent(form) {
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

  async function handleDelete(eventId) {
    if (!window.confirm('Remover este evento?')) return;
    await api.delete(`/partners/events/${eventId}`);
    load();
  }

  async function handleClaim(venue) {
    await api.post(`/partners/claim-venue/${venue.id}`);
    setShowClaim(false);
    load();
  }

  const analyticsMap = Object.fromEntries(analytics.map(a => [a.event_id, a]));
  const initials = user.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div>
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-avatar">{initials}</div>
        <div>
          <h2>{user.name}</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{stats?.total_events ?? 0}</div>
          <div className="stat-label">Eventos publicados</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.featured_events ?? 0}</div>
          <div className="stat-label">Em destaque</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{venues.length}</div>
          <div className="stat-label">Locais vinculados</div>
        </div>
      </div>

      {/* Venues section */}
      <div className="section-header" style={{ marginTop: 24 }}>
        <div className="section-title">Meus Locais</div>
        <button className="section-link" style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--accent)' }} onClick={() => setShowClaim(true)}>
          + Vincular local
        </button>
      </div>

      {venues.length === 0 ? (
        <div className="empty-state" style={{ padding: '20px 0' }}>
          <p>Nenhum local vinculado ainda.</p>
          <button className="btn-secondary" style={{ marginTop: 12 }} onClick={() => setShowClaim(true)}>
            Buscar meu estabelecimento
          </button>
        </div>
      ) : (
        <div className="venue-list" style={{ marginBottom: 24 }}>
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

      {/* Events section */}
      <div className="section-header">
        <div className="section-title">Meus Eventos</div>
        {venues.length > 0 && !showForm && (
          <button className="btn-primary" style={{ fontSize: 13, padding: '6px 14px' }} onClick={() => { setEditEvent(null); setShowForm(true); }}>
            + Novo evento
          </button>
        )}
      </div>

      {(showForm || editEvent) && (
        <EventForm
          venues={venues}
          tags={tags}
          initial={editEvent ? {
            venue_id: editEvent.venue_id,
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
              <div className="pev-vibe">{event.vibe_status}</div>
              {analyticsMap[event.id] && (
                <div className="pev-analytics">
                  <span>👁 {analyticsMap[event.id].view_count}</span>
                  <span>🚀 {analyticsMap[event.id].bora_count}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {event.is_featured && <span className="badge-featured-sm">Destaque</span>}
              <button className="btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }}
                onClick={() => { setEditEvent(event); setShowForm(false); }}>
                Editar
              </button>
              <button style={{ fontSize: 12, padding: '4px 10px', background: 'none', border: '1px solid #c0392b', color: '#c0392b', borderRadius: 8, cursor: 'pointer' }}
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
