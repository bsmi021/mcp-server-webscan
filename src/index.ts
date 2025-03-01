import { extractLinksTool } from "./tools/extractLinksTool.js";
import { createServer } from "./initialize.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { crawlSiteTool } from "./tools/crawlSiteTool.js";
import { checkLinksTool } from "./tools/checkLinksTool.js";
import { fetchPageTool } from "./tools/fetchPageTool.js";
import { findPatternsTool } from "./tools/findPatterns.js";
import { generateSiteMapTool } from "./tools/genereateSiteMaptool.js";

const main = async () => {
    try {
        console.error("Initializing webscan MCP server...");

        // Create and configure the MCP server
        const server = createServer();

        // Register tools
        extractLinksTool(server);
        crawlSiteTool(server);
        checkLinksTool(server);
        fetchPageTool(server);
        findPatternsTool(server);
        generateSiteMapTool(server);


        // Start the MCP server
        const transport = new StdioServerTransport();
        await server.connect(transport);

        console.error("Webscan MCP server initialized and running.");

    } catch (error) {
        console.error("Error initializing webscan MCP server:", error);
        process.exit(1);
    }
}

// Run the main function
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
