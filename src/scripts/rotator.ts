// Drives every [data-rotator]: a fresh random order on each visit, then a timed crossfade.
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

export function initRotators() {
  while (timers.length) clearInterval(timers.pop());
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll<HTMLElement>('[data-rotator]').forEach((root) => {
    const slides = shuffle(Array.from(root.querySelectorAll<HTMLElement>(':scope > .rot__slide')));
    if (!slides.length) return;
    const caption = root.querySelector<HTMLElement>('[data-rot-caption]');
    const label = root.querySelector<HTMLElement>('[data-rot-label]');
    const every = Number(root.dataset.interval) || 6500;
    root.style.setProperty('--rot-dur', `${every + 1500}ms`);
    let i = 0;
    let busy = false;

    const show = (n: number) => {
      const s = slides[n];
      return load(s).then(() => {
        slides.forEach((x) => x.classList.toggle('is-active', x === s));
        const alt = s.dataset.alt ?? '';
        label?.setAttribute('aria-label', alt);
        if (caption) {
          caption.classList.remove('is-on');
          setTimeout(() => { caption.textContent = alt; caption.classList.add('is-on'); }, 400);
        }
        load(slides[(n + 1) % slides.length]); // warm up the next photo
      });
    };

    show(0);
    if (still || slides.length < 2) return;
    timers.push(window.setInterval(() => {
      if (document.hidden || busy) return;
      busy = true;
      i = (i + 1) % slides.length;
      show(i).finally(() => { busy = false; });
    }, every));
  });
}
