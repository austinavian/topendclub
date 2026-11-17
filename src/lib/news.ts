import type { Ev } from './events';
import { artKey } from './events';

type Cover = { src: string; webp?: string; focus?: string; photo: boolean };

// Stories with a real photo of the night. Everything else uses the art made from that event's flyer.
const photos: Record<string, { base: string; focus: string }> = {
  '2026-spring': { base: '/photos/2026/2026-spring-draw-check-presentation', focus: '50% 40%' },
};

export function coverFor(_id: string, ev?: Ev): Cover {
  const p = ev && photos[ev.id];
  if (p) return { src: `${p.base}.jpg`, webp: `${p.base}-sm.webp 960w, ${p.base}.webp 1920w`, focus: p.focus, photo: true };
  if (ev) {
    const a = `/events/art/${artKey(ev)}`;
    return { src: `${a}-thumb.webp`, webp: `${a}-thumb-sm.webp 600w, ${a}-thumb.webp 1200w`, photo: false };
  }
  return { src: '/photos/2026/2026-spring-dinner-tents-dusk.jpg', photo: true };
}
