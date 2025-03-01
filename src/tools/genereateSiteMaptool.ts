import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { crawlPage, fetchHtml, htmlToMarkdown } from "../utils.js";
import { SitemapArgs } from "../types-and-interfaces.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

/**
 * Tool that generates a sitemap for a website
 * 
 * @param server - MCP server instance to register the tool with
 */

export const generateSiteMapTool = (server: McpServer): void => {
    server.tool(
        "generate-site-map",
        "Generate a sitemap for a website",
        {
            url: z.string().url(),
            baseUrl: z.string().url().optional(),
            limit: z.number().min(1).max(5000).optional().default(100),
        },
        async (args: SitemapArgs, extra) => {
            try {
                const visited = new Set<string>();
                const urls = await crawlPage(args.url, 0, 1, visited);
                const limitedUrls = urls.slice(0, args.maxUrls);

                const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${limitedUrls.map(url => `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`).join('\n')}
</urlset>`;

                return {
                    content: [
                        {
                            type: "text",
                            text: sitemap
                        }
                    ]
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                throw new McpError(ErrorCode.InternalError, `Error generating sitemap: ${errorMessage}`);
            }

        }
    )
}