import { existsSync } from 'node:fs';
import { getCollection, type CollectionEntry } from 'astro:content';
import styles from '../data/flyer-styles.json';

export type Ev = CollectionEntry<'events'>['data'] & { id: string };
export type FlyerStyle = { accent: string; bg: string; dark: boolean; motif: string };

export async function allEvents(): Promise<Ev[]> {
  return (await getCollection('events'))
    .map((e) => ({ ...e.data, id: e.id }))
    .sort((a, b) => +a.date - +b.date);
}

/** The flyer's look, or a neighbor's for events that never had a flyer. */
export function styleFor(e: Ev): FlyerStyle & { borrowed: boolean } {
  const borrow = (styles.borrow as Record<string, string>)[e.id];
  const key = e.flyer ?? borrow;
  const s = (styles as unknown as Record<string, FlyerStyle>)[key];
  return { ...s, borrowed: !e.flyer };
}

export const usd = (n: number) => '$' + n.toLocaleString('en-US');
export const longDate = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
export const shortDate = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
/** 2026-04-25, for <time datetime> and schema.org. */
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
export const raisedText = (e: Ev) => (e.raised ? `${e.raisedIsEstimate ? 'About ' : ''}${usd(e.raised)}` : null);

/** Rounded for tiles and cards: 3510 -> "$3.5K", 29350 -> "$29.4K". */
export const compactUsd = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1).replace(/\.0$/, '')}K` : usd(n);

/** The event's sharing card (made by scripts/share-images.py), or the club's card until one exists. */
export const shareImage = (e: Ev) => (existsSync(`public/og/${e.id}.jpg`) ? `/og/${e.id}.jpg` : '/og/default.jpg');

/** Key for the generated artwork in public/events/art (2021 events have art but no flyer). */
export const artKey = (e: Ev) => e.flyer ?? `${e.year}_${e.season === 'Spring' ? 1 : 2}`;
