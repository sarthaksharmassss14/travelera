"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, MapPin, Navigation, ArrowRightLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import axios from "axios";
import { cacheService } from "@/lib/cache";
import { startOfToday } from "date-fns";
import LocationInput from "./LocationInput";
import AlertModal from "./AlertModal";

export default function TripWizard() {
    const [step, setStep] = useState(1);
    const [mode, setMode] = useState<"structured" | "ai">("structured");
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [error, setError] = useState<{ isOpen: boolean; title: string; message: string }>({
        isOpen: false,
        title: "",
        message: "",
    });
    const [formData, setFormData] = useState({
        sourceCity: "",
        destination: "",
        range: { from: undefined, to: undefined } as any,
        budget: "Mid",
        travelers: 1,
    });

    const router = useRouter();

    const handleNext = () => setStep((s) => s + 1);
    const handleBack = () => setStep((s) => s - 1);

    const handleSwapLocations = () => {
        setFormData((prev) => ({
            ...prev,
            sourceCity: prev.destination,
            destination: prev.sourceCity,
        }));
    };

    const isStep1Valid = formData.sourceCity && formData.destination;
    const isStep2Valid = formData.range?.from && formData.range?.to;
    const isFormValid = mode === "ai" ? query.length > 10 : (isStep1Valid && isStep2Valid);

    const steps = [
        { id: 1, label: "Route" },
        { id: 2, label: "Dates" },
        { id: 3, label: "Budget" },
    ];

    const handleSubmit = async () => {
        if (!isFormValid) {
            setError({
                isOpen: true,
                title: "Incomplete Details",
                message: mode === "ai" ? "Please enter a more detailed query." : "Please fill in all required fields.",
            });
            return;
        }
        setLoading(true);
        try {
            let finalData;

            if (mode === "ai") {
                const response = await axios.post("/api/generate", {
                    query: query
                });
                finalData = response.data;
            } else {
                const days = Math.ceil(
                    (formData.range.to.getTime() - formData.range.from.getTime()) / (1000 * 60 * 60 * 24)
                ) + 1;

                const cacheKey = cacheService.generateKey("itinerary", formData.sourceCity, formData.destination, days, formData.budget);
                const cached = await cacheService.get<any>(cacheKey, 168);

                if (cached) {
                    finalData = cached;
                } else {
                    const response = await axios.post("/api/generate", {
                        sourceCity: formData.sourceCity,
                        destination: formData.destination,
                        days,
                        budget: formData.budget,
                        travelers: formData.travelers,
                    });
                    finalData = { ...response.data, destination: formData.destination, sourceCity: formData.sourceCity };
                }
            }

            localStorage.setItem("latest_trip", JSON.stringify(finalData));
            router.push("/itinerary");
        } catch (error: any) {
            console.error(error);
            const errMsg = error.response?.data?.error || "Failed to generate itinerary. Please try again.";
            setError({
                isOpen: true,
                title: "Planning Error",
                message: errMsg,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-xl mx-auto backdrop-blur-md bg-slate-900/80 border-slate-800 shadow-2xl transition-all duration-300">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center mb-4">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
                        {mode === "structured" ? "Create Your Adventure" : "Ask AI Planner"}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMode(mode === "structured" ? "ai" : "structured")}
                        className="text-xs text-cyan-400 hover:text-cyan-300 hover:bg-white/5"
                    >
                        {mode === "structured" ? "Confused? Use AI Chat" : "Switch to Form"}
                    </Button>
                </div>

                {/* Interactive Progress Segments - Only show if structured */}
                {mode === "structured" && (
                    <div className="flex gap-2 pt-4">
                        {steps.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setStep(s.id)}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 relative group ${step >= s.id ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" : "bg-slate-700 hover:bg-slate-600"
                                    }`}
                            >
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {s.label}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </CardHeader>

            <CardContent className="space-y-6 pt-6 min-h-[300px]">
                {mode === "ai" ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-4">
                            <Label className="text-slate-300 text-lg">What's on your mind?</Label>
                            <textarea
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g. I want to go somewhere snowy for 5 days from Mumbai with 2 friends. My budget is around 1.5 lakhs. Suggest a good place and plan everything!"
                                className="w-full h-40 bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setQuery("Plan a 7-day luxury beach vacation in Bali for a couple starting from Delhi.")}
                                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-1 rounded-full transition-colors"
                                >
                                    Try: Luxury Bali
                                </button>
                                <button
                                    onClick={() => setQuery("Budget trip to Japan for 10 days, interested in anime and history.")}
                                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-1 rounded-full transition-colors"
                                >
                                    Try: Japan Budget
                                </button>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 font-bold py-6 text-lg shadow-lg shadow-cyan-500/20"
                            onClick={handleSubmit}
                            disabled={loading || query.length < 10}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    AI is planning your trip...
                                </>
                            ) : (
                                "Plan My Trip"
                            )}
                        </Button>
                    </div>
                ) : (
                    <>
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="relative space-y-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-slate-300">
                                            <Navigation className="h-4 w-4 text-cyan-400" />
                                            Leaving From
                                        </Label>
                                        <LocationInput
                                            placeholder="e.g. New York, USA"
                                            value={formData.sourceCity}
                                            onChange={(val) => setFormData({ ...formData, sourceCity: val })}
                                            icon={Navigation}
                                        />
                                    </div>

                                    {/* Swap Button */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pt-6">
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={handleSwapLocations}
                                            className="rounded-full bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-cyan-400 transition-colors h-8 w-8 shadow-lg"
                                            title="Swap Locations"
                                        >
                                            <ArrowRightLeft className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-slate-300">
                                            <MapPin className="h-4 w-4 text-indigo-400" />
                                            Going To
                                        </Label>
                                        <LocationInput
                                            placeholder="e.g. Kyoto, Japan"
                                            value={formData.destination}
                                            onChange={(val) => setFormData({ ...formData, destination: val })}
                                            icon={MapPin}
                                        />
                                    </div>
                                </div>
                                <Button
                                    className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 font-semibold shadow-lg shadow-cyan-500/20"
                                    onClick={handleNext}
                                    disabled={!isStep1Valid}
                                >
                                    Next: Select Dates
                                </Button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-4">
                                    <Label className="text-slate-300 text-lg">When are you traveling?</Label>
                                    <div className="w-full">
                                        <Calendar
                                            mode="range"
                                            selected={formData.range}
                                            onSelect={(range) => setFormData({ ...formData, range: range as any })}
                                            className="w-full"
                                            disabled={{ before: startOfToday() }}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={handleBack} className="w-1/3 border-slate-700 hover:bg-slate-800">
                                        Back
                                    </Button>
                                    <Button
                                        className="w-2/3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 font-semibold shadow-lg shadow-indigo-500/20"
                                        onClick={handleNext}
                                        disabled={!isStep2Valid}
                                    >
                                        Next: Budget
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-4">
                                    <Label className="text-slate-300 text-lg">Number of Travelers</Label>
                                    <div className="flex items-center gap-4 bg-slate-950/30 p-2 rounded-xl border border-slate-700 w-fit">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-xl font-bold hover:text-cyan-400"
                                            onClick={() => setFormData(prev => ({ ...prev, travelers: Math.max(1, prev.travelers - 1) }))}
                                        >
                                            -
                                        </Button>
                                        <span className="text-xl font-black text-white min-w-[20px] text-center">{formData.travelers}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-xl font-bold hover:text-cyan-400"
                                            onClick={() => setFormData(prev => ({ ...prev, travelers: prev.travelers + 1 }))}
                                        >
                                            +
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-slate-300 text-lg">What's your budget style?</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {["Cheap", "Mid", "Luxury"].map((b) => (
                                            <Button
                                                key={b}
                                                variant={formData.budget === b ? "default" : "outline"}
                                                onClick={() => setFormData({ ...formData, budget: b })}
                                                className={`h-24 flex flex-col items-center justify-center gap-2 transition-all duration-200 border-slate-700 ${formData.budget === b
                                                    ? "bg-indigo-600 hover:bg-indigo-700 border-indigo-500 ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900"
                                                    : "hover:bg-slate-800 hover:border-slate-600"
                                                    }`}
                                            >
                                                <span className="text-lg font-bold">{b}</span>
                                                <span className="text-xs text-slate-400 font-normal">
                                                    {b === "Cheap" && "$ (Economy)"}
                                                    {b === "Mid" && "$$ (Comfort)"}
                                                    {b === "Luxury" && "$$$ (Business)"}
                                                </span>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button variant="outline" onClick={handleBack} className="w-1/3 border-slate-700 hover:bg-slate-800">
                                        Back
                                    </Button>
                                    <Button
                                        className="w-2/3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 font-bold shadow-lg shadow-indigo-500/20"
                                        onClick={handleSubmit}
                                        disabled={loading || !isFormValid}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            "Start Adventure"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>

            <AlertModal
                isOpen={error.isOpen}
                onClose={() => setError({ ...error, isOpen: false })}
                title={error.title}
                message={error.message}
            />
        </Card>
    );
}
