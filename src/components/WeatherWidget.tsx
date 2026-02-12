"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudSun, Thermometer, AlertCircle } from "lucide-react";
import axios from "axios";
import { cacheService } from "@/lib/cache";

export default function WeatherWidget({ destination, tripDays = 7 }: { destination: string, tripDays?: number }) {
    const [weather, setWeather] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Ensure we show at least 7 days, and cap at 16 (Open-Meteo free tier limit)
    const displayDays = Math.min(Math.max(tripDays, 7), 16);

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
        <div className="h-32 flex items-center justify-center bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse">
            <span className="text-slate-500 text-sm">Checking the skies...</span>
        </div>
    );

    if (error || !weather) return (
        <Card className="bg-slate-900/50 border-slate-800 p-4 flex items-center gap-3 text-slate-400">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <span className="text-xs">Weather unavailable for this specific region.</span>
        </Card>
    );

    return (
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <CloudSun className="h-4 w-4 text-cyan-400" />
                        <span>{displayDays}-Day Forecast</span>
                    </div>
                </CardTitle>
                {weather.locationName && (
                    <span className="text-[10px] text-slate-500 font-mono text-right">
                        {weather.locationName}, {weather.country}
                    </span>
                )}
            </CardHeader>
            <CardContent className="grid grid-cols-4 sm:grid-cols-7 gap-3 px-3 pb-4">
                {weather.time.map((time: string, i: number) => (
                    <div key={time} className="text-center space-y-1.5 p-2 rounded-lg bg-slate-800/30 border border-white/5">
                        <p className="text-[8px] uppercase font-bold text-slate-500">
                            {new Date(time).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        </p>
                        <div className="h-6 w-6 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center">
                            <Thermometer className="h-3 w-3 text-indigo-400" />
                        </div>
                        <p className="text-[10px] font-black text-white">{Math.round(weather.temperature_2m_max[i])}°</p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
