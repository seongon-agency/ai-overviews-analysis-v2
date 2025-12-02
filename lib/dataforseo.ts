import { DataForSEOResult } from './types';

const API_URL = 'https://api.dataforseo.com/v3/serp/google/organic/live/advanced';

/**
 * Fetch a single keyword from DataForSEO API
 */
export async function fetchKeyword(
  keyword: string,
  locationCode: string,
  languageCode: string
): Promise<DataForSEOResult> {
  const apiKey = process.env.SEO_API_KEY;

  if (!apiKey) {
    throw new Error('SEO_API_KEY environment variable is not set');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{
      keyword,
      location_code: parseInt(locationCode, 10),
      language_code: languageCode,
      depth: 10,
      group_organic_results: true,
      load_async_ai_overview: true,
    }]),
  });

  if (!response.ok) {
    throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO error: ${data.status_message}`);
  }

  if (!data.tasks?.[0]?.result?.[0]) {
    throw new Error('No result returned from DataForSEO');
  }

  return data.tasks[0].result[0];
}

/**
 * Fetch multiple keywords with concurrency control
 */
export async function fetchKeywordsBatch(
  keywords: string[],
  locationCode: string,
  languageCode: string,
  onProgress?: (completed: number, total: number) => void
): Promise<{ keyword: string; result: DataForSEOResult | null; error?: string }[]> {
  const BATCH_SIZE = 50; // Max concurrent requests
  const results: { keyword: string; result: DataForSEOResult | null; error?: string }[] = [];
  let completed = 0;

  // Process in batches
  for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
    const batch = keywords.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(async (keyword) => {
      try {
        const result = await fetchKeyword(keyword, locationCode, languageCode);
        return { keyword, result, error: undefined };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { keyword, result: null, error: errorMessage };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    completed += batch.length;
    onProgress?.(completed, keywords.length);
  }

  return results;
}
