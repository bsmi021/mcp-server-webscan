/**
 * Schema definitions for WebScan MCP server tools
 * Contains Zod schemas for all tool inputs
 */

import { z } from 'zod';

/**
 * Schema for fetch_page tool
 */
export const fetchPageSchema = z.object({
    url: z.string().describe("URL of the page to fetch"),
    selector: z.string().optional().describe("Optional CSS selector to target specific content")
});

/**
 * Schema for extract_links tool
 */
export const extractLinksSchema = z.object({
    url: z.string().describe("URL of the page to analyze"),
    baseUrl: z.string().optional().describe("Optional base URL to filter links")
});

/**
 * Schema for crawl_site tool
 */
export const crawlSiteSchema = z.object({
    url: z.string().describe("Starting URL to crawl"),
    maxDepth: z.number().default(2).describe("Maximum crawl depth")
});

/**
 * Schema for check_links tool
 */
export const checkLinksSchema = z.object({
    url: z.string().describe("URL to check links for")
});

/**
 * Schema for find_patterns tool
 */
export const findPatternsSchema = z.object({
    url: z.string().describe("URL to search in"),
    pattern: z.string().describe("Regex pattern to match URLs against")
});

/**
 * Schema for generate_sitemap tool
 */
export const generateSitemapSchema = z.object({
    url: z.string().describe("Root URL for sitemap"),
    maxUrls: z.number().default(100).describe("Maximum number of URLs to include")
}); 