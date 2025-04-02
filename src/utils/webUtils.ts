import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from './logger.js'; // Assuming logger exists or will be created

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
    logger.debug(`Crawling: ${url} at depth ${depth}`);

    try {
        // Use fetchHtml to get content and cheerio object
        const { $ } = await fetchHtml(url);
        const links = new Set<string>();
        const baseUrl = new URL(url); // Get base URL for origin check

        // Extract all links from the page
        $('a[href]').each((_, element) => {
            const href = $(element).attr('href');
            // Basic filtering: ignore empty, anchor links, mailto, tel, etc.
            if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                try {
                    const absoluteUrl = new URL(href, url).toString();
                    // Ensure the link is within the same origin
                    if (new URL(absoluteUrl).origin === baseUrl.origin && !links.has(absoluteUrl)) {
                        links.add(absoluteUrl);
                    }
                } catch (e) {
                    logger.warn(`Skipping invalid URL '${href}' found on ${url}`, { error: e instanceof Error ? e.message : String(e) });
                }
            }
        });

        logger.debug(`Found ${links.size} unique, same-origin links on ${url}`);

        // Recursively crawl each discovered link
        const crawlPromises = Array.from(links).map(link => crawlPage(link, depth + 1, maxDepth, visited));
        const results = await Promise.all(crawlPromises);
        results.forEach(subUrls => urls.push(...subUrls));

    } catch (error) {
        logger.error(`Error crawling ${url}`, { errorMessage: error instanceof Error ? error.message : String(error) });
        // Optionally re-throw or handle specific errors (e.g., 404, 500)
    }

    return urls;
}

/**
 * Fetches HTML content from a URL and returns HTML string and Cheerio API object
 * @param url - The URL to fetch
 * @returns Promise resolving to an object containing the HTML string and CheerioAPI instance
 * @throws Throws error if fetching fails
 */
export async function fetchHtml(url: string): Promise<{ html: string; $: cheerio.CheerioAPI }> {
    try {
        const response = await axios.get(url, {
            headers: {
                // Add a default user-agent to be polite
                'User-Agent': 'MCP-WebScan-Bot/1.0 (+https://example.com/bot-info)',
            },
            timeout: 10000, // Add a timeout (e.g., 10 seconds)
        });

        // Basic check for successful status code
        if (response.status < 200 || response.status >= 300) {
            throw new Error(`Request failed with status code ${response.status}`);
        }

        // Basic check for HTML content type
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.includes('text/html')) {
            logger.warn(`Expected HTML content type but received '${contentType}' from ${url}`);
            // Decide whether to proceed or throw an error based on requirements
        }

        const html = response.data;
        const $ = cheerio.load(html);
        return { html, $ };
    } catch (error) {
        logger.error(`Failed to fetch HTML from ${url}`, { error: error instanceof Error ? error.message : String(error) });
        // Re-throw the error to be handled by the caller
        throw error;
    }
}


/**
 * Checks if a URL is valid and reachable using a HEAD request
 * @param url - The URL to check
 * @returns Boolean indicating if the URL is valid and returns a successful status code (2xx)
 */
export async function isValidUrl(url: string): Promise<boolean> {
    try {
        const response = await axios.head(url, {
            headers: {
                'User-Agent': 'MCP-WebScan-Bot/1.0 (+https://example.com/bot-info)',
            },
            timeout: 5000, // Shorter timeout for HEAD requests
        });
        // Consider only 2xx status codes as valid/reachable
        return response.status >= 200 && response.status < 300;
    } catch (error) {
        logger.debug(`HEAD request failed for ${url}`, { error: error instanceof Error ? error.message : String(error) });
        return false;
    }
}
