//evals.ts

import { EvalConfig } from 'mcp-evals';
import { openai } from "@ai-sdk/openai";
import { grade, EvalFunction } from "mcp-evals";

const extractLinksToolEval: EvalFunction = {
    name: 'extractLinksToolEval',
    description: 'Evaluates link extraction from a webpage using the extract-links tool',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please extract up to 3 links from https://example.com using the base URL https://example.com");
        return JSON.parse(result);
    }
};

const generateSitemapToolEval: EvalFunction = {
    name: "generateSitemapTool",
    description: "Evaluates generateSitemapTool functionality",
    run: async () => {
        const result = await grade(openai("gpt-4"), "Generate a sitemap for https://example.com with a maximum depth of 3 and limit of 10 URLs. Include the XML in the response.");
        return JSON.parse(result);
    }
};

const crawlSiteToolEval: EvalFunction = {
    name: 'crawlSiteTool Evaluation',
    description: 'Evaluates the crawling of a website with a specified max depth',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please crawl the site https://www.example.com up to a depth of 2 and list the discovered pages.");
        return JSON.parse(result);
    }
};

const findPatternsToolEval: EvalFunction = {
    name: 'findPatternsToolEval',
    description: 'Evaluates the findPatternsTool functionality',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please find all links matching the pattern 'example' on the webpage https://www.example.com.");
        return JSON.parse(result);
    }
};

const TOOL_NAMEEval: EvalFunction = {
    name: "TOOL_NAME Tool Evaluation",
    description: "Evaluates the functionality of TOOL_NAME by testing its ability to process a request",
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please demonstrate how TOOL_NAME handles a request with the input 'Hello, tool!'");
        return JSON.parse(result);
    }
};

const config: EvalConfig = {
    model: openai("gpt-4"),
    evals: [extractLinksToolEval, generateSitemapToolEval, crawlSiteToolEval, findPatternsToolEval, TOOL_NAMEEval]
};
  
export default config;
  
export const evals = [extractLinksToolEval, generateSitemapToolEval, crawlSiteToolEval, findPatternsToolEval, TOOL_NAMEEval];