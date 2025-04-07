"use client";
import React, { useState, useEffect, useRef } from "react";
import { routeIntent, NaturalLanguageUnderstanding, VoiceInputHandler, PromptContext } from "intentjs-core";

interface HistoryItem {
    input: string;
    response: string;
}

export default function DemoRouter() {
    const [input, setInput] = useState("");
    const [response, setResponse] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const nluRef = useRef<NaturalLanguageUnderstanding | null>(null);
    const voiceHandlerRef = useRef<VoiceInputHandler | null>(null);

    useEffect(() => {
        nluRef.current = new NaturalLanguageUnderstanding({
            llmProvider: "mock",
            debug: true,
            defaultContext: {
                page: "dashboard",
                availableActions: ["navigate", "filter", "sort", "export"],
                availableTargets: ["dashboard", "settings", "profile", "reports", "sales", "users"],
            },
        });

        voiceHandlerRef.current = new VoiceInputHandler({
            language: "en-US",
            onInterimResult: (text) => setInput(text),
            onError: (error) => {
                setResponse(`Voice error: ${error.message}`);
                setIsListening(false);
            },
        });

        return () => {
            if (voiceHandlerRef.current && isListening) {
                voiceHandlerRef.current.stop();
            }
        };
    }, [isListening]);

    const toggleVoiceInput = async () => {
        if (!voiceHandlerRef.current) return;

        if (isListening) {
            const text = voiceHandlerRef.current.stop();
            setIsListening(false);
            if (text) {
                setInput(text);
                await processInput(text);
            }
        } else {
            setIsListening(true);
            try {
                const text = await voiceHandlerRef.current.listen();
                setIsListening(false);
                if (text) {
                    setInput(text);
                    await processInput(text);
                }
            } catch (error) {
                setResponse(`Voice error: ${(error as Error).message}`);
                setIsListening(false);
            }
        }
    };

    const processInput = async (text: string) => {
        if (!nluRef.current || !text.trim()) return;
        setLoading(true);

        const context: PromptContext = {
            page: "dashboard",
            availableActions: ["navigate", "filter", "sort", "export"],
            availableTargets: ["dashboard", "settings", "profile", "reports", "sales", "users"],
            appState: {
                currentView: "sales-dashboard",
                selectedDateRange: "last-month",
                availableRegions: ["europe", "asia", "america"],
            },
        };

        try {
            const parseResult = await nluRef.current.parseIntent(text, context);

            if (parseResult.success && parseResult.intent) {
                const executionResult = await routeIntent(parseResult.intent);
                const result = {
                    intent: parseResult.intent,
                    execution: executionResult,
                    processingTime: parseResult.processingTime,
                    retries: parseResult.retries,
                    confidence: parseResult.intent.confidence,
                    correctionSuggestion: parseResult.correctionSuggestion,
                };

                setResponse(JSON.stringify(result, null, 2));
                setHistory((prev) => [...prev, { input: text, response: JSON.stringify(result, null, 2) }]);
            } else {
                setResponse(
                    JSON.stringify(
                        {
                            error: parseResult.error,
                            rawResponse: parseResult.rawLLMResponse,
                            retries: parseResult.retries,
                            correctionSuggestion: parseResult.correctionSuggestion,
                        },
                        null,
                        2
                    )
                );
            }
        } catch (error) {
            setResponse(`Error: ${(error as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await processInput(input);
    };

    // Function to handle example button clicks
    const handleExampleClick = (example: string) => {
        setInput(example);
        // Use void to explicitly ignore the Promise
        void processInput(example);
    };

    const examples = [
        "Show me sales from last month",
        "Navigate to settings page",
        "Export this report as PDF",
        "Filter data by region: Europe",
        "Sort the table by date",
    ];

    return (
        <div className="space-y-8 w-full">
            <div>
                <h2 className="text-xl font-semibold mb-2">Demo Input</h2>
                <p className="text-gray-600">Enter a command to test NLU + routing</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Try: 'Show me sales from last month'"
                    className="flex-1 p-3 h-11 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                />
                <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`px-4 py-2 h-11 rounded shadow-sm transition-colors duration-200 cursor-pointer hover:opacity-90 ${
                        isListening ? "bg-red-500 text-white" : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                    }`}
                >
                    🎤
                </button>
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-blue-600 text-white px-6 py-2 h-11 rounded shadow disabled:opacity-50 hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
                >
                    {loading ? "Processing..." : "Submit"}
                </button>
            </form>

            <div>
                <h3 className="text-lg font-semibold mb-2">💡 Try these examples:</h3>
                <div className="flex flex-wrap gap-2">
                    {examples.map((example, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleExampleClick(example)}
                            className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded border text-sm transition-colors duration-200 cursor-pointer"
                        >
                            {example}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">🔎 Result:</h3>
                <pre className="bg-gray-100 p-4 rounded border text-sm whitespace-pre-wrap overflow-auto max-h-72 w-full font-mono">
                    {response || "Submit a command or try an example"}
                </pre>
            </div>

            {history.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">📜 History</h3>
                    <div className="space-y-3">
                        {history.map((item, idx) => (
                            <div key={idx} className="bg-white border p-4 rounded shadow-sm">
                                <div className="font-semibold mb-1 text-gray-800">Input: {item.input}</div>
                                <details>
                                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors duration-200 py-1">Show response</summary>
                                    <pre className="bg-gray-50 mt-2 p-2 rounded border text-sm max-h-40 overflow-auto whitespace-pre-wrap w-full font-mono">
                                        {item.response}
                                    </pre>
                                </details>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}