/**
 * Arguments for the generate-site-map tool.
 */
export interface GenerateSitemapArgs {
    url: string;
    maxDepth: number; // Zod default handles optionality
    limit: number;    // Zod default handles optionality
}

/**
 * Represents the result of generating a sitemap.
 * Contains the sitemap XML content as a string.
 */
export interface SitemapResult {
    sitemapXml: string;
    urlCount: number; // Number of URLs included in the sitemap
}

// Add other types specific to the generate-sitemap service if needed.
// export interface GenerateSitemapServiceConfig {
//   // Example: Config for XML formatting options
//   prettyPrintXml?: boolean;
//   includeLastMod?: boolean;
// }
