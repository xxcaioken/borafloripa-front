import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EventCard from './EventCard';
import type { EventOut, VenueOut } from '../services/api';

const mockVenue: VenueOut = {
  id: 1, owner_id: null, name: 'Bar do Zé', city: 'Florianópolis',
  lat: -27.59, lng: -48.54, address: 'Rua Conselheiro Mafra, 100',
  instagram: '@bardoze', whatsapp: null, hours: null,
  category: 'bar', is_new: false, logo_url: null, photo_url: null,
  pet_friendly: false, wheelchair: false, hearing_loop: false,
  visual_aid: false, adapted_wc: false, parking: false, checkin_count: 0,
};

function makeEvent(overrides: Partial<EventOut> = {}): EventOut {
  return {
    id: 1, title: 'Noite de Samba', description: 'Uma noite incrível',
    date: '2026-06-15T21:00:00', vibe_status: 'Normal',
    is_featured: false, category: 'bar', is_temporary: false,
    organizers: null, cover_url: null, price_info: null,
    view_count: 42, recurrence: null, venue: mockVenue, tags: [],
    ...overrides,
  };
}

describe('EventCard', () => {
  it('renders event title and venue name', () => {
    render(<EventCard event={makeEvent()} />);
    expect(screen.getByText('Noite de Samba')).toBeInTheDocument();
    expect(screen.getByText(/Bar do Zé/)).toBeInTheDocument();
  });

  it('shows vibe status', () => {
    render(<EventCard event={makeEvent({ vibe_status: 'Quente 🔥' })} />);
    expect(screen.getByText('Quente 🔥')).toBeInTheDocument();
  });

  it('shows price_info when provided', () => {
    render(<EventCard event={makeEvent({ price_info: 'Entrada: R$25' })} />);
    expect(screen.getByText(/R\$25/)).toBeInTheDocument();
  });

  it('hides price section when price_info is null', () => {
    render(<EventCard event={makeEvent({ price_info: null })} />);
    expect(screen.queryByText(/Entrada:/)).not.toBeInTheDocument();
  });

  it('shows "Destaque" badge when is_featured is true', () => {
    render(<EventCard event={makeEvent({ is_featured: true })} />);
    expect(screen.getByText(/Destaque/)).toBeInTheDocument();
  });

  it('shows "Especial" badge when is_temporary is true', () => {
    render(<EventCard event={makeEvent({ is_temporary: true })} />);
    expect(screen.getByText(/Especial/)).toBeInTheDocument();
  });

  it('shows "Semanal" recurrence badge', () => {
    render(<EventCard event={makeEvent({ recurrence: 'weekly' })} />);
    expect(screen.getByText(/Semanal/)).toBeInTheDocument();
  });

  it('shows "Mensal" recurrence badge', () => {
    render(<EventCard event={makeEvent({ recurrence: 'monthly' })} />);
    expect(screen.getByText(/Mensal/)).toBeInTheDocument();
  });

  it('calls onBora when Bora! button is clicked', () => {
    const onBora = vi.fn();
    render(<EventCard event={makeEvent()} onBora={onBora} />);
    fireEvent.click(screen.getByRole('button', { name: /Confirmar presença/i }));
    expect(onBora).toHaveBeenCalledWith(1);
  });

  it('shows "Tô dentro!" when already reacted', () => {
    render(<EventCard event={makeEvent()} boraReacted={true} />);
    expect(screen.getByText(/Tô dentro!/)).toBeInTheDocument();
  });

  it('shows bora count when > 0', () => {
    render(<EventCard event={makeEvent()} boraCount={7} />);
    expect(screen.getByText(/7 pessoas vão/)).toBeInTheDocument();
  });

  it('does not show bookmark button when onSave is not provided', () => {
    render(<EventCard event={makeEvent()} />);
    expect(screen.queryByLabelText(/Salvar evento/)).not.toBeInTheDocument();
  });

  it('shows bookmark button when onSave is provided', () => {
    render(<EventCard event={makeEvent()} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Salvar evento')).toBeInTheDocument();
  });

  it('shows "Pet OK" accessibility badge when pet_friendly', () => {
    render(<EventCard event={makeEvent({ venue: { ...mockVenue, pet_friendly: true } })} />);
    expect(screen.getByText(/Pet OK/)).toBeInTheDocument();
  });

  it('is keyboard accessible via Enter key', () => {
    const onClick = vi.fn();
    render(<EventCard event={makeEvent()} onClick={onClick} />);
    const card = screen.getByRole('button', { name: /Noite de Samba em Bar do Zé/ });
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();
  });
});
