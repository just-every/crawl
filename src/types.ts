export interface CrawlOptions {
    depth?: number;
    maxConcurrency?: number;
    respectRobots?: boolean;
    sameOriginOnly?: boolean;
    userAgent?: string;
    cacheDir?: string;
    timeout?: number;
}

export interface Article {
    title: string;
    content: string;
    textContent: string;
    length: number;
    excerpt: string;
    byline: string | null;
    dir: string | null;
    siteName: string | null;
    lang: string | null;
    publishedTime: string | null;
    baseUrl?: string;
}

export interface CrawlResult {
    url: string;
    markdown: string;
    title?: string;
    links?: string[];
    error?: string;
}

export interface CacheEntry {
    url: string;
    markdown: string;
    timestamp: number;
    title?: string;
}