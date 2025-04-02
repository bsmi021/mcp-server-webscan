/**
 * Arguments for the check-links tool.
 */
export interface CheckLinksArgs {
    url: string;
}

/**
 * Represents the result of checking a single link.
 * - url: The absolute URL that was checked.
 * - status: 'valid' if reachable, 'broken' if unreachable, 'invalid_url' if the original href was malformed.
 */
export interface LinkCheckResult {
    url: string;
    status: 'valid' | 'broken' | 'invalid_url';
}

// Add other types specific to the check-links service if needed in the future.
// For example, configuration options for the service.
// export interface CheckLinksServiceConfig {
//   requestTimeoutMs?: number;
//   concurrentChecks?: number;
// }
