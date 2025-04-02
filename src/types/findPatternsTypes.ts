/**
 * Arguments for the find-patterns tool.
 */
export interface FindPatternsArgs {
    url: string;
    pattern: string;
}

/**
 * Represents a single link result (URL and text).
 * Re-defined here for now, consider moving to a common types file later.
 */
export interface LinkResult {
    url: string;
    text: string;
}

// Add other types specific to the find-patterns service if needed in the future.
// export interface FindPatternsServiceConfig {
//   // Example: Config for regex engine options or performance tuning
//   regexTimeoutMs?: number;
// }
