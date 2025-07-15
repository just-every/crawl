#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fetch } from './index.js';
const argv = yargs(hideBin(process.argv))
    .command('$0 <url>', 'Fetch a URL and convert to Markdown', (yargs) => {
    return yargs
        .positional('url', {
        describe: 'The URL to fetch',
        type: 'string',
        demandOption: true,
    })
        .option('depth', {
        alias: 'd',
        describe: 'Crawl depth (0 = single page)',
        type: 'number',
        default: 0,
    })
        .option('concurrency', {
        alias: 'c',
        describe: 'Max concurrent requests',
        type: 'number',
        default: 3,
    })
        .option('robots', {
        describe: 'Respect robots.txt',
        type: 'boolean',
        default: true,
    })
        .option('all-origins', {
        describe: 'Allow cross-origin crawling',
        type: 'boolean',
        default: false,
    })
        .option('user-agent', {
        alias: 'u',
        describe: 'Custom user agent',
        type: 'string',
    })
        .option('cache-dir', {
        describe: 'Cache directory',
        type: 'string',
        default: '.cache',
    })
        .option('timeout', {
        alias: 't',
        describe: 'Request timeout in milliseconds',
        type: 'number',
        default: 30000,
    })
        .option('output', {
        alias: 'o',
        describe: 'Output format',
        type: 'string',
        choices: ['json', 'markdown', 'both'],
        default: 'markdown',
    });
}, async (argv) => {
    try {
        const crawlOptions = {
            depth: argv.depth,
            maxConcurrency: argv.concurrency,
            respectRobots: argv.robots,
            sameOriginOnly: !argv.allOrigins,
            userAgent: argv.userAgent,
            cacheDir: argv.cacheDir,
            timeout: argv.timeout,
        };
        console.error(`Fetching ${argv.url}...`);
        const results = await fetch(argv.url, crawlOptions);
        if (argv.output === 'json') {
            console.log(JSON.stringify(results, null, 2));
        }
        else if (argv.output === 'markdown') {
            results.forEach(result => {
                // Always output markdown if we have it, even with errors
                if (result.markdown) {
                    console.log(result.markdown);
                    if (results.length > 1) {
                        console.log('\n---\n'); // Separator between multiple pages
                    }
                }
                // Show error as warning if we also have content
                if (result.error && result.markdown) {
                    console.error(`Warning for ${result.url}: ${result.error}`);
                }
                else if (result.error && !result.markdown) {
                    console.error(`Error for ${result.url}: ${result.error}`);
                }
            });
        }
        else if (argv.output === 'both') {
            results.forEach(result => {
                console.log(`\n## URL: ${result.url}\n`);
                if (result.markdown) {
                    console.log(result.markdown);
                }
                if (result.error) {
                    console.error(`${result.markdown ? 'Warning' : 'Error'}: ${result.error}`);
                }
            });
        }
        // Exit with error only if we have errors without content
        const hasFatalErrors = results.some(r => r.error && !r.markdown);
        if (hasFatalErrors) {
            process.exit(1);
        }
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
})
    .command('clear-cache', 'Clear the cache directory', (yargs) => {
    return yargs.option('cache-dir', {
        describe: 'Cache directory',
        type: 'string',
        default: '.cache',
    });
}, async (argv) => {
    try {
        const { rm } = await import('fs/promises');
        await rm(argv.cacheDir, { recursive: true, force: true });
        console.log(`Cache cleared: ${argv.cacheDir}`);
    }
    catch (error) {
        console.error('Error clearing cache:', error);
        process.exit(1);
    }
})
    .help()
    .parse();
//# sourceMappingURL=cli.js.map