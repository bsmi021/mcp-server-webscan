import { fetchHtml, isValidUrl } from '../utils/index.js'; // Use barrel file
import { logger } from '../utils/index.js';
import { LinkCheckResult } from '../types/checkLinksTypes.js'; // Use specific type file
import { ServiceError, ValidationError } from '../utils/index.js'; // Use custom errors

// Placeholder for potential future configuration
// import { ConfigurationManager } from '../config/ConfigurationManager.js';
// import { CheckLinksServiceConfig } from '../types/checkLinksTypes.js';

export class CheckLinksService {
    // private readonly config: Required<CheckLinksServiceConfig>;

    constructor(/* config: Partial<CheckLinksServiceConfig> = {} */) {
        // const configManager = ConfigurationManager.getInstance();
        // const defaultConfig = configManager.getCheckLinksServiceConfig(); // Assuming this method exists
        // this.config = { ...defaultConfig, ...config };
        // logger.debug("CheckLinksService initialized", { config: this.config });
        logger.debug("CheckLinksService initialized");
    }

    /**
     * Fetches a page, extracts links, and checks their validity.
     * @param pageUrl - The URL of the page to check.
     * @returns A promise resolving to an array of link check results.
     * @throws {ValidationError} If the input URL is invalid.
     * @throws {ServiceError} If fetching the page or checking links fails.
     */
    public async checkLinksOnPage(pageUrl: string): Promise<LinkCheckResult[]> {
        if (!pageUrl || typeof pageUrl !== 'string') {
            throw new ValidationError('Invalid input: pageUrl string is required.');
        }
        logger.info(`Starting link check for page: ${pageUrl}`);

        const results: LinkCheckResult[] = [];
        const checkedUrls = new Set<string>(); // Keep track of URLs already checked in this run

        try {
            // Fetch the HTML content and Cheerio object
            const { $ } = await fetchHtml(pageUrl);
            logger.debug(`Successfully fetched HTML for ${pageUrl}`);

            const linkElements = $('a[href]').toArray();
            logger.debug(`Found ${linkElements.length} anchor elements on ${pageUrl}`);

            // Process links concurrently for better performance
            const checkPromises = linkElements.map(async (element) => {
                const href = $(element).attr('href');

                // Basic filtering for href attribute
                if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                    logger.debug(`Skipping invalid or local href: ${href}`);
                    return null; // Skip this link
                }

                let absoluteUrl: string;
                try {
                    // Resolve the relative URL against the page URL
                    absoluteUrl = new URL(href, pageUrl).toString();
                } catch (e) {
                    logger.warn(`Could not resolve href '${href}' on page ${pageUrl}`, { error: e instanceof Error ? e.message : String(e) });
                    // Add result for invalid URL format
                    return { url: href, status: 'invalid_url' } as LinkCheckResult;
                }

                // Check if this absolute URL has already been processed in this run
                if (checkedUrls.has(absoluteUrl)) {
                    logger.debug(`Skipping already checked URL: ${absoluteUrl}`);
                    return null; // Skip duplicate check
                }
                checkedUrls.add(absoluteUrl); // Mark as checked for this run

                // Check the validity (reachability) of the absolute URL
                try {
                    const isValid = await isValidUrl(absoluteUrl);
                    logger.debug(`Checked URL: ${absoluteUrl} - Status: ${isValid ? 'valid' : 'broken'}`);
                    return { url: absoluteUrl, status: isValid ? 'valid' : 'broken' } as LinkCheckResult;
                } catch (checkError) {
                    // Log error during isValidUrl check, but still report as broken
                    logger.error(`Error checking validity of URL ${absoluteUrl}`, { error: checkError instanceof Error ? checkError.message : String(checkError) });
                    return { url: absoluteUrl, status: 'broken' } as LinkCheckResult;
                }
            });

            // Wait for all checks to complete and filter out nulls (skipped links)
            const completedResults = (await Promise.all(checkPromises)).filter(result => result !== null) as LinkCheckResult[];
            results.push(...completedResults);

        } catch (fetchError) {
            // Handle errors during the initial fetchHtml call
            logger.error(`Failed to fetch or process page ${pageUrl}`, { error: fetchError instanceof Error ? fetchError.message : String(fetchError) });
            // Wrap fetch error in a ServiceError
            throw new ServiceError(`Failed to fetch or process the page at ${pageUrl}: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`, fetchError);
        }

        logger.info(`Finished link check for page: ${pageUrl}. Found ${results.length} results.`);
        return results;
    }
}
