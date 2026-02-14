"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}

export default function AlertModal({ isOpen, onClose, title, message }: AlertModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
                    >
                        {/* Glow Effect */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />

                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                <AlertCircle className="h-8 w-8 text-red-500" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-white tracking-tight">{title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {message}
                                </p>
                            </div>

                            <Button
                                onClick={onClose}
                                className="w-full bg-white hover:bg-slate-200 text-slate-900 font-bold rounded-2xl py-6 transition-all duration-300"
                            >
                                Got it
                            </Button>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
