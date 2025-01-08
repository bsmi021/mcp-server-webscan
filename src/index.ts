#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios from 'axios';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

interface FetchPageArgs {
  url: string;
  selector?: string;
}

interface ExtractLinksArgs {
  url: string;
  baseUrl?: string;
}

class WebscanServer {
  private server: Server;
  private turndown: TurndownService;

  constructor() {
    this.server = new Server(
      {
        name: "webscan-server",
        version: "1.0.0"
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.turndown = new TurndownService();
    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "fetch_page",
            description: "Fetch a web page and convert it to Markdown for analysis",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "URL of the page to fetch"
                },
                selector: {
                  type: "string",
                  description: "Optional CSS selector to target specific content"
                }
              },
              required: ["url"]
            }
          },
          {
            name: "extract_links",
            description: "Extract all links from a web page with their text",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "URL of the page to analyze"
                },
                baseUrl: {
                  type: "string",
                  description: "Optional base URL to filter links"
                }
              },
              required: ["url"]
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const args = request.params.arguments as Record<string, unknown>;

      switch (request.params.name) {
        case 'fetch_page': {
          if (!args?.url || typeof args.url !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'URL is required and must be a string');
          }

          const fetchArgs: FetchPageArgs = {
            url: args.url,
            selector: args.selector as string | undefined
          };

          return this.handleFetchPage(fetchArgs);
        }

        case 'extract_links': {
          if (!args?.url || typeof args.url !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'URL is required and must be a string');
          }

          const extractArgs: ExtractLinksArgs = {
            url: args.url,
            baseUrl: args.baseUrl as string | undefined
          };

          return this.handleExtractLinks(extractArgs);
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }
    });
  }

  private async handleFetchPage(args: FetchPageArgs) {
    try {
      const response = await axios.get(args.url);
      const $ = cheerio.load(response.data);

      const content = args.selector ?
        $(args.selector).html() :
        $('body').html();

      if (!content) {
        throw new McpError(ErrorCode.InternalError, 'No content found');
      }

      const markdown = this.turndown.turndown(content);

      return {
        content: [
          {
            type: "text",
            text: markdown
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new McpError(ErrorCode.InternalError, `Error fetching page: ${errorMessage}`);
    }
  }

  private async handleExtractLinks(args: ExtractLinksArgs) {
    try {
      const response = await axios.get(args.url);
      const $ = cheerio.load(response.data);
      const links = new Set<string>();
      const results: Array<{ url: string, text: string }> = [];

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
      throw new McpError(ErrorCode.InternalError, `Error extracting links: ${errorMessage}`);
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Webscan MCP server running on stdio');
  }
}

const server = new WebscanServer();
server.run().catch(console.error);
