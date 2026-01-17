"use client"

import { useState, useEffect } from "react"
import { BarChart3, Globe, Link2, Shield, TrendingUp, AlertTriangle, Zap, ChevronRight, RefreshCw, Smartphone, Monitor, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GlobalCard } from "@/components/ui/global-card"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface SEOMetrics {
    id: string
    domain_authority: number
    page_authority: number
    external_links: number
    linking_root_domains: number
    // Desktop PageSpeed
    performance_desktop: number
    accessibility_desktop: number
    best_practices_desktop: number
    seo_desktop: number
    lcp_desktop: number
    cls_desktop: number
    tbt_desktop: number
    fcp_desktop: number
    recommendations_desktop: any[]
    // Mobile PageSpeed
    performance_mobile: number
    accessibility_mobile: number
    best_practices_mobile: number
    seo_mobile: number
    lcp_mobile: number
    cls_mobile: number
    tbt_mobile: number
    fcp_mobile: number
    recommendations_mobile: any[]
    fetched_at: string
    // Status tracking for background jobs
    status?: 'pending' | 'running' | 'completed' | 'failed'
    error_message?: string
}

interface SEOMetricsDashboardProps {
    domain: string
    brandId?: string
}

// Premium Stone Card Wrapper
function StoneCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`relative p-1 bg-stone-100 rounded-[20px] shadow-sm ${className}`}>
            <div className="bg-white border border-stone-200/60 rounded-[16px] overflow-hidden h-full transition-all">
                {children}
            </div>
        </div>
    )
}

function MetricCard({ title, value, label, icon: Icon, colorClass = "text-stone-900", chartType = "gauge", numericValue = 0 }: {
    title: string,
    value: string | number | null,
    label: string,
    icon: any,
    colorClass?: string,
    chartType?: "gauge" | "bars" | "line" | "target",
    numericValue?: number
}) {
    // Mini visualization based on chart type
    const renderMiniChart = () => {
        const normalizedValue = Math.min(100, Math.max(0, numericValue))

        switch (chartType) {
            case "gauge":
                // Semi-circle gauge with needle for DA
                const needleAngle = -90 + (normalizedValue / 100) * 180 // -90 to 90 degrees
                const gaugeColor = normalizedValue > 40 ? "#22c55e" : normalizedValue > 20 ? "#f59e0b" : "#ef4444"
                return (
                    <svg width="52" height="32" viewBox="0 0 52 32" className="overflow-visible">
                        {/* Background arc */}
                        <defs>
                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ef4444" />
                                <stop offset="50%" stopColor="#f59e0b" />
                                <stop offset="100%" stopColor="#22c55e" />
                            </linearGradient>
                        </defs>
                        <path d="M6 26 A20 20 0 0 1 46 26" fill="none" stroke="#e7e5e4" strokeWidth="5" strokeLinecap="round" />
                        {/* Colored arc */}
                        <path
                            d="M6 26 A20 20 0 0 1 46 26"
                            fill="none"
                            stroke="url(#gaugeGradient)"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={`${(normalizedValue / 100) * 63} 63`}
                        />
                        {/* Needle */}
                        <g transform={`rotate(${needleAngle}, 26, 26)`}>
                            <line x1="26" y1="26" x2="26" y2="10" stroke={gaugeColor} strokeWidth="2" strokeLinecap="round" />
                            <circle cx="26" cy="26" r="3" fill={gaugeColor} />
                        </g>
                    </svg>
                )
            case "bars":
                // Mini bar chart for backlinks
                const bars = [0.3, 0.5, 0.7, 0.4, 0.8, 0.6, 0.9].map(h => Math.min(1, h * (numericValue > 0 ? 1 : 0.3)))
                return (
                    <div className="flex items-end gap-[2px] h-6">
                        {bars.map((h, i) => (
                            <div
                                key={i}
                                className="w-1 rounded-full bg-emerald-500"
                                style={{ height: `${h * 100}%`, opacity: numericValue > 0 ? 1 : 0.3 }}
                            />
                        ))}
                    </div>
                )
            case "line":
                // Wavy trend line for ref domains
                return (
                    <svg width="48" height="24" viewBox="0 0 48 24" className="text-blue-500">
                        <path
                            d="M2 18 Q8 8 14 12 T26 8 T38 14 T46 6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            opacity={numericValue > 0 ? 1 : 0.3}
                        />
                    </svg>
                )
            case "target":
                // Mini ring showing PA out of 100
                const ringRadius = 12
                const ringCircumference = 2 * Math.PI * ringRadius
                const ringOffset = ringCircumference - (normalizedValue / 100) * ringCircumference
                const ringColor = normalizedValue > 40 ? "#22c55e" : normalizedValue > 20 ? "#f59e0b" : "#ef4444"
                return (
                    <svg width="32" height="32" viewBox="0 0 32 32" className="overflow-visible">
                        {/* Background ring */}
                        <circle cx="16" cy="16" r={ringRadius} fill="none" stroke="#e7e5e4" strokeWidth="4" />
                        {/* Progress ring */}
                        <circle
                            cx="16" cy="16" r={ringRadius}
                            fill="none"
                            stroke={ringColor}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={ringCircumference}
                            strokeDashoffset={ringOffset}
                            transform="rotate(-90 16 16)"
                        />
                        {/* Center text showing value */}
                        <text x="16" y="16" textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="bold" fill={ringColor}>
                            {normalizedValue}
                        </text>
                    </svg>
                )
            default:
                return <Icon className="w-4 h-4 text-stone-400" />
        }
    }

    return (
        <StoneCard>
            <div className="p-5 flex flex-col justify-between h-full min-h-[140px]">
                <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{title}</span>
                    <div className="p-2 bg-stone-50 rounded-lg flex items-center justify-center">
                        {renderMiniChart()}
                    </div>
                </div>
                <div>
                    <div className={`text-4xl font-bold tracking-tighter mb-1 ${colorClass}`}>
                        {value ?? "-"}
                    </div>
                    <div className="text-[11px] font-medium text-stone-400">{label}</div>
                </div>
            </div>
        </StoneCard>
    )
}

function ScoreRing({ score, label }: { score: number | null, label: string }) {
    const actualScore = score || 0
    const radius = 40
    const strokeWidth = 8
    const size = 100
    const center = size / 2
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (actualScore / 100) * circumference

    // Determine color scheme
    let gradientId = "redGradient"
    let shadowColor = "rgba(239, 68, 68, 0.2)"
    let textColor = "text-red-600"

    if (actualScore >= 90) {
        gradientId = "greenGradient"
        shadowColor = "rgba(34, 197, 94, 0.2)"
        textColor = "text-emerald-600"
    } else if (actualScore >= 50) {
        gradientId = "amberGradient"
        shadowColor = "rgba(245, 158, 11, 0.2)"
        textColor = "text-amber-600"
    }

    if (!score) {
        gradientId = "grayGradient"
        shadowColor = "rgba(120, 113, 108, 0.1)"
        textColor = "text-stone-400"
    }

    return (
        <div className="flex flex-col items-center gap-4 group cursor-default">
            <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                {/* Glow Effect Background */}
                <div
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at center, ${shadowColor} 0%, transparent 70%)` }}
                />

                <svg width={size} height={size} className="transform -rotate-90 relative z-10 overflow-visible">
                    <defs>
                        <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22c55e" />
                            <stop offset="100%" stopColor="#86efac" />
                        </linearGradient>
                        <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#fcd34d" />
                        </linearGradient>
                        <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="100%" stopColor="#fca5a5" />
                        </linearGradient>
                        <linearGradient id="grayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#e7e5e4" />
                            <stop offset="100%" stopColor="#d6d3d1" />
                        </linearGradient>
                    </defs>

                    {/* Background Ring */}
                    <circle
                        cx={center} cy={center} r={radius}
                        className="stroke-stone-100"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />

                    {/* Progress Ring with Gradient & Shadow */}
                    <circle
                        cx={center} cy={center} r={radius}
                        stroke={`url(#${gradientId})`}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                        style={{ filter: `drop-shadow(0px 2px 4px ${shadowColor})` }}
                    />
                </svg>

                {/* Center Score */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold tracking-tighter ${textColor}`}>
                        {score ?? "-"}
                    </span>
                </div>
            </div>

            {/* Label */}
            <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">{label}</span>
        </div>
    )
}

function CWVCard({ label, value, unit, status }: { label: string, value: string, unit: string, status: { label: string, color: string } }) {
    return (
        <div className="p-4 bg-stone-50/50 rounded-xl border border-stone-100 h-full flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${status.color}`} />
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">{status.label}</span>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-2xl font-bold text-stone-900">{value}</span>
                    <span className="text-xs font-medium text-stone-400">{unit}</span>
                </div>
            </div>
            <div className="text-[11px] font-medium text-stone-500 mt-2">{label}</div>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="space-y-8 animate-pulse max-w-5xl mx-auto w-full">
            <div className="h-20 w-full bg-stone-100 rounded-xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-stone-100 rounded-xl" />)}
            </div>
            <div className="h-96 bg-stone-100 rounded-xl" />
        </div>
    )
}

export function SEOMetricsDashboard({ domain, brandId }: SEOMetricsDashboardProps) {
    const [analyzing, setAnalyzing] = useState(false)
    const [metrics, setMetrics] = useState<SEOMetrics | null>(null)
    const [device, setDevice] = useState<"mobile" | "desktop">("desktop")
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState("")
    const [jobStatus, setJobStatus] = useState<'pending' | 'running' | 'completed' | 'failed' | null>(null)

    // Fetch metrics and check for running jobs
    const fetchMetrics = async () => {
        try {
            const res = await fetch(`/api/seo-metrics?domain=${domain}&brandId=${brandId}`)
            if (res.ok) {
                const data = await res.json()
                if (data && data.metrics) {
                    setMetrics(data.metrics)
                    setJobStatus(data.status || 'completed')

                    // If job completed, stop analyzing state
                    if (data.status === 'completed') {
                        setAnalyzing(false)
                        setRefreshing(false)
                    }

                    // If job failed, show error
                    if (data.status === 'failed') {
                        setError(data.error_message || 'Analysis failed')
                        setAnalyzing(false)
                        setRefreshing(false)
                    }

                    return data.status
                }
            }
        } catch (e) {
            console.error("Failed to load metrics", e)
        }
        return null
    }

    // Initial load
    useEffect(() => {
        if (!brandId) return

        async function checkData() {
            setLoading(true)
            const status = await fetchMetrics()
            // If job is running/pending, start polling
            if (status === 'running' || status === 'pending') {
                setAnalyzing(true)
            }
            setLoading(false)
        }
        checkData()
    }, [brandId, domain])

    // Polling effect - poll every 10 seconds while job is running
    useEffect(() => {
        if (!analyzing || !brandId) return

        const interval = setInterval(async () => {
            const status = await fetchMetrics()
            if (status === 'completed' || status === 'failed') {
                clearInterval(interval)
            }
        }, 10000)

        return () => clearInterval(interval)
    }, [analyzing, brandId, domain])

    // Refresh PageSpeed for specific device
    const handleRefresh = async (strategy?: 'mobile' | 'desktop') => {
        setRefreshing(true)
        setAnalyzing(true)
        setError("")
        try {
            const res = await fetch("/api/seo-metrics/fetch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    domain,
                    brandId,
                    force: true,
                    refreshStrategy: strategy || device
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Refresh failed")

            // If cached data returned, update immediately
            if (data.cached && data.metrics) {
                setMetrics(data.metrics)
                setRefreshing(false)
                setAnalyzing(false)
                toast.success(`${strategy || device} metrics updated!`)
            } else if (data.triggered) {
                // Job triggered, polling will handle the rest
                toast.info("Analysis started in background...")
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to update metrics")
            setRefreshing(false)
            setAnalyzing(false)
        }
    }

    // Full analysis (fetches both mobile + desktop)
    const handleAnalyze = async () => {
        setAnalyzing(true)
        setError("")
        try {
            const res = await fetch("/api/seo-metrics/fetch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ domain, brandId })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Analysis failed")

            // If cached data returned, update immediately
            if (data.cached && data.metrics) {
                setMetrics(data.metrics)
                setAnalyzing(false)
                toast.success("Analysis complete!")
            } else if (data.triggered) {
                // Job triggered, polling will handle the rest
                toast.info("Analysis started in background. This may take 1-2 minutes...")
            }
        } catch (err: any) {
            setError(err.message)
            toast.error("Failed to analyze site")
            setAnalyzing(false)
        }
    }

    const getCWVStatus = (val: number | null, good: number, poor: number) => {
        if (val === null || val === undefined) return { label: "No Data", color: "bg-stone-300" }
        if (val <= good) return { label: "Good", color: "bg-emerald-500" }
        if (val >= poor) return { label: "Poor", color: "bg-red-500" }
        return { label: "Needs Improvement", color: "bg-amber-500" }
    }

    // Get device-specific values (instant - no API call)
    const getPerf = (key: string) => {
        if (!metrics) return null
        const suffix = device === 'mobile' ? '_mobile' : '_desktop'
        return (metrics as any)[key + suffix]
    }

    const getRecommendations = () => {
        if (!metrics) return []
        return device === 'mobile' ? metrics.recommendations_mobile : metrics.recommendations_desktop
    }

    if (loading) return <LoadingSkeleton />

    // EMPTY STATE - Modern Card Design
    if (!metrics) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <GlobalCard className="w-full max-w-2xl bg-stone-100 rounded-lg">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-br from-stone-50 to-stone-100 px-8 py-10 text-center border-b border-stone-200 rounded-t-lg">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-stone-900 mb-5">
                            <BarChart3 className="h-7 w-7 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-stone-900 mb-2">SEO Health Check</h2>
                        <p className="text-stone-500 text-sm max-w-sm mx-auto">
                            Get a comprehensive SEO report for <span className="font-medium text-stone-700">{domain}</span>
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-2 divide-x divide-stone-100">
                        <div className="p-6 text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-stone-100 mb-3 border border-stone-200">
                                <TrendingUp className="h-5 w-5 text-stone-600" />
                            </div>
                            <h4 className="font-semibold text-stone-900 text-sm mb-1">Domain Authority</h4>
                            <p className="text-xs text-stone-400">Moz DA & PA scores</p>
                        </div>
                        <div className="p-6 text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-stone-100 mb-3 border border-stone-200">
                                <Link2 className="h-5 w-5 text-stone-600" />
                            </div>
                            <h4 className="font-semibold text-stone-900 text-sm mb-1">Backlink Profile</h4>
                            <p className="text-xs text-stone-400">Links & ref domains</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 divide-x divide-stone-100 border-t border-stone-100">
                        <div className="p-6 text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-stone-100 mb-3 border border-stone-200">
                                <Zap className="h-5 w-5 text-stone-600" />
                            </div>
                            <h4 className="font-semibold text-stone-900 text-sm mb-1">Core Web Vitals</h4>
                            <p className="text-xs text-stone-400">LCP, CLS, TBT, FCP</p>
                        </div>
                        <div className="p-6 text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-stone-100 mb-3 border border-stone-200">
                                <Monitor className="h-5 w-5 text-stone-600" />
                            </div>
                            <h4 className="font-semibold text-stone-900 text-sm mb-1">Mobile & Desktop</h4>
                            <p className="text-xs text-stone-400">Both strategies tested</p>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mx-6 mt-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="p-6 bg-stone-50/50">
                        <Button
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="w-full py-6 text-base bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg transition-all"
                        >
                            {analyzing ? (
                                <><Loader2 className="h-5 w-5 mr-3 animate-spin" /> Analyzing...</>
                            ) : (
                                <>Start Analysis</>
                            )}
                        </Button>

                    </div>
                </GlobalCard>
            </div>
        )
    }

    // DASHBOARD STATE
    return (
        <div className="space-y-8 w-full mx-auto pb-20 fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-stone-100">
                <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-xl bg-white border border-stone-200 shadow-xs flex items-center justify-center overflow-hidden">
                        <img
                            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                            alt={domain}
                            className="w-10 h-10"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = `<span class="text-2xl font-bold text-stone-900">${domain.charAt(0).toUpperCase()}</span>`;
                            }}
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">{domain}</h1>
                        <div className="flex items-center gap-2.5 mt-1">
                            <Badge variant="secondary" className="bg-stone-100 text-stone-500 hover:bg-stone-100 border-stone-200 rounded-md px-2 font-medium text-[11px] uppercase tracking-wider">
                                SEO Report
                            </Badge>
                            <span className="text-[11px] font-medium text-stone-400 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-stone-300" />
                                {formatDistanceToNow(new Date(metrics.fetched_at))} ago
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Metrics Grid (Moz - shared) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Domain Rating"
                    value={metrics.domain_authority}
                    label="Moz Authority"
                    icon={TrendingUp}
                    colorClass={metrics.domain_authority ? (metrics.domain_authority > 40 ? "text-emerald-600" : metrics.domain_authority > 20 ? "text-amber-600" : "text-stone-900") : "text-stone-900"}
                    chartType="gauge"
                    numericValue={metrics.domain_authority || 0}
                />
                <MetricCard
                    title="Backlinks"
                    value={metrics.external_links !== null ? Intl.NumberFormat('en', { notation: "compact" }).format(metrics.external_links) : "-"}
                    label="Total Links"
                    icon={Link2}
                    chartType="bars"
                    numericValue={metrics.external_links || 0}
                />
                <MetricCard
                    title="Ref. Domains"
                    value={metrics.linking_root_domains !== null ? Intl.NumberFormat('en', { notation: "compact" }).format(metrics.linking_root_domains) : "-"}
                    label="Unique Domains"
                    icon={Globe}
                    chartType="line"
                    numericValue={metrics.linking_root_domains || 0}
                />
                <MetricCard
                    title="Page Authority"
                    value={metrics.page_authority}
                    label="Moz PA Score"
                    icon={Shield}
                    colorClass={metrics.page_authority ? (metrics.page_authority > 40 ? "text-emerald-600" : metrics.page_authority > 20 ? "text-amber-600" : "text-stone-900") : "text-stone-900"}
                    chartType="target"
                    numericValue={metrics.page_authority || 0}
                />
            </div>

            {/* Performance Section */}
            <StoneCard>
                <div className="p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-stone-900" />
                            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Performance</h3>
                            <button
                                onClick={() => handleRefresh(device)}
                                disabled={refreshing}
                                className="cursor-pointer ml-2 p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-50"
                                title={`Refresh ${device} data`}
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                            </button>
                        </div>
                        <div className="bg-stone-50 p-1 rounded-xl border border-stone-100 flex items-center gap-1">
                            <button
                                className={`cursor-pointer w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${device === 'mobile' ? 'bg-white text-stone-900 border border-stone-200' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'}`}
                                onClick={() => setDevice('mobile')}
                            >
                                <Smartphone className="w-3 h-3" /> Mobile
                            </button>
                            <button
                                className={`cursor-pointer w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${device === 'desktop' ? 'bg-white text-stone-900 border border-stone-200' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'}`}
                                onClick={() => setDevice('desktop')}
                            >
                                <Monitor className="w-3 h-3" /> Desktop
                            </button>
                        </div>
                    </div>

                    {/* Score Rings - Instant switch via getPerf() */}
                    <div className="flex flex-wrap justify-center sm:justify-around gap-y-10 gap-x-8 mb-12">
                        <ScoreRing score={getPerf('performance')} label="Performance" />
                        <ScoreRing score={getPerf('accessibility')} label="Accessibility" />
                        <ScoreRing score={getPerf('best_practices')} label="Best Practices" />
                        <ScoreRing score={getPerf('seo')} label="SEO" />
                    </div>

                    {/* Core Web Vitals */}
                    <div className="pt-8 border-t border-stone-100/60">
                        <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6">Core Web Vitals</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <CWVCard label="Largest Contentful Paint" value={`${getPerf('lcp') ?? '-'}`} unit="s" status={getCWVStatus(getPerf('lcp'), 2.5, 4.0)} />
                            <CWVCard label="Cumulative Layout Shift" value={`${getPerf('cls') ?? '-'}`} unit="" status={getCWVStatus(getPerf('cls'), 0.1, 0.25)} />
                            <CWVCard label="Total Blocking Time" value={`${getPerf('tbt') ?? '-'}`} unit="ms" status={getCWVStatus(getPerf('tbt'), 200, 600)} />
                            <CWVCard label="First Contentful Paint" value={`${getPerf('fcp') ?? '-'}`} unit="s" status={getCWVStatus(getPerf('fcp'), 1.8, 3.0)} />
                        </div>

                        {!getPerf('performance') && (
                            <div className="mt-6 flex items-center justify-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-100 border-dashed text-xs text-stone-400">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>No {device} data yet. Click refresh to fetch.</span>
                            </div>
                        )}
                    </div>
                </div>
            </StoneCard>

            {/* Recommendations */}
            {getRecommendations() && getRecommendations().length > 0 && (
                <StoneCard>
                    <div className="p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-[14px] bg-amber-50 flex items-center justify-center border border-amber-100">
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Opportunities</h3>
                                <div className="text-[11px] text-stone-400 font-medium">{getRecommendations().length} items to fix</div>
                            </div>
                        </div>
                        <div className="grid gap-3">
                            {getRecommendations().slice(0, 5).map((rec: any, i: number) => (
                                <div key={i} className="group relative p-5 bg-stone-50/40 hover:bg-stone-50 border border-stone-100 hover:border-stone-200 rounded-[16px] transition-all duration-300">
                                    <div className="flex justify-between gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2.5">
                                                <Badge variant="outline" className="bg-white text-stone-500 border-stone-200 text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 h-6">
                                                    {rec.category || "SEO"}
                                                </Badge>
                                                <h5 className="text-sm font-bold text-stone-900 line-clamp-1">{rec.title}</h5>
                                            </div>
                                            <p className="text-xs text-stone-500 pl-1 leading-relaxed max-w-2xl">{rec.description?.replace(/\[.*?\]\(.*?\)/g, '').substring(0, 140)}...</p>
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </StoneCard>
            )}

            <div className="h-10"></div>
        </div>
    )
}
