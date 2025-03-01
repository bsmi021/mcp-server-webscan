import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { crawlPage, fetchHtml, htmlToMarkdown } from "../utils.js";
import { CrawlResult, CrawlSiteArgs } from "../types-and-interfaces.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

/**
 * Tool that crawls a website and returns a list of all the URLs found
 * 
 * @param server - MCP server instance to register the tool with
 */

export const crawlSiteTool = (server: McpServer): void => {
    server.tool(
        "crawl-site",
        "Crawl a website and return a list of all the URLs found",
        {
            url: z.string().url(),
            maxDepth: z.number().min(1).max(10).optional().default(3),
        },
        async (args: CrawlSiteArgs, extra) => {
            try {
                const visited = new Set<string>();
                const urls = await crawlPage(args.url, 0, args.maxDepth, visited);

                const result: CrawlResult = {
                    crawled_urls: urls,
                    total_urls: urls.length
                };

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                throw new McpError(ErrorCode.InternalError, `Error crawling site: ${errorMessage}`);
            }
        }
    )
}