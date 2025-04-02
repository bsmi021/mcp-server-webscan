import { crawlPage } from '../utils/index.js';
import { logger } from '../utils/index.js';
import { SitemapResult } from '../types/generateSitemapTypes.js';
import { ServiceError, ValidationError } from '../utils/index.js';
import { escape } from 'html-escaper'; // Use a library for XML escaping

// Placeholder for potential future configuration
// import { ConfigurationManager } from '../config/ConfigurationManager.js';
// import { GenerateSitemapServiceConfig } from '../types/generateSitemapTypes.js';

export class GenerateSitemapService {
    // private readonly config: Required<GenerateSitemapServiceConfig>;

    constructor(/* config: Partial<GenerateSitemapServiceConfig> = {} */) {
        // const configManager = ConfigurationManager.getInstance();
        // const defaultConfig = configManager.getGenerateSitemapServiceConfig(); // Assuming this method exists
        // this.config = { ...defaultConfig, ...config };
        // logger.debug("GenerateSitemapService initialized", { config: this.config });
        logger.debug("GenerateSitemapService initialized");
    }

    /**
     * Generates an XML sitemap by crawling a website.
     * @param startUrl - The URL to begin crawling from.
     * @param maxDepth - The maximum depth to crawl for discovering URLs.
     * @param limit - The maximum number of URLs to include in the sitemap.
     * @returns A promise resolving to an object containing the sitemap XML string and URL count.
     * @throws {ValidationError} If input arguments are invalid.
     * @throws {ServiceError} If crawling or XML generation fails.
     */
    public async generateSitemap(startUrl: string, maxDepth: number, limit: number): Promise<SitemapResult> {
        // Basic validation
        if (!startUrl || typeof startUrl !== 'string') {
            throw new ValidationError('Invalid input: startUrl string is required.');
        }
        if (typeof maxDepth !== 'number' || maxDepth < 0) {
            throw new ValidationError('Invalid input: maxDepth must be a non-negative number.');
        }
        if (typeof limit !== 'number' || limit <= 0) {
            throw new ValidationError('Invalid input: limit must be a positive number.');
        }

        logger.info(`Starting sitemap generation for: ${startUrl}`, { maxDepth, limit });

        try {
            const visited = new Set<string>();
            // Crawl the site to get URLs
            const allUrls = await crawlPage(startUrl, 0, maxDepth, visited);
            const uniqueUrls = Array.from(new Set(allUrls)); // Ensure uniqueness again
            logger.debug(`Crawl discovered ${uniqueUrls.length} unique URLs.`);

            // Apply the limit
            const limitedUrls = uniqueUrls.slice(0, limit);
            logger.debug(`Limiting sitemap to ${limitedUrls.length} URLs.`);

            // Generate XML sitemap string
            // Ensure URLs are properly escaped for XML
            const urlEntries = limitedUrls
                .map(url => `  <url>
    <loc>${escape(url)}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod> 
  </url>`) // Use YYYY-MM-DD format for lastmod
                .join('\n');

            const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

            const result: SitemapResult = {
                sitemapXml: sitemapXml,
                urlCount: limitedUrls.length,
            };

            logger.info(`Finished sitemap generation for ${startUrl}. Included ${result.urlCount} URLs.`);
            return result;

        } catch (error) {
            logger.error(`Error during sitemap generation for ${startUrl}`, { error: error instanceof Error ? error.message : String(error), startUrl, maxDepth, limit });
            // Wrap errors from crawlPage or XML generation
            throw new ServiceError(`Sitemap generation failed for ${startUrl}: ${error instanceof Error ? error.message : String(error)}`, error);
        }
    }
}
