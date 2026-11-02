/**
 * View-transition name for a project's shared element (card ↔ page), e.g.
 * vtName('fig', 'arts') → 'fig-arts'. Lowercase, with anything outside [a-z0-9-]
 * replaced by '-', so it is always a valid CSS identifier.
 */
export function vtName(kind: 'fig' | 'title', slug: string): string {
  return `${kind}-${slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
}
