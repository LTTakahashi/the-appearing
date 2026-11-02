// Code-level constants. Everything the owner edits (hero text, bio, contact
// links, "Updated" date) lives in src/content/site/profile.yaml.

export interface NavItem {
  label: string;
  href: string;
  enabled: boolean;
}

export interface LinkItem {
  label: string;
  href: string;
}

export const site = {
  name: 'Luiz Takahashi',
  legalName: 'Luiz Takeshi Takahashi Dos Reis',
  altName: 'L. Takahashi Dos Reis',
  url: 'https://luiztakahashi.com',
  affiliation: 'Washington State University',
} as const;

export const nav: NavItem[] = [
  { label: 'Research', href: '/#research', enabled: true },
  { label: 'Publications', href: '/#publications', enabled: true },
  { label: 'Gallery', href: '/gallery/', enabled: false },
  { label: 'Writing', href: '/writing/', enabled: false },
  { label: 'CV', href: '/Takahashi_CV.pdf', enabled: true },
];
