import { CrawlQueue } from './crawler/queue.js';
export { CrawlQueue } from './crawler/queue.js';
import { createToolFunction } from '@just-every/ensemble';
/**
 * Fetch a URL and convert it to markdown
 * @param url - The URL to fetch
 * @param options - Crawling options
 * @returns Promise with crawl results
 */
export async function fetch(url, options = {}) {
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
export async function fetchMarkdown(url, options = {}) {
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
export function getCrawlTools() {
    return [
        createToolFunction(async (url, depth) => {
            const results = await fetch(url, { depth });
            return results
                .filter(result => !result.error && result.markdown)
                .map(result => result.markdown)
                .join('\n\n---\n\n');
        }, 'Quickly fetch a URL and convert it to markdown', {
            url: {
                type: 'string',
                description: 'Starting URL',
            },
            depth: {
                type: 'number',
                description: 'How many pages to crawl (default: 1)',
                optional: true,
            },
        }, undefined, 'web_fetch'),
    ];
}
//# sourceMappingURL=index.js.map