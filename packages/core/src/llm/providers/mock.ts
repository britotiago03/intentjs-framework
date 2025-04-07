// src/llm/providers/mock.ts
import { LLMProvider, LLMProviderOptions, LLMRequest, LLMResponse } from '../types';

export class MockProvider implements LLMProvider {
    // Mark as readonly since we don't modify it after construction
    // We're keeping options for consistency with the interface
    // @ts-ignore: options is required by the LLMProvider interface
    private readonly options: LLMProviderOptions;
    public readonly name = 'mock';

    // Predefined responses for common patterns
    private readonly patternResponses: [RegExp, string][] = [
        [/show.*sales.*last month/i, JSON.stringify({ action: "filter", target: "sales", params: { dateRange: "last_month" }, confidence: 0.95 })],
        [/navigate|go|open|show.*dashboard/i, JSON.stringify({ action: "navigate", target: "dashboard", confidence: 0.95 })],
        [/navigate|go|open|show.*settings/i, JSON.stringify({ action: "navigate", target: "settings", confidence: 0.95 })],
        [/navigate|go|open|show.*profile/i, JSON.stringify({ action: "navigate", target: "profile", confidence: 0.95 })],
        [/export.*pdf/i, JSON.stringify({ action: "export", target: "current", params: { format: "pdf" }, confidence: 0.9 })],
        [/export.*csv/i, JSON.stringify({ action: "export", target: "current", params: { format: "csv" }, confidence: 0.9 })],
        [/filter.*region.*europe/i, JSON.stringify({ action: "filter", target: "data", params: { region: "europe" }, confidence: 0.92 })],
        [/sort.*by.*date/i, JSON.stringify({ action: "sort", target: "data", params: { field: "date" }, confidence: 0.88 })],
        [/hello|hi|hey/i, JSON.stringify({ action: "greet", confidence: 0.8 })]
    ];

    constructor(options: LLMProviderOptions) {
        // Store options to maintain interface compatibility
        this.options = {
            ...options
        };
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        const input = request.prompt;

        // Look for matching patterns
        for (const [pattern, response] of this.patternResponses) {
            if (pattern.test(input)) {
                return {
                    content: response,
                    usage: {
                        promptTokens: input.split(' ').length,
                        completionTokens: response.length,
                        totalTokens: input.split(' ').length + response.length
                    }
                };
            }
        }

        const fallback = {
            action: "unknown",
            params: { rawInput: input },
            confidence: 0.4
        };

        // Default fallback for unrecognized inputs
        return {
            content: JSON.stringify(fallback),
            usage: {
                promptTokens: input.split(' ').length,
                completionTokens: 20,
                totalTokens: input.split(' ').length + 20
            }
        };
    }
}