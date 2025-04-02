import { createServer } from "./initialize.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// Individual tool imports are no longer needed here, registration happens in initialize.ts via tools/index.ts

const main = async () => {
    try {
        console.error("Initializing webscan MCP server...");

        // Create and configure the MCP server (this now includes tool registration)
        const server = createServer();

        // Tool registration is now handled within createServer via registerTools

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
