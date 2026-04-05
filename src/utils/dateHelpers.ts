import type { EventOut } from '../services/api';

export function groupByDate(events: EventOut[]): [string, EventOut[]][] {
  const map = new Map<string, EventOut[]>();
  for (const e of events) {
    const key = e.date.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return [...map.entries()];
}

export function formatDateLabel(dateKey: string): string {
  const d = new Date(dateKey + 'T12:00:00');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return '📅 Hoje';
  if (d.toDateString() === tomorrow.toDateString()) return '📅 Amanhã';
  return '📅 ' + d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
