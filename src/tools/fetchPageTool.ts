import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchHtml, htmlToMarkdown } from "../utils.js";
import { FetchPageArgs } from "../types-and-interfaces.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

/**
 * Tool that fetches a web page and converts it to Markdown
 * 
 * @param server - MCP server instance to register the tool with
 */

export const fetchPageTool = (server: McpServer): void => {
    server.tool(
        "fetch-page",
        "Fetch a web page and convert it to Markdown",
        {
            url: z.string().url(),
            selector: z.string().optional(),
        },
        async (args: FetchPageArgs, extra) => {
            try {
                const { $, html } = await fetchHtml(args.url);

                const content = args.selector ?
                    $(args.selector).html() :
                    $('body').html();

                if (!content) {
                    throw new McpError(ErrorCode.InternalError, 'No content found');
                }

                const markdown = htmlToMarkdown(content);

                return {
                    content: [
                        {
                            type: "text",
                            text: markdown
                        }
                    ]
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                throw new McpError(ErrorCode.InternalError, `Error fetching page: ${errorMessage}`);
            }
        }
    )
}
