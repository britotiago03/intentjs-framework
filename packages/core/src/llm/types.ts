// src/llm/types.ts
export interface LLMProviderOptions {
    apiKey: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
    endpoint?: string;
}

export interface LLMRequest {
    prompt: string;
    options?: Partial<LLMProviderOptions>;
}

export interface LLMResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    error?: string;
}

export interface LLMProvider {
    name: string;
    generate(request: LLMRequest): Promise<LLMResponse>;
}

// Export everything as a single module
export * from './providers';