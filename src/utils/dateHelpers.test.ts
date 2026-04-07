import { describe, it, expect } from 'vitest';
import { groupByDate, formatDateLabel, addDays, toDateKey } from './dateHelpers';
import type { EventOut } from '../services/api';

// Minimal EventOut stubs — only 'date' matters for these utils
function makeEvent(id: number, date: string): EventOut {
  return {
    id, date, title: `Event ${id}`, description: null,
    vibe_status: 'Normal', is_featured: false, category: 'bar',
    is_temporary: false, organizers: null, cover_url: null,
    price_info: null, view_count: 0, recurrence: null,
    tags: [],
    venue: {
      id: 1, owner_id: null, name: 'Venue', city: 'Florianópolis',
      lat: -27.59, lng: -48.54, address: null, instagram: null,
      whatsapp: null, hours: null, category: 'bar', is_new: false,
      logo_url: null, photo_url: null, pet_friendly: false,
      wheelchair: false, hearing_loop: false, visual_aid: false,
      adapted_wc: false, parking: false, checkin_count: 0,
    },
  };
}

describe('groupByDate', () => {
  it('groups events that share the same calendar date', () => {
    const events = [
      makeEvent(1, '2026-06-15T20:00:00'),
      makeEvent(2, '2026-06-15T23:00:00'),
      makeEvent(3, '2026-06-16T21:00:00'),
    ];
    const grouped = groupByDate(events);
    expect(grouped).toHaveLength(2);
    expect(grouped[0][0]).toBe('2026-06-15');
    expect(grouped[0][1]).toHaveLength(2);
    expect(grouped[1][0]).toBe('2026-06-16');
    expect(grouped[1][1]).toHaveLength(1);
  });

  it('preserves insertion order', () => {
    const events = [
      makeEvent(1, '2026-06-17T20:00:00'),
      makeEvent(2, '2026-06-15T20:00:00'),
    ];
    const grouped = groupByDate(events);
    expect(grouped[0][0]).toBe('2026-06-17');
    expect(grouped[1][0]).toBe('2026-06-15');
  });

  it('returns empty array for empty input', () => {
    expect(groupByDate([])).toEqual([]);
  });
});

// Build a YYYY-MM-DD key using LOCAL time (same logic as formatDateLabel's comparison)
function localDateKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

describe('formatDateLabel', () => {
  it('returns "Hoje" for today\'s date key', () => {
    expect(formatDateLabel(localDateKey(new Date()))).toBe('📅 Hoje');
  });

  it('returns "Amanhã" for tomorrow\'s date key', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(formatDateLabel(localDateKey(tomorrow))).toBe('📅 Amanhã');
  });

  it('returns a formatted date string for other dates', () => {
    const label = formatDateLabel('2026-06-15');
    expect(label).toMatch(/^📅 /);
    // Should contain day-of-week and month in pt-BR
    expect(label.toLowerCase()).toMatch(/segunda|terça|quarta|quinta|sexta|sábado|domingo/);
  });
});

describe('addDays', () => {
  it('adds positive days correctly', () => {
    const base = new Date('2026-06-01');
    const result = addDays(base, 5);
    expect(result.toISOString().slice(0, 10)).toBe('2026-06-06');
  });

  it('crosses month boundary', () => {
    const base = new Date('2026-06-29');
    const result = addDays(base, 3);
    expect(result.toISOString().slice(0, 10)).toBe('2026-07-02');
  });

  it('does not mutate the original date', () => {
    const base = new Date('2026-06-01');
    addDays(base, 10);
    expect(base.toISOString().slice(0, 10)).toBe('2026-06-01');
  });
});

describe('toDateKey', () => {
  it('returns yyyy-mm-dd format', () => {
    const d = new Date('2026-06-15T21:00:00Z');
    expect(toDateKey(d)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
