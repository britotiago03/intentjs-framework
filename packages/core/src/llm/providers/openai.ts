// src/llm/providers/openai.ts
import { LLMProvider, LLMProviderOptions, LLMRequest, LLMResponse } from '../types';

export class OpenAIProvider implements LLMProvider {
    private readonly options: LLMProviderOptions;
    public readonly name = 'openai';

    constructor(options: LLMProviderOptions) {
        this.options = {
            model: 'gpt-4o',
            temperature: 0.2,
            maxTokens: 1024,
            ...options
        };
    }

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const mergedOptions = { ...this.options, ...request.options };

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mergedOptions.apiKey}`
                },
                body: JSON.stringify({
                    model: mergedOptions.model,
                    messages: [{ role: 'user', content: request.prompt }],
                    temperature: mergedOptions.temperature,
                    max_tokens: mergedOptions.maxTokens,
                    stop: mergedOptions.stopSequences
                })
            });

            if (!response.ok) {
                const error = await response.json();
                return {
                    content: '',
                    error: error.error?.message || 'OpenAI API request failed'
                };
            }

            const data = await response.json();
            return {
                content: data.choices[0].message.content,
                usage: {
                    promptTokens: data.usage.prompt_tokens,
                    completionTokens: data.usage.completion_tokens,
                    totalTokens: data.usage.total_tokens
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