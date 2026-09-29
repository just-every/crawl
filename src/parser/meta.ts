import { JSDOM } from "jsdom";
import { PageMetadata } from "../types.js";

export function extractMetadata(dom: JSDOM): PageMetadata {
  const document = dom.window.document;

  // Helper to get attribute content from various selectors
  const getMeta = (selector: string): string | undefined => {
    return (
      document.querySelector(selector)?.getAttribute("content")?.trim() ||
      undefined
    );
  };

  const metadata: PageMetadata = {
    // Standard SEO
    title: document.title || getMeta('meta[name="title"]'),
    description: getMeta('meta[name="description"]'),
    author:
      getMeta('meta[name="author"]') ||
      getMeta('meta[property="article:author"]'),
    keywords: getMeta('meta[name="keywords"]')
      ?.split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    canonical:
      document.querySelector('link[rel="canonical"]')?.getAttribute("href") ||
      undefined,
    language:
      document.documentElement.lang || getMeta('meta[property="og:locale"]'),

    // OpenGraph
    ogTitle: getMeta('meta[property="og:title"]'),
    ogDescription: getMeta('meta[property="og:description"]'),
    ogImage: getMeta('meta[property="og:image"]'),
    ogType: getMeta('meta[property="og:type"]'),

    // Twitter Cards
    twitterCard: getMeta('meta[name="twitter:card"]'),
    twitterSite: getMeta('meta[name="twitter:site"]'),
    twitterCreator: getMeta('meta[name="twitter:creator"]'),

    // Articles/Blogs
    publishedTime:
      getMeta('meta[property="article:published_time"]') ||
      getMeta('meta[itemprop="datePublished"]'),
    modifiedTime:
      getMeta('meta[property="article:modified_time"]') ||
      getMeta('meta[itemprop="dateModified"]'),
  };

  // Fallback: If title is still missing, try H1
  if (!metadata.title) {
    metadata.title = document.querySelector("h1")?.textContent?.trim();
  }

  return metadata;
}
