import { CrawlOptions, CrawlResult } from './types.js';
export type { CrawlOptions, CrawlResult, Article, CacheEntry } from './types.js';
export { CrawlQueue } from './crawler/queue.js';
import { ToolFunction } from '@just-every/ensemble';
/**
 * Fetch a URL and convert it to markdown
 * @param url - The URL to fetch
 * @param options - Crawling options
 * @returns Promise with crawl results
 */
export declare function fetch(url: string, options?: CrawlOptions): Promise<CrawlResult[]>;
/**
 * Fetch a single URL and return only the markdown content
 * @param url - The URL to fetch
 * @param options - Crawling options
 * @returns Promise with markdown string
 */
export declare function fetchMarkdown(url: string, options?: CrawlOptions): Promise<string>;
export declare function getCrawlTools(): ToolFunction[];
//# sourceMappingURL=index.d.ts.map