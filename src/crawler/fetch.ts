import { fetch } from 'undici';

interface FetchOptions {
    userAgent?: string;
    timeout?: number;
    maxRedirections?: number;
    cookieHeader?: string;
}

export async function fetchStream(
    url: string,
    options: FetchOptions = {}
): Promise<string> {
    const {
        userAgent = 'MCP/0.1 (+https://github.com/just-every/mcp-read-website-fast)',
        timeout = 30000,
        maxRedirections = 5,
    } = options;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': userAgent,
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                DNT: '1',
                Connection: 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                ...(options.cookieHeader ? { Cookie: options.cookieHeader } : {}),
            },
            redirect: maxRedirections > 0 ? 'follow' : 'manual',
            signal: AbortSignal.timeout(timeout),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} for ${url}`);
        }

        const contentType = response.headers.get('content-type');
        if (
            contentType &&
            !contentType.includes('text/html') &&
            !contentType.includes('application/xhtml+xml')
        ) {
            throw new Error(`Non-HTML content type: ${contentType} for ${url}`);
        }

        return await response.text();
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to fetch ${url}: ${error.message}`);
        }
        throw error;
    }
}

export function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}
