import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';



const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


/**
 * Get the root directory of our application
 * This ensures consistent path resolution regardless of where the process is started
 */
export const getAppRoot = () => {
    // Go up one level from src to get to the app root
    return path.resolve(__dirname, '..');
};

export const createServer = (): McpServer => {
    const server = new McpServer({
        name: "webscan",
        version: "1.0.0",
        description: ""
    });

    // Handle cleanup on exit
    process.on('exit', async () => {
        try {
            //await browserManager.cleanup();
            //await dbManager.close();
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    });

    return server;
}

