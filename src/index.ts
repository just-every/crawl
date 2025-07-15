import { CrawlQueue } from './crawler/queue.js';
import { CrawlOptions, CrawlResult } from './types.js';

export type { CrawlOptions, CrawlResult, Article, CacheEntry } from './types.js';
export { CrawlQueue } from './crawler/queue.js';

/**
 * Fetch a URL and convert it to markdown
 * @param url - The URL to fetch
 * @param options - Crawling options
 * @returns Promise with crawl results
 */
export async function fetch(url: string, options: CrawlOptions = {}): Promise<CrawlResult[]> {
    const queue = new CrawlQueue(options);
    await queue.init();
    return await queue.crawl(url);
}

/**
 * Fetch a single URL and return only the markdown content
 * @param url - The URL to fetch
 * @param options - Crawling options
 * @returns Promise with markdown string
 */
export async function fetchMarkdown(url: string, options: CrawlOptions = {}): Promise<string> {
    const results = await fetch(url, { ...options, depth: 0 });
    if (results.length === 0) {
        throw new Error('No results returned');
    }
    
    const result = results[0];
    if (result.error) {
        throw new Error(result.error);
    }
    
    return result.markdown;
}