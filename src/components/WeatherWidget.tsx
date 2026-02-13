"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudSun, Thermometer, AlertCircle, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind } from "lucide-react";
import axios from "axios";
import { cacheService } from "@/lib/cache";

export default function WeatherWidget({ destination, tripDays = 7 }: { destination: string, tripDays?: number }) {
    const [weather, setWeather] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Ensure we show at least 7 days, and cap at 16 (Open-Meteo free tier limit)
    const displayDays = Math.min(Math.max(tripDays, 7), 16);

    const getWeatherIcon = (code: number) => {
        // WMO Weather interpretation codes (WW)
        if (code === 0) return { icon: Sun, color: "text-amber-400", bg: "bg-amber-400/10", glow: "shadow-[0_0_15px_rgba(251,191,36,0.4)]", label: "Clear" };
        if (code <= 3) return { icon: CloudSun, color: "text-blue-300", bg: "bg-blue-300/10", glow: "", label: "Partly Cloudy" };
        if (code <= 48) return { icon: Cloud, color: "text-slate-400", bg: "bg-slate-400/10", glow: "", label: "Foggy" };
        if (code <= 67) return { icon: CloudRain, color: "text-cyan-400", bg: "bg-cyan-400/10", glow: "shadow-[0_0_15px_rgba(34,211,238,0.3)]", label: "Rainy" };
        if (code <= 77) return { icon: CloudSnow, color: "text-indigo-200", bg: "bg-indigo-100/10", glow: "shadow-[0_0_15px_rgba(224,231,255,0.3)]", label: "Snowy" };
        if (code <= 82) return { icon: CloudRain, color: "text-blue-500", bg: "bg-blue-500/10", glow: "", label: "Showers" };
        if (code <= 99) return { icon: CloudLightning, color: "text-purple-400", bg: "bg-purple-400/10", glow: "shadow-[0_0_15px_rgba(168,85,247,0.4)]", label: "Stormy" };
        return { icon: Wind, color: "text-slate-300", bg: "bg-slate-300/10", glow: "", label: "Windy" };
    };

    // Manual mapping for Indian States -> Capitals to ensure direct hits
    const STATE_TO_CAPITAL: Record<string, string> = {
        "meghalaya": "Shillong",
        "kerala": "Thiruvananthapuram",
        "rajasthan": "Jaipur",
        "goa": "Panaji",
        "bihar": "Patna",
        "himachal pradesh": "Shimla",
        "uttarakhand": "Dehradun",
        "punjab": "Chandigarh",
        "haryana": "Chandigarh",
        "uttar pradesh": "Lucknow",
        "madhya pradesh": "Bhopal",
        "maharashtra": "Mumbai",
        "gujarat": "Gandhinagar",
        "karnataka": "Bengaluru",
        "tamil nadu": "Chennai",
        "telangana": "Hyderabad",
        "andhra pradesh": "Amaravati",
        "west bengal": "Kolkata",
        "assam": "Dispur",
        "sikkim": "Gangtok",
        "jammu and kashmir": "Srinagar",
        "ladakh": "Leh",
        "odisha": "Bhubaneswar",
        "chhattisgarh": "Raipur",
        "jharkhand": "Ranchi"
    };

    useEffect(() => {
        async function fetchWeather() {
            setError(false);
            let searchName = destination.split(",")[0].trim();

            // Check manual map first (case-insensitive)
            const lowerName = searchName.toLowerCase();
            if (STATE_TO_CAPITAL[lowerName]) {
                searchName = STATE_TO_CAPITAL[lowerName];
            }
            // Cache by name + days to avoid showing wrong range
            const cacheKey = cacheService.generateKey("weather", searchName, displayDays);
            const cached = cacheService.get<any>(cacheKey, 12);

            if (cached) {
                setWeather(cached);
                setLoading(false);
                return;
            }

            try {
                // First attempt: Exact search
                let geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchName)}&count=1&language=en&format=json`);

                // Second attempt: Try searching for "Capital of X" or just append " City" if first failed
                if (!geoRes.data.results) {
                    const fallbackQuery = `${searchName} capital`;
                    console.log(`Weather: '${searchName}' failed, trying '${fallbackQuery}'`);
                    geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(fallbackQuery)}&count=1&language=en&format=json`);
                }

                if (geoRes.data.results?.[0]) {
                    const { latitude, longitude, name, country } = geoRes.data.results[0];
                    // Fetch weather using coordinates
                    const wRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=${displayDays}`);

                    const weatherData = {
                        ...wRes.data.daily,
                        locationName: name, // Store the resolved city name (e.g., Thiruvananthapuram for Kerala)
                        country: country
                    };

                    setWeather(weatherData);
                    cacheService.set(cacheKey, weatherData, 12); // Cache for 12 hours
                } else {
                    setError(true);
                }
            } catch (e) {
                console.error("Weather Fetch Error:", e);
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        if (destination) {
            fetchWeather();
        } else {
            setLoading(false);
        }
    }, [destination, displayDays]);

    if (loading) return (
        <div className="h-40 flex items-center justify-center bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse">
            <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Atmospheric Check...</span>
        </div>
    );

    if (error || !weather) return (
        <Card className="bg-slate-900/50 border-slate-800 p-6 flex items-center gap-4 text-slate-400">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-500" />
            </div>
            <div className="space-y-1">
                <p className="text-sm font-bold text-slate-200">Local Forecast Unavailable</p>
                <p className="text-xs">Weather sync failed for this specific region.</p>
            </div>
        </Card>
    );

    return (
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/5">
            <style jsx global>{`
                .sundar-scroll::-webkit-scrollbar {
                    height: 6px;
                }
                .sundar-scroll::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.1);
                    border-radius: 10px;
                }
                .sundar-scroll::-webkit-scrollbar-thumb {
                    background: linear-gradient(to right, #22d3ee, #4f46e5);
                    border-radius: 10px;
                }
                .sundar-scroll::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to right, #06b6d4, #4338ca);
                }
            `}</style>
            <CardHeader className="pb-4 border-b border-slate-800/50 bg-indigo-500/5">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                            <CloudSun className="h-6 w-6 text-cyan-400" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-black uppercase tracking-tighter text-white">Local Skies</CardTitle>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Atmospheric Conditions</p>
                        </div>
                    </div>
                    {weather.locationName && (
                        <div className="text-right px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800/50">
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Forecast For</span>
                            <span className="text-sm text-cyan-400 font-black">{weather.locationName}</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex gap-4 overflow-x-auto pb-4 sundar-scroll scrollbar-hide">
                    {weather.time.map((time: string, i: number) => {
                        const condition = getWeatherIcon(weather.weathercode[i]);
                        const Icon = condition.icon;
                        return (
                            <div key={time} className="flex-shrink-0 w-32 text-center space-y-4 p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-cyan-500/30 transition-all group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <p className="text-[11px] uppercase font-black text-slate-400 group-hover:text-cyan-400 transition-colors">
                                    {new Date(time).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                                </p>
                                <div className={`h-14 w-14 mx-auto rounded-2xl ${condition.bg} flex items-center justify-center ${condition.color} ${condition.glow} transition-all group-hover:scale-110 group-hover:rotate-3`}>
                                    <Icon className="h-8 w-8" />
                                </div>
                                <div className="space-y-1 relative z-10">
                                    <div className="flex items-center justify-center gap-1">
                                        <p className="text-lg font-black text-white">{Math.round(weather.temperature_2m_max[i])}°</p>
                                        <span className="text-[10px] text-slate-500">/</span>
                                        <p className="text-sm font-bold text-slate-400">{Math.round(weather.temperature_2m_min[i])}°</p>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter group-hover:text-slate-300">{condition.label}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
