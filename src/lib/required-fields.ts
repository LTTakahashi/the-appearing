// Top-level fields each collection requires. One list, read by the content schemas
// (which fail the build if it drifts from them) and by the editor-config test, so
// /admin never lets you save an entry the build would reject for a missing field.
export const REQUIRED_FIELDS = {
  profile: ['label', 'researchLine', 'bio', 'caption', 'email', 'github', 'orcid', 'cvPath', 'updated'],
  projects: ['title', 'summary', 'role', 'status', 'feature', 'order'],
  news: ['date', 'text'],
  publications: ['type', 'title', 'self', 'venue', 'year', 'selected', 'order'],
} as const satisfies Record<string, readonly string[]>;
