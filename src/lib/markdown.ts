import { Marked } from 'marked';

/** 'Rules frozen first' → 'rules-frozen-first'. Used for section ids and rail links. */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Section ids the page itself uses, so a text section can't take them.
const RESERVED = new Map([
  ['in-one-minute', 'In one minute'],
  ['paper-and-code', 'Paper and code'],
]);

/**
 * Why a project's text-section headings can't all become distinct section ids, or
 * null when they can. Headings that differ only in case or punctuation collide.
 */
export function headingProblem(headings: string[]): string | null {
  const seen = new Map<string, string>();
  for (const heading of headings) {
    const id = headingId(heading);
    if (!id) return `text section heading "${heading}" has no letters or numbers to make a section id from`;
    const reserved = RESERVED.get(id);
    if (reserved) return `text section heading "${heading}" is reserved: the page already has an "${reserved}" section`;
    const earlier = seen.get(id);
    if (earlier !== undefined) {
      return `text section headings "${earlier}" and "${heading}" make the same section id "${id}"; rename one`;
    }
    seen.set(id, heading);
  }
  return null;
}

// Links in text sections may only go to web pages, email, this site or this page.
const SAFE_HREF = /^(https?:|mailto:|\/|#)/i;

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);

const marked = new Marked({
  gfm: true,
  walkTokens(token) {
    // Text-block headings are h2; anything inside the body sits below them.
    if (token.type === 'heading' && token.depth < 3) token.depth = 3;
  },
  renderer: {
    // Raw HTML in owner-written text is shown as text, never executed.
    html(token) {
      return escapeHtml(token.text);
    },
    link(token) {
      const text = this.parser.parseInline(token.tokens);
      if (!SAFE_HREF.test(token.href)) return text;
      const rel = token.href.startsWith('https://') ? ' rel="noopener"' : '';
      return `<a href="${escapeHtml(token.href)}"${rel}>${text}</a>`;
    },
  },
});

/** Markdown for text-block bodies: HTML escaped, headings demoted to h3+. */
export function renderBlockMarkdown(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

/** The image sources in a piece of Markdown; text sections must have none. */
export function markdownImages(md: string): string[] {
  const found: string[] = [];
  marked.walkTokens(marked.lexer(md), (token) => {
    if (token.type === 'image') found.push(token.href);
  });
  return found;
}
