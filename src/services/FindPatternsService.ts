import { fetchHtml } from '../utils/index.js';
import { logger } from '../utils/index.js';
import { LinkResult } from '../types/findPatternsTypes.js'; // Use specific type file
import { ServiceError, ValidationError } from '../utils/index.js';

// Placeholder for potential future configuration
// import { ConfigurationManager } from '../config/ConfigurationManager.js';
// import { FindPatternsServiceConfig } from '../types/findPatternsTypes.js';

export class FindPatternsService {
    // private readonly config: Required<FindPatternsServiceConfig>;

    constructor(/* config: Partial<FindPatternsServiceConfig> = {} */) {
        // const configManager = ConfigurationManager.getInstance();
        // const defaultConfig = configManager.getFindPatternsServiceConfig(); // Assuming this method exists
        // this.config = { ...defaultConfig, ...config };
        // logger.debug("FindPatternsService initialized", { config: this.config });
        logger.debug("FindPatternsService initialized");
    }

    /**
     * Fetches a page and finds links matching a regex pattern.
     * @param pageUrl - The URL of the page to search.
     * @param pattern - The regex pattern string to match against link URLs.
     * @returns A promise resolving to an array of matching link results.
     * @throws {ValidationError} If input arguments are invalid or pattern is invalid regex.
     * @throws {ServiceError} If fetching or parsing fails.
     */
    public async findLinksByPattern(pageUrl: string, pattern: string): Promise<LinkResult[]> {
        // Basic validation
        if (!pageUrl || typeof pageUrl !== 'string') {
            throw new ValidationError('Invalid input: pageUrl string is required.');
        }
        if (!pattern || typeof pattern !== 'string') {
            throw new ValidationError('Invalid input: pattern string is required.');
        }

        let regex: RegExp;
        try {
            regex = new RegExp(pattern); // Compile the regex pattern
        } catch (e) {
            logger.error(`Invalid regex pattern provided: ${pattern}`, { error: e instanceof Error ? e.message : String(e) });
            throw new ValidationError(`Invalid regex pattern: ${pattern}. Error: ${e instanceof Error ? e.message : String(e)}`);
        }

        logger.info(`Starting pattern search on: ${pageUrl}`, { pattern });

        const matches: LinkResult[] = [];

        try {
            const { $ } = await fetchHtml(pageUrl);
            logger.debug(`Successfully fetched HTML for ${pageUrl}`);

            const linkElements = $('a[href]').toArray();
            logger.debug(`Found ${linkElements.length} anchor elements on ${pageUrl}`);

            for (const element of linkElements) {
                const link = $(element);
                const href = link.attr('href');
                const text = link.text().trim() || '[No text]';

                // Basic filtering
                if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                    continue;
                }

                let absoluteUrl: string;
                try {
                    absoluteUrl = new URL(href, pageUrl).toString();
                } catch (e) {
                    logger.warn(`Could not resolve href '${href}' on page ${pageUrl}`, { error: e instanceof Error ? e.message : String(e) });
                    continue; // Skip invalid URLs
                }

                // Test the absolute URL against the regex
                if (regex.test(absoluteUrl)) {
                    logger.debug(`Pattern match found: ${absoluteUrl}`);
                    matches.push({ url: absoluteUrl, text: text });
                }
            }

        } catch (fetchError) {
            logger.error(`Failed to fetch or process page ${pageUrl} for pattern finding`, { error: fetchError instanceof Error ? fetchError.message : String(fetchError) });
            throw new ServiceError(`Failed to fetch or process page ${pageUrl}: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`, fetchError);
        }

        logger.info(`Finished pattern search for ${pageUrl}. Found ${matches.length} matching links.`);
        return matches;
    }
}
