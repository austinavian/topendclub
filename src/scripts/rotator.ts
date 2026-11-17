// Drives every [data-rotator] with a timed crossfade.
// Featured photos (data-featured) always open the show, both first in random order, and come up
// about `data-boost` times as often as the rest (2.5 by default) before the order repeats.
const timers: number[] = [];

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function load(slide: HTMLElement): Promise<void> {
  const img = slide.querySelector('img')!;
  const src = slide.querySelector('source');
  if (!img.getAttribute('src')) {
    if (src?.dataset.srcset) src.srcset = src.dataset.srcset;
    img.src = img.dataset.src!;
  }
  return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
}

// Endless playlist. One cycle shows every other photo twice and each featured photo
// 2 × boost times, spread evenly, with the featured photos taking turns.
function playlist(featured: HTMLElement[], others: HTMLElement[], boost: number) {
  const feat = shuffle([...featured]);
  let f = 0;
  let lastOther: HTMLElement | undefined;
  const cycle = (): HTMLElement[] => {
    if (!feat.length || !others.length) return shuffle([...feat, ...others]);
    const o: HTMLElement[] = [];
    for (let r = 0; r < 2; r++) {
      const round = shuffle([...others]);
      if (round.length > 1 && round[0] === (o.at(-1) ?? lastOther)) round.push(round.shift()!);
      o.push(...round);
    }
    lastOther = o.at(-1);
    const nf = Math.round(feat.length * 2 * boost);
    const n = nf + o.length;
    const slots = new Set(Array.from({ length: nf }, (_, k) => Math.round((k * n) / nf)));
    let oi = 0;
    return Array.from({ length: n }, (_, i) => (slots.has(i) ? feat[f++ % feat.length] : o[oi++]));
  };
  // The first cycle opens on the featured photos back to back, so both show first.
  let queue = cycle();
  const open = queue.findIndex((s, i) => featured.includes(s) && featured.includes(queue[i + 1]));
  if (open > 0) queue = [...queue.slice(open), ...queue.slice(0, open)];
  return {
    next(): HTMLElement { if (!queue.length) queue = cycle(); return queue.shift()!; },
    peek(): HTMLElement { if (!queue.length) queue = cycle(); return queue[0]; },
  };
}

export function initRotators() {
  while (timers.length) clearInterval(timers.pop());
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll<HTMLElement>('[data-rotator]').forEach((root) => {
    const slides = Array.from(root.querySelectorAll<HTMLElement>(':scope > .rot__slide'));
    if (!slides.length) return;
    const featured = slides.filter((s) => s.hasAttribute('data-featured'));
    const others = slides.filter((s) => !s.hasAttribute('data-featured'));
    const list = playlist(featured, others, Number(root.dataset.boost) || 2.5);
    const caption = root.querySelector<HTMLElement>('[data-rot-caption]');
    const label = root.querySelector<HTMLElement>('[data-rot-label]');
    const every = Number(root.dataset.interval) || 6500;
    root.style.setProperty('--rot-dur', `${every + 1500}ms`);
    let busy = false;

    const show = (s: HTMLElement) =>
      load(s).then(() => {
        slides.forEach((x) => x.classList.toggle('is-active', x === s));
        const alt = s.dataset.alt ?? '';
        label?.setAttribute('aria-label', alt);
        if (caption) {
          caption.classList.remove('is-on');
          setTimeout(() => { caption.textContent = alt; caption.classList.add('is-on'); }, 400);
        }
        load(list.peek()); // warm up the next photo
      });

    show(list.next());
    if (still || slides.length < 2) return;
    timers.push(window.setInterval(() => {
      if (document.hidden || busy) return;
      busy = true;
      show(list.next()).finally(() => { busy = false; });
    }, every));
  });
}
