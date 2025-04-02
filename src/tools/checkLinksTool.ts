import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod"; // Keep Zod for potential future input schema use if needed
import { TOOL_NAME, TOOL_DESCRIPTION, TOOL_PARAMS } from "./checkLinksToolParams.js";
import { CheckLinksService } from "../services/CheckLinksService.js";
import { CheckLinksArgs } from "../types/checkLinksTypes.js"; // Use specific type
import { ValidationError, ServiceError } from "../utils/index.js"; // Import custom errors
import { logger } from "../utils/index.js";

// Define the type for the arguments based on TOOL_PARAMS
// This provides type safety within the processRequest function
type CheckLinksToolArgs = z.infer<z.ZodObject<typeof TOOL_PARAMS>>;

/**
 * Registers the check-links tool with the MCP server.
 * This acts as an adapter between the MCP server and the CheckLinksService.
 *
 * @param server - MCP server instance to register the tool with.
 * @param config - Optional configuration for the CheckLinksService (currently unused).
 */
export const checkLinksTool = (server: McpServer, config?: any /* Replace 'any' with specific config type if CheckLinksService uses it */): void => {
    // Instantiate the service
    // If the service needs config, pass it here: new CheckLinksService(config)
    const serviceInstance = new CheckLinksService();

    /**
     * Processes the check-links tool request.
     * Validates input, calls the service, handles errors, and formats the response.
     * @param args - The arguments object matching TOOL_PARAMS.
     */
    const processRequest = async (args: CheckLinksToolArgs) => {
        logger.debug(`Received ${TOOL_NAME} request`, { args });

        // Input validation is implicitly handled by Zod in TOOL_PARAMS when the server calls this.
        // If more complex validation or transformation is needed, it can be done here.

        try {
            // Call the service method with the validated URL
            const results = await serviceInstance.checkLinksOnPage(args.url);

            // Format the successful output for MCP
            return {
                content: [{
                    type: "text" as const,
                    text: JSON.stringify(results, null, 2) // Pretty print JSON
                }]
            };

        } catch (error) {
            // Combine error and args into a single context object for logging
            const logContext = {
                args,
                errorDetails: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error)
            };
            logger.error(`Error processing ${TOOL_NAME}`, logContext); // Pass combined context

            // Map service-specific errors to McpError
            if (error instanceof ValidationError) {
                throw new McpError(
                    ErrorCode.InvalidParams,
                    `Validation failed: ${error.message}`,
                    error.details // Pass details if available
                );
            }
            if (error instanceof ServiceError) {
                // Use the message from the ServiceError
                throw new McpError(
                    ErrorCode.InternalError,
                    error.message, // Pass service error message directly
                    error.details
                );
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

    // Register the tool with the server
    server.tool(
        TOOL_NAME,
        TOOL_DESCRIPTION,
        TOOL_PARAMS, // Pass the Zod schema directly
        processRequest
    );

    logger.info("Tool registered", { toolName: TOOL_NAME });
};
