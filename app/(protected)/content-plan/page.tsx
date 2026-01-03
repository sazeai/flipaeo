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
    Pause,
    LayoutGrid,
    Layers,
    Award,
    Waypoints,
    Calendar as CalendarIcon,
    MousePointer2
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
import { CalendarView } from "@/components/content-plan/calendar-view"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"

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
        icon: Layers,
        tagline: "Direct answers to your customers' most burning questions.",
        color: "text-stone-700",
        bgColor: "bg-stone-100 border-stone-200",
        targetCount: 12
    },
    "Supporting Articles": {
        label: "Supporting Articles",
        icon: Waypoints,
        tagline: "Comprehensive guides that build depth and trust.",
        color: "text-stone-700",
        bgColor: "bg-stone-100 border-stone-200",
        targetCount: 8
    },
    "Conversion Pages": {
        label: "Conversion Pages",
        icon: MousePointerClick,
        tagline: "High-intent content designed to drive signups.",
        color: "text-stone-700",
        bgColor: "bg-stone-100 border-stone-200",
        targetCount: 6
    },
    "Authority Plays": {
        label: "Authority Plays",
        icon: Award,
        tagline: "Thought leadership to establish industry expertise.",
        color: "text-stone-700",
        bgColor: "bg-stone-100 border-stone-200",
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
    const [viewMode, setViewMode] = useState<"strategy" | "calendar">("strategy")
    const [selectedItem, setSelectedItem] = useState<ContentPlanItem | null>(null)

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
                <div className="flex flex-col gap-6 px-5 py-5 border-b border-stone-200/50 bg-stone-50/40 backdrop-blur-md rounded-t-xl sticky top-0 z-10 min-h-[80px]">
                    <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center justify-between lg:justify-start gap-4">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2 flex-wrap">
                                    {plan?.gsc_enhanced ? (
                                        <>
                                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-sm transition-transform hover:rotate-3">
                                                <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                                            </div>
                                            <span className="bg-gradient-to-r from-stone-900 to-stone-600 bg-clip-text text-transparent">Content Strategy</span>
                                        </>
                                    ) : (
                                        "Strategy Roadmap"
                                    )}
                                </h1>
                                {plan?.plan_data && (
                                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-stone-900 text-[11px] font-black text-white px-2 shadow-md">
                                        {plan.plan_data.length}
                                    </span>
                                )}
                            </div>
                        </div>
                        {plan && (
                            <p className="text-[11px] font-bold text-stone-400 pl-1 uppercase tracking-[0.15em] opacity-80 mt-1 whitespace-nowrap">
                                Data-Driven 30 Day Roadmap
                            </p>
                        )}
                    </div>

                    {/* Consolidated Toolbar */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 w-full">
                        {/* Left: Filter Tabs */}
                        {plan && (
                            <div className="flex items-center p-1 bg-stone-100/50 border border-stone-200/50 rounded-xl overflow-x-auto w-full lg:w-auto no-scrollbar">
                                <button
                                    onClick={() => setFilter("all")}
                                    className={cn(
                                        "relative px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap z-10",
                                        filter === "all"
                                            ? "text-stone-900 bg-white shadow-sm ring-1 ring-stone-200"
                                            : "text-stone-500 hover:text-stone-700"
                                    )}
                                >
                                    All <span className="opacity-40 ml-1">{plan.plan_data.length}</span>
                                </button>
                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                    <button
                                        key={key}
                                        onClick={() => setFilter(key as any)}
                                        className={cn(
                                            "cursor-pointer relative px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap z-10 flex items-center gap-2",
                                            filter === key
                                                ? "text-stone-900 bg-white shadow-sm ring-1 ring-stone-200"
                                                : "text-stone-500 hover:text-stone-700"
                                        )}
                                    >
                                        {config.label}
                                        <span className="opacity-40">{planStats[key] || 0}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Right: Actions & View */}
                        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
                            {/* Credits Warning */}
                            {!hasCredits && (
                                <Link href="/pricing" className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 hover:bg-red-100/50 transition-colors">
                                    <Lock className="w-3 h-3" />
                                    <span>Top up</span>
                                </Link>
                            )}

                            {/* View Switcher */}
                            <div className="flex items-center p-1 bg-stone-100/50 border border-stone-200/50 rounded-xl">
                                <button
                                    onClick={() => setViewMode("strategy")}
                                    className={cn(
                                        "cursor-pointer p-1.5 rounded-lg transition-all",
                                        viewMode === "strategy"
                                            ? "bg-white text-stone-900 shadow-sm ring-1 ring-stone-200"
                                            : "text-stone-400 hover:text-stone-600"
                                    )}
                                    title="List View"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("calendar")}
                                    className={cn(
                                        "cursor-pointer p-1.5 rounded-lg transition-all",
                                        viewMode === "calendar"
                                            ? "bg-white text-stone-900 shadow-sm ring-1 ring-stone-200"
                                            : "text-stone-400 hover:text-stone-600"
                                    )}
                                    title="Calendar View"
                                >
                                    <CalendarIcon className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Auto-Refill Button (Clean) */}
                            {plan && (
                                <Button
                                    onClick={handleToggleAutomation}
                                    disabled={automationLoading || (!hasCredits && plan.automation_status !== "active")}
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        "h-9 px-4 text-[11px] font-bold border-stone-200 hover:bg-stone-50 hover:text-stone-900 transition-all rounded-lg",
                                        plan.automation_status === "active" && "bg-stone-50 border-stone-300"
                                    )}
                                >
                                    {automationLoading ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                                            {plan.automation_status === "active" ? "Disabling..." : "Enabling..."}
                                        </>
                                    ) : plan.automation_status === "active" ? (
                                        <>
                                            <span className="relative flex h-2 w-2 mr-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            Automation On
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-3.5 h-3.5 mr-2" />
                                            Auto-Refill
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
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
                            {viewMode === "strategy" ? (
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
                                                {/* Section Header */}
                                                <div className="flex items-start justify-between gap-4 mb-6 mt-2 px-1">
                                                    <div className="flex gap-3">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 border",
                                                            categoryConfig.bgColor,
                                                            categoryConfig.color
                                                        )}>
                                                            <CategoryIcon className="w-4 h-4" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h2 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
                                                                {categoryConfig.label}
                                                            </h2>
                                                            <p className="text-[11px] text-stone-500 max-w-md leading-relaxed">
                                                                <span className="font-semibold text-stone-400">Why: </span>
                                                                {categoryConfig.tagline}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "text-[10px] font-bold px-2 py-1 rounded-md bg-stone-100/50 text-stone-400 border border-stone-100/50"
                                                        )}>
                                                            {completedCount} / {categoryConfig.targetCount} Published
                                                        </div>
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
                            ) : (
                                <div className="px-2">
                                    <CalendarView
                                        items={filteredPlan}
                                        onItemClick={(item) => setSelectedItem(item)}
                                    />
                                </div>
                            )}

                            {/* --- Article Detail Sheet --- */}
                            <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                                <SheetContent className="sm:max-w-md border-l border-stone-200 p-0 overflow-y-auto">
                                    {selectedItem && (
                                        <div className="flex flex-col h-full">
                                            <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                                                <SheetHeader className="space-y-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm",
                                                            selectedItem.status === 'published' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                                selectedItem.status === 'writing' ? "bg-blue-50 text-blue-700 border-blue-100 animate-pulse" :
                                                                    "bg-stone-50 border border-stone-200 text-stone-600 font-bold"
                                                        )}>
                                                            {selectedItem.status === 'pending' ? 'Planned Article' : selectedItem.status}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200/50">
                                                            {new Date(selectedItem.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <SheetTitle className="text-xl font-bold text-stone-900 leading-tight">
                                                        {selectedItem.title}
                                                    </SheetTitle>
                                                    <SheetDescription className="text-stone-500 italic text-xs leading-relaxed">
                                                        {selectedItem.reason}
                                                    </SheetDescription>
                                                </SheetHeader>
                                            </div>

                                            <div className="p-6 space-y-8">
                                                {/* Core Strategy */}
                                                <div className="space-y-4">
                                                    <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Target className="w-3 h-3" />
                                                        Strategic Foundation
                                                    </h3>
                                                    <div className={cn("grid gap-3", (selectedItem.gsc_impressions ?? 0) > 0 ? "grid-cols-2" : "grid-cols-1")}>
                                                        {/* Impact - Only show if we have real GSC data */}
                                                        {(selectedItem.gsc_impressions ?? 0) > 0 && (
                                                            <div className="p-3 rounded-xl border border-stone-100 bg-white shadow-sm">
                                                                <p className="text-[10px] text-stone-400 font-medium mb-1">Impact</p>
                                                                <p className="text-sm font-bold text-stone-900">{selectedItem.impact || 'Medium'}</p>
                                                            </div>
                                                        )}
                                                        <div className="p-3 rounded-xl border border-stone-100 bg-white shadow-sm">
                                                            <p className="text-[10px] text-stone-400 font-medium mb-1">Category</p>
                                                            <p className="text-sm font-bold text-stone-900">{selectedItem.article_category || 'General'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* SEO Data - Only show if we have REAL GSC data (impressions > 0) */}
                                                {(selectedItem.gsc_impressions ?? 0) > 0 && (
                                                    <div className="space-y-4">
                                                        <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                                            <BarChart3 className="w-3 h-3" />
                                                            SEO Metrics
                                                        </h3>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                                                                <div className="flex items-center gap-2">
                                                                    <Search className="w-4 h-4 text-stone-400" />
                                                                    <span className="text-sm font-medium text-stone-700">Primary Keyword</span>
                                                                </div>
                                                                <span className="text-sm font-bold text-stone-900">{selectedItem.main_keyword}</span>
                                                            </div>

                                                            <div className="grid grid-cols-3 gap-3">
                                                                <div className="p-3 text-center">
                                                                    <p className="text-[10px] text-stone-400 font-medium mb-1">Impressions</p>
                                                                    <p className="text-sm font-bold text-stone-900">{selectedItem.gsc_impressions?.toLocaleString() || '-'}</p>
                                                                </div>
                                                                <div className="p-3 text-center">
                                                                    <p className="text-[10px] text-stone-400 font-medium mb-1">Current Pos</p>
                                                                    <p className="text-sm font-bold text-stone-900">{selectedItem.gsc_position?.toFixed(1) || '-'}</p>
                                                                </div>
                                                                <div className="p-3 text-center">
                                                                    <p className="text-[10px] text-stone-400 font-medium mb-1">CTR</p>
                                                                    <p className="text-sm font-bold text-stone-900">{selectedItem.gsc_ctr ? `${selectedItem.gsc_ctr.toFixed(1)}%` : '-'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Keywords */}
                                                <div className="space-y-4">
                                                    <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Tag className="w-3 h-3" />
                                                        Semantic Keywords
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedItem.supporting_keywords.map(kw => (
                                                            <span key={kw} className="px-2 py-1 rounded-md bg-stone-100 border border-stone-200 text-[11px] font-medium text-stone-600">
                                                                {kw}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-auto p-6 border-t border-stone-100 bg-white">
                                                <Button
                                                    onClick={() => {
                                                        setSelectedItem(null)
                                                        handleWriteArticle(selectedItem)
                                                    }}
                                                    disabled={!hasCredits || selectedItem.status === 'published'}
                                                    className="w-full h-12 rounded-xl bg-stone-900 text-white font-bold text-sm shadow-xl active:scale-[0.98] transition-all"
                                                >
                                                    {selectedItem.status === 'published' ? 'Article Published' :
                                                        selectedItem.status === 'writing' ? 'View Article' :
                                                            'Write Article Now'}
                                                </Button>
                                                <p className="text-center text-[10px] text-stone-400 mt-3 font-medium uppercase tracking-tight">
                                                    {hasCredits ? 'Cost: 1 Content Pass' : 'No Passes Available'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </SheetContent>
                            </Sheet>
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

