import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ConfigurationManager } from "../config/ConfigurationManager.js"; // Needed if passing config
import { logger } from "../utils/index.js";

// Import individual tool registration functions
import { checkLinksTool } from "./checkLinksTool.js";
import { crawlSiteTool } from "./crawlSiteTool.js";
import { extractLinksTool } from "./extractLinksTool.js";
import { fetchPageTool } from "./fetchPageTool.js";
import { findPatternsTool } from "./findPatterns.js";
import { generateSitemapTool } from "./generateSitemapTool.js";

/**
 * Registers all available tools with the MCP server instance.
 * This function acts as the central point for tool registration.
 *
 * @param server - The McpServer instance to register tools with.
 */
export function registerTools(server: McpServer): void {
    logger.info("Registering tools...");

    // Get config manager instance if needed to pass specific configs to tools
    // const configManager = ConfigurationManager.getInstance();

    // Register each tool
    // Pass specific config if the tool/service requires it, e.g.:
    // checkLinksTool(server, configManager.getCheckLinksConfig());
    checkLinksTool(server);
    crawlSiteTool(server);
    extractLinksTool(server);
    fetchPageTool(server);
    findPatternsTool(server);
    generateSitemapTool(server);

    logger.info("All tools registered.");
}

// Optionally re-export individual tool functions if needed elsewhere, though unlikely
// export { checkLinksTool, crawlSiteTool, ... };
