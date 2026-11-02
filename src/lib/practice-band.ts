// Pure model for the "practice-band" interactive figure (spec §6.3). Shared by the
// server render and the browser script so both always agree. Simulated data only.

export const OBS = [10.2, 11.6, 12.9, 13.1, 14.6, 15.0, 15.4, 16.6, 11.3, 16.9, 16.4, 17.3, 16.8, 17.6];
export const DAYS = OBS.length;
export const HALF = 2.4;
export const FIXED = { lo: 7.6, hi: 12.4 };
export const DEFAULT_DAY = 9;

/** Expected score on day d under practice. */
export const mean = (d: number): number => 10 + 6.5 * (1 - Math.exp(-(d - 1) / 3.5));

// Chart geometry in a 680×380 viewBox (days 1–14 on x, scores 4–22 on y).
export const VIEWBOX = '0 0 680 380';
export const PLOT = { left: 56, right: 650, top: 30, bottom: 330 };
export const x = (d: number): number => PLOT.left + (d - 1) * ((PLOT.right - PLOT.left) / (DAYS - 1));
export const y = (s: number): number => PLOT.bottom - (s - 4) * ((PLOT.bottom - PLOT.top) / 18);

export const VERDICTS = {
  bandWithin: 'Within what practice predicts: no flag.',
  bandBelow: 'Below what practice predicts: flagged as a possible real drop.',
  bandAbove: 'Above what practice predicts.',
  fixedNormal: 'Looks normal.',
  fixedMissed: 'Looks normal, so this drop would be missed.',
  fixedFalseAlarm: 'Out of range: would raise a false alarm for what is only practice.',
  fixedBelow: 'Below range: flagged.',
} as const;

export interface DayState {
  day: number;
  score: number;
  bandLo: number;
  bandHi: number;
  bandVerdict: string;
  /** True when the band's verdict should be drawn in the accent color. */
  bandFlag: boolean;
  fixedVerdict: string;
  /** True when the fixed range's verdict should be drawn in the accent color. */
  fixedFlag: boolean;
}

const clampDay = (day: number): number => Math.min(DAYS, Math.max(1, Math.round(day) || DEFAULT_DAY));
const round1 = (n: number): number => Math.round(n * 10) / 10;

export function state(dayInput: number): DayState {
  const day = clampDay(dayInput);
  const score = OBS[day - 1];
  const bandLo = round1(mean(day) - HALF);
  const bandHi = round1(mean(day) + HALF);
  const below = score < mean(day) - HALF;
  const above = score > mean(day) + HALF;

  let fixedVerdict: string = VERDICTS.fixedNormal;
  let fixedFlag = false;
  if (score > FIXED.hi) { fixedVerdict = VERDICTS.fixedFalseAlarm; fixedFlag = true; }
  else if (score < FIXED.lo) { fixedVerdict = VERDICTS.fixedBelow; fixedFlag = true; }
  else if (below) { fixedVerdict = VERDICTS.fixedMissed; fixedFlag = true; }

  return {
    day,
    score,
    bandLo,
    bandHi,
    bandVerdict: below ? VERDICTS.bandBelow : above ? VERDICTS.bandAbove : VERDICTS.bandWithin,
    bandFlag: below,
    fixedVerdict,
    fixedFlag,
  };
}

export interface Geometry {
  bandPath: string;
  meanPath: string;
  fixed: { top: number; height: number; mid: number };
  points: { day: number; cx: number; cy: number; outside: boolean }[];
}

export function geometry(): Geometry {
  const days = Array.from({ length: DAYS }, (_, i) => i + 1);
  const f = (n: number) => n.toFixed(1);
  const upper = days.map((d) => `${f(x(d))},${f(y(mean(d) + HALF))}`);
  const lower = [...days].reverse().map((d) => `${f(x(d))},${f(y(mean(d) - HALF))}`);
  return {
    bandPath: `M${upper.join(' L')} L${lower.join(' L')} Z`,
    meanPath: `M${days.map((d) => `${f(x(d))},${f(y(mean(d)))}`).join(' L')}`,
    fixed: { top: y(FIXED.hi), height: y(FIXED.lo) - y(FIXED.hi), mid: y((FIXED.lo + FIXED.hi) / 2) },
    points: days.map((d) => ({
      day: d,
      cx: Number(f(x(d))),
      cy: Number(f(y(OBS[d - 1]))),
      outside: OBS[d - 1] < mean(d) - HALF || OBS[d - 1] > mean(d) + HALF,
    })),
  };
}
