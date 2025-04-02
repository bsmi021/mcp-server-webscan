/**
 * Arguments for the extract-links tool.
 */
export interface ExtractLinksArgs {
    url: string;
    baseUrl?: string; // Optional base URL for filtering/resolving
    limit: number; // Note: Zod default handles optionality, TS interface needs it
}

/**
 * Represents a single extracted link with its URL and anchor text.
 */
export interface LinkResult {
    url: string;
    text: string;
}

// Add other types specific to the extract-links service if needed in the future.
// export interface ExtractLinksServiceConfig {
//   // Example: Configuration for stream processing or worker threads mentioned in description
//   useStreams?: boolean;
//   workerThreadCount?: number;
// }
