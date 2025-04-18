import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { TOOL_NAME, TOOL_DESCRIPTION, TOOL_PARAMS } from "./findPatternsToolParams.js";
import { FindPatternsService } from "../services/FindPatternsService.js";
// import { FindPatternsArgs } from "../types/findPatternsTypes.js"; // Args type defined below
import { ValidationError, ServiceError } from "../utils/index.js";
import { logger } from "../utils/index.js";

// Define the type for the arguments based on TOOL_PARAMS
type FindPatternsToolArgs = z.infer<z.ZodObject<typeof TOOL_PARAMS>>;

/**
 * Registers the find-patterns tool with the MCP server.
 * Acts as an adapter between the MCP server and the FindPatternsService.
 *
 * @param server - MCP server instance to register the tool with.
 * @param config - Optional configuration for the FindPatternsService (currently unused).
 */
export const findPatternsTool = (server: McpServer, config?: any /* Replace 'any' with specific config type */): void => {
    const serviceInstance = new FindPatternsService();

    /**
     * Processes the find-patterns tool request.
     * @param args - The arguments object matching TOOL_PARAMS.
     */
    const processRequest = async (args: FindPatternsToolArgs) => {
        const { url, pattern } = args;
        logger.debug(`Received ${TOOL_NAME} request`, { url, pattern: '...' }); // Avoid logging potentially large/complex patterns directly unless needed

        try {
            // Call the service method
            const results = await serviceInstance.findLinksByPattern(url, pattern);

            // Format the successful output for MCP
            return {
                content: [{
                    type: "text" as const,
                    text: JSON.stringify(results, null, 2)
                }]
            };

        } catch (error) {
            const logContext = {
                args: { url: args.url, pattern: '...' }, // Mask pattern in logs
                errorDetails: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error)
            };
            logger.error(`Error processing ${TOOL_NAME}`, logContext);

            // Map service-specific errors to McpError
            if (error instanceof ValidationError) {
                // Check if it's the specific regex validation error from the service
                if (error.message.startsWith('Invalid regex pattern')) {
                    throw new McpError(ErrorCode.InvalidParams, error.message, error.details); // Pass specific message
                }
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
