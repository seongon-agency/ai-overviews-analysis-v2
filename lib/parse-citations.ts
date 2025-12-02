import { ParsedSegment } from './types';

/**
 * Parse markdown with inline citations [[n]](url) into segments
 * that can be rendered as React components.
 */
export function parseMarkdownWithCitations(markdown: string): ParsedSegment[] {
  if (!markdown) return [];

  const segments: ParsedSegment[] = [];

  // Pattern: [[n]](url) where n is citation number
  const citationPattern = /\[\[(\d+)\]\]\(([^)]+)\)/g;

  let lastIndex = 0;
  let match;

  while ((match = citationPattern.exec(markdown)) !== null) {
    // Add text before citation
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: markdown.slice(lastIndex, match.index)
      });
    }

    // Add citation
    segments.push({
      type: 'citation',
      citationNum: parseInt(match[1], 10),
      url: match[2]
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < markdown.length) {
    segments.push({
      type: 'text',
      content: markdown.slice(lastIndex)
    });
  }

  return segments;
}

/**
 * Clean markdown by removing citation links but keeping readable text.
 * Used for competitor mention analysis.
 */
export function cleanMarkdownCitations(md: string): string {
  if (!md) return '';

  // Remove citation links [[1]](url)
  let cleaned = md.replace(/\s*\[\[\d+\]\]\([^)]+\)/g, '');

  // Convert [text](url) to just text (but keep images)
  cleaned = cleaned.replace(/(?<!!)\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove images ![alt](url)
  cleaned = cleaned.replace(/!\[[^\]]*\]\([^)]+\)/g, '');

  // Clean whitespace
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  cleaned = cleaned.replace(/\s+([.,;:!?])/g, '$1');

  return cleaned.trim();
}

/**
 * Extract unique citation numbers from markdown
 */
export function extractCitationNumbers(markdown: string): number[] {
  if (!markdown) return [];

  const citationPattern = /\[\[(\d+)\]\]/g;
  const numbers = new Set<number>();
  let match;

  while ((match = citationPattern.exec(markdown)) !== null) {
    numbers.add(parseInt(match[1], 10));
  }

  return Array.from(numbers).sort((a, b) => a - b);
}
