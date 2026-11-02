// Highlights the "On this page" link for the section being read. Without JS the
// rail still links to every section; only the highlight is missing.
const rail = document.querySelector<HTMLElement>('nav.on-this-page');
if (rail) {
  const links = Array.from(rail.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
  const sections = links
    .map((a) => document.getElementById(a.getAttribute('href')!.slice(1)))
    .filter((s): s is HTMLElement => s !== null);

  // A section the reader jumped to (rail click or #link) stays highlighted until it
  // leaves the screen, even when it is too short to scroll up to the reading line.
  // `seen` waits out a smooth scroll that hasn't reached it yet.
  let pinned: HTMLElement | null = null;
  let seen = false;
  const onScreen = (s: HTMLElement) => {
    const r = s.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  };
  const pin = (s: HTMLElement | null) => { pinned = s; seen = false; };
  const pinFromHash = () => {
    // Section ids are plain a-z0-9 slugs, so the hash needs no decoding.
    pin(sections.find((s) => s.id === location.hash.slice(1)) ?? null);
  };

  let ticking = false;
  const update = () => {
    ticking = false;
    if (pinned) {
      if (onScreen(pinned)) seen = true;
      else if (seen) pinned = null;
    }
    let current = sections[0];
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    if (pinned) current = pinned;
    else if (atBottom) current = sections[sections.length - 1];
    else {
      const line = window.innerHeight * 0.3;
      for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s;
    }
    for (const a of links) {
      if (a.getAttribute('href') === `#${current?.id}`) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  for (const a of links) {
    a.addEventListener('click', () => {
      pin(sections.find((s) => `#${s.id}` === a.getAttribute('href')) ?? null);
      onScroll();
    });
  }
  window.addEventListener('hashchange', () => { pinFromHash(); onScroll(); });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  pinFromHash();
  update();
}
