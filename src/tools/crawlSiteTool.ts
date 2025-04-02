import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { TOOL_NAME, TOOL_DESCRIPTION, TOOL_PARAMS } from "./crawlSiteToolParams.js";
import { CrawlSiteService } from "../services/CrawlSiteService.js";
// import { CrawlSiteArgs } from "../types/crawlSiteTypes.js"; // Args type defined below
import { ValidationError, ServiceError } from "../utils/index.js";
import { logger } from "../utils/index.js";

// Define the type for the arguments based on TOOL_PARAMS
type CrawlSiteToolArgs = z.infer<z.ZodObject<typeof TOOL_PARAMS>>;

/**
 * Registers the crawl-site tool with the MCP server.
 * Acts as an adapter between the MCP server and the CrawlSiteService.
 *
 * @param server - MCP server instance to register the tool with.
 * @param config - Optional configuration for the CrawlSiteService (currently unused).
 */
export const crawlSiteTool = (server: McpServer, config?: any /* Replace 'any' with specific config type */): void => {
    const serviceInstance = new CrawlSiteService();

    /**
     * Processes the crawl-site tool request.
     * @param args - The arguments object matching TOOL_PARAMS.
     */
    const processRequest = async (args: CrawlSiteToolArgs) => {
        // Zod handles default for maxDepth if not provided
        const { url, maxDepth } = args;
        logger.debug(`Received ${TOOL_NAME} request`, { url, maxDepth });

        try {
            // Call the service method
            const result = await serviceInstance.crawlWebsite(url, maxDepth);

            // Format the successful output for MCP
            return {
                content: [{
                    type: "text" as const,
                    text: JSON.stringify(result, null, 2)
                }]
            };

        } catch (error) {
            const logContext = {
                args,
                errorDetails: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error)
            };
            logger.error(`Error processing ${TOOL_NAME}`, logContext);

            // Map service-specific errors to McpError
            if (error instanceof ValidationError) {
                throw new McpError(ErrorCode.InvalidParams, `Validation failed: ${error.message}`, error.details);
            }
            if (error instanceof ServiceError) {
                throw new McpError(ErrorCode.InternalError, error.message, error.details);
            }
            if (error instanceof McpError) {
                throw error; // Re-throw existing McpErrors
            }

            // Catch-all for unexpected errors
            throw new McpError(
                ErrorCode.InternalError,
                error instanceof Error ? `An unexpected error occurred in ${TOOL_NAME}: ${error.message}` : `An unexpected error occurred in ${TOOL_NAME}.`
            );
        }
    };

    // Register the tool
    server.tool(
        TOOL_NAME,
        TOOL_DESCRIPTION,
        TOOL_PARAMS,
        processRequest
    );

    logger.info("Tool registered", { toolName: TOOL_NAME });
};
