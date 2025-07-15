export function normalizeUrl(url: string): string {
    try {
        const parsed = new URL(url);

        // Remove trailing slash unless it's the root
        if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
            parsed.pathname = parsed.pathname.slice(0, -1);
        }

        // Sort query parameters for consistency
        const params = Array.from(parsed.searchParams.entries());
        params.sort(([a], [b]) => a.localeCompare(b));
        parsed.search = '';
        params.forEach(([key, value]) =>
            parsed.searchParams.append(key, value)
        );

        // Remove default ports
        if (
            (parsed.protocol === 'http:' && parsed.port === '80') ||
            (parsed.protocol === 'https:' && parsed.port === '443')
        ) {
            parsed.port = '';
        }

        // Remove fragment
        parsed.hash = '';

        return parsed.href;
    } catch {
        return url;
    }
}

export function isSameOrigin(url1: string, url2: string): boolean {
    try {
        const u1 = new URL(url1);
        const u2 = new URL(url2);
        return u1.origin === u2.origin;
    } catch {
        return false;
    }
}