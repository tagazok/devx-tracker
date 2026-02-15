// Feature: ticket-viewer, Property 2: Markdown renderer produces valid structure
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { renderMarkdown } from './markdownRenderer';

/**
 * Strips HTML tags from a string, returning only the text content.
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Decodes HTML entities back to their original characters.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

describe('Property 2: Markdown renderer produces valid structure', () => {
  // **Validates: Requirements 2.3**

  it('always returns a non-empty string for any input', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 500 }),
        (input: string) => {
          const result = renderMarkdown(input);
          expect(result.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('does not pass through raw HTML tags from the input (XSS prevention)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 300 }),
        (input: string) => {
          const result = renderMarkdown(input);
          // If the input contained a '<' character (potential HTML tag start),
          // the output should NOT contain the raw '<' from input — it should be escaped.
          // We verify by checking that any '<' in the output is part of the renderer's
          // own HTML tags, not raw input. Specifically, raw `<script>` should never appear.
          if (input.includes('<script>')) {
            expect(result).not.toContain('<script>');
          }
          if (input.includes('</script>')) {
            expect(result).not.toContain('</script>');
          }
          // More generally: any literal '<' from input should be escaped to '&lt;'
          // The renderer only produces its own safe tags (p, h1-h3, strong, em, a, br, pre, code)
          const strippedOutput = stripHtmlTags(result);
          if (input.includes('<')) {
            expect(strippedOutput).toContain('&lt;');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('preserves all text content from the input (no text is lost)', () => {
    fc.assert(
      fc.property(
        // Use printable ASCII to avoid edge cases with control characters
        fc.stringOf(
          fc.char().filter((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126),
          { minLength: 1, maxLength: 300 },
        ),
        (input: string) => {
          const result = renderMarkdown(input);
          // Strip HTML tags from output, then decode HTML entities
          const textContent = decodeHtmlEntities(stripHtmlTags(result));

          // Every non-whitespace, non-markdown-syntax character from the input
          // should appear in the decoded text content.
          // We extract "plain text" from input by removing markdown syntax characters
          // that get consumed by the renderer (**, *, `, #, [], ())
          // A simpler check: every word-character sequence from input should be in output
          const inputWords = input.match(/\w+/g) || [];
          for (const word of inputWords) {
            expect(textContent).toContain(word);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
