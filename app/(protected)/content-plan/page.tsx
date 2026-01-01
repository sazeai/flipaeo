"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import Link from "next/link"
import {
    Calendar,
    Sparkles,
    TrendingUp,
    Zap,
    Target,
    Lock,
    PenTool,
    SquarePen,
    CheckCircle2,
    Loader2,
    FileText,
    BookOpen,
    Layout,
    BarChart3,
    MousePointerClick,
    Search,
    Feather,
    Lightbulb,
    Gauge,
    Tag,
    Play,
    Pause
} from "lucide-react"
import { ContentPlanItem } from "@/lib/schemas/content-plan"
import { Button } from "@/components/ui/button"
import { GlobalCard } from "@/components/ui/global-card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AutomationModal } from "@/components/automation-modal"
import { cn } from "@/lib/utils"
import { useCredits } from "@/hooks/useCredits"
import { CustomSpinner } from "@/components/CustomSpinner"
import { PlanCard } from "@/components/content-plan/plan-card"

// --- Minimal Design System Configuration ---

// Clean, monochrome-focused badge styles with minimal color usage
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

const STATUS_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
    pending: { label: "Planned", icon: Calendar, className: "text-stone-500" },
    writing: { label: "Writing", icon: PenTool, className: "text-stone-900" },
    published: { label: "Published", icon: CheckCircle2, className: "text-stone-900" },
}

// Article Category Configuration for Strategic 12-8-6-4 Distribution
const ARTICLE_CATEGORY_CONFIG: Record<string, {
    label: string;
    icon: any;
    tagline: string;
    color: string;
    bgColor: string;
    targetCount: number;
}> = {
    "Core Answers": {
        label: "Core Answers",
        icon: BookOpen,
        tagline: "Foundation of topical authority",
        color: "text-blue-600",
        bgColor: "bg-blue-50 border-blue-200",
        targetCount: 12
    },
    "Supporting Articles": {
        label: "Supporting Articles",
        icon: Target,
        tagline: "Deepen coverage with how-tos",
        color: "text-amber-600",
        bgColor: "bg-amber-50 border-amber-200",
        targetCount: 8
    },
    "Conversion Pages": {
        label: "Conversion Pages",
        icon: TrendingUp,
        tagline: "Commercial intent winners",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50 border-emerald-200",
        targetCount: 6
    },
    "Authority Plays": {
        label: "Authority Plays",
        icon: Sparkles,
        tagline: "Expert positioning & edge cases",
        color: "text-purple-600",
        bgColor: "bg-purple-50 border-purple-200",
        targetCount: 4
    }
}

export default function ContentPlanPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [plan, setPlan] = useState<{ id: string; plan_data: ContentPlanItem[]; gsc_enhanced: boolean; automation_status?: string } | null>(null)
    const [filter, setFilter] = useState<"all" | "pending" | "writing" | "published">("all")
    const [error, setError] = useState("")
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<ContentPlanItem>>({})
    const [automationLoading, setAutomationLoading] = useState(false)
    const [showAutomationModal, setShowAutomationModal] = useState(false)
    const [missedCount, setMissedCount] = useState(0)

    // Credit gating
    const { balance: creditBalance, hasCredits } = useCredits()

    useEffect(() => {
        fetchPlan()
    }, [])

    // Handle redirect when no plan exists (must be in useEffect, not render)
    useEffect(() => {
        if (!loading && !plan) {
            router.replace("/onboarding")
        }
    }, [loading, plan, router])

    const fetchPlan = async () => {
        try {
            const res = await fetch("/api/content-plan")
            const data = await res.json()
            if (res.ok && data) {
                setPlan(data)
            }
        } catch (e: any) {
            setError(e.message || "Failed to load content plan")
        } finally {
            setLoading(false)
        }
    }

    const handleWriteArticle = async (item: ContentPlanItem) => {
        setLoading(true)
        setError("")

        try {
            const settingsRes = await fetch("/api/settings")
            if (!settingsRes.ok) throw new Error("Failed to fetch settings.")
            const settings = await settingsRes.json()

            if (!settings.brandId) {
                router.push("/onboarding")
                return
            }

            const generateRes = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    keyword: item.main_keyword,
                    brandId: settings.brandId,
                    title: item.title,
                    articleType: item.article_type || "informational",
                    supportingKeywords: item.supporting_keywords || [],
                    cluster: item.cluster || "",
                    planId: plan?.id,
                    itemId: item.id,
                }),
            })

            if (!generateRes.ok) {
                const data = await generateRes.json()
                throw new Error(data.error || "Failed to start article generation")
            }

            // const { articleId } = await generateRes.json() // Not needed for redirect

            if (plan) {
                await handleUpdateStatus(item.id, "writing")
            }

            // Redirect to articles list instead of the specific article
            router.push(`/articles`)
        } catch (e: any) {
            setError(e.message || "Failed to generate article")
        } finally {
            setLoading(false)
        }
    }

    const handleStartEdit = (item: ContentPlanItem) => {
        setEditingId(item.id)
        setEditForm({
            title: item.title,
            main_keyword: item.main_keyword,
            supporting_keywords: item.supporting_keywords,
            article_type: item.article_type || "informational",
        })
    }

    const handleSaveEdit = async () => {
        if (!plan || !editingId) return

        try {
            await fetch("/api/content-plan", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId: plan.id,
                    itemId: editingId,
                    updates: editForm,
                }),
            })

            setPlan(prev => {
                if (!prev) return prev
                return {
                    ...prev,
                    plan_data: prev.plan_data.map(item =>
                        item.id === editingId ? { ...item, ...editForm } : item
                    ),
                }
            })
            setEditingId(null)
            setEditForm({})
        } catch (e) {
            console.error("Failed to save edit:", e)
        }
    }

    // Used by the memoized PlanCard component
    const handleSaveEditForItem = useCallback(async (itemId: string, updates: Partial<ContentPlanItem>) => {
        if (!plan) return

        try {
            await fetch("/api/content-plan", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId: plan.id,
                    itemId,
                    updates,
                }),
            })

            setPlan(prev => {
                if (!prev) return prev
                return {
                    ...prev,
                    plan_data: prev.plan_data.map(item =>
                        item.id === itemId ? { ...item, ...updates } : item
                    ),
                }
            })
            setEditingId(null)
        } catch (e) {
            console.error("Failed to save edit:", e)
        }
    }, [plan])

    const handleUpdateStatus = async (itemId: string, status: "pending" | "writing" | "published") => {
        if (!plan) return

        try {
            await fetch("/api/content-plan", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId: plan.id,
                    itemId,
                    updates: { status },
                }),
            })

            setPlan(prev => {
                if (!prev) return prev
                return {
                    ...prev,
                    plan_data: prev.plan_data.map(item =>
                        item.id === itemId ? { ...item, status } : item
                    ),
                }
            })
        } catch (e) {
            console.error("Failed to update status:", e)
        }
    }

    // Automation toggle handler
    const handleToggleAutomation = async () => {
        if (!plan) return

        const isActive = plan.automation_status === "active"

        if (isActive) {
            // Pausing automation - no modal needed
            setAutomationLoading(true)
            try {
                const res = await fetch("/api/content-plan/automation", { method: "DELETE" })
                const data = await res.json()
                if (res.ok) {
                    setPlan(prev => prev ? { ...prev, automation_status: data.automation_status } : prev)
                } else {
                    setError(data.error || "Failed to pause automation")
                }
            } catch (e: any) {
                setError(e.message || "Failed to pause automation")
            } finally {
                setAutomationLoading(false)
            }
        } else {
            // Starting automation - check for missed articles first
            setAutomationLoading(true)
            try {
                const res = await fetch("/api/content-plan/automation")
                const data = await res.json()

                if (data.missedCount > 0) {
                    // Show modal for user to choose how to handle missed articles
                    setMissedCount(data.missedCount)
                    setShowAutomationModal(true)
                } else {
                    // No missed articles - activate directly
                    await handleActivateAutomation("gradual")
                }
            } catch (e: any) {
                setError(e.message || "Failed to check automation status")
            } finally {
                setAutomationLoading(false)
            }
        }
    }

    // Handle activation with user's chosen action
    const handleActivateAutomation = async (action: "gradual" | "skip" | "reschedule") => {
        try {
            const res = await fetch("/api/content-plan/automation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            })
            const data = await res.json()

            if (res.ok) {
                setPlan(prev => prev ? { ...prev, automation_status: data.automation_status } : prev)
                // Refetch plan to get updated dates if rescheduled
                if (action === "reschedule" || action === "skip") {
                    fetchPlan()
                }
            } else {
                setError(data.error || "Failed to activate automation")
            }
        } catch (e: any) {
            setError(e.message || "Failed to activate automation")
            throw e
        }
    }

    const filteredPlan = plan?.plan_data.filter(item => {
        if (filter === "all") return true
        return item.status === filter
    }) || []

    const urgentItems = filteredPlan.filter(item => item.badge && ["high_impact", "quick_win"].includes(item.badge)).slice(0, 5)
    const regularItems = filteredPlan.filter(item => !urgentItems.includes(item))

    const planStats = plan?.plan_data.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
    }, {} as Record<string, number>) || {}

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <CustomSpinner className="w-10 h-10" />
            </div>
        )
    }


    if (!plan) {
        // Redirect is handled by useEffect above, show spinner while redirecting
        return (
            <div className="min-h-screen flex items-center justify-center">
                <CustomSpinner className="w-10 h-10" />
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen font-sans">
            <GlobalCard className="w-full shadow-sm rounded-xl border border-stone-200 bg-white">
                {/* --- Integrated Header --- */}
                {/* --- Integrated Header --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 py-4 border-b border-stone-200/50 bg-stone-50/40 backdrop-blur-sm rounded-t-xl sticky top-0 z-10 backdrop-filter min-h-[72px]">
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2 flex-wrap">
                                {plan?.gsc_enhanced ? (
                                    <>
                                        <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-500/10 flex-shrink-0" />
                                        <span>Data-Driven Strategy</span>
                                    </>
                                ) : (
                                    "Content Plan"
                                )}
                            </h1>
                            {plan?.plan_data && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-200/50 text-[10px] font-medium text-stone-600 px-1.5 translate-y-[1px]">
                                    {plan.plan_data.length}
                                </span>
                            )}
                        </div>
                        {plan && (
                            <p className="text-[10px] font-medium text-stone-400 pl-0.5">
                                Generated {new Date().toLocaleDateString()} • 30 Day Strategic Roadmap
                            </p>
                        )}
                    </div>

                    {/* Automation Button + Filters */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Automation Toggle Button */}
                        {plan && (
                            <Button
                                onClick={handleToggleAutomation}
                                disabled={automationLoading || (!hasCredits && plan.automation_status !== "active")}
                                size="sm"
                                className={cn(
                                    "h-9 px-4 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 shadow-sm",
                                    plan.automation_status === "active"
                                        ? "bg-stone-900 text-white hover:bg-stone-800"
                                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                                )}
                            >
                                {automationLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : plan.automation_status === "active" ? (
                                    <>
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <Pause className="w-3.5 h-3.5" />
                                        <span className="sm:block hidden">Pause Automation</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-3.5 h-3.5" />
                                        <span>Start Automation</span>
                                    </>
                                )}
                            </Button>
                        )}

                        {!hasCredits && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 text-[10px] font-medium rounded-lg border border-red-100">
                                <Lock className="w-3 h-3" />
                                <span>0 Passes</span>
                                <Link href="/pricing" className="underline hover:no-underline">Top up</Link>
                            </div>
                        )}

                        {plan && (
                            <div className="flex bg-stone-100/50 border border-stone-200 rounded-lg p-1 self-start md:self-center overflow-x-auto max-w-full">
                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                    <button
                                        key={key}
                                        onClick={() => setFilter(key as any)}
                                        className={cn(
                                            "cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                                            filter === key
                                                ? "bg-white text-stone-900 shadow-xs border border-stone-200/50"
                                                : "text-stone-500 hover:text-stone-700 hover:bg-stone-200/50"
                                        )}
                                    >
                                        <span className={filter === key ? "inline" : "hidden sm:inline"}>
                                            {config.label}
                                        </span>
                                        <ConfigIcon config={config} isSelected={filter === key} />
                                        <span className={cn(
                                            "ml-1 text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.25rem]",
                                            filter === key ? "bg-stone-100 " : "bg-stone-200/50"
                                        )}>
                                            {planStats[key] || 0}
                                        </span>
                                    </button>
                                ))}
                                {/* 'All' Filter */}
                                <button
                                    onClick={() => setFilter("all")}
                                    className={cn(
                                        "cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ml-1",
                                        filter === "all"
                                            ? "bg-white text-stone-900 shadow-xs border border-stone-200/50"
                                            : "text-stone-500 hover:text-stone-700 hover:bg-stone-200/50"
                                    )}
                                >
                                    <span>All</span>
                                    <span className={cn(
                                        "ml-1 text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.25rem]",
                                        filter === "all" ? "bg-stone-100" : "bg-stone-200/50"
                                    )}>
                                        {plan.plan_data.length}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Body Content --- */}
                <div className="p-4 space-y-8">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-3">
                            <CustomSpinner className="w-10 h-10" />
                            <p className="text-sm text-stone-500 font-medium animate-pulse">Loading content plan...</p>
                        </div>
                    ) : error ? (
                        <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-center">
                            <p className="text-sm text-red-600 font-medium mb-3">{error}</p>
                            <Button variant="outline" size="sm" onClick={fetchPlan} className="h-8 text-xs bg-white hover:bg-red-50 border-red-200 text-red-700">
                                Retry
                            </Button>
                        </div>
                    ) : !plan ? (
                        <div className="text-center py-20 px-4">
                            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText className="w-8 h-8 text-stone-400" />
                            </div>
                            <h2 className="text-xl font-bold text-stone-900 mb-2">No Content Plan Yet</h2>
                            <p className="text-stone-500 max-w-md mx-auto mb-8 text-sm leading-relaxed">
                                Generate a data-driven 30-day content plan based on your competitors and search trends.
                            </p>
                            <Button onClick={() => router.push("/onboarding")} className="h-10 px-6 font-semibold shadow-md active:scale-95 transition-transform">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Create First Plan
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* --- Strategic Content Grid by Article Category --- */}
                            <div className="space-y-8">
                                {Object.entries(ARTICLE_CATEGORY_CONFIG).map(([categoryKey, categoryConfig]) => {
                                    // Get items for this category
                                    const categoryItems = filteredPlan.filter(
                                        item => item.article_category === categoryKey
                                    )

                                    // Skip empty sections when filtering by status
                                    if (categoryItems.length === 0 && filter !== 'all') return null

                                    const CategoryIcon = categoryConfig.icon
                                    const completedCount = categoryItems.filter(i => i.status === 'published').length

                                    return (
                                        <section key={categoryKey}>
                                            {/* Section Header */}
                                            <div className={cn(
                                                "flex items-center justify-between gap-3 mb-4 p-3 rounded-lg border",
                                                categoryConfig.bgColor
                                            )}>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center bg-white/80 shadow-sm",
                                                        categoryConfig.color
                                                    )}>
                                                        <CategoryIcon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-sm font-bold text-stone-900 tracking-tight">
                                                            {categoryConfig.label}
                                                        </h2>
                                                        <p className="text-[11px] text-stone-500">
                                                            {categoryConfig.tagline}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                                                        categoryConfig.color,
                                                        "bg-white/80"
                                                    )}>
                                                        {completedCount}/{categoryConfig.targetCount}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Articles Grid */}
                                            {categoryItems.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                                    {categoryItems.map((item) => (
                                                        <PlanCard
                                                            key={item.id}
                                                            item={item}
                                                            isEditing={editingId === item.id}
                                                            hasCredits={hasCredits}
                                                            onStartEdit={() => handleStartEdit(item)}
                                                            onCancelEdit={() => setEditingId(null)}
                                                            onSaveEdit={(updates) => handleSaveEditForItem(item.id, updates)}
                                                            onWriteArticle={() => handleWriteArticle(item)}
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 text-stone-400 text-sm border border-dashed border-stone-200 rounded-lg">
                                                    No {categoryConfig.label} yet
                                                </div>
                                            )}
                                        </section>
                                    )
                                })}

                                {/* Uncategorized Section (for legacy plans without article_category) */}
                                {filteredPlan.filter(item => !item.article_category).length > 0 && (
                                    <section>
                                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-100">
                                            <Layout className="w-4 h-4 text-stone-400" />
                                            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                                                Legacy / Uncategorized
                                            </h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {filteredPlan
                                                .filter(item => !item.article_category)
                                                .map((item) => (
                                                    <PlanCard
                                                        key={item.id}
                                                        item={item}
                                                        isEditing={editingId === item.id}
                                                        hasCredits={hasCredits}
                                                        onStartEdit={() => handleStartEdit(item)}
                                                        onCancelEdit={() => setEditingId(null)}
                                                        onSaveEdit={(updates) => handleSaveEditForItem(item.id, updates)}
                                                        onWriteArticle={() => handleWriteArticle(item)}
                                                    />
                                                ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </GlobalCard>

            {/* Automation Modal for handling missed articles */}
            <AutomationModal
                isOpen={showAutomationModal}
                onClose={() => setShowAutomationModal(false)}
                missedCount={missedCount}
                onConfirm={handleActivateAutomation}
            />
        </div>
    )
}

// Helper to avoid TS errors in map
function ConfigIcon({ config, isSelected }: { config: any, isSelected: boolean }) {
    const Icon = config.icon
    return <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-stone-900" : "text-stone-400")} />
}
