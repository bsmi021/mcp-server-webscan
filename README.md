# MCP Webscan Server
[![smithery badge](https://smithery.ai/badge/mcp-server-webscan)](https://smithery.ai/server/mcp-server-webscan)

A Model Context Protocol (MCP) server for web content scanning and analysis. This server provides tools for fetching, analyzing, and extracting information from web pages.

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

1. `fetch_page`
   - Fetches a web page and converts it to Markdown
   - Parameters:
     - `url` (required): URL of the page to fetch
     - `selector` (optional): CSS selector to target specific content

2. `extract_links`
   - Extracts all links from a web page with their text
   - Parameters:
     - `url` (required): URL of the page to analyze
     - `baseUrl` (optional): Base URL to filter links

3. `crawl_site`
   - Recursively crawls a website up to a specified depth
   - Parameters:
     - `url` (required): Starting URL to crawl
     - `maxDepth` (optional, default: 2): Maximum crawl depth

4. `check_links`
   - Checks for broken links on a page
   - Parameters:
     - `url` (required): URL to check links for

5. `find_patterns`
   - Finds URLs matching a specific pattern
   - Parameters:
     - `url` (required): URL to search in
     - `pattern` (required): Regex pattern to match URLs against

6. `generate_sitemap`
   - Generates a simple XML sitemap
   - Parameters:
     - `url` (required): Root URL for sitemap
     - `maxUrls` (optional, default: 100): Maximum number of URLs to include

## Example Usage with Claude Desktop

1. Configure the server in your Claude Desktop settings:

```json
{
  "mcpServers": {
    "webscan": {
      "command": "node",
      "args": ["path/to/mcp-server-webscan/dist/index.js"],
      "env": {
        "NODE_ENV": "development"
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

### Project Structure

```
mcp-server-webscan/
├── src/
│   └── index.ts    # Main server implementation
├── dist/           # Compiled JavaScript
├── package.json
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
