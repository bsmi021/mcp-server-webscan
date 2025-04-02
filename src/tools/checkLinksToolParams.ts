import { z } from 'zod';

export const TOOL_NAME = "check-links";

export const TOOL_DESCRIPTION = `Fetches a given URL, extracts all anchor ('a') links, and checks each linked URL for validity (reachability via HEAD request). Returns a list of checked links with their status ('valid', 'broken', or 'invalid_url' if the href attribute couldn't be resolved to a full URL).`;

export const TOOL_PARAMS = {
    url: z.string().url().describe("The fully qualified URL of the web page to check for broken links. Must be a valid HTTP or HTTPS URL."),
};

// Optional: Define a Zod schema for the entire input object if needed later
// export const checkLinksInputSchema = z.object(TOOL_PARAMS);
