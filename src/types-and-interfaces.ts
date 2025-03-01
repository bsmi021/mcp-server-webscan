/**
 * Types and interfaces for the WebScan MCP server
 * Contains all the type definitions and interfaces used throughout the application
 */

/**
 * Arguments for fetching a web page
 */
export interface FetchPageArgs {
    url: string;
    selector?: string;
}

/**
 * Arguments for extracting links from a page
 */
export interface ExtractLinksArgs {
    url: string;
    baseUrl?: string;
}

/**
 * Arguments for crawling a site
 */
export interface CrawlSiteArgs {
    url: string;
    maxDepth: number;
}

/**
 * Arguments for checking links on a page
 */
export interface CheckLinksArgs {
    url: string;
}

/**
 * Arguments for finding URL patterns
 */
export interface FindPatternsArgs {
    url: string;
    pattern: string;
}

/**
 * Arguments for generating a sitemap
 */
export interface SitemapArgs {
    url: string;
    maxUrls?: number;
}

/**
 * Link extraction result
 */
export interface LinkResult {
    url: string;
    text: string;
}

/**
 * Link check result
 */
export interface LinkCheckResult {
    url: string;
    status: string;
}

/**
 * Crawl result
 */
export interface CrawlResult {
    crawled_urls: string[];
    total_urls: number;
} 