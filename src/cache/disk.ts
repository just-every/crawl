import { createHash } from 'crypto';
import { mkdir, readFile, writeFile, access } from 'fs/promises';
import { join } from 'path';
import { CacheEntry } from '../types.js';

export class DiskCache {
    private cacheDir: string;
    private cacheEnabled: boolean = true;

    constructor(cacheDir: string = '.cache') {
        this.cacheDir = cacheDir;
    }

    async init(): Promise<void> {
        try {
            await mkdir(this.cacheDir, { recursive: true });
        } catch (error) {
            // If we can't create the cache directory, disable caching
            // Only show warning in debug mode or when explicitly requested
            if (process.env.DEBUG || process.env.CRAWL_DEBUG) {
                console.warn(`Cache directory creation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Caching will be disabled.`);
            }
            this.cacheEnabled = false;
        }
    }

    private getCacheKey(url: string): string {
        return createHash('sha256').update(url).digest('hex');
    }

    private getCachePath(url: string): string {
        const key = this.getCacheKey(url);
        return join(this.cacheDir, `${key}.json`);
    }

    async has(url: string): Promise<boolean> {
        if (!this.cacheEnabled) return false;
        
        try {
            await access(this.getCachePath(url));
            return true;
        } catch {
            return false;
        }
    }

    async get(url: string): Promise<CacheEntry | null> {
        if (!this.cacheEnabled) return null;
        
        try {
            const path = this.getCachePath(url);
            const data = await readFile(path, 'utf-8');
            return JSON.parse(data) as CacheEntry;
        } catch {
            return null;
        }
    }

    async put(url: string, markdown: string, title?: string): Promise<void> {
        if (!this.cacheEnabled) return;
        
        const entry: CacheEntry = {
            url,
            markdown,
            timestamp: Date.now(),
            title,
        };

        const path = this.getCachePath(url);
        try {
            await writeFile(path, JSON.stringify(entry, null, 2));
        } catch (error) {
            // Only show warning in debug mode
            if (process.env.DEBUG || process.env.CRAWL_DEBUG) {
                console.warn(`Failed to write to cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }

    async getAge(url: string): Promise<number | null> {
        const entry = await this.get(url);
        if (!entry) return null;
        return Date.now() - entry.timestamp;
    }
}