// Gentle fade-in of cards, rows, news and publications as they scroll into
// view (spec §6.6). Progressive enhancement: without JS, or with reduced
// motion, nothing is hidden. A safety timeout reveals everything regardless.

const SELECTOR = '.project-card, .project-row, .news li, .pubs li';
const SAFETY_MS = 2500;

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (root.classList.contains('js') && !reduceMotion && 'IntersectionObserver' in window) {
  const elements = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
  const show = (el: Element) => el.classList.add('is-visible');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          show(entry.target);
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15 },
  );

  for (const el of elements) {
    el.classList.add('reveal');
    observer.observe(el);
  }

  window.setTimeout(() => {
    elements.forEach(show);
    observer.disconnect();
  }, SAFETY_MS);
}
