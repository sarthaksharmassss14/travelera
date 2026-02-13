"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Bed, Train, Ticket, Utensils, IndianRupee, Sparkles, Bus, Home, Car } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartTooltip } from "recharts";

interface BudgetCategory {
    label: string;
    estimate: number;
    note: string;
}

interface BudgetBreakdown {
    main_travel: BudgetCategory;
    stay: BudgetCategory;
    transport: BudgetCategory;
    attractions: BudgetCategory;
    food: BudgetCategory;
}

export default function ExpenditureReport({ breakdown, travelers = 1 }: { breakdown: BudgetBreakdown, travelers?: number }) {
    if (!breakdown) return null;

    const getIcon = (label: any, defaultIcon: any) => {
        if (!label || typeof label !== 'string') return defaultIcon;
        const l = label.toLowerCase();

        // Priority 1: Flight check (Highest priority to avoid Bus mixup)
        if (l.includes("flight") || l.includes("plane") || l.includes("air travel")) return Plane;

        // Priority 2: Stay check
        if (l.includes("hotel") || l.includes("stay") || l.includes("resort") || l.includes("villa")) return Bed;
        if (l.includes("hostel") || l.includes("dorm") || l.includes("guesthouse") || l.includes("home")) return Home;

        // Priority 3: Local transport types
        if (l.includes("train") || l.includes("metro") || l.includes("railway")) return Train;
        if (l.includes("bus") || l.includes("coach")) return Bus;
        if (l.includes("car") || l.includes("taxi") || l.includes("auto") || l.includes("cab")) return Car;

        return defaultIcon;
    };

    const categories = [
        { name: breakdown.main_travel?.label || "Travel", value: breakdown.main_travel?.estimate || 0, data: breakdown.main_travel, icon: getIcon(breakdown.main_travel?.label || "", Plane), color: "#3b82f6", class: "text-blue-400", bg: "bg-blue-500/10" },
        { name: breakdown.stay?.label || "Stay", value: breakdown.stay?.estimate || 0, data: breakdown.stay, icon: getIcon(breakdown.stay?.label || "", Bed), color: "#6366f1", class: "text-indigo-400", bg: "bg-indigo-500/10" },
        { name: breakdown.transport?.label || "Local Transport", value: breakdown.transport?.estimate || 0, data: breakdown.transport, icon: getIcon(breakdown.transport?.label || "", Car), color: "#10b981", class: "text-emerald-400", bg: "bg-emerald-500/10" },
        { name: breakdown.attractions?.label || "Attractions", value: breakdown.attractions?.estimate || 0, data: breakdown.attractions, icon: getIcon(breakdown.attractions?.label || "", Ticket), color: "#a855f7", class: "text-purple-400", bg: "bg-purple-500/10" },
        { name: breakdown.food?.label || "Food", value: breakdown.food?.estimate || 0, data: breakdown.food, icon: getIcon(breakdown.food?.label || "", Utensils), color: "#f59e0b", class: "text-amber-400", bg: "bg-amber-500/10" },
    ].filter(cat => cat.value > 0);

    const total = categories.reduce((acc, curr) => acc + curr.value, 0);

    const formatINR = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <Card className="bg-slate-900/60 border-slate-800 shadow-2xl backdrop-blur-xl overflow-hidden ring-1 ring-white/5">
            <CardHeader className="border-b border-slate-800/50 pb-6 bg-gradient-to-br from-indigo-500/5 to-transparent">
                <div className="flex justify-between items-center gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-black flex items-center gap-2 tracking-tight">
                            <IndianRupee className="h-5 w-5 text-cyan-400" />
                            SMART BUDGET
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 w-fit">
                                <Sparkles className="h-3 w-3 text-cyan-400" />
                                <span className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">AI Analyzed</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 w-fit">
                                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">{travelers} Traveler{travelers > 1 ? 's' : ''}</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-[10px] text-slate-500 uppercase font-black block">Estimated Total</span>
                            <p className="text-3xl font-black text-white drop-shadow-sm">{formatINR(total)}</p>
                        </div>
                    </div>

                    <div className="h-28 w-28 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categories}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={30}
                                    outerRadius={45}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <RechartTooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg shadow-xl text-[10px]">
                                                    <p className="font-bold text-white">{payload[0].name}</p>
                                                    <p className="text-cyan-400">{formatINR(payload[0].value as number)}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid divide-y divide-slate-800/40">
                    {categories.map((cat) => (
                        <div key={cat.name} className="p-5 flex items-start gap-4 hover:bg-white/[0.02] transition-all group">
                            <div className={`h-12 w-12 shrink-0 rounded-2xl ${cat.bg} flex items-center justify-center ${cat.class} group-hover:scale-110 transition-transform`}>
                                <cat.icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1 gap-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tight group-hover:text-slate-200 transition-colors flex-1">
                                        {typeof cat.name === 'object' ? (cat.name as any).label || "Expenditure" : cat.name}
                                    </span>
                                    <span className="text-base font-mono font-black text-white shrink-0">{formatINR(cat.data?.estimate || 0)}</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-snug">
                                    {typeof cat.data?.note === 'object' ? (cat.data.note as any).description || "Detailed breakdown" : cat.data?.note || ""}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
