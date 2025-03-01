import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchHtml, isValidUrl } from "../utils.js";
import { CheckLinksArgs, LinkCheckResult } from "../types-and-interfaces.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

/**
 * Tool that checks for broken links on a page
 * 
 * @param server - MCP server instance to register the tool with
 */
export const checkLinksTool = (server: McpServer): void => {
    server.tool(
        "check-links",
        "Check for broken links on a page",
        {
            url: z.string().url(),
        },
        async (args: CheckLinksArgs, extra) => {
            try {
                const { $ } = await fetchHtml(args.url);
                const results: LinkCheckResult[] = [];
                const checked = new Set<string>();

                for (const element of $('a[href]').toArray()) {
                    const href = $(element).attr('href');
                    if (href && !href.startsWith('#')) {
                        try {
                            const fullUrl = new URL(href, args.url).toString();
                            if (!checked.has(fullUrl)) {
                                checked.add(fullUrl);
                                const isValid = await isValidUrl(fullUrl);
                                results.push({
                                    url: fullUrl,
                                    status: isValid ? 'valid' : 'broken'
                                });
                            }
                        } catch (e) {
                            results.push({ url: href, status: 'invalid_url' });
                        }
                    }
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(results, null, 2)
                        }
                    ]
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                throw new McpError(ErrorCode.InternalError, `Error checking links: ${errorMessage}`);
            }
        }
    )
}
