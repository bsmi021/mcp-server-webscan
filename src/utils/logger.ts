// Define log levels using string literal union (as per .clinerules)
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Basic configuration - could be enhanced by ConfigurationManager later
let currentLogLevel: LogLevel = process.env.LOG_LEVEL === 'debug' ? 'debug' : 'info';

// Map log levels to severity numbers for comparison
const LogLevelSeverity: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

/**
 * Sets the minimum log level to output.
 * @param level - The minimum log level ('debug', 'info', 'warn', 'error').
 */
export function setLogLevel(level: LogLevel): void {
    if (LogLevelSeverity[level] !== undefined) {
        currentLogLevel = level;
        log('info', `Log level set to: ${level}`);
    } else {
        log('warn', `Invalid log level specified: ${level}. Keeping current level: ${currentLogLevel}`);
    }
}

/**
 * Core logging function that outputs structured JSON to stderr.
 * @param level - The log level.
 * @param message - The main log message.
 * @param context - Optional context object to include in the log entry.
 */
function log(level: LogLevel, message: string, context?: Record<string, unknown> | Error): void {
    if (LogLevelSeverity[level] < LogLevelSeverity[currentLogLevel]) {
        return; // Skip logging if level is below current threshold
    }

    const logEntry: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        level: level,
        message: message,
    };

    // Handle context object or Error instance
    if (context) {
        if (context instanceof Error) {
            // If context is an Error, extract relevant properties
            logEntry.error = {
                name: context.name,
                message: context.message,
                stack: context.stack,
                // Include custom properties if they exist (e.g., from custom error classes)
                ...(Object.keys(context).length > 0 && { details: { ...context } }),
            };
            // Overwrite message if error message is more specific
            if (!message && context.message) {
                logEntry.message = context.message;
            }
        } else if (typeof context === 'object' && context !== null) {
            // If context is a plain object, merge it
            logEntry.context = context;
        } else {
            // If context is something else, log its string representation
            logEntry.context = String(context);
        }
    }


    try {
        // Write the structured JSON log entry to stderr
        process.stderr.write(JSON.stringify(logEntry) + '\n');
    } catch (error) {
        // Fallback if JSON stringification fails (e.g., circular references)
        const fallbackMessage = `Fallback log (${level}): ${message} - Context: ${context instanceof Error ? context.message : String(context)} - Stringify Error: ${error instanceof Error ? error.message : String(error)}\n`;
        process.stderr.write(fallbackMessage);
    }
}

// Export logger functions adhering to a common interface
export const logger = {
    debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
    info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
    warn: (message: string, context?: Record<string, unknown> | Error) => log('warn', message, context),
    // Allow passing Error directly as context for error logs
    error: (message: string, context?: Record<string, unknown> | Error) => log('error', message, context),
    setLogLevel: setLogLevel,
};

// Example usage:
// logger.info("Server started", { port: 3000 });
// try { throw new Error("Something broke"); } catch (e) { logger.error("Operation failed", e); }
