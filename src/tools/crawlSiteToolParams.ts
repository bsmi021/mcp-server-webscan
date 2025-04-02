import { z } from 'zod';

export const TOOL_NAME = "crawl-site";

export const TOOL_DESCRIPTION = `Recursively crawls a website starting from a given URL up to a specified maximum depth. It follows links within the same origin and returns a list of all unique URLs found during the crawl.`;

export const TOOL_PARAMS = {
    url: z.string().url().describe("The starting URL for the crawl. Must be a valid HTTP or HTTPS URL."),
    maxDepth: z.number().int().min(0).max(5).optional().default(2).describe("The maximum depth to crawl relative to the starting URL. 0 means only the starting URL is fetched. Max allowed depth is 5 to prevent excessive crawling. Defaults to 2."),
};

// Optional: Define a Zod schema for the entire input object if needed later
// export const crawlSiteInputSchema = z.object(TOOL_PARAMS);
