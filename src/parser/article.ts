import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { Article } from '../types.js';

export function extractArticle(dom: JSDOM): Article | null {
    const document = dom.window.document;
    const baseUrl = dom.window.location.href;

    // Check if this looks like a blog/article page with clear article structure
    const articleParagraph = document.querySelector('article p');
    const hasStrongArticleIndicators =
        (document.querySelector('article') !== null &&
            articleParagraph?.textContent &&
            articleParagraph.textContent.length > 200) ||
        document.querySelector('[itemtype*="BlogPosting"]') !== null ||
        document.querySelector('[itemtype*="NewsArticle"]') !== null ||
        document.querySelector('meta[property="article:published_time"]') !==
            null;

    // Only use Readability for clear article/blog pages
    if (hasStrongArticleIndicators) {
        // Clone document to avoid modifying the original
        const documentClone = document.cloneNode(true) as Document;

        // Try Readability
        const reader = new Readability(documentClone);
        const article = reader.parse();

        // If Readability returns substantial content, use it
        if (article && article.content && article.content.trim().length > 500) {
            return {
                title: article.title || 'Untitled',
                content: article.content || '',
                textContent: article.textContent || '',
                length: article.length || 0,
                excerpt: article.excerpt || '',
                byline: article.byline || null,
                dir: article.dir || null,
                lang: article.lang || null,
                siteName: article.siteName || null,
                publishedTime: article.publishedTime || null,
                baseUrl,
            };
        }
    }

    // For all other pages (homepages, product pages, etc), extract all content
    return extractContentManually(dom);
}

function extractContentManually(dom: JSDOM): Article | null {
    try {
        const document = dom.window.document;
        const baseUrl = dom.window.location.href;

        // Get title - try multiple sources
        const title =
            document.querySelector('title')?.textContent ||
            document.querySelector('h1')?.textContent ||
            document
                .querySelector('meta[property="og:title"]')
                ?.getAttribute('content') ||
            document
                .querySelector('meta[name="title"]')
                ?.getAttribute('content') ||
            'Untitled Page';

        // Get author/byline
        const byline =
            document
                .querySelector('meta[name="author"]')
                ?.getAttribute('content') ||
            document.querySelector('[rel="author"]')?.textContent ||
            document.querySelector('.author')?.textContent ||
            null;

        // Handle cases where body might not exist
        if (!document.body) {
            // Try to extract from documentElement instead
            const html = document.documentElement?.innerHTML || '';
            return {
                title: title.trim(),
                content: html,
                byline,
                excerpt: '',
                dir: null,
                lang: document.documentElement?.lang || null,
                length: html.length,
                siteName: null,
                textContent: document.documentElement?.textContent || '',
                publishedTime: null,
                baseUrl,
            };
        }

        // Clone body and only remove script/style elements
        const contentClone = document.body.cloneNode(true) as HTMLElement;

        // Only remove truly non-text elements
        const selectorsToRemove = ['script', 'style', 'noscript', 'template'];

        selectorsToRemove.forEach(selector => {
            try {
                contentClone
                    .querySelectorAll(selector)
                    .forEach(el => el.remove());
            } catch {
                // Continue if selector fails
            }
        });

        // Use the entire body content
        const mainContent = contentClone;

        // Preserve structure and links
        const content = mainContent.innerHTML || mainContent.textContent || '';

        return {
            title: title.trim(),
            content,
            byline,
            excerpt: '',
            dir: null,
            lang: document.documentElement?.lang || null,
            length: content.length,
            siteName: null,
            textContent: mainContent.textContent || '',
            publishedTime: null,
            baseUrl,
        };
    } catch (error) {
        // Last resort - try to get any text content
        console.error('Error in manual extraction:', error);
        return {
            title: 'Error extracting content',
            content:
                dom.window.document.body?.innerHTML ||
                dom.window.document.documentElement?.innerHTML ||
                '',
            byline: null,
            excerpt: '',
            dir: null,
            lang: null,
            length: 0,
            siteName: null,
            textContent: dom.window.document.body?.textContent || '',
            publishedTime: null,
            baseUrl: dom.window.location.href,
        };
    }
}

export function hasContent(html: string): boolean {
    // Quick check for common no-content indicators
    const lowerHtml = html.toLowerCase();

    if (
        lowerHtml.includes('<noscript>') &&
        !lowerHtml.includes('<article') &&
        !lowerHtml.includes('<main')
    ) {
        return false;
    }

    // Check if there's substantial text content
    const textContent = html.replace(/<[^>]*>/g, '').trim();
    return textContent.length > 100;
}