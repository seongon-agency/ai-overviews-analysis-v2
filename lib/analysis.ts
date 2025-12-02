import { KeywordRow, Reference, KeywordRecord, CompetitorMetrics, AnalysisResult } from './types';

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalize text for brand matching:
 * - Lowercase
 * - Remove Vietnamese diacritics (optional normalization)
 * - Trim whitespace
 */
function normalizeForMatching(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Check if a brand name appears in text (case-insensitive, partial match)
 * This handles cases like "Novagen" matching "Bệnh viện đa khoa Novagen"
 */
export function brandMatchesText(brandName: string, text: string): boolean {
  if (!brandName || !text) return false;

  const normalizedBrand = normalizeForMatching(brandName);
  const normalizedText = normalizeForMatching(text);

  // Direct substring match (handles partial matches)
  if (normalizedText.includes(normalizedBrand)) {
    return true;
  }

  // Also try word boundary match for more precision
  try {
    const pattern = new RegExp(`\\b${escapeRegex(normalizedBrand)}\\b`, 'i');
    if (pattern.test(text)) {
      return true;
    }
  } catch {
    // Ignore regex errors
  }

  return false;
}

/**
 * Check if brand domain appears in a URL or domain string
 */
export function brandMatchesDomain(brandDomain: string, domain: string, url?: string): boolean {
  if (!brandDomain) return false;

  const normalizedBrandDomain = normalizeForMatching(brandDomain);

  if (domain && normalizeForMatching(domain).includes(normalizedBrandDomain)) {
    return true;
  }

  if (url && normalizeForMatching(url).includes(normalizedBrandDomain)) {
    return true;
  }

  return false;
}

/**
 * Check if brand is cited in references (by domain or source name)
 */
export function findBrandInReferences(
  references: Reference[],
  brandName: string,
  brandDomain: string
): { rank: number; matchedBy: 'domain' | 'source' } | null {
  for (const ref of references) {
    // Check domain match first (more reliable)
    if (brandMatchesDomain(brandDomain, ref.domain, ref.url)) {
      return { rank: ref.rank, matchedBy: 'domain' };
    }

    // Check source name match
    if (brandMatchesText(brandName, ref.source)) {
      return { rank: ref.rank, matchedBy: 'source' };
    }
  }

  return null;
}

/**
 * Check if brand is mentioned in AIO markdown text (not as citation, but in content)
 */
export function isBrandMentionedInText(
  aioMarkdown: string | null,
  brandName: string
): boolean {
  if (!aioMarkdown || !brandName) return false;
  return brandMatchesText(brandName, aioMarkdown);
}

/**
 * Parse references from JSON string
 */
function parseReferences(refsJson: string | null): Reference[] {
  if (!refsJson) return [];

  try {
    const refs = JSON.parse(refsJson);
    if (!Array.isArray(refs)) return [];

    return refs.map((r: { domain?: string; source?: string; url?: string }, idx: number) => ({
      rank: idx + 1,
      domain: r.domain || '',
      source: r.source || '',
      url: r.url || ''
    }));
  } catch {
    return [];
  }
}

/**
 * Convert database KeywordRow to UI KeywordRecord
 */
export function processKeywordRow(
  row: KeywordRow,
  brandName: string,
  brandDomain: string
): KeywordRecord {
  const references = parseReferences(row.aio_references);

  // Find brand in citations (by domain or source name)
  const brandMatch = findBrandInReferences(references, brandName, brandDomain);

  // Check if brand is mentioned in the AIO text content
  const brandMentioned = isBrandMentionedInText(row.aio_markdown, brandName);

  return {
    id: row.id,
    keyword: row.keyword,
    hasAIOverview: row.has_ai_overview === 1,
    aioMarkdown: row.aio_markdown,
    references,
    referenceCount: references.length,
    brandRank: brandMatch?.rank || null,
    brandMentioned
  };
}

/**
 * Analyze keywords and generate competitor metrics
 * Ported from Python analyzeDataFrame.py
 */
export function analyzeKeywords(
  keywordRows: KeywordRow[],
  brandName: string,
  brandDomain: string
): AnalysisResult {
  // Process all keywords
  const keywordsAnalysis: KeywordRecord[] = keywordRows.map(row =>
    processKeywordRow(row, brandName, brandDomain)
  );

  // Filter keywords with AI overviews for competitor analysis
  const aioKeywords = keywordsAnalysis.filter(k => k.hasAIOverview);

  // Build competitor metrics map
  const brandMap = new Map<string, {
    citedCount: number;
    domains: Set<string>;
    ranks: number[];
    citedInPrompts: Set<string>;
    mentionedInPrompts: Set<string>;
    isUserBrand: boolean;
  }>();

  // Helper to ensure user's brand entry exists
  const ensureUserBrand = () => {
    if (brandName && !brandMap.has(brandName)) {
      brandMap.set(brandName, {
        citedCount: 0,
        domains: new Set(),
        ranks: [],
        citedInPrompts: new Set(),
        mentionedInPrompts: new Set(),
        isUserBrand: true
      });
    }
  };

  // Count citations per brand (source)
  for (const kw of aioKeywords) {
    for (const ref of kw.references) {
      const sourceBrand = ref.source;
      if (!sourceBrand) continue;

      // Check if this source matches the user's brand
      const matchesUserBrand = brandMatchesText(brandName, sourceBrand) ||
                               brandMatchesDomain(brandDomain, ref.domain, ref.url);

      if (matchesUserBrand) {
        // Aggregate under user's brand name
        ensureUserBrand();
        const data = brandMap.get(brandName)!;
        data.citedCount++;
        data.domains.add(ref.domain);
        data.ranks.push(ref.rank);
        data.citedInPrompts.add(kw.keyword);
      } else {
        // Track as competitor
        if (!brandMap.has(sourceBrand)) {
          brandMap.set(sourceBrand, {
            citedCount: 0,
            domains: new Set(),
            ranks: [],
            citedInPrompts: new Set(),
            mentionedInPrompts: new Set(),
            isUserBrand: false
          });
        }

        const data = brandMap.get(sourceBrand)!;
        data.citedCount++;
        data.domains.add(ref.domain);
        data.ranks.push(ref.rank);
        data.citedInPrompts.add(kw.keyword);
      }
    }
  }

  // Check brand mentions in markdown text
  for (const kw of aioKeywords) {
    if (!kw.aioMarkdown) continue;

    // Check user's brand mention first
    if (brandName && brandMatchesText(brandName, kw.aioMarkdown)) {
      ensureUserBrand();
      brandMap.get(brandName)!.mentionedInPrompts.add(kw.keyword);
    }

    // Check other brands' mentions
    brandMap.forEach((data, brand) => {
      if (data.isUserBrand) return; // Already checked above

      if (brandMatchesText(brand, kw.aioMarkdown!)) {
        data.mentionedInPrompts.add(kw.keyword);
      }
    });
  }

  // Convert to array and calculate rates
  const totalPrompts = aioKeywords.length;
  const competitors: CompetitorMetrics[] = Array.from(brandMap.entries())
    .map(([brand, data]) => ({
      brand,
      citedCount: data.citedCount,
      mentionedCount: data.mentionedInPrompts.size,
      uniqueDomains: Array.from(data.domains),
      averageRank: data.ranks.length > 0
        ? data.ranks.reduce((a, b) => a + b, 0) / data.ranks.length
        : 0,
      citedInPrompts: data.citedInPrompts.size,
      promptCitedRate: totalPrompts > 0 ? data.citedInPrompts.size / totalPrompts : 0,
      mentionRate: totalPrompts > 0 ? data.mentionedInPrompts.size / totalPrompts : 0,
      isUserBrand: data.isUserBrand
    }))
    // Sort: User's brand first, then by total engagement
    .sort((a, b) => {
      if (a.isUserBrand && !b.isUserBrand) return -1;
      if (!a.isUserBrand && b.isUserBrand) return 1;
      return (b.citedCount + b.mentionedCount) - (a.citedCount + a.mentionedCount);
    });

  return {
    summary: {
      totalKeywords: keywordRows.length,
      aiOverviewsFound: aioKeywords.length,
      competitorsIdentified: competitors.length
    },
    keywordsAnalysis,
    competitors
  };
}

/**
 * Generate CSV content from keywords analysis
 */
export function keywordsToCSV(keywords: KeywordRecord[]): string {
  const headers = ['keyword', 'has_ai_overview', 'reference_count', 'brand_rank', 'references'];
  const rows = keywords.map(kw => [
    `"${kw.keyword.replace(/"/g, '""')}"`,
    kw.hasAIOverview ? 'Yes' : 'No',
    kw.referenceCount.toString(),
    kw.brandRank?.toString() || '',
    `"${kw.references.map(r => `${r.rank}. ${r.source} (${r.domain})`).join(' | ').replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Generate CSV content from competitors analysis
 */
export function competitorsToCSV(competitors: CompetitorMetrics[]): string {
  const headers = [
    'brand',
    'cited_count',
    'mentioned_count',
    'unique_domains',
    'average_rank',
    'cited_in_prompts',
    'prompt_cited_rate',
    'mention_rate'
  ];

  const rows = competitors.map(c => [
    `"${c.brand.replace(/"/g, '""')}"`,
    c.citedCount.toString(),
    c.mentionedCount.toString(),
    `"${c.uniqueDomains.join(', ').replace(/"/g, '""')}"`,
    c.averageRank.toFixed(2),
    c.citedInPrompts.toString(),
    (c.promptCitedRate * 100).toFixed(1) + '%',
    (c.mentionRate * 100).toFixed(1) + '%'
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
