"use client";

import React, { useState, useEffect, useRef } from "react";
import { IntentJS } from "intentjs-core";
import { VoiceInputHandler } from "intentjs-core";
import { registerExecutor } from "intentjs-actions";

interface DataItem {
    id: number;
    name: string;
    region: string;
    date: string;
    value: number;
}

interface DataState {
    filters: Record<string, any>;
    sort: {
        field: keyof DataItem;
        direction: "asc" | "desc";
    };
    items: DataItem[];
}

export default function UsageExample() {
    const [input, setInput] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [processingResult, setProcessingResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState("dashboard");
    const [data, setData] = useState<DataState>({
        filters: {},
        sort: { field: "date", direction: "desc" },
        items: generateSampleData(20),
    });

    const intentJSRef = useRef<IntentJS | null>(null);
    const voiceHandlerRef = useRef<VoiceInputHandler | null>(null);

    useEffect(() => {
        intentJSRef.current = new IntentJS({
            llmProvider: "mock",
            debug: true,
            defaultContext: {
                availableActions: ["navigate", "filter", "sort", "export", "search"],
                availableTargets: ["dashboard", "settings", "profile", "reports"],
            },
        });

        voiceHandlerRef.current = new VoiceInputHandler({
            language: "en-US",
            onInterimResult: (text) => setInput(text),
            onError: (err) => {
                console.error("Voice input error:", err);
                setIsListening(false);
            },
        });

        registerExecutor("navigate", ({ target }) => {
            setCurrentPage(target || "dashboard");
            return { success: true, page: target };
        });

        registerExecutor("filter", ({ params }) => {
            setData((prev) => ({
                ...prev,
                filters: { ...params },
            }));
            return { success: true, filters: params };
        });

        registerExecutor("sort", ({ params }) => {
            const field = (params?.field as keyof DataItem) || "date";
            const direction = params?.direction === "asc" ? "asc" : "desc";

            setData((prev) => ({
                ...prev,
                sort: { field, direction },
            }));

            return { success: true, sort: { field, direction } };
        });

        return () => {
            if (voiceHandlerRef.current && isListening) {
                voiceHandlerRef.current.stop();
            }
        };
    }, [isListening]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await processInput(input);
    };

    const toggleVoiceInput = async () => {
        if (!voiceHandlerRef.current) return;

        if (isListening) {
            const text = voiceHandlerRef.current.stop();
            setIsListening(false);
            if (text) await processInput(text);
        } else {
            setIsListening(true);
            try {
                const text = await voiceHandlerRef.current.listen();
                setIsListening(false);
                if (text) await processInput(text);
            } catch (err) {
                console.error("Voice error:", err);
                setIsListening(false);
            }
        }
    };

    const processInput = async (text: string) => {
        if (!intentJSRef.current || !text.trim()) return;

        setLoading(true);

        try {
            const result = await intentJSRef.current.process(text, {
                nlu: {
                    page: currentPage,
                    appState: {
                        currentPage,
                        filters: data.filters,
                        sort: data.sort,
                    },
                },
                executor: { currentPage },
            });

            setProcessingResult(result);
        } catch (err) {
            setProcessingResult({
                success: false,
                error: err instanceof Error ? err.message : "Unknown error",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.items
        .filter((item) => {
            for (const [key, value] of Object.entries(data.filters)) {
                const itemKey = key as keyof DataItem;
                if (item[itemKey] !== value) return false;
            }
            return true;
        })
        .sort((a, b) => {
            const field = data.sort.field;
            const dir = data.sort.direction === "asc" ? 1 : -1;
            return a[field] < b[field] ? -dir : a[field] > b[field] ? dir : 0;
        });

    return (
        <div className="w-full space-y-8">
            <header className="space-y-1">
                <h2 className="text-xl font-semibold">Intent.js Usage Example</h2>
                <p className="text-gray-600">Current page: <strong>{currentPage}</strong></p>
            </header>

            <nav className="flex flex-wrap gap-3">
                {["dashboard", "reports", "settings", "profile"].map((page) => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 h-10 rounded transition-colors duration-200 cursor-pointer ${
                            currentPage === page
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                    >
                        {page.charAt(0).toUpperCase() + page.slice(1)}
                    </button>
                ))}
            </nav>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Try: 'Sort by name' or 'Navigate to reports'"
                    className="flex-1 px-4 py-2 h-11 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent w-full"
                />
                <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`px-4 py-2 h-11 rounded shadow-sm transition-colors duration-200 cursor-pointer ${
                        isListening ? "bg-red-500 text-white" : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                    }`}
                    title={isListening ? "Stop listening" : "Start voice input"}
                >
                    🎤
                </button>
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-blue-600 text-white px-5 py-2 h-11 rounded disabled:opacity-50 hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
                >
                    {loading ? "Processing..." : "Submit"}
                </button>
            </form>

            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded border">
                Filters: {Object.keys(data.filters).length ? JSON.stringify(data.filters) : "None"} |
                Sort: {data.sort.field} ({data.sort.direction})
            </div>

            <div className="overflow-x-auto border rounded bg-white shadow-sm">
                <table className="w-full text-sm text-left table-fixed">
                    <thead className="bg-gray-100 border-b">
                    <tr>
                        {["ID", "Name", "Region", "Date", "Value"].map((label) => (
                            <th key={label} className="px-4 py-2 font-medium">{label}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {filteredData.map((item) => (
                        <tr key={item.id} className="border-t hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-4 py-2">{item.id}</td>
                            <td className="px-4 py-2">{item.name}</td>
                            <td className="px-4 py-2">{item.region}</td>
                            <td className="px-4 py-2">{item.date}</td>
                            <td className="px-4 py-2">{item.value}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {processingResult && (
                <div className="bg-gray-100 p-4 rounded border overflow-auto max-h-64 text-sm w-full">
                    <h3 className="text-lg font-semibold mb-2">🧠 Last Intent Result:</h3>
                    <pre className="w-full font-mono">{JSON.stringify(processingResult, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}

function generateSampleData(count: number): DataItem[] {
    const regions = ["Europe", "Asia", "America", "Africa"];
    const names = ["Sales Report", "User Activity", "Forecast", "Insights", "Campaign"];

    return Array.from({ length: count }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));

        return {
            id: i + 1,
            name: names[Math.floor(Math.random() * names.length)],
            region: regions[Math.floor(Math.random() * regions.length)],
            date: date.toISOString().split("T")[0],
            value: Math.floor(Math.random() * 1000),
        };
    });
}