import { fetchStream } from './fetch.js';

interface RobotsChecker {
    isAllowed(url: string, userAgent?: string): boolean;
    getCrawlDelay(userAgent?: string): number | undefined;
}

const robotsCache = new Map<string, RobotsChecker>();

export async function getRobotsChecker(
    origin: string,
    userAgent: string = '*'
): Promise<RobotsChecker> {
    const cached = robotsCache.get(origin);
    if (cached) return cached;

    try {
        const robotsUrl = new URL('/robots.txt', origin).href;
        const robotsTxt = await fetchStream(robotsUrl, {
            timeout: 5000,
            userAgent,
        });

        // Dynamic import for CommonJS module
        const robotsParserModule = (await import('robots-parser')) as any;
        const robotsParser = robotsParserModule.default || robotsParserModule;
        const robots = robotsParser(robotsUrl, robotsTxt);
        robotsCache.set(origin, robots);
        return robots;
    } catch {
        // If robots.txt fetch fails, create a permissive checker
        const permissive: RobotsChecker = {
            isAllowed: () => true,
            getCrawlDelay: () => undefined,
        };
        robotsCache.set(origin, permissive);
        return permissive;
    }
}

export async function isAllowedByRobots(
    url: string,
    userAgent: string = '*'
): Promise<boolean> {
    try {
        const { origin } = new URL(url);
        const checker = await getRobotsChecker(origin, userAgent);
        return checker.isAllowed(url, userAgent);
    } catch {
        return true; // Default to allowed if any error
    }
}

export async function getCrawlDelay(
    url: string,
    userAgent: string = '*'
): Promise<number> {
    try {
        const { origin } = new URL(url);
        const checker = await getRobotsChecker(origin, userAgent);
        return checker.getCrawlDelay(userAgent) || 0;
    } catch {
        return 0;
    }
}