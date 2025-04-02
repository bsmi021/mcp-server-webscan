import { fetchHtml, htmlToMarkdown } from '../utils/index.js';
import { logger } from '../utils/index.js';
import { FetchPageResult } from '../types/fetchPageTypes.js'; // Use specific type file
import { ServiceError, ValidationError, NotFoundError } from '../utils/index.js';

// Placeholder for potential future configuration
// import { ConfigurationManager } from '../config/ConfigurationManager.js';
// import { FetchPageServiceConfig } from '../types/fetchPageTypes.js';

export class FetchPageService {
    // private readonly config: Required<FetchPageServiceConfig>;

    constructor(/* config: Partial<FetchPageServiceConfig> = {} */) {
        // const configManager = ConfigurationManager.getInstance();
        // const defaultConfig = configManager.getFetchPageServiceConfig(); // Assuming this method exists
        // this.config = { ...defaultConfig, ...config };
        // logger.debug("FetchPageService initialized", { config: this.config });
        logger.debug("FetchPageService initialized");
    }

    /**
     * Fetches a web page, optionally selects content, and converts it to Markdown.
     * @param pageUrl - The URL of the page to fetch.
     * @param selector - Optional CSS selector to extract specific content.
     * @returns A promise resolving to an object containing the Markdown content and source info.
     * @throws {ValidationError} If the input URL is invalid.
     * @throws {NotFoundError} If the selector doesn't match any element.
     * @throws {ServiceError} If fetching or conversion fails.
     */
    public async fetchAndConvertToMarkdown(pageUrl: string, selector?: string): Promise<FetchPageResult> {
        // Basic validation
        if (!pageUrl || typeof pageUrl !== 'string') {
            throw new ValidationError('Invalid input: pageUrl string is required.');
        }
        if (selector && typeof selector !== 'string') {
            throw new ValidationError('Invalid input: selector must be a string if provided.');
        }

        logger.info(`Starting page fetch for Markdown conversion: ${pageUrl}`, { selector });

        try {
            const { $ } = await fetchHtml(pageUrl);
            logger.debug(`Successfully fetched HTML for ${pageUrl}`);

            let targetHtml: string | null = null;
            let effectiveSelector = selector;

            if (selector) {
                const selectedElement = $(selector).first(); // Get the first matching element
                if (selectedElement.length > 0) {
                    targetHtml = selectedElement.html();
                    logger.debug(`Using selector "${selector}"`);
                } else {
                    logger.warn(`Selector "${selector}" did not match any elements on ${pageUrl}. Falling back to body.`);
                    effectiveSelector = undefined; // Clear selector if it didn't match
                    targetHtml = $('body').html();
                }
            } else {
                logger.debug(`No selector provided, using body content.`);
                targetHtml = $('body').html();
            }

            if (targetHtml === null || targetHtml.trim() === '') {
                // Use NotFoundError if selector was provided but yielded no content, otherwise ServiceError
                const errorMsg = selector
                    ? `Content extraction failed: Selector "${selector}" yielded empty content.`
                    : `Content extraction failed: Body content is empty or could not be retrieved.`;
                logger.error(errorMsg, { pageUrl, selector });
                if (selector) {
                    throw new NotFoundError(errorMsg);
                } else {
                    throw new ServiceError(errorMsg);
                }
            }

            // Convert the extracted HTML to Markdown
            const markdown = htmlToMarkdown(targetHtml);
            logger.info(`Successfully converted content from ${pageUrl} to Markdown.`);

            const result: FetchPageResult = {
                markdownContent: markdown,
                sourceUrl: pageUrl,
                selectorUsed: effectiveSelector, // Report the selector actually used (or undefined)
            };

            return result;

        } catch (error) {
            // Handle errors from fetchHtml or htmlToMarkdown, or our own thrown errors
            logger.error(`Error during fetch/conversion for ${pageUrl}`, { error: error instanceof Error ? error.message : String(error), pageUrl, selector });

            // Re-throw known custom errors, wrap others in ServiceError
            if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ServiceError) {
                throw error;
            }

            throw new ServiceError(`Failed to fetch or convert page ${pageUrl}: ${error instanceof Error ? error.message : String(error)}`, error);
        }
    }
}
