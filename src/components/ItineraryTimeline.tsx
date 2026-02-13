"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPin, ChevronDown, ChevronRight, Calendar } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Activity {
    time: string;
    description: string;
    location: string;
}

interface DayPlan {
    day: number;
    activities: Activity[];
}

export default function ItineraryTimeline({ plans }: { plans: DayPlan[] }) {
    const [expandedDays, setExpandedDays] = useState<number[]>([1]); // Default first day expanded

    const toggleDay = (day: number) => {
        setExpandedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    return (
        <div className="space-y-6">
            {plans.map((day) => {
                const isExpanded = expandedDays.includes(day.day);
                return (
                    <div key={day.day} className="relative">
                        {/* Timeline Connector */}
                        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-slate-800/50 z-0" />

                        {/* Day Header */}
                        <button
                            onClick={() => toggleDay(day.day)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all z-10 relative bg-slate-900/40 backdrop-blur-sm group
                                ${isExpanded ? "border-indigo-500/30 ring-1 ring-indigo-500/20" : "border-slate-800 hover:border-slate-700"}
                            `}
                        >
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0 transition-all
                                ${isExpanded ? "bg-indigo-600 text-white scale-110 shadow-[0_0_20px_rgba(79,70,229,0.4)]" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"}
                            `}>
                                {day.day}
                            </div>

                            <div className="flex-1 text-left">
                                <h3 className="text-xl font-black text-white flex items-center gap-2">
                                    Day {day.day}
                                    {!isExpanded && (
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-800/50 px-2 py-0.5 rounded-full ml-2">
                                            {day.activities.length} Activities
                                        </span>
                                    )}
                                </h3>
                                <p className="text-xs text-slate-400 font-medium">{isExpanded ? "Click to collapse" : "Click to view full schedule"}</p>
                            </div>

                            <div className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                                <ChevronDown className={`h-5 w-5 ${isExpanded ? "text-indigo-400" : "text-slate-500"}`} />
                            </div>
                        </button>

                        {/* Activities */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden pl-14 mt-4 space-y-4"
                                >
                                    {day.activities.map((activity, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: idx * 0.1 }}
                                        >
                                            <Card className="bg-slate-900/30 border-slate-800/50 hover:border-indigo-500/30 transition-all hover:bg-indigo-500/[0.02] overflow-hidden group/card shadow-lg">
                                                <CardContent className="p-0 flex flex-col sm:flex-row">
                                                    <div className="p-4 sm:border-r border-slate-800/50 bg-slate-900/20 sm:min-w-[100px] flex sm:flex-col items-center justify-center gap-2">
                                                        <Clock className="h-4 w-4 text-cyan-400" />
                                                        <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">{activity.time}</span>
                                                    </div>
                                                    <div className="p-5 flex-1 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-5 w-5 rounded-md bg-indigo-500/10 flex items-center justify-center">
                                                                <MapPin className="h-3 w-3 text-indigo-400" />
                                                            </div>
                                                            <span className="text-[11px] text-indigo-400 font-black uppercase tracking-widest">{activity.location}</span>
                                                        </div>
                                                        <p className="text-slate-300 text-sm leading-relaxed font-medium">{activity.description}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}
