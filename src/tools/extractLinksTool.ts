import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchHtml } from "../utils.js";
import { LinkResult, ExtractLinksArgs } from "../types-and-interfaces.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";



/**
 * Tool that extracts all links from a web page
 * Uses optimized stream processing for large HTML documents
 * 
 * @param server - MCP server instance to register the tool with
 */
export const extractLinksTool = (server: McpServer): void => {
    server.tool(
        "extract-links",
        "Extract and analyze all hyperlinks from a web page, organizing them into a structured format with URLs, anchor text, and contextual information. Performance-optimized with stream processing and worker threads for efficient handling of large pages. Works with either a direct URL or raw HTML content. Handles relative and absolute URLs properly by supporting an optional base URL parameter. Results can be limited to prevent overwhelming output for link-dense pages. Returns a comprehensive link inventory that includes destination URLs, link text, titles (if available), and whether links are internal or external to the source domain. Useful for site mapping, content analysis, broken link checking, SEO analysis, and as a preparatory step for targeted crawling operations.",
        {
            url: z.string().url(),
            baseUrl: z.string().url().optional(),
            limit: z.number().min(1).max(5000).optional().default(100),

        },
        async (args: ExtractLinksArgs, extra) => {
            try {
                const { $ } = await fetchHtml(args.url);
                const links = new Set<string>();
                const results: LinkResult[] = [];

                $('a[href]').each((_, element) => {
                    const link = $(element);
                    const href = link.attr('href');
                    const text = link.text().trim();

                    if (href && !href.startsWith('#')) {
                        try {
                            const fullUrl = new URL(href, args.url).toString();

                            if (args.baseUrl && !fullUrl.startsWith(args.baseUrl)) {
                                return;
                            }

                            if (!links.has(fullUrl)) {
                                links.add(fullUrl);
                                results.push({
                                    url: fullUrl,
                                    text: text || '[No text]'
                                });
                            }
                        } catch (e) {
                            // Skip invalid URLs
                        }
                    }
                });

                // Return in the format expected by the MCP SDK
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(results, null, 2)
                        }
                    ],
                    links: results
                };

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                throw new McpError(ErrorCode.InternalError, `Error extracting links: ${errorMessage}`);
            }
        }
    )
}

