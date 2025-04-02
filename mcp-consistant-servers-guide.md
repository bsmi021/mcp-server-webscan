
# Comprehensive Guide: Developing Consistent MCP Servers (LLM Optimized)

This guide outlines the steps and patterns, derived from the provided codebase, to build robust and consistent MCP servers. It emphasizes clarity and structure, making it suitable for LLM understanding and execution.

**Core Principles:**

1. **Modularity:** Each piece (tool, service, type, config) has its place.
2. **Consistency:** Follow the same pattern for every new tool/service.
3. **Explicitness:** Define types clearly (TypeScript) and describe parameters thoroughly (`zod` descriptions).
4. **Separation of Concerns:**
    * **MCP Server/Transport:** Handles protocol communication (`initialize.ts`, `server.ts`).
    * **Tool Registration:** Connects MCP tools to services (`tools/index.ts`, `tools/*Tool.ts`).
    * **Tool Parameters:** Defines the tool's interface for the LLM (`tools/*Params.ts`).
    * **Services:** Contain the core business logic (`services/*Service.ts`).
    * **Types:** Define data structures and interfaces (`types/*.ts`).
    * **Configuration:** Manages settings (`config/ConfigurationManager.ts`).
    * **Utilities:** Provides reusable helper functions (`utils/*.ts`).
5. **KISS (Keep It Simple, Stupid):** While the implementation details within services might be complex, the *structure* for adding new capabilities remains simple and repeatable.

**I. Standard Project Structure**

```
src/
├── config/
│   └── ConfigurationManager.ts  # Singleton for managing all configs
├── services/
│   ├── YourService.ts         # Core logic for a specific capability
│   └── index.ts               # Barrel file for exporting services
├── tools/
│   ├── yourTool.ts            # Registers the tool with MCP server, acts as adapter
│   ├── yourToolParams.ts      # Defines TOOL_NAME, TOOL_DESCRIPTION, TOOL_PARAMS (Zod)
│   └── index.ts               # Central function to register all tools
├── types/
│   ├── yourServiceTypes.ts    # Interfaces/types specific to YourService
│   └── index.ts               # Barrel file for exporting types, common types
├── utils/
│   ├── contextSanitizer.ts    # Example utility
│   ├── errors.ts              # Custom error classes
│   ├── logger.ts              # Structured JSON logger utility (stderr)
│   └── index.ts               # Barrel file for exporting utils
├── initialize.ts              # Creates and configures the McpServer instance
└── server.ts                  # Entry point, connects transport, starts server
```

**II. Step-by-Step: Adding a New Tool ("YourTool")**

Follow these steps consistently for each new capability:

**Step 1: Define Types (`src/types/yourServiceTypes.ts`)**

* Define TypeScript interfaces for the data structures your service will use (e.g., input data, output data, state, configuration).
* If runtime validation is needed (especially at API boundaries like tool input), define corresponding `zod` schemas alongside or within these type files.
* Export types from `src/types/index.ts`.

```typescript
// src/types/yourServiceTypes.ts
import { z } from 'zod';

// Configuration specific to YourService
export interface YourServiceConfig {
  someSetting: string;
  retryCount: number;
}

// Data structure for the service's core operation
export interface YourServiceData {
  id: string;
  input: string;
  processedValue?: number;
  status: 'pending' | 'processing' | 'complete' | 'error';
  metrics?: YourServiceMetrics;
}

export interface YourServiceMetrics {
  processingTimeMs: number;
}

// Optional: Zod schema if validation is needed at boundaries
export const yourServiceDataSchema = z.object({
  id: z.string().uuid(),
  input: z.string().min(1),
  // ... other fields
});

// src/types/index.ts
export * from './yourServiceTypes.js';
// ... export other types
```

**Step 2: Implement the Service (`src/services/YourService.ts`)**

* Create a class (e.g., `YourService`) to encapsulate the core logic.
* Inject configuration via the constructor. Use `ConfigurationManager` to get defaults.
* Implement methods that perform the actual work (e.g., `processData(data: YourServiceData): Promise<YourServiceData>`).
* Manage internal state if necessary.
* Use utility functions (`logger`, `sanitizeContext`, custom errors) from `src/utils/`.
* Focus *only* on the business logic, not MCP specifics.
* Export the service class from `src/services/index.ts`.

```typescript
// src/services/YourService.ts
import { ConfigurationManager } from '../config/ConfigurationManager.js';
import { YourServiceConfig, YourServiceData } from '../types/index.js';
import { logger } from '../utils/index.js';
import { ValidationError } from '../utils/errors.js'; // Use custom errors

export class YourService {
  private readonly config: Required<YourServiceConfig>;

  constructor(config: Partial<YourServiceConfig> = {}) {
    const configManager = ConfigurationManager.getInstance();
    // Assuming ConfigurationManager has a method to get YourService config
    const defaultConfig = configManager.getYourServiceConfig();
    this.config = { ...defaultConfig, ...config };
  }

  public async processData(inputData: unknown): Promise<YourServiceData> {
    const startTime = Date.now();
    logger.debug("Processing data", { config: this.config });

    // 1. Validate input (using Zod schema if defined)
    // const validationResult = yourServiceDataSchema.safeParse(inputData);
    // if (!validationResult.success) {
    //   throw new ValidationError('Invalid input data', validationResult.error.format());
    // }
    // const data = validationResult.data as YourServiceData; // Or transform input

    // TEMP: Simple type assertion for example
    const data = inputData as YourServiceData;
    if (!data || typeof data.input !== 'string') {
       throw new ValidationError('Invalid input: input string is required.');
    }

    // 2. Perform core logic
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate work
    const processedValue = data.input.length * this.config.retryCount;

    // 3. Prepare result
    const result: YourServiceData = {
      ...data,
      processedValue,
      status: 'complete',
      metrics: {
        processingTimeMs: Date.now() - startTime,
      },
    };
    logger.info("Data processed successfully", { id: result.id });
    return result;
  }
}

// src/services/index.ts
export * from './YourService.js';
// ... export other services
```

**Step 3: Define Tool Parameters (`src/tools/yourToolParams.ts`)**

* Define `TOOL_NAME` (e.g., `const TOOL_NAME = "yourTool";`).
* Define `TOOL_DESCRIPTION` (string, be descriptive for the LLM).
* Define `TOOL_PARAMS` using `zod`. **This is critical for LLM interaction.**
  * Use `z.object({...})`.
  * For each parameter, use the appropriate `zod` type (e.g., `z.string()`, `z.number()`, `z.boolean()`, `z.array()`, `z.enum()`).
  * **Crucially, use `.describe("Detailed explanation...")` for every parameter.** Explain what it is, its purpose, constraints, valid values, and how it relates to other parameters. Include examples if helpful. This documentation is directly used by the LLM.
  * Mark optional parameters with `.optional()`.
  * Define nested objects or arrays as needed.

```typescript
// src/tools/yourToolParams.ts
import { z } from 'zod';

export const TOOL_NAME = "yourTool";

export const TOOL_DESCRIPTION = `Processes input data using YourService.
This tool takes an input string and applies specific processing based on configuration.
It returns the processed data including a calculated value and metrics.`;

export const TOOL_PARAMS = {
  // Use z.object for the top-level structure if passing a single object argument
  // If passing multiple arguments, list them directly (less common in MCP tools)
  id: z.string().uuid().describe("A unique identifier (UUID format) for the data processing request. Ensures idempotency if needed."),
  input: z.string().min(1).max(1024).describe("The primary input string to be processed. Must be between 1 and 1024 characters."),
  priority: z.number().int().min(1).max(5).optional().describe("Optional processing priority (1=highest, 5=lowest). Defaults to 3 if not provided."),
  // Example nested object
  metadata: z.object({
    source: z.string().optional().describe("Optional source system identifier."),
    timestamp: z.string().datetime().optional().describe("Optional ISO 8601 timestamp of when the data was generated.")
  }).optional().describe("Optional metadata associated with the input data.")
};

// Optional: Define a Zod schema for the entire input object if needed for validation
// export const yourToolInputSchema = z.object(TOOL_PARAMS);
```

**Step 4: Implement Tool Registration (`src/tools/yourTool.ts`)**

* Import the `McpServer`, `McpError`, `ErrorCode` from the SDK.
* Import your service (`YourService`), tool parameters (`TOOL_NAME`, `TOOL_DESCRIPTION`, `TOOL_PARAMS`), and any necessary types.
* Create a function (e.g., `yourTool(server: McpServer, config?: Partial<YourServiceConfig>)`) that takes the `McpServer` instance and optional configuration.
* Inside this function:
  * Instantiate your service (`new YourService(config)`). Store it if it needs to persist across calls (though the example shows instantiation per registration).
  * Define an `async` wrapper function (e.g., `processYourToolRequest`) that will be the tool's execution logic.
    * This function receives the arguments (`args`) defined by `TOOL_PARAMS`.
    * **Validate/Transform Input:** Use the Zod schema (if created) or perform manual checks/transformations to match the `YourService` input requirements.
    * **Call the Service:** `await yourServiceInstance.processData(transformedInput);`
    * **Handle Errors:** Wrap the service call in a `try...catch` block.
      * Catch specific custom errors (e.g., `ValidationError`) and map them to appropriate `McpError` instances (e.g., `ErrorCode.InvalidParams`).
      * Catch generic errors and map them to `ErrorCode.InternalError`.
    * **Format Output:** Format the service's result into the MCP content structure: `{ content: [{ type: "text", text: JSON.stringify(result) }] }`.
  * Call `server.tool(TOOL_NAME, TOOL_DESCRIPTION, TOOL_PARAMS, processYourToolRequest);`.

```typescript
// src/tools/yourTool.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod"; // Import Zod if using schema validation here
import { TOOL_NAME, TOOL_DESCRIPTION, TOOL_PARAMS } from "./yourToolParams.js";
import { YourService } from "../services/index.js";
import { YourServiceConfig, YourServiceData } from "../types/index.js";
import { ValidationError } from "../utils/errors.js"; // Import custom errors
import { logger } from "../utils/index.js";

// Optional: Define input type based on Zod schema for type safety
// type YourToolInput = z.infer<typeof yourToolInputSchema>;
// If TOOL_PARAMS defines multiple args, create a type for that object:
type YourToolArgs = {
  id: string;
  input: string;
  priority?: number;
  metadata?: { source?: string; timestamp?: string };
};


export const yourTool = (server: McpServer, config?: Partial<YourServiceConfig>): void => {
  // Instantiate the service - consider if it should be singleton or per-request
  const serviceInstance = new YourService(config);

  const processYourToolRequest = async (args: YourToolArgs /* or YourToolInput */) => {
    logger.debug(`Received ${TOOL_NAME} request`, { args });
    try {
      // 1. Input Validation/Transformation (Example)
      // Use Zod schema if defined:
      // const validationResult = yourToolInputSchema.safeParse(args);
      // if (!validationResult.success) {
      //    throw new ValidationError('Invalid tool parameters', validationResult.error.format());
      // }
      // const validatedArgs = validationResult.data;

      // Manual transformation to match service input if needed:
      const serviceInput: Partial<YourServiceData> = {
        id: args.id,
        input: args.input,
        status: 'pending',
        // Map other args as needed
      };

      // 2. Call the service
      const result = await serviceInstance.processData(serviceInput);

      // 3. Format the successful output for MCP
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2) // Pretty print JSON
        }]
      };

    } catch (error) {
      logger.error(`Error processing ${TOOL_NAME}`, error, { args }); // Pass error object and context

      // 4. Map errors to McpError
      if (error instanceof ValidationError) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Validation failed: ${error.message}`,
          error.details // Pass details if available
        );
      }
      if (error instanceof McpError) {
         throw error; // Re-throw existing McpErrors
      }
      // Generic internal error
      throw new McpError(
        ErrorCode.InternalError,
        error instanceof Error ? error.message : 'An unexpected error occurred in yourTool.'
      );
    }
  };

  server.tool(
    TOOL_NAME,
    TOOL_DESCRIPTION,
    TOOL_PARAMS, // Pass the Zod schema directly
    processYourToolRequest
  );

  logger.info("Tool registered", { toolName: TOOL_NAME });
};
```

**Step 5: Centralize Tool Registration (`src/tools/index.ts`)**

* Import the registration function (`yourTool`) created in the previous step.
* Create helper functions (e.g., `registerYourTool`) if configuration fetching or complex setup is needed per tool.
* Modify the main `registerTools(server: McpServer)` function to call `yourTool(server, config)` or `registerYourTool(server)`.

```typescript
// src/tools/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ConfigurationManager } from "../config/ConfigurationManager.js";
// Import other tool registration functions
import { thinkingTool } from "./sequentialThinkingTool.js";
import { yourTool } from "./yourTool.js"; // Import the new tool

/**
 * Register all tools with the MCP server
 */
export function registerTools(server: McpServer): void {
  // Register existing tools
  registerThinkingTool(server);
  // ... other existing tool registrations

  // Register the new tool
  registerYourTool(server);
}

// Helper function for consistent registration (optional but good practice)
function registerThinkingTool(server: McpServer): void {
  const configManager = ConfigurationManager.getInstance();
  // Fetch specific configs if needed
  thinkingTool(server, {
    core: configManager.getCoreConfig(),
    // ... other configs
  });
}

// Helper for the new tool
function registerYourTool(server: McpServer): void {
  const configManager = ConfigurationManager.getInstance();
  // Fetch specific config for YourService
  yourTool(server, configManager.getYourServiceConfig()); // Assuming this method exists
}
```

**Step 6: Add Configuration (`src/config/ConfigurationManager.ts`)**

* If your service needs configuration:
  * Add the `YourServiceConfig` interface to the manager's internal `config` structure.
  * Provide default values in the constructor.
  * Add a getter method (e.g., `getYourServiceConfig(): Required<YourServiceConfig>`).
  * Add an update method if runtime updates are needed.

```typescript
// src/config/ConfigurationManager.ts
import { YourServiceConfig } from '../types/index.js'; // Import the new config type
// ... other imports

export class ConfigurationManager {
  // ... (singleton implementation)

  private config: {
    // ... other configs
    yourService: Required<YourServiceConfig>;
  };

  private constructor() {
    this.config = {
      // ... other default configs
      yourService: {
        // Define defaults for YourService
        someSetting: 'default value',
        retryCount: 3,
      },
    };
  }

  // ... (getInstance method)

  // Getter for the new config
  public getYourServiceConfig(): Required<YourServiceConfig> {
    return { ...this.config.yourService };
  }

  // Optional: Update method
  public updateYourServiceConfig(config: Partial<YourServiceConfig>): void {
    this.config.yourService = {
      ...this.config.yourService,
      ...config,
    };
    // Potentially notify services or re-initialize if needed
  }

  // ... other getters/updaters
}
```

**Step 7: Add Utilities (`src/utils/`)**

* If your service requires reusable helper functions (e.g., specific data transformations, complex calculations), create them in separate files within `src/utils/`.
* Export them via `src/utils/index.ts`.

**Step 8: Server Initialization (`src/initialize.ts`, `src/server.ts`)**

* Ensure `createServer` in `src/initialize.ts` calls the `registerTools` function.
* The entry point `src/server.ts` should import `createServer`, create the server instance, connect the transport (e.g., `StdioServerTransport`), and handle potential startup errors. No changes are usually needed here when just adding a tool, assuming `registerTools` is already called.

**III. Key Practices Recap**

* **Zod for Params:** Use `zod` in `*Params.ts` files. Use `.describe()` extensively for LLM guidance.
* **TypeScript Types:** Define clear interfaces in `src/types/`.
* **Service Layer:** Isolate logic in `src/services/`. Services don't know about MCP.
* **Tool Layer (`*Tool.ts`):** Acts as an adapter. Handles MCP specifics: receives args, calls service, formats output, maps errors to `McpError`.
* **Configuration:** Use `ConfigurationManager` singleton for centralized config.
* **Error Handling:** Use custom error classes internally; map to `McpError` in the tool layer.
* **Logging:** Use the structured JSON logger utility (`src/utils/logger.ts`) which writes to `stderr`. Include relevant context objects in logs.
* **Barrel Files (`index.ts`):** Use them in `services`, `types`, `utils` for cleaner imports.

---

By consistently following this structure and these steps, you can build complex MCP servers that remain maintainable, testable, and easy for both humans and LLMs to understand and extend, adhering to the KISS principle in its structure and workflow. The most crucial part for LLM optimization is the detailed `.describe()` content within the `zod` schemas in the `*Params.ts` files.

---
The core philosophy observed in the codebase is: **Structure, Separation, and Clarity.**

1. **Structure:** A consistent directory and file naming convention.
2. **Separation:** Clear boundaries between server setup, tool definition, business logic (services), data types, configuration, and utilities.
3. **Clarity:** Explicit type definitions, detailed parameter descriptions (crucial for LLMs), and focused utility functions.
