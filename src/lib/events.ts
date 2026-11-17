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
export const raisedText = (e: Ev) => (e.raised ? `${e.raisedIsEstimate ? 'About ' : ''}${usd(e.raised)}` : null);
