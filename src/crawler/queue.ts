import pLimit from 'p-limit';
import { CrawlOptions, CrawlResult } from '../types.js';
import { normalizeUrl, isSameOrigin } from '../cache/normalize.js';
import { DiskCache } from '../cache/disk.js';
import { fetchStream, isValidUrl } from './fetch.js';
import { parseNetscapeCookieFile, buildCookieHeaderForUrl, type CookieEntry } from './cookies.js';
import { isAllowedByRobots, getCrawlDelay } from './robots.js';
import { htmlToDom, extractLinks } from '../parser/dom.js';
import { extractArticle } from '../parser/article.js';
import { formatArticleMarkdown } from '../parser/markdown.js';

export class CrawlQueue {
    private visited = new Set<string>();
    private queue: string[] = [];
    private limit: ReturnType<typeof pLimit>;
    private cache: DiskCache;
    private options: Required<Omit<CrawlOptions, 'cookieHeader' | 'cookiesFile'>> & Pick<CrawlOptions, 'cookieHeader' | 'cookiesFile'>;
    private results: CrawlResult[] = [];
    private cookieJar?: CookieEntry[];

    constructor(options: CrawlOptions = {}) {
        this.options = {
            depth: options.depth ?? 0,
            maxConcurrency: options.maxConcurrency ?? 3,
            respectRobots: options.respectRobots ?? true,
            sameOriginOnly: options.sameOriginOnly ?? true,
            userAgent: options.userAgent ?? 'MCP/0.1',
            cacheDir: options.cacheDir ?? '.cache',
            timeout: options.timeout ?? 30000,
            cookieHeader: options.cookieHeader,
            cookiesFile: options.cookiesFile,
        };

        this.limit = pLimit(this.options.maxConcurrency);
        this.cache = new DiskCache(this.options.cacheDir);
        // Load cookies file once if provided
        if (options.cookiesFile) {
            try {
                this.cookieJar = parseNetscapeCookieFile(options.cookiesFile);
            } catch {
                // Ignore cookie file errors and proceed without cookies
                this.cookieJar = undefined;
            }
        }
    }

    async init(): Promise<void> {
        await this.cache.init();
    }

    async crawl(startUrl: string): Promise<CrawlResult[]> {
        const normalizedUrl = normalizeUrl(startUrl);

        if (!isValidUrl(normalizedUrl)) {
            throw new Error(`Invalid URL: ${startUrl}`);
        }

        this.queue.push(normalizedUrl);
        await this.processQueue(0);

        return this.results;
    }

    private async processQueue(currentDepth: number): Promise<void> {
        if (currentDepth > this.options.depth) return;

        const urls = [...this.queue];
        this.queue = [];

        const tasks = urls.map(url =>
            this.limit(() => this.processUrl(url, currentDepth))
        );

        await Promise.all(tasks);

        if (this.queue.length > 0) {
            await this.processQueue(currentDepth + 1);
        }
    }

    private async processUrl(url: string, depth: number): Promise<void> {
        const normalizedUrl = normalizeUrl(url);

        if (this.visited.has(normalizedUrl)) return;
        this.visited.add(normalizedUrl);

        try {
            // Check cache first
            const cached = await this.cache.get(normalizedUrl);
            if (cached) {
                this.results.push({
                    url: normalizedUrl,
                    markdown: cached.markdown,
                    title: cached.title,
                });
                return;
            }

            // Check robots.txt
            if (this.options.respectRobots) {
                const allowed = await isAllowedByRobots(
                    normalizedUrl,
                    this.options.userAgent
                );
                if (!allowed) {
                    this.results.push({
                        url: normalizedUrl,
                        markdown: '',
                        error: 'Blocked by robots.txt',
                    });
                    return;
                }

                const delay = await getCrawlDelay(
                    normalizedUrl,
                    this.options.userAgent
                );
                if (delay > 0) {
                    await new Promise(resolve =>
                        setTimeout(resolve, delay * 1000)
                    );
                }
            }

            // Fetch and parse
            const cookieHeader = this.options.cookieHeader || (this.cookieJar ? buildCookieHeaderForUrl(normalizedUrl, this.cookieJar) : undefined);
            const html = await fetchStream(normalizedUrl, {
                userAgent: this.options.userAgent,
                timeout: this.options.timeout,
                cookieHeader,
            });

            // Check if we got valid HTML
            if (!html || html.trim().length === 0) {
                this.results.push({
                    url: normalizedUrl,
                    markdown: '',
                    error: 'Empty response from server',
                });
                return;
            }

            const dom = htmlToDom(html, normalizedUrl);
            const article = extractArticle(dom);

            if (!article) {
                this.results.push({
                    url: normalizedUrl,
                    markdown: '',
                    error: 'Failed to extract article content',
                });
                return;
            }

            // Check if we got meaningful content
            // For SPAs and JavaScript-heavy sites, we still want to extract whatever we can
            if (!article.content || article.content.trim().length < 50) {
                // Try to provide some basic content instead of failing
                const fallbackMarkdown =
                    `# ${article.title || 'Page Content'}\n\n` +
                    `*Note: This page appears to be JavaScript-rendered. Limited content extracted.*\n\n` +
                    (article.textContent
                        ? article.textContent.substring(0, 1000) + '...'
                        : 'No text content available');

                this.results.push({
                    url: normalizedUrl,
                    markdown: fallbackMarkdown,
                    title: article.title || normalizedUrl,
                    error: 'Limited content extracted (JavaScript-rendered page)',
                });
                return;
            }

            const markdown = formatArticleMarkdown(article);

            // Cache the result
            await this.cache.put(normalizedUrl, markdown, article.title);

            // Extract links for further crawling
            let links: string[] = [];
            if (depth < this.options.depth) {
                links = extractLinks(dom);

                if (this.options.sameOriginOnly) {
                    links = links.filter(link =>
                        isSameOrigin(normalizedUrl, link)
                    );
                }

                // Add to queue
                links.forEach(link => {
                    const normalized = normalizeUrl(link);
                    if (!this.visited.has(normalized)) {
                        this.queue.push(normalized);
                    }
                });
            }

            this.results.push({
                url: normalizedUrl,
                markdown,
                title: article.title,
                links: links.length > 0 ? links : undefined,
            });
        } catch (error) {
            this.results.push({
                url: normalizedUrl,
                markdown: '',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
}
