/**
 * Arguments for the fetch-page tool.
 */
export interface FetchPageArgs {
    url: string;
    selector?: string; // Optional CSS selector
}

/**
 * Represents the result of fetching and converting a page (or part of it) to Markdown.
 */
export interface FetchPageResult {
    markdownContent: string;
    sourceUrl: string;
    selectorUsed?: string; // Indicate which selector was used, if any
}

// Add other types specific to the fetch-page service if needed in the future.
// export interface FetchPageServiceConfig {
//   // Example: Config for markdown conversion options
//   turndownOptions?: object;
// }
