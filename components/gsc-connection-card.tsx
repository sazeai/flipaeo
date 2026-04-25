"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
    Sparkles,
    TrendingUp,
    Zap,
    Target,
    BarChart3,
    Lock,
    Eye,
    X,
    ArrowRight,
    ChevronDown,
    ShieldCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface GSCConnectionCardProps {
    onConnect: () => void
    onDismiss: () => void
    className?: string
}

export function GSCConnectionCard({ onConnect, onDismiss, className }: GSCConnectionCardProps) {
    const [showPrivacy, setShowPrivacy] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
                "relative overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-all hover:shadow-md",
                className
            )}
        >
            {/* Dismiss Button */}
            <button
                onClick={onDismiss}
                className="absolute top-3 right-3 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-all z-20"
                title="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col lg:flex-row min-h-[280px]">
                {/* Left: Value Proposition */}
                <div className="flex-1 p-4 flex flex-col justify-center">
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-stone-100 text-stone-600 text-[11px] font-bold uppercase tracking-wider border border-stone-200 select-none">
                                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                                Power-Up Available
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl sm:text-2xl font-bold text-stone-950 tracking-tight leading-tight">
                                    Unlock Data-Driven Content Planning
                                </h2>
                                <p className="text-stone-500 leading-relaxed max-w-lg text-sm sm:text-base font-medium">
                                    Stop guessing. Connect Google Search Console to see exactly what your audience is searching for and prioritize high-impact topics with real data.
                                </p>
                            </div>
                        </div>

                        {/* Clean Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                            {[
                                { icon: TrendingUp, label: "High-Impact Topics", desc: "Target keywords near page 1" },
                                { icon: Zap, label: "Quick Wins", desc: "Low-hanging fruit for fast traffic" },
                                { icon: Target, label: "Real Rankings", desc: "Based on actual user visits" },
                                { icon: BarChart3, label: "CTR Improvements", desc: "Fix titles with low clicks" }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3 items-start group">
                                    <div className="mt-0.5 p-1.5 rounded-md bg-white border border-stone-200 text-stone-500 group-hover:text-stone-900 group-hover:border-stone-400 transition-colors shadow-sm">
                                        <item.icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-stone-900">{item.label}</h4>
                                        <p className="text-[11px] text-stone-500 leading-snug mt-0.5">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Privacy Toggle */}
                        <div className="pt-2">
                            <button
                                onClick={() => setShowPrivacy(!showPrivacy)}
                                className="flex items-center gap-2 text-[11px] font-medium text-stone-400 hover:text-stone-600 transition-colors group"
                            >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>100% Read-Only & Secure. How we use data?</span>
                                <ChevronDown className={cn("w-3 h-3 transition-transform opacity-50 group-hover:opacity-100", showPrivacy && "rotate-180")} />
                            </button>

                            <AnimatePresence>
                                {showPrivacy && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-3 p-3 bg-stone-50 rounded-lg border border-stone-100 text-xs text-stone-500 space-y-2">
                                            <div className="flex items-start gap-2">
                                                <Lock className="w-3 h-3 text-stone-400 mt-0.5 shrink-0" />
                                                <p><strong>Read-Only:</strong> We can only view your data. We NEVER modify or delete anything.</p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Eye className="w-3 h-3 text-stone-400 mt-0.5 shrink-0" />
                                                <p><strong>On-Demand:</strong> We fetch metrics live. We don't store your search history.</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Right: CTA Section */}
                <div className="lg:w-80 bg-stone-50/50 border-t lg:border-t-0 lg:border-l border-stone-100 p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    {/* Subtle Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '16px 16px' }}
                    />

                    <div className="relative z-10 space-y-6 w-full max-w-xs mx-auto">
                        <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-sm border border-stone-200 flex items-center justify-center p-3">
                            {/* Google G Logo SVG */}
                            <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84.81-.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-bold text-stone-900 text-sm">Connect Search Console</h3>
                            <p className="text-xs text-stone-500 font-medium">Unlock intelligence for <strong>your site</strong></p>
                        </div>

                        <Button
                            onClick={onConnect}
                            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold h-10 rounded-lg shadow-sm hover:shadow transition-all"
                        >
                            <span className="flex items-center gap-2">
                                Connect Now
                                <ArrowRight className="w-4 h-4 text-stone-400" />
                            </span>
                        </Button>

                        <p className="text-[10px] text-stone-400 font-medium">
                            <Lock className="w-2.5 h-2.5 inline mr-1 mb-0.5" />
                            Secure oAuth Connection
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
