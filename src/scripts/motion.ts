// Scroll reveals and the nav's hairline. Re-run after every client-side navigation.
let io: IntersectionObserver | null = null;
let onScroll: (() => void) | null = null;

export function initMotion() {
  document.documentElement.classList.add('js');
  try {
    const t = sessionStorage.getItem('tec-theme');
    if (t) document.documentElement.setAttribute('data-theme', t);
  } catch {}

  io?.disconnect();
  const items = document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach((el) => el.classList.add('is-visible'));
  } else {
    io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io?.unobserve(e.target); }
      }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    items.forEach((el) => io!.observe(el));
  }

  const nav = document.querySelector('[data-gnav]');
  if (onScroll) window.removeEventListener('scroll', onScroll);
  onScroll = () => nav?.classList.toggle('is-scrolled', window.scrollY > 4);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}
