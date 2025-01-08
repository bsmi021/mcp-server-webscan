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

interface CrawlSiteArgs {
  url: string;
  maxDepth: number;
}

interface CheckLinksArgs {
  url: string;
}

interface FindPatternsArgs {
  url: string;
  pattern: string;
}

interface SitemapArgs {
  url: string;
  maxUrls?: number;
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
          },
          {
            name: "crawl_site",
            description: "Recursively crawl a website up to a specified depth",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "Starting URL to crawl"
                },
                maxDepth: {
                  type: "number",
                  description: "Maximum crawl depth",
                  default: 2
                }
              },
              required: ["url"]
            }
          },
          {
            name: "check_links",
            description: "Check for broken links on a page",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "URL to check links for"
                }
              },
              required: ["url"]
            }
          },
          {
            name: "find_patterns",
            description: "Find URLs matching a specific pattern",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "URL to search in"
                },
                pattern: {
                  type: "string",
                  description: "Regex pattern to match URLs against"
                }
              },
              required: ["url", "pattern"]
            }
          },
          {
            name: "generate_sitemap",
            description: "Generate a simple XML sitemap",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "Root URL for sitemap"
                },
                maxUrls: {
                  type: "number",
                  description: "Maximum number of URLs to include",
                  default: 100
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

        case 'crawl_site': {
          if (!args?.url || typeof args.url !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'URL is required and must be a string');
          }

          const crawlArgs: CrawlSiteArgs = {
            url: args.url,
            maxDepth: typeof args.maxDepth === 'number' ? args.maxDepth : 2
          };

          return this.handleCrawlSite(crawlArgs);
        }

        case 'check_links': {
          if (!args?.url || typeof args.url !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'URL is required and must be a string');
          }

          const checkArgs: CheckLinksArgs = {
            url: args.url
          };

          return this.handleCheckLinks(checkArgs);
        }

        case 'find_patterns': {
          if (!args?.url || typeof args.url !== 'string' || !args?.pattern || typeof args.pattern !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'URL and pattern are required and must be strings');
          }

          const patternArgs: FindPatternsArgs = {
            url: args.url,
            pattern: args.pattern
          };

          return this.handleFindPatterns(patternArgs);
        }

        case 'generate_sitemap': {
          if (!args?.url || typeof args.url !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'URL is required and must be a string');
          }

          const sitemapArgs: SitemapArgs = {
            url: args.url,
            maxUrls: typeof args.maxUrls === 'number' ? args.maxUrls : 100
          };

          return this.handleGenerateSitemap(sitemapArgs);
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }
    });
  }

  private async crawlPage(url: string, depth: number, maxDepth: number, visited: Set<string>): Promise<string[]> {
    if (depth > maxDepth || visited.has(url)) {
      return [];
    }

    visited.add(url);
    const urls: string[] = [url];

    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      const links = new Set<string>();

      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href && !href.startsWith('#')) {
          try {
            const fullUrl = new URL(href, url).toString();
            if (fullUrl.startsWith(new URL(url).origin) && !links.has(fullUrl)) {
              links.add(fullUrl);
            }
          } catch (e) {
            // Skip invalid URLs
          }
        }
      });

      for (const link of links) {
        const subUrls = await this.crawlPage(link, depth + 1, maxDepth, visited);
        urls.push(...subUrls);
      }
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
    }

    return urls;
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

  private async handleCrawlSite(args: CrawlSiteArgs) {
    try {
      const visited = new Set<string>();
      const urls = await this.crawlPage(args.url, 0, args.maxDepth, visited);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              crawled_urls: urls,
              total_urls: urls.length
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new McpError(ErrorCode.InternalError, `Error crawling site: ${errorMessage}`);
    }
  }

  private async handleCheckLinks(args: CheckLinksArgs) {
    try {
      const response = await axios.get(args.url);
      const $ = cheerio.load(response.data);
      const results: Array<{ url: string, status: string }> = [];
      const checked = new Set<string>();

      for (const element of $('a[href]').toArray()) {
        const href = $(element).attr('href');
        if (href && !href.startsWith('#')) {
          try {
            const fullUrl = new URL(href, args.url).toString();
            if (!checked.has(fullUrl)) {
              checked.add(fullUrl);
              try {
                await axios.head(fullUrl);
                results.push({ url: fullUrl, status: 'valid' });
              } catch (error) {
                results.push({ url: fullUrl, status: 'broken' });
              }
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

  private async handleFindPatterns(args: FindPatternsArgs) {
    try {
      const response = await axios.get(args.url);
      const $ = cheerio.load(response.data);
      const matches: Array<{ url: string, text: string }> = [];
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

  private async handleGenerateSitemap(args: SitemapArgs) {
    try {
      const visited = new Set<string>();
      const urls = await this.crawlPage(args.url, 0, 1, visited);
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


  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Webscan MCP server running on stdio');
  }
}

const server = new WebscanServer();
server.run().catch(console.error);
