"use client"

import { useState, memo } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import {
    Calendar,
    Sparkles,
    TrendingUp,
    Zap,
    Target,
    PenTool,
    SquarePen,
    CheckCircle2,
    Loader2,
    FileText,
    BookOpen,
    BarChart3,
    MousePointerClick,
    Search,
    Feather,
    Lightbulb,
    Gauge,
    Tag,
} from "lucide-react"
import { ContentPlanItem } from "@/lib/schemas/content-plan"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Badge and type configs
const BADGE_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
    high_impact: {
        label: "High Impact",
        icon: Sparkles,
        className: "text-stone-900 border-stone-200 bg-stone-50"
    },
    quick_win: {
        label: "Quick Win",
        icon: Zap,
        className: "text-stone-900 border-stone-200 bg-stone-50"
    },
    low_ctr: {
        label: "Low CTR",
        icon: MousePointerClick,
        className: "text-stone-900 border-stone-200 bg-stone-50"
    },
    new_opportunity: {
        label: "New Opportunity",
        icon: Target,
        className: "text-stone-900 border-stone-200 bg-stone-50"
    },
}

const ARTICLE_TYPE_CONFIG: Record<string, { label: string; icon: any }> = {
    informational: { label: "Informational", icon: FileText },
    commercial: { label: "Commercial", icon: BarChart3 },
    howto: { label: "How-To", icon: BookOpen },
}

interface PlanCardProps {
    item: ContentPlanItem
    isUrgent?: boolean
    isEditing: boolean
    hasCredits: boolean
    onStartEdit: () => void
    onCancelEdit: () => void
    onSaveEdit: (updates: Partial<ContentPlanItem>) => void
    onWriteArticle: () => void
}

// Separate EditForm component with its own local state
const EditForm = memo(function EditForm({
    item,
    onCancel,
    onSave
}: {
    item: ContentPlanItem
    onCancel: () => void
    onSave: (updates: Partial<ContentPlanItem>) => void
}) {
    // Local state for the edit form - this prevents parent re-renders
    const [localForm, setLocalForm] = useState({
        title: item.title || "",
        main_keyword: item.main_keyword || "",
        article_type: item.article_type || "informational",
        supporting_keywords: item.supporting_keywords || [],
    })

    const handleSave = () => {
        onSave(localForm)
    }

    return (
        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
            <div>
                <label className="text-[10px] text-stone-400 font-medium uppercase mb-1 block">Title</label>
                <input
                    type="text"
                    value={localForm.title}
                    onChange={(e) => setLocalForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 text-sm font-medium bg-transparent border rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                    placeholder="Article Title"
                    autoFocus
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] text-stone-400 font-medium uppercase mb-1 block">Target Keyword</label>
                    <input
                        type="text"
                        value={localForm.main_keyword}
                        onChange={(e) => setLocalForm(prev => ({ ...prev, main_keyword: e.target.value }))}
                        className="w-full px-3 py-2 text-xs bg-transparent border rounded-md"
                        placeholder="Target Keyword"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-stone-400 font-medium uppercase mb-1 block">Article Type</label>
                    <select
                        value={localForm.article_type}
                        onChange={(e) => setLocalForm(prev => ({ ...prev, article_type: e.target.value as any }))}
                        className="w-full px-3 py-2 text-xs bg-transparent border rounded-md"
                    >
                        <option value="informational">Informational</option>
                        <option value="commercial">Commercial</option>
                        <option value="howto">How-To</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="text-[10px] text-stone-400 font-medium uppercase mb-1 block">Supporting Keywords</label>
                <textarea
                    value={localForm.supporting_keywords.join(", ")}
                    onChange={(e) => setLocalForm(prev => ({
                        ...prev,
                        supporting_keywords: e.target.value.split(",").map(k => k.trim()).filter(k => k.length > 0)
                    }))}
                    className="w-full px-3 py-2 text-xs bg-transparent border rounded-md resize-none"
                    placeholder="keyword 1, keyword 2, keyword 3"
                    rows={2}
                />
                <p className="text-[10px] text-stone-400 mt-1">Separate keywords with commas</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="ghost" onClick={onCancel} className="h-8 text-xs">
                    Cancel
                </Button>
                <Button size="sm" onClick={handleSave} className="h-8 text-xs bg-stone-900 text-white hover:bg-stone-800">
                    Save Changes
                </Button>
            </div>
        </div>
    )
})

// Memoized PlanCard component - only re-renders when its props change
export const PlanCard = memo(function PlanCard({
    item,
    isUrgent = false,
    isEditing,
    hasCredits,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onWriteArticle
}: PlanCardProps) {
    const typeConfig = ARTICLE_TYPE_CONFIG[item.article_type || "informational"]
    const BadgeIcon = item.badge ? BADGE_CONFIG[item.badge]?.icon : null

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "group relative p-5 rounded-xl border transition-all duration-200 flex flex-col h-full bg-white",
                isUrgent
                    ? "border-stone-300 shadow-sm"
                    : "border-stone-200 hover:border-stone-300 hover:shadow-sm"
            )}
        >
            {isEditing ? (
                <EditForm
                    item={item}
                    onCancel={onCancelEdit}
                    onSave={onSaveEdit}
                />
            ) : (
                /* --- View Mode --- */
                <div className="flex flex-col h-full gap-3">
                    {/* Header: Badges, Score & Edit */}
                    <div className="flex items-start justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            {item.badge && BADGE_CONFIG[item.badge] && (
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border",
                                    BADGE_CONFIG[item.badge].className
                                )}>
                                    <BadgeIcon className="w-3 h-3" />
                                    {BADGE_CONFIG[item.badge].label}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium text-stone-500 border border-stone-100 bg-stone-50">
                                <typeConfig.icon className="w-3 h-3" />
                                {typeConfig.label}
                            </span>
                            {/* Opportunity Score with Tooltip */}
                            {item.opportunity_score !== undefined && item.opportunity_score > 0 && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-stone-700 bg-stone-100 border border-stone-200 cursor-help">
                                            <Gauge className="w-3 h-3" />
                                            {item.opportunity_score}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[220px]">
                                        <p className="font-semibold">Opportunity Score</p>
                                        <p className="text-[11px] opacity-90">Calculated from impressions, position, CTR gap, and keyword specificity. Higher = more valuable topic.</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {/* Impact Badge with Tooltip */}
                            {item.impact && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className={cn(
                                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium cursor-help border",
                                            item.impact === "High" && "text-emerald-700 bg-emerald-50 border-emerald-200",
                                            item.impact === "Medium" && "text-amber-700 bg-amber-50 border-amber-200",
                                            item.impact === "Low" && "text-stone-500 bg-stone-50 border-stone-200"
                                        )}>
                                            <TrendingUp className="w-3 h-3" />
                                            {item.impact}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[200px]">
                                        <p className="font-semibold">Expected Traffic Impact</p>
                                        <p className="text-[11px] opacity-90">
                                            {item.impact === "High" && "This topic can drive significant organic traffic."}
                                            {item.impact === "Medium" && "This topic has moderate traffic potential."}
                                            {item.impact === "Low" && "Smaller traffic potential, but good for authority."}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>

                        <button
                            onClick={onStartEdit}
                            className="cursor-pointer opacity-100 group-hover:opacity-80 transition-opacity p-1.5 hover:bg-stone-100 rounded-md text-stone-400 hover:text-stone-600"
                        >
                            <SquarePen className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-stone-900 text-[15px] leading-snug group-hover:text-stone-700 transition-colors line-clamp-2">
                        {item.title}
                    </h3>

                    {/* AI Strategic Reason */}
                    {item.reason && (
                        <p className="text-[11px] text-stone-500 leading-relaxed italic">
                            <Lightbulb className="w-3 h-3 inline mr-1 opacity-70" />
                            {item.reason}
                        </p>
                    )}

                    {/* GSC Metrics Grid */}
                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-xs">
                        {/* Main Keyword with Tooltip */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 text-stone-500 truncate cursor-help col-span-2">
                                    <Search className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate font-medium">{item.main_keyword}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[250px]">
                                <p className="font-semibold">Target Keyword</p>
                                <p className="text-[11px] opacity-90">The primary keyword this article will target for SEO rankings.</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* GSC Impressions */}
                        {item.gsc_impressions && item.gsc_impressions > 0 ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 text-stone-500 cursor-help">
                                        <TrendingUp className="w-3 h-3 flex-shrink-0" />
                                        <span>{item.gsc_impressions.toLocaleString()} <span className="text-[10px] opacity-70">imps</span></span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[200px] text-center">
                                    <p className="font-semibold">Monthly Impressions</p>
                                    <p className="text-[11px] opacity-90">How many times your site appeared in search results for this keyword.</p>
                                </TooltipContent>
                            </Tooltip>
                        ) : null}

                        {/* CTR */}
                        {item.gsc_ctr !== undefined && item.gsc_ctr > 0 ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex gap-2 text-stone-500 cursor-help">
                                        <MousePointerClick className="w-3 h-3 flex-shrink-0" />
                                        <span>{item.gsc_ctr.toFixed(1)}% <span className="text-[10px] opacity-70">CTR</span></span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[200px]">
                                    <p className="font-semibold">Click-Through Rate</p>
                                    <p className="text-[11px] opacity-90">Percentage of impressions that resulted in clicks. Low CTR = opportunity to target the keyword.</p>
                                </TooltipContent>
                            </Tooltip>
                        ) : null}

                        {/* Position */}
                        {item.gsc_position && item.gsc_position > 0 ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex gap-2 text-stone-500 cursor-help">
                                        <Target className="w-3 h-3 flex-shrink-0" />
                                        <span>Pos {item.gsc_position.toFixed(1)}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[220px] ">
                                    <p className="font-semibold">Average Position</p>
                                    <p className="text-[11px] opacity-90">Your current ranking in Google. Position 1-10 = Page 1, 11-20 = Page 2, etc.</p>
                                </TooltipContent>
                            </Tooltip>
                        ) : null}
                    </div>

                    {/* Supporting Keywords */}
                    {item.supporting_keywords && item.supporting_keywords.length > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 text-[10px] text-stone-400 cursor-help">
                                    <Tag className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">
                                        +{item.supporting_keywords.length} related keywords
                                    </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[280px]">
                                <p className="font-semibold mb-1">Supporting Keywords</p>
                                <p className="text-[11px] opacity-90 leading-relaxed">
                                    {item.supporting_keywords.slice(0, 5).join(", ")}
                                    {item.supporting_keywords.length > 5 && ` +${item.supporting_keywords.length - 5} more`}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {/* Footer: Date & Action */}
                    <div className="mt-auto pt-3 flex items-end justify-between border-t border-stone-100">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-stone-400 font-medium">SCHEDULED</span>
                            <span className="text-xs font-medium text-stone-700">
                                {new Date(item.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        </div>

                        {item.status === 'writing' ? (
                            <Link
                                href="/articles"
                                className="flex items-center gap-1.5 text-xs font-semibold text-stone-900 bg-stone-100 px-3 py-1.5 rounded-lg hover:bg-stone-200 transition-colors"
                            >
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Writing...
                            </Link>
                        ) : item.status === 'published' ? (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-900 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Published
                            </span>
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-block">
                                        <Button
                                            onClick={onWriteArticle}
                                            size="sm"
                                            disabled={!hasCredits}
                                            className={cn(
                                                "h-8 text-xs font-semibold shadow-sm rounded-lg",
                                                !hasCredits
                                                    ? "bg-stone-100 text-stone-400 cursor-not-allowed hover:bg-stone-100"
                                                    : "bg-stone-900 text-white hover:bg-stone-800"
                                            )}
                                        >
                                            <Feather className="w-3 h-3" />
                                            Write Article
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                {!hasCredits && (
                                    <TooltipContent>
                                        <p>Passes required. Please top up.</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    )
})
