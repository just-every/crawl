import { JSDOM, VirtualConsole } from 'jsdom';

export function htmlToDom(html: string, url: string): JSDOM {
    try {
        // First try without loading external resources to avoid errors
        return new JSDOM(html, {
            url,
            contentType: 'text/html',
            includeNodeLocations: false,
            runScripts: undefined, // Don't run scripts
            resources: undefined, // Don't load external resources
            pretendToBeVisual: true,
            virtualConsole: new VirtualConsole().sendTo(console, {
                omitJSDOMErrors: true,
            }),
        });
    } catch {
        // Try again with minimal options
        try {
            return new JSDOM(html, {
                url,
                contentType: 'text/html',
                virtualConsole: new VirtualConsole().sendTo(console, {
                    omitJSDOMErrors: true,
                }),
            });
        } catch {
            // Return a minimal DOM with the content
            return new JSDOM(
                `<!DOCTYPE html><html><body>${html}</body></html>`,
                {
                    url,
                    contentType: 'text/html',
                    virtualConsole: new VirtualConsole().sendTo(console, {
                        omitJSDOMErrors: true,
                    }),
                }
            );
        }
    }
}

export function extractLinks(dom: JSDOM): string[] {
    const document = dom.window.document;
    const links: string[] = [];
    const baseUrl = dom.window.location.href;

    const anchorElements = document.querySelectorAll('a[href]');

    anchorElements.forEach(element => {
        try {
            const href = element.getAttribute('href');
            if (!href) return;

            // Skip non-http links
            if (
                href.startsWith('mailto:') ||
                href.startsWith('tel:') ||
                href.startsWith('javascript:') ||
                href.startsWith('#')
            ) {
                return;
            }

            // Resolve relative URLs
            const absoluteUrl = new URL(href, baseUrl).href;
            links.push(absoluteUrl);
        } catch {
            // Invalid URL, skip
        }
    });

    return [...new Set(links)]; // Remove duplicates
}