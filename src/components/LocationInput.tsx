"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { Loader2, MapPin } from "lucide-react";

interface LocationInputProps {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    icon?: any;
}

export default function LocationInput({ placeholder, value, onChange, icon: Icon }: LocationInputProps) {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchSuggestions = async (query: string) => {
        if (!query || query.length < 2) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const res = await axios.get(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
            );
            setSuggestions(res.data.results || []);
        } catch (error) {
            console.error("Geocoding error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val); // Always update parent state immediately
        setShowDropdown(true);

        // Debounce simple implementation
        const timeoutId = setTimeout(() => {
            fetchSuggestions(val);
        }, 300);
        return () => clearTimeout(timeoutId);
    };

    const handleSelect = (s: any) => {
        // If s is a string (manual entry), use it directly. Otherwise format the API result.
        const formatted = typeof s === 'string' ? s : `${s.name}, ${s.country}`;
        onChange(formatted);
        setSuggestions([]);
        setShowDropdown(false);
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div className="relative">
                <Input
                    placeholder={placeholder}
                    value={value}
                    onChange={handleChange}
                    onFocus={() => value.length >= 3 && setShowDropdown(true)}
                    className="bg-slate-950/50 border-slate-700 pl-10"
                />
                {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />}
                {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-500" />}
            </div>

            {showDropdown && value.length >= 2 && (
                <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                    {/* OPTION 1: Use exactly what user typed */}
                    <button
                        className="w-full px-4 py-3 text-left hover:bg-slate-800 transition-colors flex items-center gap-3 border-b border-slate-800"
                        onClick={() => handleSelect(value)}
                    >
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <MapPin className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">Use "{value}"</p>
                            <p className="text-[10px] text-emerald-400/70 truncate">Search for this specific region/place</p>
                        </div>
                    </button>

                    {/* API Suggestions */}
                    {suggestions.map((s, i) => (
                        <button
                            key={`${s.id}-${i}`}
                            className="w-full px-4 py-3 text-left hover:bg-slate-800 transition-colors flex items-center gap-3 border-b border-slate-800 last:border-0"
                            onClick={() => handleSelect(s)}
                        >
                            <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                                <MapPin className="h-4 w-4 text-cyan-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">{s.name}</p>
                                <p className="text-[10px] text-slate-500 truncate">
                                    {s.admin1 ? `${s.admin1}, ` : ""}{s.country}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
