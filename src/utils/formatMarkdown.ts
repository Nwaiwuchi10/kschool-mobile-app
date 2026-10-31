/**
 * Converts Markdown text into clean, semantic HTML for the Mobile App
 * so that headers, bullet points, numbered lists, bold/italics, quotes,
 * tables, and KaTeX math formulas render with great typography.
 */
export function formatMarkdownForMobile(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return '';

  let text = markdown;

  // Check if content is already pure HTML without markdown syntax
  const hasHtmlBlocks = /<(p|div|table|ul|ol|h[1-6]|blockquote)[^>]*>/i.test(text);
  const hasMarkdownSyntax = /^#{1,6}\s|^\s*[-*+]\s|^\s*\d+\.\s|\*\*|__/m.test(text);

  if (hasHtmlBlocks && !hasMarkdownSyntax) {
    return text;
  }

  // 1. Preserve math blocks ($$...$$ and $...$)
  const mathTokens: string[] = [];
  text = text.replace(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g, (match) => {
    const idx = mathTokens.length;
    mathTokens.push(match);
    return `___MATH_TOKEN_${idx}___`;
  });

  // 2. Preserve code blocks
  const codeTokens: string[] = [];
  text = text.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeTokens.length;
    codeTokens.push(
      `<pre class="code-block"><code class="language-${lang || 'text'}">${code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')}</code></pre>`
    );
    return `___CODE_TOKEN_${idx}___`;
  });

  // 3. Inline code
  text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // 4. Headings (H1 to H6)
  text = text.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  text = text.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  text = text.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  text = text.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  text = text.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  text = text.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // 5. Blockquotes (> ...)
  text = text.replace(/^\s*>\s*(.+)$/gm, '<blockquote>$1</blockquote>');

  // 6. Horizontal Rules (--- or ***)
  text = text.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr />');

  // 7. Bold & Italic
  text = text.replace(/\*\*\*([^\*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  text = text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  text = text.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
  text = text.replace(/_([^_]+)_/g, '<em>$1</em>');

  // 8. Markdown Links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 9. Markdown Tables
  text = text.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (tableMatch) => {
    const lines = tableMatch.trim().split(/\r?\n/).map((l) => l.trim());
    if (lines.length < 2) return tableMatch;

    const headerLine = lines[0];
    const dataLines = lines.slice(1).filter((line) => !/^\|[\s\-:|]+\|$/.test(line));

    const parseRow = (rowStr: string) =>
      rowStr
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim());

    const headerCells = parseRow(headerLine);
    const headerHtml = `<tr>${headerCells.map((c) => `<th>${c}</th>`).join('')}</tr>`;

    const bodyHtml = dataLines
      .map(
        (dl) =>
          `<tr>${parseRow(dl)
            .map((c) => `<td>${c}</td>`)
            .join('')}</tr>`
      )
      .join('');

    return `<div class="table-wrapper"><table><thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody></table></div>`;
  });

  // 10. Unordered Lists (- or *)
  text = text.replace(/(?:^[ \t]*[-*+]\s+(?:.+)(?:\r?\n|$))+/gm, (listMatch) => {
    const items = listMatch
      .trim()
      .split(/\r?\n/)
      .map((item) => item.replace(/^[ \t]*[-*+]\s+/, '').trim())
      .filter(Boolean)
      .map((item) => `<li>${item}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  });

  // 11. Ordered Lists (1. 2. 3.)
  text = text.replace(/(?:^[ \t]*\d+\.\s+(?:.+)(?:\r?\n|$))+/gm, (listMatch) => {
    const items = listMatch
      .trim()
      .split(/\r?\n/)
      .map((item) => item.replace(/^[ \t]*\d+\.\s+/, '').trim())
      .filter(Boolean)
      .map((item) => `<li>${item}</li>`)
      .join('');
    return `<ol>${items}</ol>`;
  });

  // 12. Paragraphs: split by double newlines, wrap non-block segments in <p>
  const blocks = text.split(/\n{2,}/);
  text = blocks
    .map((block) => {
      const b = block.trim();
      if (!b) return '';
      if (/^<(h[1-6]|ul|ol|pre|blockquote|table|div|hr)/i.test(b)) {
        return b;
      }
      return `<p>${b.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');

  // 13. Restore code blocks
  text = text.replace(/___CODE_TOKEN_(\d+)___/g, (_, id) => codeTokens[Number(id)] || '');

  // 14. Restore math tokens
  text = text.replace(/___MATH_TOKEN_(\d+)___/g, (_, id) => mathTokens[Number(id)] || '');

  return text;
}

