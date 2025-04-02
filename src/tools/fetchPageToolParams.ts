import { z } from 'zod';

export const TOOL_NAME = "fetch-page";

export const TOOL_DESCRIPTION = `Fetches the HTML content of a given URL. Optionally, it can select a specific part of the HTML using a CSS selector and convert only that part (or the whole body if no selector is provided) to Markdown format. Returns the resulting Markdown text.`;

export const TOOL_PARAMS = {
    url: z.string().url().describe("The fully qualified URL of the web page to fetch. Must be a valid HTTP or HTTPS URL."),
    selector: z.string().optional().describe("Optional CSS selector (e.g., '#main-content', '.article-body'). If provided, only the HTML content within the first matching element will be converted to Markdown. If omitted or if the selector doesn't match, the content of the 'body' tag will be used."),
};

// Optional: Define a Zod schema for the entire input object if needed later
// export const fetchPageInputSchema = z.object(TOOL_PARAMS);
