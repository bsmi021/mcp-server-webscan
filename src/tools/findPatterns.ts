import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchHtml } from "../utils.js";
import { FindPatternsArgs, LinkResult } from "../types-and-interfaces.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";



/**
 * Tool that finds all links that match a given pattern
 * 
 * @param server - MCP server instance to register the tool with
 */

export const findPatternsTool = (server: McpServer): void => {
    server.tool(
        "find-patterns",
        "Find all links that match a given pattern",
        {
            url: z.string().url(),
            pattern: z.string(),
        },
        async (args: FindPatternsArgs, extra) => {
            try {
                const { $ } = await fetchHtml(args.url);
                const matches: LinkResult[] = [];
                const regex = new RegExp(args.pattern);

                $('a[href]').each((_, element) => {
                    const link = $(element);
                    const href = link.attr('href');
                    const text = link.text().trim();

                    if (href) {
                        try {
                            const fullUrl = new URL(href, args.url).toString();
                            if (regex.test(fullUrl)) {
                                matches.push({
                                    url: fullUrl,
                                    text: text || '[No text]'
                                });
                            }
                        } catch (e) {
                            // Skip invalid URLs
                        }
                    }
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(matches, null, 2)
                        }
                    ]
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                throw new McpError(ErrorCode.InternalError, `Error finding patterns: ${errorMessage}`);
            }
        }
    )
}