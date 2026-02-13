"use client";

import { useEffect, useState } from "react";
import ItineraryTimeline from "@/components/ItineraryTimeline";
import WeatherWidget from "@/components/WeatherWidget";
import CountryInsights from "@/components/CountryInsights";
import ExpenditureReport from "@/components/ExpenditureReport";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, Calendar as CalendarIcon, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const TravelMap = dynamic(() => import("@/components/TravelMap"), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-slate-900/50 rounded-xl animate-pulse border border-slate-800" />
});

export default function ItineraryPage() {
    const [data, setData] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const saved = localStorage.getItem("latest_trip");
        if (saved) {
            setData(JSON.parse(saved));
        } else {
            router.push("/");
        }
    }, []);

    if (!data) return null;

    const handleExport = () => {
        const manifesto = `
# Travel Manifesto: ${data.sourceCity} to ${data.destination}
## Summary
${data.trip_summary}

## Expenditure Report (Estimates in INR)
- ${data.budget_breakdown?.main_travel?.label}: ₹${data.budget_breakdown?.main_travel?.estimate || 0}
- ${data.budget_breakdown?.stay?.label}: ₹${data.budget_breakdown?.stay?.estimate || 0}
- ${data.budget_breakdown?.transport?.label}: ₹${data.budget_breakdown?.transport?.estimate || 0}
- ${data.budget_breakdown?.attractions?.label}: ₹${data.budget_breakdown?.attractions?.estimate || 0}
- ${data.budget_breakdown?.food?.label}: ₹${data.budget_breakdown?.food?.estimate || 0}
- **Total Estimated Budget: ₹${Object.values(data.budget_breakdown || {}).reduce((acc: number, curr: any) => acc + (curr.estimate || 0), 0)}**

## Itinerary
${data.daily_plans.map((day: any) => `
### Day ${day.day}
${day.activities.map((a: any) => `- **${a.time}**: ${a.description} (@ ${a.location})`).join('\n')}
`).join('\n')}
    `;

        const blob = new Blob([manifesto], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Travel-Manifesto-${data.destination}.md`;
        a.click();
    };

    const formatValue = (val: any) => {
        if (!val) return "";
        if (typeof val === 'string') return val;
        if (typeof val === 'object') {
            // If it's the specific object seen in the error: {duration, type, destination, transport, budget}
            // Or similar, just pick the most descriptive field or stringify
            return val.summary || val.description || val.label || val.destination || JSON.stringify(val);
        }
        return String(val);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-2">
                    <Link href="/" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm mb-4">
                        <ChevronLeft className="h-4 w-4" /> Back to Planner
                    </Link>
                    <div className="flex items-center gap-3 text-slate-500 text-sm font-medium uppercase tracking-widest">
                        <span>{formatValue(data.sourceCity)}</span>
                        <div className="h-px w-8 bg-slate-800" />
                        <span className="text-cyan-400">{formatValue(data.destination)}</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Your Journey in {formatValue(data.destination)}</h1>
                    <p className="text-slate-400 max-w-2xl">{formatValue(data.trip_summary)}</p>
                </div>
                <Button
                    onClick={handleExport}
                    className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 border-none font-bold shadow-lg shadow-cyan-900/20 hover:scale-105 transition-transform"
                >
                    <Download className="mr-2 h-4 w-4" /> Export Manifesto
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <ItineraryTimeline plans={data.daily_plans} />
                    <WeatherWidget destination={data.destination} tripDays={data.daily_plans?.length} />
                </div>
                <div className="space-y-6">
                    <TravelMap plans={data.daily_plans} />
                    <ExpenditureReport breakdown={data.budget_breakdown} travelers={data.travelers} />
                    <CountryInsights destination={data.destination} />

                    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-cyan-400">
                            <CalendarIcon className="h-5 w-5" />
                            Pro Tips
                        </h3>
                        <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4">
                            <li>Book your train passes at least 2 weeks in advance.</li>
                            <li>Tours are cheaper on weekdays in {data.destination}.</li>
                            <li>Always carry a reusable water bottle and power bank.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
