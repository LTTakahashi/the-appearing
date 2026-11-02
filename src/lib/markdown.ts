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
      const rel = token.href.startsWith('https://') ? ' rel="noopener"' : '';
      return `<a href="${escapeHtml(token.href)}"${rel}>${text}</a>`;
    },
  },
});

/** Markdown for text-block bodies: HTML escaped, headings demoted to h3+. */
export function renderBlockMarkdown(md: string): string {
  return marked.parse(md, { async: false }) as string;
}
