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
                "relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-1 shadow-sm",
                className
            )}
        >
            {/* Background Decor */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />

            {/* Dismiss Button */}
            <button
                onClick={onDismiss}
                className="absolute top-3 right-3 p-1.5 text-blue-300 hover:text-blue-500 hover:bg-blue-100/50 rounded-full transition-colors z-20"
                title="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="relative bg-white/60 backdrop-blur-sm rounded-xl p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start relative z-10">

                    {/* Left: Content */}
                    <div className="flex-1 space-y-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/50 text-blue-700 text-[11px] font-bold uppercase tracking-wider border border-blue-200/50">
                                <Sparkles className="w-3 h-3" />
                                Wait! You're missing out
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 leading-tight">
                                Unlock Data-Driven Content Planning
                            </h2>
                            <p className="text-slate-600 leading-relaxed max-w-xl">
                                Connect Google Search Console to supercharge your strategy avoiding guesswork.
                                Get real search performance data to prioritize high-impact topics.
                            </p>
                        </div>

                        {/* Benefit Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="flex gap-3 items-start">
                                <div className="p-2 bg-amber-50 rounded-lg border border-amber-100 text-amber-600">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">High-Impact Topics</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Find keywords close to page 1 ranking</p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start">
                                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-600">
                                    <Zap className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Quick Wins</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Fix low-hanging fruit for fast traffic</p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start">
                                <div className="p-2 bg-purple-50 rounded-lg border border-purple-100 text-purple-600">
                                    <Target className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Real Rankings</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Prioritize based on actual user data</p>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start">
                                <div className="p-2 bg-rose-50 rounded-lg border border-rose-100 text-rose-600">
                                    <BarChart3 className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Low CTR Fixes</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Identify titles that need improvement</p>
                                </div>
                            </div>
                        </div>

                        {/* Privacy Section */}
                        <div className="pt-2">
                            <button
                                onClick={() => setShowPrivacy(!showPrivacy)}
                                className="flex items-center gap-2 text-[11px] font-medium text-slate-400 hover:text-blue-600 transition-colors group"
                            >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>We prioritize your privacy. How do we use your data?</span>
                                <ChevronDown className={cn("w-3 h-3 transition-transform", showPrivacy && "rotate-180")} />
                            </button>

                            <AnimatePresence>
                                {showPrivacy && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs text-slate-600 space-y-2">
                                            <div className="flex items-start gap-2">
                                                <Lock className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                                                <p><strong>100% Read-Only:</strong> We can only view your data. We can NEVER modify, delete, or submit anything to Google.</p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Eye className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                                                <p><strong>No Data Storage:</strong> We fetch metrics on-demand to enhance your plan. We don't store copies of your search history.</p>
                                            </div>
                                            <div className="pl-5">
                                                <a href="/privacy-policy" className="text-blue-600 underline decoration-blue-300 hover:decoration-blue-600 underline-offset-2">Read Privacy Policy</a>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right: CTA */}
                    <div className="flex-none w-full lg:w-72 flex flex-col gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm items-center text-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-2">
                            {/* Google G Logo SVG */}
                            <svg viewBox="0 0 24 24" className="w-6 h-6"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84.81-.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-bold text-slate-900">Connect Search Console</h3>
                            <p className="text-xs text-slate-500">View real data for <strong>your site</strong></p>
                        </div>

                        <Button
                            onClick={onConnect}
                            size="lg"
                            className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold shadow-md shadow-blue-500/20"
                        >
                            Connect Now
                            <ArrowRight className="w-4 h-4 ml-2 opacity-80" />
                        </Button>

                        <p className="text-[10px] text-slate-400">
                            Only takes 30 seconds
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
