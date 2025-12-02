import { ParsedSegment, Reference } from './types';

/**
 * Extract domain from URL for matching
 */
function extractDomain(url: string): string {
  try {
    // Handle URLs with or without protocol
    let domain = url;
    if (url.includes('://')) {
      domain = url.split('://')[1];
    }
    // Get just the host part
    domain = domain.split('/')[0].split('#')[0].split('?')[0];
    // Remove www.
    domain = domain.replace(/^www\./, '');
    return domain.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Parse markdown with inline citations [[n]](url) into segments
 * that can be rendered as React components.
 *
 * IMPORTANT: The citation number [[n]] in the markdown does NOT correspond to
 * the index in the references array. Instead, we match by URL domain.
 * The citationNum returned is the matched reference's rank (1-indexed position in references array).
 */
export function parseMarkdownWithCitations(
  markdown: string,
  references?: Reference[]
): ParsedSegment[] {
  if (!markdown) return [];

  // Pre-process: Remove DataForSEO CDN images (these don't exist in real AI Overviews)
  // Pattern: ![any text](https://api.dataforseo.com/cdn/...)
  let cleanedMarkdown = markdown.replace(/!\[[^\]]*\]\(https?:\/\/api\.dataforseo\.com\/cdn\/[^)]+\)\s*/g, '');

  // Also remove any other DataForSEO API URLs that might appear as images
  cleanedMarkdown = cleanedMarkdown.replace(/!\[[^\]]*\]\(https?:\/\/[^)]*dataforseo[^)]*\)\s*/g, '');

  const segments: ParsedSegment[] = [];

  // Pattern: [[n]](url) where n is citation number (but n is unreliable for matching)
  const citationPattern = /\[\[(\d+)\]\]\(([^)]+)\)/g;

  let lastIndex = 0;
  let match;

  while ((match = citationPattern.exec(cleanedMarkdown)) !== null) {
    // Add text before citation
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: cleanedMarkdown.slice(lastIndex, match.index)
      });
    }

    const displayNum = parseInt(match[1], 10); // The number shown in markdown
    const citationUrl = match[2];
    const citationDomain = extractDomain(citationUrl);

    // Find matching reference by domain
    let matchedRank = displayNum; // Default to display number
    if (references && references.length > 0) {
      const matchedRef = references.find(ref => {
        const refDomain = extractDomain(ref.domain || ref.url || '');
        return refDomain === citationDomain ||
               citationDomain.includes(refDomain) ||
               refDomain.includes(citationDomain);
      });
      if (matchedRef) {
        matchedRank = matchedRef.rank;
      }
    }

    // Add citation with the MATCHED rank (not the display number)
    segments.push({
      type: 'citation',
      citationNum: matchedRank,
      url: citationUrl
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < cleanedMarkdown.length) {
    segments.push({
      type: 'text',
      content: cleanedMarkdown.slice(lastIndex)
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
