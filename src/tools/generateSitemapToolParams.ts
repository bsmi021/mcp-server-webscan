import { z } from 'zod';

export const TOOL_NAME = "generate-site-map";

export const TOOL_DESCRIPTION = `Crawls a website starting from a given URL up to a specified depth and generates an XML sitemap containing the discovered URLs (up to a specified limit).`;

export const TOOL_PARAMS = {
    url: z.string().url().describe("The starting URL for the crawl to generate the sitemap. Must be a valid HTTP or HTTPS URL."),
    maxDepth: z.number().int().min(0).max(5).optional().default(2).describe("The maximum depth to crawl relative to the starting URL to discover pages for the sitemap. 0 means only the starting URL. Max allowed depth is 5. Defaults to 2."),
    limit: z.number().int().min(1).max(5000).optional().default(1000).describe("Maximum number of URLs to include in the generated sitemap XML. Defaults to 1000. Max allowed is 5000."),
};

// Optional: Define a Zod schema for the entire input object if needed later
// export const generateSitemapInputSchema = z.object(TOOL_PARAMS);
