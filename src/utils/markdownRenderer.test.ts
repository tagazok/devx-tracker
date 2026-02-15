import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdownRenderer';

describe('renderMarkdown', () => {
  /**
   * Validates: Requirement 2.3
   * Headings are converted to the correct HTML heading tags.
   */
  describe('headings', () => {
    it('converts # Heading to <h1>', () => {
      expect(renderMarkdown('# Heading')).toContain('<h1>Heading</h1>');
    });

    it('converts ## Heading to <h2>', () => {
      expect(renderMarkdown('## Heading')).toContain('<h2>Heading</h2>');
    });

    it('converts ### Heading to <h3>', () => {
      expect(renderMarkdown('### Heading')).toContain('<h3>Heading</h3>');
    });
  });

  /**
   * Validates: Requirement 2.3
   * Inline formatting: bold and italic.
   */
  describe('inline formatting', () => {
    it('converts **bold** to <strong>', () => {
      expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>');
    });

    it('converts *italic* to <em>', () => {
      expect(renderMarkdown('*italic*')).toContain('<em>italic</em>');
    });
  });

  /**
   * Validates: Requirement 2.3
   * Links are converted to anchor tags.
   */
  describe('links', () => {
    it('converts [text](url) to <a href="url">text</a>', () => {
      expect(renderMarkdown('[text](url)')).toContain('<a href="url">text</a>');
    });
  });

  /**
   * Validates: Requirement 2.3
   * Code: inline code and fenced code blocks.
   */
  describe('code', () => {
    it('converts inline `code` to <code>', () => {
      expect(renderMarkdown('`code`')).toContain('<code>code</code>');
    });

    it('converts fenced code blocks to <pre><code>', () => {
      const input = '```\nconst x = 1;\n```';
      const result = renderMarkdown(input);
      expect(result).toContain('<pre><code>');
      expect(result).toContain('</code></pre>');
      expect(result).toContain('const x = 1;');
    });
  });

  /**
   * Validates: Requirement 2.3
   * XSS prevention: raw HTML tags must be escaped.
   */
  describe('XSS prevention', () => {
    it('escapes <script> tags', () => {
      const input = "<script>alert('xss')</script>";
      const result = renderMarkdown(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });

  /**
   * Validates: Requirement 2.3
   * Edge cases: empty string, plain text, paragraph splitting.
   */
  describe('edge cases', () => {
    it('returns <p></p> for empty string', () => {
      expect(renderMarkdown('')).toBe('<p></p>');
    });

    it('wraps plain text in <p> tags', () => {
      const result = renderMarkdown('Hello world');
      expect(result).toContain('<p>');
      expect(result).toContain('Hello world');
      expect(result).toContain('</p>');
    });

    it('creates separate paragraphs for double newlines', () => {
      const input = 'First paragraph\n\nSecond paragraph';
      const result = renderMarkdown(input);
      expect(result).toContain('<p>First paragraph</p>');
      expect(result).toContain('<p>Second paragraph</p>');
    });
  });
});
