import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { LinkItem } from '../data/site';

type Listed = 'projects' | 'news' | 'publications';

/** Every entry of a collection except drafts. Always query lists through this. */
export async function published<C extends Listed>(name: C): Promise<CollectionEntry<C>[]> {
  const all = (await getCollection(name)) as CollectionEntry<C>[];
  return all.filter((entry) => (entry.data as { draft?: boolean }).draft !== true);
}

export type Profile = CollectionEntry<'profile'>['data'];

export async function getProfile(): Promise<Profile> {
  const entry = await getEntry('profile', 'profile');
  if (!entry) throw new Error('src/content/site/profile.yaml is missing');
  return entry.data;
}

/** Hero contact links, derived from the profile so each value is typed once. */
export function heroLinks(p: Profile): LinkItem[] {
  return [
    { label: 'CV (PDF)', href: p.cvPath },
    { label: p.email, href: `mailto:${p.email}` },
    { label: 'GitHub', href: p.github },
    { label: 'ORCID', href: p.orcid },
  ];
}
