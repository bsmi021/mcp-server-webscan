import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { TOOL_NAME, TOOL_DESCRIPTION, TOOL_PARAMS } from "./extractLinksToolParams.js";
import { ExtractLinksService } from "../services/ExtractLinksService.js";
// import { ExtractLinksArgs } from "../types/extractLinksTypes.js"; // Args type defined below
import { ValidationError, ServiceError } from "../utils/index.js";
import { logger } from "../utils/index.js";

// Define the type for the arguments based on TOOL_PARAMS
type ExtractLinksToolArgs = z.infer<z.ZodObject<typeof TOOL_PARAMS>>;

/**
 * Registers the extract-links tool with the MCP server.
 * Acts as an adapter between the MCP server and the ExtractLinksService.
 *
 * @param server - MCP server instance to register the tool with.
 * @param config - Optional configuration for the ExtractLinksService (currently unused).
 */
export const extractLinksTool = (server: McpServer, config?: any /* Replace 'any' with specific config type */): void => {
    const serviceInstance = new ExtractLinksService();

    /**
     * Processes the extract-links tool request.
     * @param args - The arguments object matching TOOL_PARAMS.
     */
    const processRequest = async (args: ExtractLinksToolArgs) => {
        // Zod handles default for limit if not provided
        const { url, baseUrl, limit } = args;
        logger.debug(`Received ${TOOL_NAME} request`, { url, baseUrl, limit });

        try {
            // Call the service method
            const results = await serviceInstance.extractLinksFromPage(url, baseUrl, limit);

            // Format the successful output for MCP
            // Note: The original tool returned a 'links' property alongside content.
            // The standard MCP response only has 'content'. We'll return the JSON string in content.
            // If the 'links' property was specifically needed by the client, this is a breaking change.
            return {
                content: [{
                    type: "text" as const,
                    text: JSON.stringify(results, null, 2)
                }]
                // links: results // This is non-standard for MCP tool responses
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
