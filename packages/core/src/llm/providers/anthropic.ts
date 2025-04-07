// src/llm/providers/anthropic.ts
import { LLMProvider, LLMProviderOptions, LLMRequest, LLMResponse } from '../types';

export class AnthropicProvider implements LLMProvider {
    private readonly options: LLMProviderOptions;
    public readonly name = 'anthropic';

    constructor(options: LLMProviderOptions) {
        this.options = {
            model: 'claude-3-haiku-20240307',
            temperature: 0.2,
            maxTokens: 1024,
            ...options
        };
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const mergedOptions = { ...this.options, ...request.options };

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': mergedOptions.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: mergedOptions.model,
                    messages: [{ role: 'user', content: request.prompt }],
                    temperature: mergedOptions.temperature,
                    max_tokens: mergedOptions.maxTokens,
                    stop_sequences: mergedOptions.stopSequences
                })
            });

            if (!response.ok) {
                const error = await response.json();
                const errorMessage = error.error?.message || 'Anthropic API request failed';
                return {
                    content: '',
                    error: errorMessage
                };
            }

            const data = await response.json();
            return {
                content: data.content[0].text,
                usage: {
                    // Anthropic doesn't provide token usage in the same format
                    promptTokens: 0,
                    completionTokens: 0,
                    totalTokens: 0
                }
            };
        } catch (error: any) {
            return {
                content: '',
                error: error.message || 'Unknown error'
            };
        }
    }
}