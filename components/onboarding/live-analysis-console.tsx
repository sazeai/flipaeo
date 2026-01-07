"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
    Search,
    Target,
    GitBranch,
    FileText,
    CheckCircle2,
    Loader2,
    AlertCircle,
    TrendingUp,
    Ban,
    Zap,
    Users
} from "lucide-react"
import { BrandDetails } from "@/lib/schemas/brand"
import { ContentPlanItem } from "@/lib/schemas/content-plan"
import { PlanStreamEvent, PlanPhase, PHASE_LABELS } from "@/lib/plans/stream-types"

interface LiveAnalysisConsoleProps {
    brandData: BrandDetails
    seeds: string[]
    brandId: string | null
    existingContent?: string[]
    competitorBrands?: Array<{ name: string; url?: string }>
    onComplete: (data: { plan: ContentPlanItem[], gapAnalysis: any }) => void
    onError: (message: string) => void
}

interface PhaseState {
    status: 'pending' | 'active' | 'complete'
    data: any
}

interface LogEntry {
    id: string
    type: 'info' | 'success' | 'warning' | 'highlight'
    message: string
    timestamp: Date
}

export function LiveAnalysisConsole({
    brandData,
    seeds,
    brandId,
    existingContent,
    competitorBrands,
    onComplete,
    onError
}: LiveAnalysisConsoleProps) {
    const [phases, setPhases] = useState<Record<PlanPhase, PhaseState>>({
        serp: { status: 'pending', data: {} },
        gap: { status: 'pending', data: {} },
        hierarchy: { status: 'pending', data: {} },
        plan: { status: 'pending', data: {} }
    })
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [currentPhase, setCurrentPhase] = useState<PlanPhase | null>(null)
    const [isStreaming, setIsStreaming] = useState(false)
    const logsEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    // Add log entry
    const addLog = (type: LogEntry['type'], message: string) => {
        setLogs(prev => [...prev, {
            id: `${Date.now()}-${Math.random()}`,
            type,
            message,
            timestamp: new Date()
        }])
    }

    // Start streaming on mount
    useEffect(() => {
        if (isStreaming) return
        setIsStreaming(true)
        startStream()
    }, [])

    const startStream = async () => {
        try {
            addLog('info', 'Initializing strategic analysis...')

            const response = await fetch('/api/generate-content-plan-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    seeds,
                    brandData,
                    brandId,
                    existingContent,
                    competitorBrands
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to start analysis')
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error('No response body')

            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const event: PlanStreamEvent = JSON.parse(line.slice(6))
                            handleEvent(event)
                        } catch (e) {
                            console.error('Failed to parse SSE event:', e)
                        }
                    }
                }
            }
        } catch (error: any) {
            console.error('Stream error:', error)
            addLog('warning', `Error: ${error.message}`)
            onError(error.message)
        }
    }

    const handleEvent = (event: PlanStreamEvent) => {
        switch (event.type) {
            case 'phase_start':
                setCurrentPhase(event.data.phase)
                setPhases(prev => ({
                    ...prev,
                    [event.data.phase]: { status: 'active', data: {} }
                }))
                addLog('info', event.data.message)
                break

            case 'phase_complete':
                setPhases(prev => ({
                    ...prev,
                    [event.data.phase]: { status: 'complete', data: event.data }
                }))
                addLog('success', `${PHASE_LABELS[event.data.phase as PlanPhase]} complete`)
                break

            case 'serp_analyzing_seed':
                addLog('info', event.data.message)
                break

            case 'serp_seed_complete':
                addLog('success', `"${event.data.seed}" analyzed — ${event.data.coverage} coverage`)
                break

            case 'serp_competitor_found':
                addLog('highlight', `Competitor found: ${event.data.name}`)
                break

            case 'gap_analysis_start':
                addLog('info', event.data.message)
                break

            case 'gap_blue_ocean':
                addLog('highlight', `🔵 ${event.data.count} blue ocean opportunities found!`)
                event.data.topics.slice(0, 2).forEach((topic: string) => {
                    addLog('success', `  → ${topic}`)
                })
                break

            case 'gap_saturated':
                addLog('warning', `⚠️ ${event.data.count} saturated topics to avoid`)
                break

            case 'gap_weakness':
                addLog('highlight', `💪 ${event.data.count} competitor weaknesses found`)
                break

            case 'gap_opportunity':
                addLog('success', `  ★ ${event.data.topic} (${event.data.priority})`)
                break

            case 'hierarchy_building':
                addLog('info', event.data.message)
                break

            case 'hierarchy_level_complete':
                addLog('success', `${event.data.level.toUpperCase()}: ${event.data.count} topics mapped`)
                break

            case 'plan_generating':
                addLog('info', event.data.message)
                break

            case 'plan_article_added':
                addLog('success', `  Day ${event.data.day}: ${event.data.title}`)
                break

            case 'complete':
                addLog('highlight', `✨ Your 30-day content plan is ready!`)
                setTimeout(() => {
                    onComplete({
                        plan: event.data.plan,
                        gapAnalysis: event.data.gapAnalysis
                    })
                }, 1500) // Short delay for user to see completion
                break

            case 'error':
                addLog('warning', event.data.message)
                onError(event.data.message)
                break
        }
    }

    const PhaseIndicator = ({ phase, label, icon: Icon }: {
        phase: PlanPhase,
        label: string,
        icon: React.ElementType
    }) => {
        const state = phases[phase]
        return (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${state.status === 'active'
                    ? 'bg-stone-900 text-white'
                    : state.status === 'complete'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-stone-100 text-stone-400'
                }`}>
                {state.status === 'active' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : state.status === 'complete' ? (
                    <CheckCircle2 className="w-4 h-4" />
                ) : (
                    <Icon className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">{label}</span>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Phase Progress */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <PhaseIndicator phase="serp" label="SERP Intel" icon={Search} />
                <div className="w-4 h-px bg-stone-200 hidden sm:block" />
                <PhaseIndicator phase="gap" label="Gap Analysis" icon={Target} />
                <div className="w-4 h-px bg-stone-200 hidden sm:block" />
                <PhaseIndicator phase="hierarchy" label="Hierarchy" icon={GitBranch} />
                <div className="w-4 h-px bg-stone-200 hidden sm:block" />
                <PhaseIndicator phase="plan" label="Plan" icon={FileText} />
            </div>

            {/* Live Console */}
            <div className="bg-stone-950 rounded-lg border border-stone-800 overflow-hidden">
                {/* Console Header */}
                <div className="flex items-center gap-2 px-4 py-2 bg-stone-900 border-b border-stone-800">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-stone-400 text-xs font-mono ml-2">
                        Strategic Analysis Console
                    </span>
                    {isStreaming && (
                        <span className="ml-auto flex items-center gap-1.5 text-green-400 text-xs">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            LIVE
                        </span>
                    )}
                </div>

                {/* Console Content */}
                <div className="h-64 overflow-y-auto p-4 font-mono text-sm">
                    <AnimatePresence mode="popLayout">
                        {logs.map((log) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`flex items-start gap-2 mb-1 ${log.type === 'success' ? 'text-green-400' :
                                        log.type === 'warning' ? 'text-amber-400' :
                                            log.type === 'highlight' ? 'text-cyan-400' :
                                                'text-stone-400'
                                    }`}
                            >
                                <span className="text-stone-600 text-xs w-16 flex-shrink-0">
                                    {log.timestamp.toLocaleTimeString('en-US', {
                                        hour12: false,
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })}
                                </span>
                                <span className="break-words">{log.message}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={logsEndRef} />
                </div>
            </div>

            {/* Stats Summary (shown as phases complete) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {phases.serp.status === 'complete' && phases.serp.data.competitors && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-stone-50 border border-stone-200 rounded-lg p-3"
                    >
                        <div className="flex items-center gap-2 text-stone-600 mb-1">
                            <Users className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Competitors</span>
                        </div>
                        <div className="text-lg font-bold text-stone-900">
                            {phases.serp.data.competitors.length}
                        </div>
                    </motion.div>
                )}

                {phases.gap.status === 'complete' && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                        >
                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">Blue Ocean</span>
                            </div>
                            <div className="text-lg font-bold text-blue-900">
                                {phases.gap.data.blueOcean || 0}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-amber-50 border border-amber-200 rounded-lg p-3"
                        >
                            <div className="flex items-center gap-2 text-amber-600 mb-1">
                                <Ban className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">Saturated</span>
                            </div>
                            <div className="text-lg font-bold text-amber-900">
                                {phases.gap.data.saturated || 0}
                            </div>
                        </motion.div>
                    </>
                )}

                {phases.plan.status === 'complete' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-50 border border-green-200 rounded-lg p-3"
                    >
                        <div className="flex items-center gap-2 text-green-600 mb-1">
                            <Zap className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Articles</span>
                        </div>
                        <div className="text-lg font-bold text-green-900">
                            {phases.plan.data.totalArticles || 30}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
