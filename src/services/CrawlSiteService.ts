import { crawlPage } from '../utils/index.js'; // Use barrel file
import { logger } from '../utils/index.js';
import { CrawlResult } from '../types/crawlSiteTypes.js'; // Use specific type file
import { ServiceError, ValidationError } from '../utils/index.js'; // Use custom errors

// Placeholder for potential future configuration
// import { ConfigurationManager } from '../config/ConfigurationManager.js';
// import { CrawlSiteServiceConfig } from '../types/crawlSiteTypes.js';

export class CrawlSiteService {
    // private readonly config: Required<CrawlSiteServiceConfig>;

    constructor(/* config: Partial<CrawlSiteServiceConfig> = {} */) {
        // const configManager = ConfigurationManager.getInstance();
        // const defaultConfig = configManager.getCrawlSiteServiceConfig(); // Assuming this method exists
        // this.config = { ...defaultConfig, ...config };
        // logger.debug("CrawlSiteService initialized", { config: this.config });
        logger.debug("CrawlSiteService initialized");
    }

    /**
     * Crawls a website starting from a given URL up to a specified depth.
     * @param startUrl - The URL to begin crawling from.
     * @param maxDepth - The maximum depth to crawl.
     * @returns A promise resolving to an object containing the list of crawled URLs and the total count.
     * @throws {ValidationError} If the input URL or depth is invalid.
     * @throws {ServiceError} If crawling encounters an unexpected error.
     */
    public async crawlWebsite(startUrl: string, maxDepth: number): Promise<CrawlResult> {
        // Basic validation
        if (!startUrl || typeof startUrl !== 'string') {
            throw new ValidationError('Invalid input: startUrl string is required.');
        }
        if (typeof maxDepth !== 'number' || maxDepth < 0) {
            throw new ValidationError('Invalid input: maxDepth must be a non-negative number.');
        }

        logger.info(`Starting crawl for: ${startUrl} up to depth ${maxDepth}`);

        try {
            const visited = new Set<string>();
            // Call the utility function
            const urls = await crawlPage(startUrl, 0, maxDepth, visited);

            // Ensure uniqueness (though crawlPage should handle it, belt-and-suspenders)
            const uniqueUrls = Array.from(new Set(urls));

            const result: CrawlResult = {
                crawled_urls: uniqueUrls,
                total_urls: uniqueUrls.length,
            };

            logger.info(`Finished crawl for ${startUrl}. Found ${result.total_urls} unique URLs.`);
            return result;

        } catch (error) {
            // Catch errors specifically from crawlPage or its dependencies (like fetchHtml)
            logger.error(`Error during crawlWebsite execution for ${startUrl}`, { error: error instanceof Error ? error.message : String(error), startUrl, maxDepth });

            // Wrap unexpected errors in a ServiceError
            throw new ServiceError(`Crawling failed for ${startUrl}: ${error instanceof Error ? error.message : String(error)}`, error);
        }
    }
}
