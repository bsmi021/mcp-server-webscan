import { logger } from '../utils/index.js'; // Assuming logger will be available

// Define placeholder config interfaces or import them from types if they exist later
// Example:
// import { CoreConfig, YourServiceConfig } from '../types/index.js';

// Placeholder for actual configuration types
interface CoreConfig {
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

// Add other service-specific config interfaces here as needed
// interface WebScanConfig { ... }

export class ConfigurationManager {
    private static instance: ConfigurationManager;

    // Structure to hold different configuration sections
    private config: {
        core: Required<CoreConfig>;
        // Add other config sections here, e.g.:
        // webScan: Required<WebScanConfig>;
    };

    // Private constructor ensures singleton pattern
    private constructor() {
        logger.debug('Initializing ConfigurationManager...');
        // Initialize default configuration values
        this.config = {
            core: {
                logLevel: process.env.LOG_LEVEL === 'debug' ? 'debug' : 'info', // Example: Read from env var
            },
            // Initialize other default configs here
            // webScan: { ... }
        };
        logger.debug('ConfigurationManager initialized with defaults.');
    }

    /**
     * Gets the singleton instance of the ConfigurationManager.
     * @returns The singleton ConfigurationManager instance.
     */
    public static getInstance(): ConfigurationManager {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager();
        }
        return ConfigurationManager.instance;
    }

    /**
     * Gets the core configuration settings.
     * @returns A copy of the required core configuration.
     */
    public getCoreConfig(): Required<CoreConfig> {
        // Return a copy to prevent direct modification
        return { ...this.config.core };
    }

    /**
     * Updates the core configuration settings.
     * @param config - Partial core configuration object.
     */
    public updateCoreConfig(config: Partial<CoreConfig>): void {
        this.config.core = {
            ...this.config.core,
            ...config,
        };
        logger.info('Core configuration updated', { newConfig: this.config.core });
        // Potentially notify services or re-initialize logger if needed
    }

    // Add getters and updaters for other configuration sections as needed
    // Example:
    // public getWebScanConfig(): Required<WebScanConfig> {
    //   return { ...this.config.webScan };
    // }
    //
    // public updateWebScanConfig(config: Partial<WebScanConfig>): void {
    //   this.config.webScan = { ...this.config.webScan, ...config };
    //   logger.info('WebScan configuration updated');
    // }
}
