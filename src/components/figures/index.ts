import ArtsFigure from './ArtsFigure.astro';
import PraxisFigure from './PraxisFigure.astro';
import HomesFigure from './HomesFigure.astro';
import MultiviewFigure from './MultiviewFigure.astro';

/** Project illustrations by name. Used by homepage cards and project pages. */
export const figures: Record<string, (props: Record<string, never>) => unknown> = {
  arts: ArtsFigure,
  praxis: PraxisFigure,
  homes: HomesFigure,
  multiview: MultiviewFigure,
};
