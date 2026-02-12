"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Languages, Coins, Map } from "lucide-react";
import axios from "axios";
import { cacheService } from "@/lib/cache";

export default function CountryInsights({ destination }: { destination: string }) {
    const [insight, setInsight] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCountryData() {
            // Try to extract country name from destination (e.g., "Paris, France" -> "France")
            const countrySearch = destination.split(",").pop()?.trim() || destination;
            const cacheKey = cacheService.generateKey("country", countrySearch);
            const cached = cacheService.get<any>(cacheKey, 720); // Cache country data for 30 days (rarely changes)

            if (cached) {
                setInsight(cached);
                setLoading(false);
                return;
            }

            try {
                const res = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(countrySearch)}?fullText=false`);
                if (res.data?.[0]) {
                    const country = res.data[0];
                    const data = {
                        name: country.name.common,
                        flag: country.flag,
                        capital: country.capital?.[0],
                        region: country.region,
                        languages: Object.values(country.languages || {}).join(", "),
                        currency: Object.values(country.currencies || {}).map((c: any) => `${c.name} (${c.symbol})`).join(", "),
                        population: country.population.toLocaleString(),
                    };
                    setInsight(data);
                    cacheService.set(cacheKey, data, 720);
                }
            } catch (e) {
                console.error("COUNTRY_ERROR", e);
            } finally {
                setLoading(false);
            }
        }
        if (destination) {
            fetchCountryData();
        } else {
            setLoading(false);
        }
    }, [destination]);

    if (loading) return (
        <div className="h-48 flex items-center justify-center bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse">
            <span className="text-slate-500 text-sm">Loading country insights...</span>
        </div>
    );

    if (!insight) return null;

    return (
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600" />
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4 text-cyan-400" />
                    {insight.name} {insight.flag}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Languages className="h-3 w-3" /> Language
                        </span>
                        <p className="text-xs font-semibold truncate">{insight.languages}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Coins className="h-3 w-3" /> Currency
                        </span>
                        <p className="text-xs font-semibold truncate">{insight.currency}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Map className="h-3 w-3" /> Capital
                        </span>
                        <p className="text-xs font-semibold truncate">{insight.capital}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Population</span>
                        <p className="text-xs font-semibold truncate">{insight.population}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
