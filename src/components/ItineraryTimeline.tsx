"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPin } from "lucide-react";

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
    return (
        <div className="space-y-12">
            {plans.map((day) => (
                <div key={day.day} className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-800 z-0" />
                    <div className="flex items-center gap-6 mb-6">
                        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold z-10">
                            {day.day}
                        </div>
                        <h3 className="text-2xl font-bold text-white">Day {day.day}</h3>
                    </div>

                    <div className="space-y-6 pl-12">
                        {day.activities.map((activity, idx) => (
                            <Card key={idx} className="bg-slate-900/50 border-slate-800 hover:border-indigo-500/50 transition-colors">
                                <CardContent className="p-4 flex gap-4">
                                    <div className="flex flex-col items-center justify-center border-r border-slate-800 pr-4 min-w-[80px]">
                                        <Clock className="h-4 w-4 text-cyan-400 mb-1" />
                                        <span className="text-xs font-semibold text-slate-400">{activity.time}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <MapPin className="h-3 w-3 text-indigo-400" />
                                            <span className="text-xs text-indigo-400 font-medium uppercase tracking-wider">{activity.location}</span>
                                        </div>
                                        <p className="text-slate-300 text-sm leading-relaxed">{activity.description}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
