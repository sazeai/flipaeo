"use client"

import Link from "next/link"
import { Lock, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PaywallOverlayProps {
    hiddenCount: number
    categoryName: string
    children: React.ReactNode
}

export function PaywallOverlay({ hiddenCount, categoryName, children }: PaywallOverlayProps) {
    if (hiddenCount <= 0) return <>{children}</>

    return (
        <div className="relative">
            {/* Blurred Content */}
            <div className="relative">
                {children}

                {/* Gradient Blur Mask */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.4) 20%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.95) 100%)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                    }}
                />
            </div>

            {/* Centered CTA Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                    className={cn(
                        "pointer-events-auto",
                        "relative p-6 rounded-2xl",
                        "bg-white/80 backdrop-blur-xl",
                        "border border-stone-200/50",
                        "shadow-2xl shadow-stone-900/10",
                        "max-w-sm w-full mx-4",
                        "transform transition-all duration-300",
                        "hover:shadow-stone-900/20"
                    )}
                >
                    {/* Decorative gradient border */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/10 via-transparent to-stone-500/10 pointer-events-none" />

                    <div className="relative space-y-4 text-center">
                        {/* Icon */}
                        <div className="flex justify-center">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center border border-amber-200/50 shadow-xs">
                                <Lock className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>

                        {/* Copy */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-stone-900 tracking-tight">
                                Unlock {hiddenCount} More Articles
                            </h3>
                            <p className="text-sm text-stone-500 leading-relaxed">
                                Your complete <span className="font-semibold text-stone-700">{categoryName}</span> strategy
                                is waiting. See all opportunities we've discovered for your brand.
                            </p>
                        </div>

                        {/* CTA Button */}
                        <Link href="/subscribe" className="block">
                            <Button
                                className={cn(
                                    "w-full h-11 rounded-lg",
                                    "bg-stone-900 hover:bg-stone-800",
                                    "text-white font-semibold text-sm",
                                    "shadow-[0_4px_0_0_#1c1917]",
                                    "transition-all duration-200",
                                    "active:scale-[0.98]",
                                    "group"
                                )}
                            >
                                <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                                Upgrade to Unlock
                            </Button>
                        </Link>

                        {/* Subtle reassurance */}
                        <p className="text-[10px] text-stone-400 font-medium">
                            Instant access • Strategic insights included
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
