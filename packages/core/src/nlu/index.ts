// src/nlu/index.ts
import { NLUOptions, ParseResult } from './types';
import { Intent } from 'intentjs-types';
import { ProviderType, createLLMProvider, LLMProvider, LLMProviderOptions } from '../llm';
import { PromptContext, PromptHistoryItem, createDefaultIntentPrompt } from '../prompt';
import { normalizeInput, hasSensitiveContent } from '../utils/inputNormalizer';

/**
 * Core Natural Language Understanding class that converts user input into structured intents
 */
export class NaturalLanguageUnderstanding {
    private llmProvider: LLMProvider;
    private readonly options: NLUOptions;
    private history: PromptHistoryItem[] = [];

    constructor(options: NLUOptions) {
        this.options = {
            keepHistory: true,
            historyLimit: 10,
            debug: false,
            ...options
        };

        // Create LLM provider
        const llmOptions: LLMProviderOptions = {
            apiKey: 'dummy-key', // Will be overridden if provided in options
            ...options.llmOptions
        };

        this.llmProvider = createLLMProvider(options.llmProvider, llmOptions);

        if (this.options.debug) {
            console.log(`NLU initialized with ${this.llmProvider.name} provider`);
        }
    }

    /**
     * Parse natural language input into a structured intent
     */
    public async parseIntent(
        input: string,
        context?: PromptContext
    ): Promise<ParseResult> {
        const startTime = Date.now();
        const {
            retryOnFailure = true,
            maxRetries = 1,
            minConfidence = 0.6,
            debug
        } = this.options;

        let attempts = 0;
        let lastResult: ParseResult | null = null;

        while (attempts <= maxRetries) {
            attempts++;

            try {
                const normalizedInput = normalizeInput(input);

                if (hasSensitiveContent(normalizedInput)) {
                    return {
                        success: false,
                        error: 'Input contains sensitive content',
                        processingTime: Date.now() - startTime
                    };
                }

                const mergedContext: PromptContext = {
                    ...this.options.defaultContext,
                    ...context
                };

                const prompt = createDefaultIntentPrompt(
                    normalizedInput,
                    mergedContext,
                    this.options.keepHistory ? this.history : undefined,
                    this.options.promptOptions
                );

                if (debug) {
                    console.log(`Prompt (attempt ${attempts}):`, prompt);
                }

                const llmResponse = await this.llmProvider.generate({ prompt });

                if (llmResponse.error) {
                    lastResult = {
                        success: false,
                        error: `LLM error: ${llmResponse.error}`,
                        rawLLMResponse: llmResponse.content,
                        processingTime: Date.now() - startTime,
                        retries: attempts - 1
                    };
                    break;
                }

                let intent: Intent;
                try {
                    intent = JSON.parse(llmResponse.content);

                    // ✅ Handle missing action without throwing
                    if (!intent.action) {
                        lastResult = {
                            success: false,
                            error: 'Failed to parse intent: Missing required "action" field in intent',
                            rawLLMResponse: llmResponse.content,
                            processingTime: Date.now() - startTime,
                            retries: attempts - 1
                        };
                        continue;
                    }

                    if (intent.confidence !== undefined) {
                        intent.confidence = Math.max(0, Math.min(1, intent.confidence));
                    }

                } catch (error: any) {
                    lastResult = {
                        success: false,
                        error: `Failed to parse intent: ${error.message}`,
                        rawLLMResponse: llmResponse.content,
                        processingTime: Date.now() - startTime,
                        retries: attempts - 1
                    };
                    continue;
                }

                // Confidence check
                if (intent.confidence !== undefined && intent.confidence < minConfidence) {
                    if (attempts <= maxRetries && retryOnFailure) {
                        if (debug) console.warn(`Low confidence (${intent.confidence}). Retrying...`);
                        continue;
                    }

                    return {
                        success: false,
                        error: `Low confidence intent (${intent.confidence})`,
                        rawLLMResponse: llmResponse.content,
                        processingTime: Date.now() - startTime,
                        retries: attempts - 1,
                        correctionSuggestion: 'Can you rephrase or clarify your command?'
                    };
                }

                if (this.options.keepHistory) {
                    this.addToHistory(normalizedInput, intent);
                }

                return {
                    success: true,
                    intent,
                    rawLLMResponse: debug ? llmResponse.content : undefined,
                    processingTime: Date.now() - startTime,
                    retries: attempts - 1
                };

            } catch (error: any) {
                lastResult = {
                    success: false,
                    error: `Unexpected error: ${error.message}`,
                    processingTime: Date.now() - startTime,
                    retries: attempts - 1
                };
                break;
            }
        }

        return lastResult!;
    }

    /**
     * Add an entry to the conversation history
     * @private Used internally to maintain history for context-aware prompts
     */
    private addToHistory(input: string, intent: Intent): void {
        this.history.push({
            input,
            intent,
            timestamp: Date.now()
        });

        // Keep history within limit
        if (this.options.historyLimit && this.history.length > this.options.historyLimit) {
            this.history = this.history.slice(-this.options.historyLimit);
        }
    }

    /*
     * The following public methods are part of the class API.
     * They may appear unused in the current implementation but are
     * provided for extensibility and advanced usage scenarios.
     * @ts-ignore-unused-export-all -- These methods are part of the public API
     */

    /**
     * Get the conversation history
     * @returns A copy of the current conversation history
     * @public
     */
    // @ts-ignore: Method is part of public API
    public getHistory(): PromptHistoryItem[] {
        return [...this.history];
    }

    /**
     * Clear the conversation history
     * @public
     */
    // @ts-ignore: Method is part of public API
    public clearHistory(): void {
        this.history = [];
    }

    /**
     * Set a new LLM provider
     * @param provider The provider type to switch to
     * @param options Optional provider-specific options
     * @public
     */
    // @ts-ignore: Method is part of public API
    public setLLMProvider(provider: ProviderType, options?: Partial<LLMProviderOptions>): void {
        const llmOptions: LLMProviderOptions = {
            apiKey: 'dummy-key',
            ...this.options.llmOptions,
            ...options
        };

        this.llmProvider = createLLMProvider(provider, llmOptions);

        if (this.options.debug) {
            console.log(`NLU provider changed to ${this.llmProvider.name}`);
        }
    }

    /**
     * Update default context for future intent parsing
     * @param context Partial context to merge with existing default context
     * @public
     */
    // @ts-ignore: Method is part of public API
    public updateDefaultContext(context: Partial<PromptContext>): void {
        this.options.defaultContext = {
            ...this.options.defaultContext,
            ...context
        };
    }

    /**
     * Process voice input and convert it to text before parsing intent
     * @param voiceInput String or Promise that resolves to a string containing voice input
     * @param context Optional context for intent parsing
     * @returns ParseResult with the structured intent
     * @public
     */
    // @ts-ignore: Method is part of public API
    public async parseVoiceIntent(
        voiceInput: string | Promise<string>,
        context?: PromptContext
    ): Promise<ParseResult> {
        try {
            const textInput = typeof voiceInput === 'string' ? voiceInput : await voiceInput;
            return this.parseIntent(textInput, context);
        } catch (error: any) {
            return {
                success: false,
                error: `Voice processing error: ${error.message}`
            };
        }
    }
}

export * from './types';