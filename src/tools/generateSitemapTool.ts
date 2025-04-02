import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { TOOL_NAME, TOOL_DESCRIPTION, TOOL_PARAMS } from "./generateSitemapToolParams.js"; // Use new params file
import { GenerateSitemapService } from "../services/GenerateSitemapService.js"; // Use new service file
// import { GenerateSitemapArgs } from "../types/generateSitemapTypes.js"; // Args type defined below
import { ValidationError, ServiceError } from "../utils/index.js";
import { logger } from "../utils/index.js";

// Define the type for the arguments based on TOOL_PARAMS
type GenerateSitemapToolArgs = z.infer<z.ZodObject<typeof TOOL_PARAMS>>;

/**
 * Registers the generate-site-map tool with the MCP server.
 * Acts as an adapter between the MCP server and the GenerateSitemapService.
 *
 * @param server - MCP server instance to register the tool with.
 * @param config - Optional configuration for the GenerateSitemapService (currently unused).
 */
export const generateSitemapTool = (server: McpServer, config?: any /* Replace 'any' with specific config type */): void => {
    const serviceInstance = new GenerateSitemapService();

    /**
     * Processes the generate-site-map tool request.
     * @param args - The arguments object matching TOOL_PARAMS.
     */
    const processRequest = async (args: GenerateSitemapToolArgs) => {
        // Zod handles defaults for maxDepth and limit
        const { url, maxDepth, limit } = args;
        logger.debug(`Received ${TOOL_NAME} request`, { url, maxDepth, limit });

        try {
            // Call the service method
            const result = await serviceInstance.generateSitemap(url, maxDepth, limit);

            // Format the successful output for MCP - return XML content
            return {
                content: [{
                    type: "text" as const, // Could also use 'application/xml' if client supports it
                    text: result.sitemapXml
                }]
                // Optionally include urlCount in metadata if needed/supported
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
