// src/router/index.ts
import { Intent, IntentResponse } from "intentjs-types";
import { actionExecutors, ExecutorContext } from "intentjs-actions";

export interface RouterOptions {
    defaultErrorMessage?: string;
    fallbackAction?: string;
    debug?: boolean;
    middleware?: Array<(intent: Intent) => Promise<Intent | null> | Intent | null>;
}

const defaultOptions: RouterOptions = {
    defaultErrorMessage: "Action execution failed",
    debug: false
};

/**
 * Routes an intent to the appropriate executor and handles results
 */
export async function routeIntent(
    intent: Intent,
    context?: ExecutorContext,
    options: RouterOptions = {}
): Promise<IntentResponse> {
    const mergedOptions = { ...defaultOptions, ...options };

    try {
        // Debug logging
        if (mergedOptions.debug) {
            console.log(`Routing intent:`, intent);
        }

        // Apply middleware if defined
        if (mergedOptions.middleware && mergedOptions.middleware.length > 0) {
            let currentIntent = intent;

            for (const middlewareFn of mergedOptions.middleware) {
                const result = await middlewareFn(currentIntent);

                // If middleware returns null, abort the routing
                if (result === null) {
                    return {
                        success: false,
                        message: "Intent rejected by middleware"
                    };
                }

                currentIntent = result;
            }

            // Update intent with the one processed by middleware
            intent = currentIntent;
        }

        // Get the executor for this action
        const executor = actionExecutors[intent.action];

        // If no executor found but fallback is defined
        if (!executor && mergedOptions.fallbackAction) {
            const fallbackExecutor = actionExecutors[mergedOptions.fallbackAction];

            if (fallbackExecutor) {
                const data = await fallbackExecutor(intent, context);
                return {
                    success: true,
                    data,
                    message: `Executed fallback action: ${mergedOptions.fallbackAction}`
                };
            }
        }

        // If no executor found and no fallback
        if (!executor) {
            return {
                success: false,
                message: `Unknown action: ${intent.action}`
            };
        }

        // Execute the action
        try {
            const data = await executor(intent, context);

            // Debug logging
            if (mergedOptions.debug) {
                console.log(`Execution result:`, data);
            }

            return {
                success: true,
                data,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || mergedOptions.defaultErrorMessage,
            };
        }
    } catch (error: any) {
        // Catch any unexpected errors
        return {
            success: false,
            message: `Router error: ${error.message}`
        };
    }
}

/**
 * Create a middleware function that validates intent structure
 */
export function createValidationMiddleware(
    validActions?: string[],
    validTargets?: string[]
) {
    return (intent: Intent): Intent | null => {
        // Validate action
        if (validActions && validActions.length > 0) {
            if (!validActions.includes(intent.action)) {
                console.warn(`Invalid action: ${intent.action}. Valid actions: ${validActions.join(', ')}`);
                return null;
            }
        }

        // Validate target if present
        if (validTargets && validTargets.length > 0 && intent.target) {
            if (!validTargets.includes(intent.target)) {
                console.warn(`Invalid target: ${intent.target}. Valid targets: ${validTargets.join(', ')}`);
                return null;
            }
        }

        return intent;
    };
}

/**
 * Create a middleware function that logs intents
 */
export function createLoggingMiddleware(
    logger: (message: string, data?: any) => void = console.log
) {
    return (intent: Intent): Intent => {
        logger('Processing intent', intent);
        return intent;
    };
}

/**
 * Create a middleware function that enriches intent with defaults
 */
export function createDefaultsMiddleware(
    defaults: {
        target?: string;
        params?: Record<string, any>;
    }
) {
    return (intent: Intent): Intent => {
        return {
            ...intent,
            target: intent.target || defaults.target,
            params: {
                ...defaults.params,
                ...intent.params
            }
        };
    };
}

/**
 * Create a middleware function that transforms intents
 */
export function createTransformMiddleware(
    transformFn: (intent: Intent) => Intent
) {
    return transformFn;
}

/**
 * Create a router with predefined options and middleware
 */
export function createRouter(options: RouterOptions = {}) {
    return {
        route: (intent: Intent, context?: ExecutorContext) =>
            routeIntent(intent, context, options)
    };
}

/**
 * Export router utilities
 */
export const RouterUtils = {
    createValidationMiddleware,
    createLoggingMiddleware,
    createDefaultsMiddleware,
    createTransformMiddleware,
    createRouter
};