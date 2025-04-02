import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { TOOL_NAME, TOOL_DESCRIPTION, TOOL_PARAMS } from "./fetchPageToolParams.js";
import { FetchPageService } from "../services/FetchPageService.js";
// import { FetchPageArgs } from "../types/fetchPageTypes.js"; // Args type defined below
import { ValidationError, ServiceError, NotFoundError } from "../utils/index.js";
import { logger } from "../utils/index.js";

// Define the type for the arguments based on TOOL_PARAMS
type FetchPageToolArgs = z.infer<z.ZodObject<typeof TOOL_PARAMS>>;

/**
 * Registers the fetch-page tool with the MCP server.
 * Acts as an adapter between the MCP server and the FetchPageService.
 *
 * @param server - MCP server instance to register the tool with.
 * @param config - Optional configuration for the FetchPageService (currently unused).
 */
export const fetchPageTool = (server: McpServer, config?: any /* Replace 'any' with specific config type */): void => {
    const serviceInstance = new FetchPageService();

    /**
     * Processes the fetch-page tool request.
     * @param args - The arguments object matching TOOL_PARAMS.
     */
    const processRequest = async (args: FetchPageToolArgs) => {
        const { url, selector } = args;
        logger.debug(`Received ${TOOL_NAME} request`, { url, selector });

        try {
            // Call the service method
            const result = await serviceInstance.fetchAndConvertToMarkdown(url, selector);

            // Format the successful output for MCP
            return {
                content: [{
                    type: "text" as const,
                    // Return only the markdown content as per standard tool response
                    text: result.markdownContent
                }]
                // Optionally include sourceUrl and selectorUsed in metadata if the protocol supports it,
                // but the primary content should be the markdown.
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
            // Map NotFoundError specifically if needed (e.g., if selector didn't match)
            if (error instanceof NotFoundError) {
                // Using InternalError, but could potentially map to a more specific MCP code if available/appropriate
                // Or return a specific message indicating the selector issue.
                throw new McpError(ErrorCode.InternalError, `Content extraction failed: ${error.message}`, error.details);
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
