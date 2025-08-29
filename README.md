# @just-every/crawl

Fast, token-efficient web content extraction - fetch web pages and convert to clean Markdown. Perfect for LLMs to read data from web pages quickly and efficiently.

## Features

- 🚀 Fast HTML to Markdown conversion using Mozilla's Readability
- 📄 Clean, readable markdown output optimized for LLMs
- 🤖 Respects robots.txt (configurable)
- 💾 Built-in SHA-256 based caching with graceful fallbacks
- 🔄 Multi-page crawling with intelligent link extraction
- ⚡ Concurrent fetching with configurable limits (default: 3)
- 🔗 Automatic relative to absolute URL conversion in markdown
- 🛡️ Robust error handling and timeout management

## Installation

```bash
npm install @just-every/crawl
```

## Usage

### Command Line

```bash
# Fetch a single page
npx web-crawl https://example.com

# Crawl multiple pages (specify max pages to crawl)
npx web-crawl https://example.com --pages 3 --concurrency 5

# Output as JSON
npx web-crawl https://example.com --output json

# Custom user agent and timeout
npx web-crawl https://example.com --user-agent "MyBot/1.0" --timeout 60000

# Disable robots.txt checking
npx web-crawl https://example.com --no-robots
```

### Programmatic API

```javascript
import { fetch, fetchMarkdown } from '@just-every/crawl';

// Fetch and convert a single URL to markdown
const markdown = await fetchMarkdown('https://example.com');
console.log(markdown);

// Fetch multiple pages with options
const results = await fetch('https://example.com', {
    pages: 3,              // Maximum pages to crawl (default: 1)
    maxConcurrency: 5,     // Max concurrent requests (default: 3)
    respectRobots: true,   // Respect robots.txt (default: true)
    sameOriginOnly: true,  // Only crawl same origin (default: true)
    userAgent: 'MyBot/1.0',
    cacheDir: '.cache',
    timeout: 30000         // Request timeout in ms (default: 30000)
});

// Process results
results.forEach(result => {
    if (result.error) {
        console.error(`Error for ${result.url}: ${result.error}`);
    } else {
        console.log(`# ${result.title}`);
        console.log(result.markdown);
    }
});
```

## CLI Options

```
Options:
  -p, --pages <number>      Maximum pages to crawl (default: 1)
  -c, --concurrency <n>     Max concurrent requests (default: 3)
  --no-robots               Ignore robots.txt
  --all-origins             Allow cross-origin crawling
  -u, --user-agent <agent>  Custom user agent
  --cache-dir <path>        Cache directory (default: ".cache")
  -t, --timeout <ms>        Request timeout in milliseconds (default: 30000)
  -o, --output <format>     Output format: json, markdown, or both (default: "markdown")
  -h, --help                Display help
```

## API Reference

### `fetch(url, options)`

Fetches a URL and returns an array of crawl results.

**Parameters:**
- `url` (string): The URL to fetch
- `options` (CrawlOptions): Optional crawling configuration

**Returns:** `Promise<CrawlResult[]>`

### `fetchMarkdown(url, options)`

Fetches a single URL and returns only the markdown content.

**Parameters:**
- `url` (string): The URL to fetch
- `options` (CrawlOptions): Optional crawling configuration

**Returns:** `Promise<string>`

### Types

```typescript
interface CrawlOptions {
    pages?: number;           // Maximum pages to crawl (default: 1)
    maxConcurrency?: number;  // Max concurrent requests (default: 3)
    respectRobots?: boolean;  // Respect robots.txt (default: true)
    sameOriginOnly?: boolean; // Only crawl same origin (default: true)
    userAgent?: string;       // Custom user agent
    cacheDir?: string;        // Cache directory (default: ".cache")
    timeout?: number;         // Request timeout in ms (default: 30000)
}

interface CrawlResult {
    url: string;             // The URL that was crawled
    markdown: string;        // Converted markdown content
    title?: string;          // Page title
    links?: string[];        // Links extracted from markdown content
    error?: string;          // Error message if failed
}
```

## License

MIT