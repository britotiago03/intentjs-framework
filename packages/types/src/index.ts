// src/index.ts

export type Intent = {
    action: string;
    target?: string;
    params?: Record<string, any>;
    confidence?: number;
};

export type IntentResponse = {
    success: boolean;
    message?: string;
    data?: any;
};
