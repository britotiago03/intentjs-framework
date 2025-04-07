// src/executors/index.ts
import { Intent } from "intentjs-types";

export type ExecutorContext = {
    currentPage?: string;
    [key: string]: any;
};

export type ExecutorFunction = (intent: Intent, context?: ExecutorContext) => Promise<any> | any;

// Basic navigation executor
const navigateExecutor: ExecutorFunction = ({ target, params }) => {
    const page = target || params?.page || 'home';
    console.log(`Navigating to ${page} page`);

    // In a real app, this would use your router
    // Example with React Router: history.push(`/${page}`);

    return {
        destination: page,
        success: true
    };
};

// Filter executor
const filterExecutor: ExecutorFunction = ({ target, params }) => {
    const filterTarget = target || 'data';

    console.log(`Filtering ${filterTarget} with criteria:`, params);

    // In a real app, this would update your component state or Redux store
    // Example: setFilters(params);

    return {
        target: filterTarget,
        filters: params,
        success: true
    };
};

// Sort executor
const sortExecutor: ExecutorFunction = ({ target, params }) => {
    const sortTarget = target || 'data';
    const field = params?.field || 'default';
    const direction = params?.direction || 'asc';

    console.log(`Sorting ${sortTarget} by ${field} (${direction})`);

    // In a real app, this would update your component state
    // Example: setSortField(field); setSortDirection(direction);

    return {
        target: sortTarget,
        sortField: field,
        sortDirection: direction,
        success: true
    };
};

// Export executor
const exportExecutor: ExecutorFunction = ({ target, params }) => {
    const exportTarget = target || 'current';
    const format = params?.format || 'pdf';

    console.log(`Exporting ${exportTarget} as ${format}`);

    // In a real app, this would trigger your export logic
    // Example: exportService.export(exportTarget, format);

    return {
        target: exportTarget,
        format,
        timestamp: new Date().toISOString(),
        success: true
    };
};

// Search executor
const searchExecutor: ExecutorFunction = ({ params }) => {
    const query = params?.query || params?.term || '';

    console.log(`Searching for: ${query}`);

    // In a real app, this would trigger your search
    // Example: searchService.search(query);

    return {
        query,
        success: !!query,
        message: query ? `Search initiated` : `No search query provided`
    };
};

// Form submission executor
const submitExecutor: ExecutorFunction = ({ target, params }) => {
    const form = target || 'form';

    console.log(`Submitting ${form} with data:`, params);

    // In a real app, this would submit your form
    // Example: formRef.current.submit();

    return {
        form,
        data: params,
        timestamp: new Date().toISOString(),
        success: true
    };
};

// Greeting executor from original code
const greetExecutor: ExecutorFunction = ({ params }) => {
    return `Hello, ${params?.name || "world"}!`;
};

// Register all executors
export const actionExecutors: Record<string, ExecutorFunction> = {
    // Original executors
    sayHello: greetExecutor,
    goToPage: navigateExecutor,

    // New executors
    navigate: navigateExecutor,
    filter: filterExecutor,
    sort: sortExecutor,
    export: exportExecutor,
    search: searchExecutor,
    submit: submitExecutor,
    greet: greetExecutor,

    // Alias for backward compatibility
    open: navigateExecutor,
    show: filterExecutor
};

/**
 * Register a new executor or override an existing one
 */
export function registerExecutor(action: string, executor: ExecutorFunction): void {
    actionExecutors[action] = executor;
}

/**
 * Get all registered executors
 */
export function getExecutors(): Record<string, ExecutorFunction> {
    return { ...actionExecutors };
}

/**
 * Execute a chain of intents in sequence
 */
export async function executeChain(intents: Intent[], context?: ExecutorContext): Promise<any[]> {
    const results = [];

    for (const intent of intents) {
        const executor = actionExecutors[intent.action];
        if (executor) {
            const result = await executor(intent, context);
            results.push(result);
        } else {
            results.push({
                success: false,
                error: `No executor found for action: ${intent.action}`
            });
        }
    }

    return results;
}