import axios from "axios";

const CACHE_duration = 1000 * 60 * 60 * 24 * 7; // 7 Days
const researchCache = new Map<string, { data: string, timestamp: number }>();

export async function researchTravelCosts(source: string, destination: string, budget: string) {
    const cacheKey = `${source}-${destination}-${budget.toLowerCase()}`;
    const cached = researchCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < CACHE_duration)) {
        console.log("Using Cached Research for:", cacheKey);
        return cached.data;
    }

    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) return "No research data available (API Key missing).";

    const isCheap = budget.toLowerCase().includes("cheap");
    const isMid = budget.toLowerCase().includes("mid");
    const isLuxury = budget.toLowerCase().includes("luxury");

    let transportQuery = "";
    let stayQuery = "";

    if (isCheap) {
        transportQuery = `Sleeper Class Train OR Non-AC Bus fare from ${source} to ${destination} 2026. If no direct, find to nearest city + Local Bus fare.`;
        stayQuery = `Price per night for Hostels or Guesthouses in ${destination} 2026`;
    } else if (isLuxury) {
        transportQuery = `Business Class Flight OR 1st AC Train fare from ${source} to ${destination} 2026. If no direct, find Flight to nearest airport + Private Taxi fare to ${destination}.`;
        stayQuery = `Price per night for 5-Star Resorts or Luxury Hotels in ${destination} 2026`;
    } else {
        // Default to Mid if not Cheap or Luxury
        transportQuery = `3AC Train OR AC Volvo Bus fare from ${source} to ${destination} 2026. If no direct, to nearest hub + Shared Cab fare.`;
        stayQuery = `Price per night for 3-Star Hotels in ${destination} 2026`;
    }

    const queries = [
        transportQuery,
        stayQuery,
        `Entry ticket fees for top 10 tourist places in ${destination} 2026`
    ];

    try {
        const searchPromises = queries.map(q =>
            axios.post("https://api.tavily.com/search", {
                api_key: apiKey,
                query: q,
                search_depth: "basic",
                include_answer: true,
                max_results: 3
            })
        );

        const results = await Promise.all(searchPromises);

        // Combine answers and results into a concise summary for the AI
        const summary = results.map((res: any, i: number) => {
            const answer = res.data.answer || "Check below.";
            const rawSnippets = res.data.results || [];
            const snippets = rawSnippets.map((r: any) => r.content).join("\n");

            return `Q: ${queries[i]}\nA: ${answer}\nSources: ${snippets}`;
        }).join("\n---\n");

        researchCache.set(cacheKey, { data: summary, timestamp: Date.now() });

        return summary;
    } catch (error: any) {
        console.error("RESEARCH_ERROR", error.message);
        return "Error fetching real-time research data.";
    }
}
