import { PromptContext, PromptHistoryItem, PromptTemplateOptions } from './types';

function createDefaultIntentPrompt(
    input: string,
    context?: PromptContext,
    history?: PromptHistoryItem[],
    options: PromptTemplateOptions = {}
): string {
    const {
        includeContext = true,
        includeHistory = false,
        historyLimit = 3
    } = options;

    let prompt = `
You are an intent parser for a JavaScript application. Your task is to convert natural language inputs from users 
into structured intent objects. The intent should be returned as valid JSON with the following structure:

{
  "action": string,               // The primary action the user wants to perform
  "target": string,               // Optional: What the action applies to
  "params": object,               // Optional: Any parameters needed
  "confidence": number            // Optional: Confidence score between 0 and 1
}

User input: "${input}"
`;

    if (includeContext && context) {
        prompt += `
Current context:
- Current page: ${context.page || 'unknown'}
${context.availableActions ? `- Available actions: ${context.availableActions.join(', ')}` : ''}
${context.availableTargets ? `- Available targets: ${context.availableTargets.join(', ')}` : ''}
${context.appState ? `- App state: ${JSON.stringify(context.appState, null, 2)}` : ''}
`;
    }

    if (includeHistory && history && history.length > 0) {
        const limitedHistory = history.slice(-historyLimit);
        prompt += `
Recent history:
${limitedHistory.map(item => `- Input: "${item.input}" → Intent: ${JSON.stringify(item.intent)}`).join('\n')}
`;
    }

    prompt += `
Return ONLY the JSON intent object and nothing else. Do not include explanations or additional text.
`;

    return prompt;
}

export { createDefaultIntentPrompt };
