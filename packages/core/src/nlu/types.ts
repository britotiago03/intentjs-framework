// src/nlu/types.ts
import { Intent } from 'intentjs-types';
import { PromptContext, PromptTemplateOptions } from '../prompt';
import { LLMProviderOptions, ProviderType } from '../llm';

export interface NLUOptions {
    llmProvider: ProviderType;
    llmOptions?: Partial<LLMProviderOptions>;
    promptOptions?: PromptTemplateOptions;
    defaultContext?: PromptContext;
    keepHistory?: boolean;
    historyLimit?: number;
    debug?: boolean;
    retryOnFailure?: boolean;
    maxRetries?: number;
    minConfidence?: number;
}

export interface ParseResult {
    success: boolean;
    intent?: Intent;
    error?: string;
    rawLLMResponse?: string;
    processingTime?: number;
    retries?: number;
    correctionSuggestion?: string;
}