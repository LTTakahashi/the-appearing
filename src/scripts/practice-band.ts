// Makes every [data-practice-band] figure interactive. The server already rendered
// the default day, so without JavaScript the figure is complete, just static.
import { geometry, state } from '../lib/practice-band';

const points = geometry().points;

function setText(root: Element, selector: string, value: string) {
  const el = root.querySelector(selector);
  if (el) el.textContent = value;
}

function update(root: HTMLElement, dayInput: number) {
  const s = state(dayInput);
  const p = points[s.day - 1];
  const slider = root.querySelector<HTMLInputElement>('.pb-slider');
  if (slider && slider.value !== String(s.day)) slider.value = String(s.day);

  setText(root, '.pb-slider-day', String(s.day));
  setText(root, '.pb-day', `Day ${s.day}`);
  setText(root, '.pb-score', s.score.toFixed(1));
  setText(root, '.pb-band-range', `${s.bandLo.toFixed(1)}–${s.bandHi.toFixed(1)}`);
  setText(root, '.pb-band-verdict', s.bandVerdict);
  setText(root, '.pb-fixed-verdict', s.fixedVerdict);
  root.querySelector('.pb-band-verdict')?.classList.toggle('is-flag', s.bandFlag);
  root.querySelector('.pb-fixed-verdict')?.classList.toggle('is-flag', s.fixedFlag);

  const guide = root.querySelector('.pb-guide');
  guide?.setAttribute('x1', String(p.cx));
  guide?.setAttribute('x2', String(p.cx));
  const ring = root.querySelector('.pb-ring');
  ring?.setAttribute('cx', String(p.cx));
  ring?.setAttribute('cy', String(p.cy));
  root.querySelectorAll<SVGCircleElement>('.pb-dot').forEach((dot) => {
    const selected = Number(dot.dataset.day) === s.day;
    dot.classList.toggle('is-selected', selected);
    dot.setAttribute('r', selected ? '7' : '4.5');
  });
}

document.querySelectorAll<HTMLElement>('[data-practice-band]').forEach((root) => {
  const slider = root.querySelector<HTMLInputElement>('.pb-slider');
  slider?.addEventListener('input', () => update(root, Number(slider.value)));
  root.querySelectorAll<SVGCircleElement>('.pb-point').forEach((hit) => {
    hit.addEventListener('click', () => {
      update(root, Number(hit.dataset.day));
      slider?.focus();
    });
  });
});
