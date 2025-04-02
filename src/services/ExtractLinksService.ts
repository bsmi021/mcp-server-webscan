import { fetchHtml } from '../utils/index.js';
import { logger } from '../utils/index.js';
import { LinkResult } from '../types/extractLinksTypes.js';
import { ServiceError, ValidationError } from '../utils/index.js';

// Placeholder for potential future configuration
// import { ConfigurationManager } from '../config/ConfigurationManager.js';
// import { ExtractLinksServiceConfig } from '../types/extractLinksTypes.js';

export class ExtractLinksService {
    // private readonly config: Required<ExtractLinksServiceConfig>;

    constructor(/* config: Partial<ExtractLinksServiceConfig> = {} */) {
        // const configManager = ConfigurationManager.getInstance();
        // const defaultConfig = configManager.getExtractLinksServiceConfig(); // Assuming this method exists
        // this.config = { ...defaultConfig, ...config };
        // logger.debug("ExtractLinksService initialized", { config: this.config });
        logger.debug("ExtractLinksService initialized");
    }

    /**
     * Fetches a page and extracts links based on provided arguments.
     * @param pageUrl - The URL of the page to extract links from.
     * @param baseUrl - Optional base URL for filtering and resolving relative links.
     * @param limit - Maximum number of links to return.
     * @returns A promise resolving to an array of link results.
     * @throws {ValidationError} If input arguments are invalid.
     * @throws {ServiceError} If fetching or parsing fails.
     */
    public async extractLinksFromPage(pageUrl: string, baseUrl?: string, limit: number = 100): Promise<LinkResult[]> {
        // Basic validation
        if (!pageUrl || typeof pageUrl !== 'string') {
            throw new ValidationError('Invalid input: pageUrl string is required.');
        }
        if (baseUrl && typeof baseUrl !== 'string') {
            throw new ValidationError('Invalid input: baseUrl must be a string if provided.');
        }
        if (typeof limit !== 'number' || limit <= 0) {
            throw new ValidationError('Invalid input: limit must be a positive number.');
        }

        logger.info(`Starting link extraction for: ${pageUrl}`, { baseUrl, limit });

        const results: LinkResult[] = [];
        const foundUrls = new Set<string>(); // Track unique absolute URLs found

        try {
            const { $ } = await fetchHtml(pageUrl);
            logger.debug(`Successfully fetched HTML for ${pageUrl}`);

            const linkElements = $('a[href]').toArray();
            logger.debug(`Found ${linkElements.length} anchor elements on ${pageUrl}`);

            for (const element of linkElements) {
                if (results.length >= limit) {
                    logger.info(`Reached link limit (${limit}) for ${pageUrl}. Stopping extraction.`);
                    break; // Stop processing if limit is reached
                }

                const link = $(element);
                const href = link.attr('href');
                const text = link.text().trim() || '[No text]'; // Default text if empty

                // Basic filtering
                if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                    logger.debug(`Skipping invalid or local href: ${href}`);
                    continue;
                }

                let absoluteUrl: string;
                try {
                    // Resolve URL relative to the page URL
                    absoluteUrl = new URL(href, pageUrl).toString();
                } catch (e) {
                    logger.warn(`Could not resolve href '${href}' on page ${pageUrl}`, { error: e instanceof Error ? e.message : String(e) });
                    // Optionally include invalid hrefs in results if needed, or just skip
                    continue;
                }

                // Apply baseUrl filter if provided
                if (baseUrl && !absoluteUrl.startsWith(baseUrl)) {
                    logger.debug(`Skipping URL not matching baseUrl: ${absoluteUrl}`);
                    continue;
                }

                // Add to results if unique
                if (!foundUrls.has(absoluteUrl)) {
                    foundUrls.add(absoluteUrl);
                    results.push({ url: absoluteUrl, text: text });
                }
            }

        } catch (fetchError) {
            logger.error(`Failed to fetch or process page ${pageUrl} for link extraction`, { error: fetchError instanceof Error ? fetchError.message : String(fetchError) });
            throw new ServiceError(`Failed to fetch or process page ${pageUrl}: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`, fetchError);
        }

        logger.info(`Finished link extraction for ${pageUrl}. Found ${results.length} unique links (up to limit ${limit}).`);
        return results;
    }
}
