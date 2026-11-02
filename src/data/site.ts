// Site-wide facts and hero copy. Copy is fixed by the design spec §7.2.

export interface NavItem {
  label: string;
  href: string;
  enabled: boolean;
}

export interface LinkItem {
  label: string;
  href: string;
}

const researchLine =
  'I measure cognition and behavior in daily life, and ask when a recorded change is real rather than practice, context or noise.';

export const site = {
  name: 'Luiz Takahashi',
  legalName: 'Luiz Takeshi Takahashi Dos Reis',
  altName: 'L. Takahashi Dos Reis',
  url: 'https://luiztakahashi.com',
  email: 'l.takahashidosreis@wsu.edu',
  github: 'https://github.com/LTTakahashi',
  orcid: 'https://orcid.org/0009-0006-3548-1256',
  cvPath: '/Takahashi_CV.pdf',
  updated: 'November 2026',
  affiliation: 'Washington State University',
  description: researchLine,
  hero: {
    label: 'PhD applicant · Fall 2027',
    researchLine,
    bio: [
      'I’m a computer science undergraduate at Washington State University (B.S. expected May 2027), working in the Neuropsychology and Aging Lab with Maureen Schmitter-Edgecombe and the CASAS Smart Home Lab with Diane J. Cook on NIH/NIA-funded studies of older adults. I work with smartwatch speech, repeated cognitive tests and in-home sensors, using uncertainty-aware machine learning, hierarchical models and calibrated prediction intervals, always tested on people held out of development.',
      'I also work with Junhao Wen at Columbia on detecting interactions between biomarker views. Before that, I built an evaluation metric for text-to-SQL with Fabio Cozman at the University of São Paulo’s Center for Artificial Intelligence (C4AI).',
    ] as [string, string],
    caption: ['B.S. Computer Science, WSU ’27', 'Pullman, WA'] as [string, string],
    links: [
      { label: 'CV (PDF)', href: '/Takahashi_CV.pdf' },
      { label: 'l.takahashidosreis@wsu.edu', href: 'mailto:l.takahashidosreis@wsu.edu' },
      { label: 'GitHub', href: 'https://github.com/LTTakahashi' },
      { label: 'ORCID', href: 'https://orcid.org/0009-0006-3548-1256' },
    ] as LinkItem[],
  },
} as const;

export const nav: NavItem[] = [
  { label: 'Research', href: '/#research', enabled: true },
  { label: 'Publications', href: '/#publications', enabled: true },
  { label: 'Gallery', href: '/gallery/', enabled: false },
  { label: 'Writing', href: '/writing/', enabled: false },
  { label: 'CV', href: '/Takahashi_CV.pdf', enabled: true },
];
