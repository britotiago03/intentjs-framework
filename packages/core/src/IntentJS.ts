import { NaturalLanguageUnderstanding, NLUOptions } from './nlu';
import { Intent } from 'intentjs-types';
import { routeIntent } from './router';
import { ExecutorContext } from 'intentjs-actions';
import { PromptContext } from './prompt';

export interface IntentJSProcessResult {
    success: boolean;
    intent?: Intent;
    execution?: any;
    error?: string;
}

export class IntentJS {
    private readonly nlu: NaturalLanguageUnderstanding;

    constructor(options: NLUOptions) {
        this.nlu = new NaturalLanguageUnderstanding(options);
    }

    public async process(
        input: string,
        context?: {
            nlu?: PromptContext;
            executor?: ExecutorContext;
        }
    ): Promise<IntentJSProcessResult> {
        try {
            const parseResult = await this.nlu.parseIntent(input, context?.nlu);

            if (!parseResult.success || !parseResult.intent) {
                return {
                    success: false,
                    error: parseResult.error || 'Failed to parse intent'
                };
            }

            const executionResult = await routeIntent(parseResult.intent, context?.executor);

            return {
                success: executionResult.success,
                intent: parseResult.intent,
                execution: executionResult,
                error: executionResult.success ? undefined : executionResult.message
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Unknown error'
            };
        }
    }

    public async processVoice(
        voiceInput: string | Promise<string>,
        context?: {
            nlu?: PromptContext;
            executor?: ExecutorContext;
        }
    ): Promise<IntentJSProcessResult> {
        try {
            const textInput = typeof voiceInput === 'string' ? voiceInput : await voiceInput;
            return this.process(textInput, context);
        } catch (error: any) {
            return {
                success: false,
                error: `Voice processing error: ${error.message}`
            };
        }
    }

    public getNLU(): NaturalLanguageUnderstanding {
        return this.nlu;
    }
}
