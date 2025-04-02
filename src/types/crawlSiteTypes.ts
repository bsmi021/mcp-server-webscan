/**
 * Arguments for the crawl-site tool.
 */
export interface CrawlSiteArgs {
    url: string;
    maxDepth: number; // Note: Zod default handles optionality, but TS interface requires it here
}

/**
 * Represents the result of crawling a site.
 * - crawled_urls: A list of unique URLs discovered during the crawl.
 * - total_urls: The total count of unique URLs found.
 */
export interface CrawlResult {
    crawled_urls: string[];
    total_urls: number;
}

// Add other types specific to the crawl-site service if needed in the future.
// export interface CrawlSiteServiceConfig {
//   requestTimeoutMs?: number;
//   concurrentRequests?: number;
//   userAgent?: string;
// }
