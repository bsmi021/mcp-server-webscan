/**
 * Utility functions for the WebScan MCP server
 * Contains helper functions for web page processing and crawling
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

/**
 * TurndownService instance for HTML to Markdown conversion
 */
export const turndown = new TurndownService();

/**
 * Recursively crawls a website up to a specified depth
 * @param url - The URL to crawl
 * @param depth - Current depth of crawling
 * @param maxDepth - Maximum depth to crawl
 * @param visited - Set of already visited URLs
 * @returns Array of discovered URLs
 */
export async function crawlPage(url: string, depth: number, maxDepth: number, visited: Set<string>): Promise<string[]> {
    // Skip if we've reached max depth or already visited this URL
    if (depth > maxDepth || visited.has(url)) {
        return [];
    }

    visited.add(url);
    const urls: string[] = [url];

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const links = new Set<string>();

        // Extract all links from the page
        $('a[href]').each((_, element) => {
            const href = $(element).attr('href');
            if (href && !href.startsWith('#')) {
                try {
                    const fullUrl = new URL(href, url).toString();
                    if (fullUrl.startsWith(new URL(url).origin) && !links.has(fullUrl)) {
                        links.add(fullUrl);
                    }
                } catch (e) {
                    // Skip invalid URLs
                }
            }
        });

        // Recursively crawl each discovered link
        for (const link of links) {
            const subUrls = await crawlPage(link, depth + 1, maxDepth, visited);
            urls.push(...subUrls);
        }
    } catch (error) {
        console.error(`Error crawling ${url}:`, error);
    }

    return urls;
}

/**
 * Fetches HTML content from a URL
 * @param url - The URL to fetch
 * @returns The HTML content
 */
export async function fetchHtml(url: string): Promise<{ html: string, $: cheerio.CheerioAPI }> {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    return { html: response.data, $ };
}

/**
 * Converts HTML to Markdown
 * @param html - The HTML content to convert
 * @returns The converted Markdown
 */
export function htmlToMarkdown(html: string): string {
    return turndown.turndown(html);
}

/**
 * Checks if a URL is valid and reachable
 * @param url - The URL to check
 * @returns Boolean indicating if the URL is valid
 */
export async function isValidUrl(url: string): Promise<boolean> {
    try {
        await axios.head(url);
        return true;
    } catch (error) {
        return false;
    }
} 