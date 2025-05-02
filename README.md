# MCP Webscan Server

[![smithery badge](https://smithery.ai/badge/mcp-server-webscan)](https://smithery.ai/server/mcp-server-webscan)

A Model Context Protocol (MCP) server for web content scanning and analysis. This server provides tools for fetching, analyzing, and extracting information from web pages.

<a href="https://glama.ai/mcp/servers/u0tna3hemh"><img width="380" height="200" src="https://glama.ai/mcp/servers/u0tna3hemh/badge" alt="Webscan Server MCP server" /></a>

## Features

- **Page Fetching**: Convert web pages to Markdown for easy analysis
- **Link Extraction**: Extract and analyze links from web pages
- **Site Crawling**: Recursively crawl websites to discover content
- **Link Checking**: Identify broken links on web pages
- **Pattern Matching**: Find URLs matching specific patterns
- **Sitemap Generation**: Generate XML sitemaps for websites

## Installation

### Installing via Smithery

To install Webscan for Claude Desktop automatically via [Smithery](https://smithery.ai/server/mcp-server-webscan):

```bash
npx -y @smithery/cli install mcp-server-webscan --client claude
```

### Manual Installation

```bash
# Clone the repository
git clone <repository-url>
cd mcp-server-webscan

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Starting the Server

```bash
npm start
```

The server runs on stdio transport, making it compatible with MCP clients like Claude Desktop.

### Available Tools

1. `fetch-page`
   - Fetches a web page and converts it to Markdown.
   - Parameters:
     - `url` (required): URL of the page to fetch.
     - `selector` (optional): CSS selector to target specific content.

2. `extract-links`
   - Extracts all links from a web page with their text.
   - Parameters:
     - `url` (required): URL of the page to analyze.
     - `baseUrl` (optional): Base URL to filter links.
     - `limit` (optional, default: 100): Maximum number of links to return.

3. `crawl-site`
   - Recursively crawls a website up to a specified depth.
   - Parameters:
     - `url` (required): Starting URL to crawl.
     - `maxDepth` (optional, default: 2): Maximum crawl depth (0-5).

4. `check-links`
   - Checks for broken links on a page.
   - Parameters:
     - `url` (required): URL to check links for.

5. `find-patterns`
   - Finds URLs matching a specific pattern.
   - Parameters:
     - `url` (required): URL to search in.
     - `pattern` (required): JavaScript-compatible regex pattern to match URLs against.

6. `generate-site-map`
   - Generates a simple XML sitemap by crawling.
   - Parameters:
     - `url` (required): Root URL for sitemap crawl.
     - `maxDepth` (optional, default: 2): Maximum crawl depth for discovering URLs (0-5).
     - `limit` (optional, default: 1000): Maximum number of URLs to include in the sitemap.

## Example Usage with Claude Desktop

1. Configure the server in your Claude Desktop settings:

```json
{
  "mcpServers": {
    "webscan": {
      "command": "node",
      "args": ["path/to/mcp-server-webscan/build/index.js"], // Corrected path
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "info" // Example: Set log level via env var
      }
    }
  }
}
```

2. Use the tools in your conversations:

```
Could you fetch the content from https://example.com and convert it to Markdown?
```

## Development

### Prerequisites

- Node.js >= 18
- npm

### Project Structure (Post-Refactor)

```
mcp-server-webscan/
├── src/
│   ├── config/
│   │   └── ConfigurationManager.ts
│   ├── services/
│   │   ├── CheckLinksService.ts
│   │   ├── CrawlSiteService.ts
│   │   ├── ExtractLinksService.ts
│   │   ├── FetchPageService.ts
│   │   ├── FindPatternsService.ts
│   │   ├── GenerateSitemapService.ts
│   │   └── index.ts
│   ├── tools/
│   │   ├── checkLinksTool.ts
│   │   ├── checkLinksToolParams.ts
│   │   ├── crawlSiteTool.ts
│   │   ├── crawlSiteToolParams.ts
│   │   ├── extractLinksTool.ts
│   │   ├── extractLinksToolParams.ts
│   │   ├── fetchPageTool.ts
│   │   ├── fetchPageToolParams.ts
│   │   ├── findPatterns.ts
│   │   ├── findPatternsToolParams.ts
│   │   ├── generateSitemapTool.ts
│   │   ├── generateSitemapToolParams.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── checkLinksTypes.ts
│   │   ├── crawlSiteTypes.ts
│   │   ├── extractLinksTypes.ts
│   │   ├── fetchPageTypes.ts
│   │   ├── findPatternsTypes.ts
│   │   ├── generateSitemapTypes.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── errors.ts
│   │   ├── index.ts
│   │   ├── logger.ts
│   │   ├── markdownConverter.ts
│   │   └── webUtils.ts
│   ├── initialize.ts
│   └── index.ts    # Main server entry point
├── build/          # Compiled JavaScript (Corrected)
├── node_modules/
├── .clinerules
├── .gitignore
├── Dockerfile
├── LICENSE
├── mcp-consistant-servers-guide.md
├── package.json
├── package-lock.json
├── README.md
├── RFC-2025-001-Refactor.md
├── smithery.yaml
└── tsconfig.json
```

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```



## Running evals

The evals package loads an mcp client that then runs the index.ts file, so there is no need to rebuild between tests. You can load environment variables by prefixing the npx command. Full documentation can be found [here](https://www.mcpevals.io/docs).

```bash
OPENAI_API_KEY=your-key  npx mcp-eval src/evals/evals.ts src/tools/extractLinksTool.ts
```
## Error Handling

The server implements comprehensive error handling:

- Invalid parameters
- Network errors
- Content parsing errors
- URL validation

All errors are properly formatted according to the MCP specification.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the LICENSE file for details
