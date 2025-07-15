# @just-every/crawl

Fast, token-efficient web content extraction - fetch web pages and convert to clean Markdown. Perfect for LLMs to read data from web pages quickly and efficiently.

## Features

- 🚀 Fast HTML to Markdown conversion
- 📄 Clean, readable markdown output
- 🤖 Respects robots.txt by default
- 💾 Built-in caching for repeated requests
- 🔄 Multi-page crawling with depth control
- 🎯 Smart content extraction using Mozilla's Readability
- ⚡ Concurrent fetching with configurable limits
- 🔗 Automatic relative URL resolution

## Installation

```bash
npm install @just-every/crawl
```

## Usage

### Command Line

```bash
# Fetch a single page
npx web-crawl https://example.com

# Crawl with depth
npx web-crawl https://example.com --depth 2 --concurrency 5

# Output as JSON
npx web-crawl https://example.com --output json

# Custom user agent and timeout
npx web-crawl https://example.com --user-agent "MyBot/1.0" --timeout 60000
```

### Programmatic API

```javascript
import { fetch, fetchMarkdown } from '@just-every/crawl';

// Fetch and convert a single URL to markdown
const markdown = await fetchMarkdown('https://example.com');
console.log(markdown);

// Fetch with options
const results = await fetch('https://example.com', {
    depth: 2,              // Crawl depth (0 = single page)
    maxConcurrency: 5,     // Max concurrent requests
    respectRobots: true,   // Respect robots.txt
    sameOriginOnly: true,  // Only crawl same origin
    userAgent: 'MyBot/1.0',
    cacheDir: '.cache',
    timeout: 30000         // Request timeout in ms
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
  -d, --depth <number>      Crawl depth (0 = single page) (default: 0)
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
    depth?: number;           // Crawl depth (0 = single page)
    maxConcurrency?: number;  // Max concurrent requests
    respectRobots?: boolean;  // Respect robots.txt
    sameOriginOnly?: boolean; // Only crawl same origin
    userAgent?: string;       // Custom user agent
    cacheDir?: string;        // Cache directory
    timeout?: number;         // Request timeout in ms
}

interface CrawlResult {
    url: string;             // The URL that was crawled
    markdown: string;        // Converted markdown content
    title?: string;          // Page title
    links?: string[];        // Extracted links (if depth > 0)
    error?: string;          // Error message if failed
}
```

## License

MIT