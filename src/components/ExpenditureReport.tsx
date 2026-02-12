"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Bed, Train, Ticket, Utensils, IndianRupee, Sparkles, Bus, Home, Car } from "lucide-react";

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

export default function ExpenditureReport({ breakdown }: { breakdown: BudgetBreakdown }) {
    if (!breakdown) return null;

    const getIcon = (label: any, defaultIcon: any) => {
        if (!label || typeof label !== 'string') return defaultIcon;
        const l = label.toLowerCase();
        if (l.includes("train")) return Train;
        if (l.includes("bus")) return Bus;
        if (l.includes("hostel") || l.includes("dorm") || l.includes("guesthouse")) return Home;
        if (l.includes("flight")) return Plane;
        if (l.includes("car") || l.includes("taxi") || l.includes("transfer")) return Car;
        return defaultIcon;
    };

    const categories = [
        { label: breakdown.main_travel?.label || "Travel", data: breakdown.main_travel, icon: getIcon(breakdown.main_travel?.label || "", Plane), color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: breakdown.stay?.label || "Stay", data: breakdown.stay, icon: getIcon(breakdown.stay?.label || "", Bed), color: "text-indigo-400", bg: "bg-indigo-500/10" },
        { label: breakdown.transport?.label || "Local Transport", data: breakdown.transport, icon: Car, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { label: breakdown.attractions?.label || "Attractions", data: breakdown.attractions, icon: Ticket, color: "text-purple-400", bg: "bg-purple-500/10" },
        { label: breakdown.food?.label || "Food & Dining", data: breakdown.food, icon: Utensils, color: "text-amber-400", bg: "bg-amber-500/10" },
    ];

    const total = Object.values(breakdown).reduce((acc, curr) => acc + (curr?.estimate || 0), 0);

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
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-black flex items-center gap-2 tracking-tight">
                            <IndianRupee className="h-5 w-5 text-cyan-400" />
                            SMART BUDGET
                        </CardTitle>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 w-fit">
                            <Sparkles className="h-3 w-3 text-cyan-400" />
                            <span className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">AI Analyzed</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase font-black">Estimated Total</span>
                        <p className="text-3xl font-black text-white drop-shadow-sm">{formatINR(total)}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid divide-y divide-slate-800/40">
                    {categories.map((cat) => (
                        <div key={cat.label} className="p-5 flex items-start gap-4 hover:bg-white/[0.02] transition-all group">
                            <div className={`h-12 w-12 shrink-0 rounded-2xl ${cat.bg} flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}>
                                <cat.icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1 gap-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tight group-hover:text-slate-200 transition-colors flex-1">{cat.label}</span>
                                    <span className="text-base font-mono font-black text-white shrink-0">{formatINR(cat.data?.estimate || 0)}</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-snug">{cat.data?.note || ""}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
