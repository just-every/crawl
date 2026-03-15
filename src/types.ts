export interface CrawlOptions {
  depth?: number;
  maxConcurrency?: number;
  respectRobots?: boolean;
  sameOriginOnly?: boolean;
  userAgent?: string;
  cacheDir?: string;
  timeout?: number;
  // Optional cookies
  // Raw Cookie header to send on all requests (advanced override)
  cookieHeader?: string;
  // Path to a Netscape cookie file (.txt) used to build Cookie headers per URL
  cookiesFile?: string;
  // Whether to include metadata in the crawl results
  includeMetadata?: boolean;
  // Whether to clear the cache directory before crawling
  clearCache?: boolean;
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
  metadata?: PageMetadata;
}

export interface CacheEntry {
  url: string;
  markdown: string;
  timestamp: number;
  title?: string;
  metadata?: PageMetadata;
}

export interface PageMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterSite?: string;
  twitterCreator?: string;
  canonical?: string;
  publishedTime?: string;
  modifiedTime?: string;
  language?: string;
}
