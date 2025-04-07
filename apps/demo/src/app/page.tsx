// apps/demo/src/app/page.tsx
"use client";

import { useState } from "react";
import DemoRouter from "@/components/DemoRouter";
import UsageExample from "@/components/UsageExample";

export default function HomePage() {
    const [tab, setTab] = useState<"simple" | "advanced">("simple");

    return (
        <main className="p-6 max-w-6xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold mb-2">🧠 Intent.js Playground</h1>
                <p className="text-gray-600 text-lg">
                    Test natural language understanding and intent execution.
                </p>
            </div>

            {/* Tab Switcher - Improved */}
            <div className="flex justify-center gap-4 mb-10">
                <button
                    onClick={() => setTab("simple")}
                    className={`px-5 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 w-40 justify-center cursor-pointer hover:shadow-md ${
                        tab === "simple"
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                >
                    🧪 Simple Demo
                </button>
                <button
                    onClick={() => setTab("advanced")}
                    className={`px-5 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 w-40 justify-center cursor-pointer hover:shadow-md ${
                        tab === "advanced"
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                >
                    ⚙️ Advanced Usage
                </button>
            </div>

            {/* Content Container - Fixed Width */}
            <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-100 p-6 min-h-[600px]">
                {tab === "simple" ? <DemoRouter /> : <UsageExample />}
            </div>
        </main>
    );
}