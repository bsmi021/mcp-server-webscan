import TurndownService from 'turndown';

/**
 * TurndownService instance for HTML to Markdown conversion
 */
export const turndown = new TurndownService();

/**
 * Converts HTML to Markdown
 * @param html - The HTML content to convert
 * @returns The converted Markdown
 */
export function htmlToMarkdown(html: string): string {
    return turndown.turndown(html);
}
