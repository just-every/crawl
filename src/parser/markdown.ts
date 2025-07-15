import TurndownService from 'turndown';
// @ts-expect-error - turndown-plugin-gfm doesn't have types
import { gfm } from 'turndown-plugin-gfm';
import { JSDOM } from 'jsdom';

function convertRelativeUrls(html: string, baseUrl: string): string {
    try {
        const dom = new JSDOM(html, { url: baseUrl });
        const document = dom.window.document;

        // Convert all relative URLs in links
        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');
            if (
                href &&
                !href.startsWith('http://') &&
                !href.startsWith('https://') &&
                !href.startsWith('//') &&
                !href.startsWith('mailto:') &&
                !href.startsWith('tel:') &&
                !href.startsWith('javascript:') &&
                !href.startsWith('#')
            ) {
                try {
                    const absoluteUrl = new URL(href, baseUrl).href;
                    link.setAttribute('href', absoluteUrl);
                } catch {
                    // Keep original if URL construction fails
                }
            }
        });

        // Convert all relative URLs in images
        document.querySelectorAll('img[src]').forEach(img => {
            const src = img.getAttribute('src');
            if (
                src &&
                !src.startsWith('http://') &&
                !src.startsWith('https://') &&
                !src.startsWith('//') &&
                !src.startsWith('data:')
            ) {
                try {
                    const absoluteUrl = new URL(src, baseUrl).href;
                    img.setAttribute('src', absoluteUrl);
                } catch {
                    // Keep original if URL construction fails
                }
            }
        });

        // Return the full document HTML to preserve the converted URLs
        const bodyElement = document.body || document.documentElement;
        return bodyElement ? bodyElement.innerHTML : html;
    } catch {
        // If conversion fails, return original HTML
        return html;
    }
}

export function createTurndownService(): TurndownService {
    const turndown = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        linkStyle: 'inlined',
        emDelimiter: '_',
        bulletListMarker: '-',
        strongDelimiter: '**',
        hr: '---',
        // Preserve more content
        blankReplacement: (_content, node) => {
            return (node as any).isBlock ? '\n\n' : '';
        },
        keepReplacement: (content, node) => {
            return (node as any).isBlock ? '\n\n' + content + '\n\n' : content;
        },
        defaultReplacement: (content, node) => {
            return (node as any).isBlock ? '\n\n' + content + '\n\n' : content;
        },
    });

    // Use GFM plugin for tables, strikethrough, etc.
    turndown.use(gfm);

    // Custom rule: preserve media placeholders
    turndown.addRule('media', {
        filter: ['iframe', 'video', 'audio', 'embed'],
        replacement: (_content, node) => {
            const element = node as HTMLElement;
            const src =
                element.getAttribute('src') || element.getAttribute('data-src');
            const title =
                element.getAttribute('title') ||
                element.getAttribute('alt') ||
                'media';

            if (src) {
                return `\n\n[${title}](${src})\n\n`;
            }
            return '';
        },
    });

    // Custom rule: preserve figure captions
    turndown.addRule('figure', {
        filter: 'figure',
        replacement: (content, node) => {
            const figure = node as HTMLElement;
            const caption = figure.querySelector('figcaption');

            if (caption) {
                const captionText = caption.textContent || '';
                return `\n\n${content.trim()}\n*${captionText}*\n\n`;
            }
            return `\n\n${content.trim()}\n\n`;
        },
    });

    // Remove the aggressive cleanup rule to preserve more content structure

    return turndown;
}

export function htmlToMarkdown(html: string): string {
    const turndown = createTurndownService();
    let markdown = turndown.turndown(html);

    // Post-processing cleanup
    markdown = markdown
        .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
        .replace(/\s+$/gm, '') // Trim trailing spaces
        .trim();

    return markdown;
}

export function formatArticleMarkdown(article: {
    title: string;
    content: string;
    byline?: string | null;
    baseUrl?: string;
}): string {
    try {
        const turndown = createTurndownService();
        let markdown = '';

        // Only add title if it exists and is not empty
        if (article.title && article.title.trim()) {
            markdown = `# ${article.title}\n\n`;
        }

        if (article.byline) {
            markdown += `*By ${article.byline}*\n\n---\n\n`;
        }

        // Try to convert content
        try {
            // Pre-process HTML to convert relative URLs if baseUrl is provided
            const processedContent = article.baseUrl
                ? convertRelativeUrls(article.content, article.baseUrl)
                : article.content;

            markdown += turndown.turndown(processedContent);
        } catch (conversionError) {
            console.error(
                'Error converting HTML to markdown:',
                conversionError
            );
            // Fallback: extract text content if markdown conversion fails
            const tempDiv =
                typeof document !== 'undefined'
                    ? document.createElement('div')
                    : null;

            if (tempDiv) {
                tempDiv.innerHTML = article.content;
                markdown += tempDiv.textContent || article.content;
            } else {
                // Last resort: strip HTML tags manually
                markdown += article.content
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/\s+/g, ' ');
            }
        }

        // Post-processing
        return markdown
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\s+$/gm, '')
            .trim();
    } catch (error) {
        console.error('Fatal error in formatArticleMarkdown:', error);
        // Return at least the title
        return article.title
            ? `# ${article.title}\n\n[Content extraction failed]`
            : '[Content extraction failed]';
    }
}