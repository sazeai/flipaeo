"use client"

import { memo } from "react"
import { motion } from "motion/react"
import {
    CheckCircle2,
    Circle,
    PenTool,
    TrendingUp,
    Target,
    ArrowUpRight,
    Zap,
    TrendingDown,
    Search,
    BarChart3,
    BookOpen,
    FileText,
    Sparkles
} from "lucide-react"
import { ContentPlanItem } from "@/lib/schemas/content-plan"
import { cn } from "@/lib/utils"

interface CompactPlanCardProps {
    item: ContentPlanItem
    onClick: () => void
    isNext?: boolean
}

export const CompactPlanCard = memo(function CompactPlanCard({
    item,
    onClick,
    isNext = false
}: CompactPlanCardProps) {
    const isPublished = item.status === "published"
    const isWriting = item.status === "writing"
    const isPending = item.status === "pending"

    // Metrics for display
    const volume = item.gsc_impressions || 0
    const score = item.opportunity_score || 0

    // Status-specific styles
    const statusStyles = {
        published: "bg-emerald-50/50 border-emerald-100 text-emerald-700",
        writing: "bg-blue-50/50 border-blue-100 text-blue-700",
        pending: "bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:shadow-sm"
    }

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative p-2.5 rounded-xl border transition-colors cursor-pointer h-full flex flex-col gap-2",
                isNext && "ring-2 ring-stone-900 border-transparent shadow-sm",
                isPublished && statusStyles.published,
                isWriting && statusStyles.writing,
                isPending && statusStyles.pending
            )}
        >
            {/* Status & Badge Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    {isPublished ? (
                        <>
                            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider">Published</span>
                        </>
                    ) : isWriting ? (
                        <>
                            <div className="relative flex h-2 w-2 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider">In Progress</span>
                        </>
                    ) : isNext ? (
                        <>
                            <div className="w-4 h-4 rounded-full bg-stone-900 flex items-center justify-center">
                                <ArrowUpRight className="w-2.5 h-2.5 text-white" />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-stone-900">Next Up</span>
                        </>
                    ) : (
                        <>
                            <Circle className="w-3.5 h-3.5 text-stone-300" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Planned</span>
                        </>
                    )}
                </div>

                {item.badge === 'quick_win' && (
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                )}
            </div>

            {/* Title & Keyword Summary */}
            <div className="space-y-1.5">
                <h4 className={cn(
                    "text-[13px] font-bold leading-snug line-clamp-2",
                    isPending ? "text-stone-900" : "inherit"
                )}>
                    {item.title}
                </h4>

                {/* Tiny Keyword Summary */}
                <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-[10px] font-bold opacity-60 truncate tracking-tight bg-stone-100 px-1 py-0.5 rounded">
                        {item.main_keyword}
                    </span>
                    {item.supporting_keywords && item.supporting_keywords.length > 0 && (
                        <span className="text-[9px] font-bold opacity-30 whitespace-nowrap">
                            +{item.supporting_keywords.length}
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-auto flex items-center justify-between pt-2 border-t border-black/5">
                <div className="flex items-center gap-2.5 opacity-80">
                    {volume > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-bold">
                            <TrendingUp className="w-3 h-3" />
                            <span>{volume > 1000 ? `${(volume / 1000).toFixed(1)}k` : volume}</span>
                        </div>
                    )}
                </div>
                {/* Intent Indicator */}
                <div className="flex items-center gap-1.5 opacity-40">
                    {item.article_type === 'commercial' && <BarChart3 className="w-3.5 h-3.5" />}
                    {item.article_type === 'howto' && <BookOpen className="w-3.5 h-3.5" />}
                    {item.article_type === 'informational' && <FileText className="w-3.5 h-3.5" />}
                </div>
            </div>
        </div>
    )
})
