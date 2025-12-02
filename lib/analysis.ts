import { KeywordRow, Reference, KeywordRecord, CompetitorMetrics, AnalysisResult } from './types';

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  // Find brand rank in citations
  const brandRef = references.find(r =>
    r.domain.toLowerCase().includes(brandDomain.toLowerCase()) ||
    r.source.toLowerCase().includes(brandName.toLowerCase())
  );

  return {
    id: row.id,
    keyword: row.keyword,
    hasAIOverview: row.has_ai_overview === 1,
    aioMarkdown: row.aio_markdown,
    references,
    referenceCount: references.length,
    brandRank: brandRef?.rank || null
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
  }>();

  // Count citations per brand (source)
  for (const kw of aioKeywords) {
    for (const ref of kw.references) {
      const brand = ref.source;
      if (!brand) continue;

      if (!brandMap.has(brand)) {
        brandMap.set(brand, {
          citedCount: 0,
          domains: new Set(),
          ranks: [],
          citedInPrompts: new Set(),
          mentionedInPrompts: new Set()
        });
      }

      const data = brandMap.get(brand)!;
      data.citedCount++;
      data.domains.add(ref.domain);
      data.ranks.push(ref.rank);
      data.citedInPrompts.add(kw.keyword);
    }
  }

  // Check brand mentions in markdown text
  for (const kw of aioKeywords) {
    if (!kw.aioMarkdown) continue;

    brandMap.forEach((data, brand) => {
      // Word boundary check for brand mention
      try {
        const pattern = new RegExp(`\\b${escapeRegex(brand)}\\b`, 'i');
        if (pattern.test(kw.aioMarkdown!)) {
          data.mentionedInPrompts.add(kw.keyword);
        }
      } catch {
        // Ignore regex errors
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
      mentionRate: totalPrompts > 0 ? data.mentionedInPrompts.size / totalPrompts : 0
    }))
    // Sort by total engagement (citations + mentions)
    .sort((a, b) => (b.citedCount + b.mentionedCount) - (a.citedCount + a.mentionedCount));

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
