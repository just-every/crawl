import { createHash } from 'crypto';
import { mkdir, readFile, writeFile, access } from 'fs/promises';
import { join } from 'path';
import { CacheEntry } from '../types.js';

export class DiskCache {
    private cacheDir: string;

    constructor(cacheDir: string = '.cache') {
        this.cacheDir = cacheDir;
    }

    async init(): Promise<void> {
        await mkdir(this.cacheDir, { recursive: true });
    }

    private getCacheKey(url: string): string {
        return createHash('sha256').update(url).digest('hex');
    }

    private getCachePath(url: string): string {
        const key = this.getCacheKey(url);
        return join(this.cacheDir, `${key}.json`);
    }

    async has(url: string): Promise<boolean> {
        try {
            await access(this.getCachePath(url));
            return true;
        } catch {
            return false;
        }
    }

    async get(url: string): Promise<CacheEntry | null> {
        try {
            const path = this.getCachePath(url);
            const data = await readFile(path, 'utf-8');
            return JSON.parse(data) as CacheEntry;
        } catch {
            return null;
        }
    }

    async put(url: string, markdown: string, title?: string): Promise<void> {
        const entry: CacheEntry = {
            url,
            markdown,
            timestamp: Date.now(),
            title,
        };

        const path = this.getCachePath(url);
        await writeFile(path, JSON.stringify(entry, null, 2));
    }

    async getAge(url: string): Promise<number | null> {
        const entry = await this.get(url);
        if (!entry) return null;
        return Date.now() - entry.timestamp;
    }
}