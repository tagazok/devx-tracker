/**
 * Lightweight markdown renderer for `text/amz-markdown-sim` content.
 * Converts a subset of markdown to HTML with XSS prevention.
 *
 * Supported syntax:
 * - Headings: #, ##, ###
 * - Bold: **text**
 * - Italic: *text*
 * - Links: [text](url)
 * - Inline code: `code`
 * - Fenced code blocks: ```code```
 * - Line breaks: double newline → <p> tags, single newline → <br>
 */

/**
 * Escapes HTML entities to prevent XSS.
 * Must be applied BEFORE any markdown transformations.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Converts markdown-formatted text to sanitized HTML.
 * Escapes all HTML entities first, then applies markdown transformations.
 * Always returns a non-empty string (at minimum wrapping content in a <p> tag).
 */
export function renderMarkdown(text: string): string {
  if (!text) {
    return '<p></p>';
  }

  // Step 1: Escape HTML entities BEFORE any markdown processing
  const escaped = escapeHtml(text);

  // Step 2: Extract fenced code blocks before other processing
  // We use a placeholder approach to protect code blocks from inline transforms
  const codeBlocks: string[] = [];
  const withCodePlaceholders = escaped.replace(
    /```(?:\S*)\n([\s\S]*?)```/g,
    (_match, code: string) => {
      const index = codeBlocks.length;
      // Trim trailing newline inside code block if present
      codeBlocks.push(code.replace(/\n$/, ''));
      return `\n%%CODEBLOCK_${index}%%\n`;
    },
  );

  // Step 3: Split into paragraphs by double newline
  const paragraphs = withCodePlaceholders.split(/\n\n+/);

  const rendered = paragraphs
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';

      // Check if this is a code block placeholder
      const codeMatch = trimmed.match(/^%%CODEBLOCK_(\d+)%%$/);
      if (codeMatch) {
        const idx = parseInt(codeMatch[1], 10);
        return `<pre><code>${codeBlocks[idx]}</code></pre>`;
      }

      // Process lines within the block
      const lines = trimmed.split('\n');
      const processedLines = lines.map((line) => {
        // Headings (must be at start of line)
        if (line.startsWith('### ')) {
          return `<h3>${applyInlineFormatting(line.slice(4))}</h3>`;
        }
        if (line.startsWith('## ')) {
          return `<h2>${applyInlineFormatting(line.slice(3))}</h2>`;
        }
        if (line.startsWith('# ')) {
          return `<h1>${applyInlineFormatting(line.slice(2))}</h1>`;
        }
        return null; // Not a heading
      });

      // If all lines are headings, join them directly
      if (processedLines.every((l) => l !== null)) {
        return processedLines.join('');
      }

      // Otherwise, wrap in <p> with <br> for single newlines
      const content = lines
        .map((line) => {
          if (line.startsWith('### ')) {
            return `</p><h3>${applyInlineFormatting(line.slice(4))}</h3><p>`;
          }
          if (line.startsWith('## ')) {
            return `</p><h2>${applyInlineFormatting(line.slice(3))}</h2><p>`;
          }
          if (line.startsWith('# ')) {
            return `</p><h1>${applyInlineFormatting(line.slice(2))}</h1><p>`;
          }
          return applyInlineFormatting(line);
        })
        .join('<br>');

      return `<p>${content}</p>`.replace(/<p><\/p>/g, '');
    })
    .filter(Boolean)
    .join('');

  return rendered || '<p></p>';
}

/**
 * Applies inline markdown formatting: bold, italic, inline code, links.
 * Order matters — code is processed first to protect its contents.
 */
function applyInlineFormatting(text: string): string {
  let result = text;

  // Inline code (process first to protect contents from other transforms)
  const inlineCodeParts: string[] = [];
  result = result.replace(/`([^`]+)`/g, (_match, code: string) => {
    const idx = inlineCodeParts.length;
    inlineCodeParts.push(code);
    return `%%INLINE_CODE_${idx}%%`;
  });

  // Bold (**text**)
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic (*text*) — but not inside bold markers
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links [text](url)
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2">$1</a>',
  );

  // Restore inline code
  result = result.replace(/%%INLINE_CODE_(\d+)%%/g, (_match, idx: string) => {
    return `<code>${inlineCodeParts[parseInt(idx, 10)]}</code>`;
  });

  return result;
}
