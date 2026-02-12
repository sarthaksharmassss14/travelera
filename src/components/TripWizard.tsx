"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import axios from "axios";
import { cacheService } from "@/lib/cache";
import { startOfToday } from "date-fns";
import LocationInput from "./LocationInput";

export default function TripWizard() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        sourceCity: "",
        destination: "",
        range: { from: undefined, to: undefined } as any,
        budget: "Mid",
    });

    const router = useRouter();

    const handleNext = () => setStep((s) => s + 1);
    const handleBack = () => setStep((s) => s - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const days = Math.ceil(
                (formData.range.to.getTime() - formData.range.from.getTime()) / (1000 * 60 * 60 * 24)
            ) + 1;

            const cacheKey = cacheService.generateKey("itinerary", formData.sourceCity, formData.destination, days, formData.budget);
            const cached = cacheService.get<any>(cacheKey, 168);

            let finalData;
            if (cached) {
                finalData = cached;
            } else {
                const response = await axios.post("/api/generate", {
                    sourceCity: formData.sourceCity,
                    destination: formData.destination,
                    days,
                    budget: formData.budget,
                });
                finalData = { ...response.data, destination: formData.destination, sourceCity: formData.sourceCity };
                cacheService.set(cacheKey, finalData, 168);
            }

            localStorage.setItem("latest_trip", JSON.stringify(finalData));
            router.push("/itinerary");
        } catch (error) {
            console.error(error);
            alert("Failed to generate itinerary. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-xl mx-auto backdrop-blur-md bg-slate-900/50 border-slate-800 shadow-2xl">
            <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
                    Create Your Adventure
                </CardTitle>
                <Progress value={(step / 3) * 100} className="h-1 bg-slate-800" />
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Navigation className="h-3 w-3 text-cyan-400" />
                                    Leaving From
                                </Label>
                                <LocationInput
                                    placeholder="e.g. New York, USA"
                                    value={formData.sourceCity}
                                    onChange={(val) => setFormData({ ...formData, sourceCity: val })}
                                    icon={Navigation}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-indigo-400" />
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
                            className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 font-semibold"
                            onClick={handleNext}
                            disabled={!formData.destination || !formData.sourceCity}
                        >
                            Next
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-2">
                            <Label>When are you traveling?</Label>
                            <div className="flex justify-center border border-slate-700 rounded-md p-2 bg-slate-950/50">
                                <Calendar
                                    mode="range"
                                    selected={formData.range}
                                    onSelect={(range) => setFormData({ ...formData, range: range as any })}
                                    className="rounded-md"
                                    disabled={{ before: startOfToday() }}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleBack} className="w-1/3 border-slate-700">
                                Back
                            </Button>
                            <Button
                                className="w-2/3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 font-semibold"
                                onClick={handleNext}
                                disabled={!formData.range?.from || !formData.range?.to}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-2">
                            <Label>What's your budget style?</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {["Cheap", "Mid", "Luxury"].map((b) => (
                                    <Button
                                        key={b}
                                        variant={formData.budget === b ? "default" : "outline"}
                                        onClick={() => setFormData({ ...formData, budget: b })}
                                        className={
                                            formData.budget === b
                                                ? "bg-indigo-600 hover:bg-indigo-700"
                                                : "border-slate-700 hover:bg-slate-800"
                                        }
                                    >
                                        {b}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleBack} className="w-1/3 border-slate-700">
                                Back
                            </Button>
                            <Button
                                className="w-2/3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 font-bold"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    "Create Trip"
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
