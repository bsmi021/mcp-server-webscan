import { z } from 'zod';

export const TOOL_NAME = "find-patterns";

export const TOOL_DESCRIPTION = `Fetches a web page, extracts all anchor ('a') links, resolves their absolute URLs, and returns a list of links whose URLs match a given JavaScript-compatible regular expression pattern. Includes the URL and anchor text for each match.`;

export const TOOL_PARAMS = {
    url: z.string().url().describe("The fully qualified URL of the web page to search for link patterns. Must be a valid HTTP or HTTPS URL."),
    pattern: z.string().min(1).describe("A JavaScript-compatible regular expression pattern (without enclosing slashes or flags) used to test against the absolute URLs of the links found on the page. Example: 'product\\/\\d+' to find product links."),
};

// Optional: Define a Zod schema for the entire input object if needed later
// export const findPatternsInputSchema = z.object(TOOL_PARAMS);
