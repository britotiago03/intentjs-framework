// src/llm/providers/index.ts
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { MockProvider } from './mock';
import { LLMProvider, LLMProviderOptions } from '../types';

export type ProviderType = 'openai' | 'anthropic' | 'mock' | string;

export function createLLMProvider(type: ProviderType, options: LLMProviderOptions): LLMProvider {
    switch (type) {
        case 'openai':
            return new OpenAIProvider(options);
        case 'anthropic':
            return new AnthropicProvider(options);
        case 'mock':
            return new MockProvider(options);
        default:
            // Instead of dynamic require, we throw an error for unsupported providers
            // This avoids the need for Node.js require() which isn't available in browsers
            throw new Error(`Unsupported LLM provider: ${type}`);
    }
}

// Export the provider classes
export { OpenAIProvider, AnthropicProvider, MockProvider };