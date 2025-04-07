export interface PromptTemplateOptions {
    maxLength?: number;
    includeContext?: boolean;
    includeHistory?: boolean;
    historyLimit?: number;
}

export interface PromptContext {
    page?: string;
    availableActions?: string[];
    availableTargets?: string[];
    /** Any application state that could help with intent understanding */
    appState?: Record<string, any>;
}

export interface PromptHistoryItem {
    input: string;
    intent: Record<string, any>;
    timestamp: number;
}