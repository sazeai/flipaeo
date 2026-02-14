"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
    Map,
    Search,
    BarChart3,
    Users,
    CheckCircle2,
    Loader2,
    Shield,
    AlertTriangle,
} from "lucide-react"
import { BrandDetails } from "@/lib/schemas/brand"
import { TopicalAuditResult } from "@/lib/audit/types"

interface AuditConsoleProps {
    brandData: BrandDetails
    brandId: string
    brandUrl: string
    onComplete: (auditResult: TopicalAuditResult) => void
    onError: (message: string) => void
}

type AuditPhase = "niche_mapping" | "user_scanning" | "competitor_scanning" | "scoring"

const PHASE_ORDER: AuditPhase[] = ["niche_mapping", "user_scanning", "competitor_scanning", "scoring"]

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

const PHASE_LABELS: Record<AuditPhase, string> = {
    niche_mapping: "Niche Mapping",
    user_scanning: "Site Analysis",
    competitor_scanning: "Competitor Analysis",
    scoring: "Authority Scoring"
}

const PHASE_MESSAGES: Record<AuditPhase, string> = {
    niche_mapping: "Mapping the topical authority requirements for your niche...",
    user_scanning: "Scanning your site coverage...",
    competitor_scanning: "Discovering and analyzing competitors...",
    scoring: "Calculating your Authority Score and identifying gaps..."
}

const PHASE_ICONS: Record<AuditPhase, React.ElementType> = {
    niche_mapping: Map,
    user_scanning: Search,
    competitor_scanning: Users,
    scoring: BarChart3
}

const POLL_INTERVAL = 3000 // 3 seconds

export function AuditConsole({
    brandData,
    brandId,
    brandUrl,
    onComplete,
    onError
}: AuditConsoleProps) {
    const [phases, setPhases] = useState<Record<AuditPhase, PhaseState>>({
        niche_mapping: { status: 'pending', data: {} },
        user_scanning: { status: 'pending', data: {} },
        competitor_scanning: { status: 'pending', data: {} },
        scoring: { status: 'pending', data: {} }
    })
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [isRunning, setIsRunning] = useState(false)
    const hasStartedRef = useRef(false)
    const lastPhaseRef = useRef<string | null>(null)
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const logsEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    const addLog = useCallback((type: LogEntry['type'], message: string) => {
        setLogs(prev => [...prev, {
            id: `${Date.now()}-${Math.random()}`,
            type,
            message,
            timestamp: new Date()
        }])
    }, [])

    // Update phase indicators based on current phase from server
    const updatePhasesFromServer = useCallback((currentPhase: string | null) => {
        if (!currentPhase) return

        setPhases(prev => {
            const updated = { ...prev }
            const currentIdx = PHASE_ORDER.indexOf(currentPhase as AuditPhase)

            for (let i = 0; i < PHASE_ORDER.length; i++) {
                const phase = PHASE_ORDER[i]
                if (i < currentIdx) {
                    updated[phase] = { ...updated[phase], status: 'complete' }
                } else if (i === currentIdx) {
                    updated[phase] = { ...updated[phase], status: 'active' }
                }
                // phases after current stay 'pending'
            }

            return updated
        })

        // Add log for new phase transitions
        if (currentPhase !== lastPhaseRef.current) {
            const phaseKey = currentPhase as AuditPhase
            if (phaseKey in PHASE_MESSAGES) {
                addLog('info', PHASE_MESSAGES[phaseKey])
            }
            lastPhaseRef.current = currentPhase
        }
    }, [addLog])

    // Poll the audit status
    const pollStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/topical-audit?brandId=${brandId}`)
            if (!res.ok) return

            const data = await res.json()

            if (data.status === "running") {
                updatePhasesFromServer(data.phase)

                // Update stats from partial data
                if (data.partial) {
                    setPhases(prev => {
                        const updated = { ...prev }
                        if (data.partial.topics_analyzed > 0 && prev.niche_mapping.status === 'complete') {
                            updated.niche_mapping = {
                                status: 'complete',
                                data: { topic_count: data.partial.topics_analyzed }
                            }
                        }
                        if (data.partial.user_pages_scanned > 0 && prev.user_scanning.status === 'complete') {
                            updated.user_scanning = {
                                status: 'complete',
                                data: { pages_analyzed: data.partial.user_pages_scanned }
                            }
                        }
                        if (data.partial.competitors_scanned > 0 && prev.competitor_scanning.status === 'complete') {
                            updated.competitor_scanning = {
                                status: 'complete',
                                data: { competitor_count: data.partial.competitors_scanned }
                            }
                        }
                        return updated
                    })
                }
            } else if (data.status === "completed" && data.audit) {
                // Mark all phases complete
                setPhases({
                    niche_mapping: { status: 'complete', data: { topic_count: data.partial?.topics_analyzed } },
                    user_scanning: { status: 'complete', data: { pages_analyzed: data.partial?.user_pages_scanned } },
                    competitor_scanning: { status: 'complete', data: { competitor_count: data.partial?.competitors_scanned } },
                    scoring: { status: 'complete', data: { authority_score: data.audit.authority_score } }
                })

                addLog('success', `Authority Score: ${data.audit.authority_score}/100`)
                addLog('highlight', `✨ Authority Audit Complete!`)

                setIsRunning(false)
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current)
                    pollIntervalRef.current = null
                }

                setTimeout(() => onComplete(data.audit), 1500)
            } else if (data.status === "failed") {
                addLog('warning', `Error: ${data.error || 'Audit failed'}`)
                setIsRunning(false)
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current)
                    pollIntervalRef.current = null
                }
                onError(data.error || 'Audit failed')
            }
        } catch (error) {
            console.error("Poll error:", error)
        }
    }, [brandId, addLog, updatePhasesFromServer, onComplete, onError])

    // Start the audit
    const startAudit = useCallback(async () => {
        try {
            addLog('info', 'Initializing topical authority audit...')
            addLog('info', `Auditing ${brandUrl}`)

            const response = await fetch('/api/topical-audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brandId, brandData, brandUrl })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                throw new Error(errorData.error || 'Audit failed to start')
            }

            const result = await response.json()

            if (result.status === "running") {
                setIsRunning(true)
                setPhases(prev => ({
                    ...prev,
                    niche_mapping: { status: 'active', data: {} }
                }))
                addLog('info', 'Audit task started. Monitoring progress...')
                lastPhaseRef.current = "niche_mapping"

                // Start polling
                pollIntervalRef.current = setInterval(pollStatus, POLL_INTERVAL)
            }
        } catch (error: any) {
            console.error('Audit start error:', error)
            addLog('warning', `Error: ${error.message}`)
            onError(error.message)
        }
    }, [brandId, brandData, brandUrl, addLog, onError, pollStatus])

    // Check for existing audit on mount, or start new one
    useEffect(() => {
        if (hasStartedRef.current) return
        hasStartedRef.current = true

        const checkExistingAudit = async () => {
            try {
                const res = await fetch(`/api/topical-audit?brandId=${brandId}`)
                if (!res.ok) {
                    startAudit()
                    return
                }

                const data = await res.json()

                if (data.status === "running") {
                    // Resume monitoring an already-running audit
                    addLog('info', 'Reconnecting to running audit...')
                    setIsRunning(true)
                    updatePhasesFromServer(data.phase)
                    pollIntervalRef.current = setInterval(pollStatus, POLL_INTERVAL)
                } else if (data.status === "completed" && data.audit) {
                    // Audit already done — show results immediately
                    addLog('highlight', '✨ Using existing audit results')
                    setPhases({
                        niche_mapping: { status: 'complete', data: { topic_count: data.partial?.topics_analyzed } },
                        user_scanning: { status: 'complete', data: { pages_analyzed: data.partial?.user_pages_scanned } },
                        competitor_scanning: { status: 'complete', data: { competitor_count: data.partial?.competitors_scanned } },
                        scoring: { status: 'complete', data: { authority_score: data.audit.authority_score } }
                    })
                    setTimeout(() => onComplete(data.audit), 500)
                } else {
                    // No audit exists or it failed — start a new one
                    startAudit()
                }
            } catch {
                startAudit()
            }
        }

        checkExistingAudit()

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
            }
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const PhaseIndicator = ({ phase }: { phase: AuditPhase }) => {
        const state = phases[phase]
        const Icon = PHASE_ICONS[phase]
        const label = PHASE_LABELS[phase]

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
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-stone-900">Topical Authority Audit</h3>
                    <p className="text-xs text-stone-500">Analyzing your niche coverage vs. competitors</p>
                </div>
            </div>

            {/* Phase Progress */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <PhaseIndicator phase="niche_mapping" />
                <div className="w-4 h-px bg-stone-200 hidden sm:block" />
                <PhaseIndicator phase="user_scanning" />
                <div className="w-4 h-px bg-stone-200 hidden sm:block" />
                <PhaseIndicator phase="competitor_scanning" />
                <div className="w-4 h-px bg-stone-200 hidden sm:block" />
                <PhaseIndicator phase="scoring" />
            </div>

            {/* Live Console */}
            <div className="bg-stone-950 rounded-lg border border-stone-800 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-stone-900 border-b border-stone-800">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-stone-400 text-xs font-mono ml-2">
                        Authority Audit Console
                    </span>
                    {isRunning && (
                        <span className="ml-auto flex items-center gap-1.5 text-red-400 text-xs">
                            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                            AUDITING
                        </span>
                    )}
                </div>

                <div className="h-72 overflow-y-auto p-4 font-mono text-sm">
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

            {/* Live Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {phases.niche_mapping.status === 'complete' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                    >
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Required Topics</span>
                        </div>
                        <div className="text-lg font-bold text-blue-900">
                            {phases.niche_mapping.data?.topic_count || '—'}
                        </div>
                    </motion.div>
                )}

                {phases.user_scanning.status === 'complete' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-stone-50 border border-stone-200 rounded-lg p-3"
                    >
                        <div className="flex items-center gap-2 text-stone-600 mb-1">
                            <Search className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Your Pages</span>
                        </div>
                        <div className="text-lg font-bold text-stone-900">
                            {phases.user_scanning.data?.pages_analyzed || '—'}
                        </div>
                    </motion.div>
                )}

                {phases.competitor_scanning.status === 'complete' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-purple-50 border border-purple-200 rounded-lg p-3"
                    >
                        <div className="flex items-center gap-2 text-purple-600 mb-1">
                            <Users className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Competitors</span>
                        </div>
                        <div className="text-lg font-bold text-purple-900">
                            {phases.competitor_scanning.data?.competitor_count || '—'}
                        </div>
                    </motion.div>
                )}

                {phases.scoring.status === 'complete' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 rounded-lg p-3"
                    >
                        <div className="flex items-center gap-2 text-red-600 mb-1">
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">Authority Score</span>
                        </div>
                        <div className="text-lg font-bold text-red-900">
                            {phases.scoring.data?.authority_score || '—'}/100
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
