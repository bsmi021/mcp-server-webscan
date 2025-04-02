import { z } from 'zod';

export const TOOL_NAME = "extract-links";

// Using the detailed description from the original tool registration
export const TOOL_DESCRIPTION = `Extract and analyze all hyperlinks from a web page, organizing them into a structured format with URLs, anchor text, and contextual information. Performance-optimized with stream processing and worker threads for efficient handling of large pages. Works with either a direct URL or raw HTML content. Handles relative and absolute URLs properly by supporting an optional base URL parameter. Results can be limited to prevent overwhelming output for link-dense pages. Returns a comprehensive link inventory that includes destination URLs, link text, titles (if available), and whether links are internal or external to the source domain. Useful for site mapping, content analysis, broken link checking, SEO analysis, and as a preparatory step for targeted crawling operations.`;

export const TOOL_PARAMS = {
    url: z.string().url().describe("The fully qualified URL of the web page from which to extract links. Must be a valid HTTP or HTTPS URL."),
    baseUrl: z.string().url().optional().describe("Optional base URL to resolve relative links against. If provided, only links starting with this base URL will be returned. Useful for focusing on internal links."),
    limit: z.number().int().min(1).max(5000).optional().default(100).describe("Maximum number of links to return. Defaults to 100. Max allowed is 5000."),
};

// Optional: Define a Zod schema for the entire input object if needed later
// export const extractLinksInputSchema = z.object(TOOL_PARAMS);
