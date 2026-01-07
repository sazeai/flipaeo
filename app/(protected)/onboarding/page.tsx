"use client"

import Image from "next/image"
import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { Loader2, ChevronUp, ArrowRight, Globe, BadgeCheck, Calendar, TrendingUp, ExternalLink, Shield, CheckCircle2, Users, Sparkles, Zap, Target, Lock, Ban, Trash2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { saveBrandAction } from "@/actions/brand"
import { canAccessOnboarding } from "@/actions/onboarding"
import { BrandDetails } from "@/lib/schemas/brand"
import { ContentPlanItem, CompetitorData } from "@/lib/schemas/content-plan"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { CustomSpinner } from "@/components/CustomSpinner"

// localStorage keys for persistence
const STORAGE_KEYS = {
    STEP: 'onboarding_step',
    BRAND_URL: 'onboarding_brand_url',
    BRAND_DATA: 'onboarding_brand_data',
    BRAND_ID: 'onboarding_brand_id',
    COMPETITORS: 'onboarding_competitors',
    COMPETITOR_SEEDS: 'onboarding_competitor_seeds',
    CONTENT_PLAN: 'onboarding_content_plan',
    PLAN_ID: 'onboarding_plan_id',
} as const

// Simplified flow: brand → competitors (auto-redirects to /content-plan)
type Step = "brand" | "competitors"

// GSC integration moved to settings page

export default function OnboardingPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const [isHydrated, setIsHydrated] = useState(false)
    const [isCheckingAccess, setIsCheckingAccess] = useState(true)
    const [step, setStep] = useState<Step>("brand")

    // Gate check: redirect if user already has a brand
    useEffect(() => {
        async function checkOnboardingAccess() {
            // Pass current step to allow GSC flow steps
            const urlStep = searchParams.get('step')
            const { allowed, redirectTo } = await canAccessOnboarding(urlStep || undefined)
            if (!allowed && redirectTo) {
                router.replace(redirectTo)
                return
            }
            setIsCheckingAccess(false)
        }
        checkOnboardingAccess()
    }, [router, searchParams])

    // Brand DNA State
    const [url, setUrl] = useState("")
    const [analyzing, setAnalyzing] = useState(false)
    const [brandData, setBrandData] = useState<BrandDetails | null>(null)
    const [savingBrand, setSavingBrand] = useState(false)
    const [brandId, setBrandId] = useState<string | null>(null)

    // Competitor Analysis State
    const [analyzingCompetitors, setAnalyzingCompetitors] = useState(false)
    const [competitors, setCompetitors] = useState<CompetitorData[]>([])
    const [competitorSeeds, setCompetitorSeeds] = useState<string[]>([])
    const [competitorBrands, setCompetitorBrands] = useState<Array<{ name: string; url?: string }>>([])

    // NOTE: Content plan is now generated in background via Trigger.dev
    // User is redirected to /content-plan immediately after competitor analysis

    const [error, setError] = useState("")

    // Clear all onboarding data from localStorage
    const clearOnboardingStorage = useCallback(() => {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key)
        })
    }, [])

    // Restore state from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return

        // Check URL params first for step and brandId
        const urlStep = searchParams.get('step') // Keep as string for gsc-success handling
        const urlBrandId = searchParams.get('brandId')

        // FRESH ENTRY CHECK: User visited /onboarding with NO query params
        // This means they want to start a new onboarding flow, not resume
        if (!urlStep && !urlBrandId) {
            const savedBrandId = localStorage.getItem(STORAGE_KEYS.BRAND_ID)
            if (savedBrandId) {
                // Clear stale data from previous incomplete session
                clearOnboardingStorage()
            }
            // Ensure we start at the brand step with clean state
            setBrandId(null)
            setUrl("")
            setBrandData(null)
            setStep("brand")
            setIsHydrated(true)
            return // Exit early, don't restore anything
        }

        // Restore step (only brand and competitors steps now)
        const savedStep = urlStep || localStorage.getItem(STORAGE_KEYS.STEP)
        const validSteps: Step[] = ["brand", "competitors"]
        if (savedStep && validSteps.includes(savedStep as Step)) {
            setStep(savedStep as Step)
        }

        // Restore brand URL
        const savedUrl = localStorage.getItem(STORAGE_KEYS.BRAND_URL)
        if (savedUrl) setUrl(savedUrl)

        // Restore brand data
        const savedBrandData = localStorage.getItem(STORAGE_KEYS.BRAND_DATA)
        if (savedBrandData) {
            try {
                setBrandData(JSON.parse(savedBrandData))
            } catch { }
        }

        // Restore brand ID
        const savedBrandId = urlBrandId || localStorage.getItem(STORAGE_KEYS.BRAND_ID)
        if (savedBrandId) {
            setBrandId(savedBrandId)
            // If we have a brandId but no specific step, proceed to competitors
            if (!urlStep && !savedStep) setStep('competitors')
        }

        // Restore competitor data
        const savedCompetitors = localStorage.getItem(STORAGE_KEYS.COMPETITORS)
        if (savedCompetitors) {
            try {
                setCompetitors(JSON.parse(savedCompetitors))
            } catch { }
        }

        const savedSeeds = localStorage.getItem(STORAGE_KEYS.COMPETITOR_SEEDS)
        if (savedSeeds) {
            try {
                setCompetitorSeeds(JSON.parse(savedSeeds))
            } catch { }
        }

        setIsHydrated(true)
    }, [searchParams])

    // Persist step to localStorage and URL
    useEffect(() => {
        if (!isHydrated) return
        localStorage.setItem(STORAGE_KEYS.STEP, step)

        // Update URL with current step and brandId
        const params = new URLSearchParams()
        params.set('step', step)
        if (brandId) params.set('brandId', brandId)

        // Use replaceState to avoid adding to browser history for every change
        window.history.replaceState(null, '', `?${params.toString()}`)
    }, [step, brandId, isHydrated])

    // Persist brand data to localStorage
    useEffect(() => {
        if (!isHydrated) return
        localStorage.setItem(STORAGE_KEYS.BRAND_URL, url)
    }, [url, isHydrated])

    useEffect(() => {
        if (!isHydrated) return
        if (brandData) {
            localStorage.setItem(STORAGE_KEYS.BRAND_DATA, JSON.stringify(brandData))
        } else {
            localStorage.removeItem(STORAGE_KEYS.BRAND_DATA)
        }
    }, [brandData, isHydrated])

    useEffect(() => {
        if (!isHydrated) return
        if (brandId) {
            localStorage.setItem(STORAGE_KEYS.BRAND_ID, brandId)
        }
    }, [brandId, isHydrated])

    // Brand DNA handlers
    const handleAnalyzeBrand = async () => {
        if (!url) return
        setAnalyzing(true)
        setError("")
        try {
            const res = await fetch("/api/analyze-brand", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to analyze brand")
            setBrandData(data)
        } catch (e: any) {
            setError(e.message || "An error occurred")
        } finally {
            setAnalyzing(false)
        }
    }

    const handleSaveBrand = async () => {
        if (!brandData) return
        setSavingBrand(true)
        setError("")
        try {
            // Save brand data (style_dna is already included in brandData)
            const res = await saveBrandAction(url, brandData)
            if (!res.success) {
                throw new Error('error' in res ? res.error : "Failed to save brand")
            }
            if (!res.brandId) {
                throw new Error("Failed to save brand - no brandId returned")
            }
            setBrandId(res.brandId)

            // No longer creating separate brand_voices entry
            // style_dna is saved as part of brand_details

            // Proceed directly to competitor analysis
            setStep("competitors")
            // Auto-start competitor analysis - pass brandId directly since state hasn't updated yet
            handleAnalyzeCompetitors(res.brandId)
        } catch (e: any) {
            setError(e.message || "Failed to save brand details")
        } finally {
            setSavingBrand(false)
        }
    }

    // Competitor Analysis handler
    const handleAnalyzeCompetitors = async (currentBrandId?: string) => {
        // URL is optional - we use brandContext for category-based competitor search
        if (!brandData) return
        setAnalyzingCompetitors(true)
        setError("")
        try {
            const res = await fetch("/api/analyze-competitors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: url || `https://${brandData.product_name.toLowerCase().replace(/\s+/g, '')}.com`, // Fallback URL for exclusion
                    brandContext: `${brandData.product_name} - ${brandData.product_identity.literally}. Target: ${brandData.audience.primary}`,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to analyze competitors")

            const seeds = data.seeds || []
            const competitorBrandsList = data.competitorBrands || []

            // Persist to localStorage
            localStorage.setItem(STORAGE_KEYS.COMPETITORS, JSON.stringify(data.competitors || []))
            localStorage.setItem(STORAGE_KEYS.COMPETITOR_SEEDS, JSON.stringify(seeds))

            // === NEW: Background Plan Generation ===
            // 1. Sync sitemap (quick)
            let existingContent: string[] = []
            const effectiveBrandId = currentBrandId || brandId
            if (url && effectiveBrandId) {
                try {
                    const { syncSitemapToInternalLinksAction } = await import("@/actions/sync-internal-links")
                    const syncResult = await syncSitemapToInternalLinksAction(url, effectiveBrandId)
                    if (syncResult.success) {
                        existingContent = syncResult.titles
                    }
                } catch (e) {
                    console.warn("[Onboarding] Sitemap sync failed:", e)
                }
            }

            // 2. Trigger background plan generation
            const bgRes = await fetch("/api/content-plan/start-background", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    brandId: effectiveBrandId,
                    brandData,
                    seeds,
                    competitorBrands: competitorBrandsList,
                    existingContent
                }),
            })

            if (!bgRes.ok) {
                const bgError = await bgRes.json()
                throw new Error(bgError.error || "Failed to start plan generation")
            }

            // 3. Clear onboarding storage and redirect immediately
            clearOnboardingStorage()
            router.push("/content-plan")

        } catch (e: any) {
            setError(e.message || "Failed to analyze competitors")
        } finally {
            setAnalyzingCompetitors(false)
        }
    }

    // NOTE: Plan generation and GSC enhancement are now handled on /content-plan page

    // Helper to update nested brand state
    const updateField = (path: string, value: any) => {
        if (!brandData) return
        const newData = { ...brandData }
        if (path.includes('.')) {
            const [parent, child] = path.split('.')
            // @ts-ignore
            newData[parent] = { ...newData[parent], [child]: value }
        } else {
            // @ts-ignore
            newData[path] = value
        }
        setBrandData(newData)
    }

    const updateArray = (field: keyof BrandDetails, value: string) => {
        const arr = value.split('\n').filter(line => line.trim() !== '')
        setBrandData(prev => prev ? ({ ...prev, [field]: arr }) : null)
    }

    // Progress indicator - simplified to 2-step flow
    const isStepComplete = (checkStep: Step) => {
        if (checkStep === "brand" && step === "competitors") return true
        return false
    }

    const isStepActive = (checkStep: Step) => {
        return step === checkStep
    }

    const ProgressIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-6">
            {/* Step 1: Brand DNA */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${step === "brand" ? 'bg-stone-900 text-white' : 'bg-stone-800 text-stone-300'}`}>
                <Globe className="w-3.5 h-3.5" />
                <span>Brand</span>
                {step === "competitors" && <BadgeCheck className="w-3 h-3 text-green-500" />}
            </div>
            <div className={`w-4 h-px bg-stone-200`} />

            {/* Step 2: Strategy (auto-redirects) */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${step === "competitors" ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'}`}>
                <Calendar className="w-3.5 h-3.5" />
                <span>Strategy</span>
            </div>
        </div>
    )

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 font-sans">
            {/* Show loading while checking access */}
            {isCheckingAccess ? (
                <div className="flex flex-col items-center gap-3 text-stone-500">
                    <CustomSpinner className="w-10 h-10" />
                </div>
            ) : (
                <>
                    <ProgressIndicator />

                    {/* Island Container */}
                    <motion.div
                        layout
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`
          relative p-1 overflow-hidden w-full max-w-xl transition-all duration-300
          shadow-[0_0_0_1px_rgba(0,0,0,0.08),0px_1px_2px_rgba(0,0,0,0.04)]
          rounded-[20px]
          bg-stone-100
        `}
                    >
                        {/* Top Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-6 z-20 flex justify-center pointer-events-none">
                            <div className={`w-8 h-4 rounded-b-lg border-b border-x bg-stone-100 border-stone-200/50 flex items-center justify-center`}>
                                <ChevronUp className={`w-3 h-3 text-stone-400`} />
                            </div>
                        </div>

                        {/* Inner Card */}
                        <div className={`
          relative border overflow-hidden transition-all rounded-[16px]
          bg-white border-stone-200
        `}>
                            <AnimatePresence mode="wait">
                                {step === "brand" && (
                                    <motion.div
                                        key="brand-step"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="p-6"
                                    >
                                        {!brandData ? (
                                            // URL Input Form
                                            <div className="space-y-6">
                                                <div className="text-center space-y-2">
                                                    <h2 className={`text-xl font-bold text-stone-900`}>
                                                        Let&apos;s understand your brand
                                                    </h2>
                                                    <p className={`text-sm text-stone-500`}>
                                                        Share your website so we can understand your product and build your brand DNA & voice profile.
                                                    </p>
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <Input
                                                        type="url"
                                                        placeholder="https://yourwebsite.com"
                                                        className={`flex-1 bg-stone-50 border-stone-200 py-2 px-3 text-sm`}
                                                        value={url}
                                                        onChange={(e) => setUrl(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeBrand()}
                                                    />
                                                    <Button
                                                        onClick={handleAnalyzeBrand}
                                                        disabled={analyzing || !url}
                                                        className={`
                          px-6 font-semibold
                          bg-gradient-to-b from-stone-800 to-stone-950
                          hover:from-stone-700 hover:to-stone-900
                          shadow-sm
                        `}
                                                    >
                                                        {analyzing ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                                Analyzing...
                                                            </>
                                                        ) : (
                                                            "Analyze"
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            // Brand Review Form - Complete with all 10 sections
                                            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h2 className={`text-lg font-bold text-stone-900`}>Review Brand Details</h2>
                                                        <p className={`text-xs text-stone-500`}>We recommend adding more detailed brand data to get better and accurate articles later</p>
                                                    </div>

                                                </div>

                                                {/* 1. Product Identity */}
                                                <div className="space-y-3">
                                                    <h3 className={`text-sm font-semibold border-b pb-2 border-stone-100 text-stone-900`}>1. Product Identity</h3>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className={`block text-xs font-medium mb-1 text-stone-600`}>Product Name</label>
                                                            <Input value={brandData.product_name} onChange={e => updateField('product_name', e.target.value)} className="text-sm" />
                                                        </div>
                                                        <div>
                                                            <label className={`block text-xs font-medium mb-1 text-stone-600`}>What is it literally?</label>
                                                            <Input value={brandData.product_identity.literally} onChange={e => updateField('product_identity.literally', e.target.value)} className="text-sm" />
                                                        </div>
                                                        <div>
                                                            <label className={`block text-xs font-medium mb-1 text-stone-600`}>What is it emotionally?</label>
                                                            <Input value={brandData.product_identity.emotionally} onChange={e => updateField('product_identity.emotionally', e.target.value)} className="text-sm" />
                                                        </div>
                                                        <div>
                                                            <label className={`block text-xs font-medium mb-1 text-stone-600`}>What is it NOT?</label>
                                                            <Input value={brandData.product_identity.not} onChange={e => updateField('product_identity.not', e.target.value)} className="text-sm" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 2. Mission */}
                                                <div className="space-y-2">
                                                    <h3 className={`text-sm font-semibold border-b pb-2 border-stone-100 text-stone-900`}>2. Mission</h3>
                                                    <label className={`block text-xs font-medium text-stone-600`}>The "Why"</label>
                                                    <Textarea value={brandData.mission} onChange={e => updateField('mission', e.target.value)} className="text-sm min-h-[60px]" />
                                                </div>

                                                {/* 3. Audience */}
                                                <div className="space-y-3">
                                                    <h3 className={`text-sm font-semibold border-b pb-2 border-stone-100 text-stone-900`}>3. Audience</h3>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        <div>
                                                            <label className={`block text-xs font-medium mb-1 text-stone-600`}>Primary Audience</label>
                                                            <Input value={brandData.audience.primary} onChange={e => updateField('audience.primary', e.target.value)} className="text-sm" />
                                                        </div>
                                                        <div>
                                                            <label className={`block text-xs font-medium mb-1 text-stone-600`}>Psychology (Desires/Fears)</label>
                                                            <Textarea value={brandData.audience.psychology} onChange={e => updateField('audience.psychology', e.target.value)} className="text-sm min-h-[60px]" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 4. Strategic Positioning */}
                                                <div className="space-y-3">
                                                    <h3 className={`text-sm font-semibold border-b pb-2 border-stone-100 text-stone-900`}>4. Strategic Positioning</h3>
                                                    <div>
                                                        <label className={`block text-xs font-medium mb-1 text-stone-600`}>Category</label>
                                                        <Input
                                                            value={brandData.category || ''}
                                                            onChange={e => updateField('category', e.target.value)}
                                                            className="text-sm"
                                                            placeholder="e.g., Privacy-First Web Analytics, AI Photo Restoration"
                                                        />
                                                        <p className={`text-[10px] text-stone-400 mt-1`}>How would you describe your product category?</p>
                                                    </div>
                                                </div>

                                                {/* 5. Enemy */}
                                                <div className="space-y-2">
                                                    <h3 className={`text-sm font-semibold border-b pb-2 border-stone-100 text-stone-900`}>5. Enemy (What you fight against)</h3>
                                                    <Textarea
                                                        value={brandData.enemy.join('\n')}
                                                        onChange={e => updateArray('enemy', e.target.value)}
                                                        className="text-sm min-h-[60px]"
                                                        placeholder="One item per line"
                                                    />
                                                    <p className={`text-[10px] text-right text-stone-400`}>One item per line</p>
                                                </div>

                                                {/* 6. Voice & Tone */}
                                                <div className="space-y-2">
                                                    <h3 className={`text-sm font-semibold border-b pb-2 border-stone-100 text-stone-900`}>6. Brand Voice & Tone</h3>
                                                    <Textarea
                                                        value={brandData.style_dna}
                                                        onChange={e => updateArray('style_dna', e.target.value)}
                                                        className="text-sm min-h-[60px]"
                                                        placeholder="Describe your brand's voice and tone in detail."
                                                    />
                                                    <p className={`text-[10px] text-right text-stone-400`}>Comprehensive writing style guide</p>
                                                </div>

                                                {/* 7. Unique Value Proposition */}
                                                <div className="space-y-2">
                                                    <h3 className={`text-sm font-semibold border-b pb-2 border-stone-100 text-stone-900`}>7. Unique Value Proposition</h3>
                                                    <Textarea
                                                        value={brandData.uvp.join('\n')}
                                                        onChange={e => updateArray('uvp', e.target.value)}
                                                        className="text-sm min-h-[60px]"
                                                        placeholder="One item per line"
                                                    />
                                                    <p className={`text-[10px] text-right text-stone-400`}>One item per line</p>
                                                </div>

                                                {/* 8. Core Features */}
                                                <div className="space-y-2">
                                                    <h3 className={`text-sm font-semibold border-b pb-2 border-stone-100 text-stone-900`}>8. Core Features</h3>
                                                    <Textarea
                                                        value={brandData.core_features.join('\n')}
                                                        onChange={e => updateArray('core_features', e.target.value)}
                                                        className="text-sm min-h-[60px]"
                                                        placeholder="One item per line"
                                                    />
                                                    <p className={`text-[10px] text-right text-stone-400`}>One item per line</p>
                                                </div>

                                                {/* 9. Pricing */}
                                                <div className="space-y-2">
                                                    <h3 className={`text-sm font-semibold border-b pb-2 border-stone-100 text-stone-900`}>9. Pricing</h3>
                                                    <Textarea
                                                        value={brandData.pricing?.join('\n') || ''}
                                                        onChange={e => updateArray('pricing', e.target.value)}
                                                        className="text-sm min-h-[60px]"
                                                        placeholder="e.g. Pro Plan: $29/mo"
                                                    />
                                                    <p className={`text-[10px] text-right text-stone-400`}>One line e.g. "Pro Plan: $29/mo"</p>
                                                </div>

                                                {/* 10. How it Works */}
                                                <div className="space-y-2">
                                                    <h3 className={`text-sm font-semibold border-b pb-2 border-stone-100 text-stone-900`}>10. How it Works</h3>
                                                    <Textarea
                                                        value={brandData.how_it_works?.join('\n') || ''}
                                                        onChange={e => updateArray('how_it_works', e.target.value)}
                                                        className="text-sm min-h-[60px]"
                                                        placeholder="One step per line"
                                                    />
                                                    <p className={`text-[10px] text-right text-stone-400`}>One step per line</p>
                                                </div>

                                                {/* 11. Featured Image Style */}
                                                <div className="space-y-2">
                                                    <h3 className={`text-sm font-semibold border-b pb-2 border-stone-100 text-stone-900`}>11. Featured Image Style</h3>
                                                    <label className={`block text-xs font-medium mb-1 text-stone-600`}>Style Preference</label>
                                                    <select
                                                        className={`w-full h-10 rounded-md border px-3 text-sm bg-white border-stone-200 text-stone-900`}
                                                        value={brandData.image_style || "stock"}
                                                        onChange={e => updateField('image_style', e.target.value)}
                                                    >
                                                        <option value="stock">Stock Photography (Professional, Realistic)</option>
                                                        <option value="illustration">Modern Illustration (Flat, Vector)</option>
                                                        <option value="indo">Indo (Vibrant, Cultural Elements)</option>
                                                        <option value="minimalist">Minimalist (Clean, Abstract)</option>
                                                        <option value="cyberpunk">Cyberpunk (Neon, Tech)</option>
                                                        <option value="watercolor">Watercolor (Artistic, Soft)</option>
                                                    </select>
                                                    <p className={`text-[10px] text-right text-stone-400`}>Select the style for AI-generated featured images.</p>
                                                </div>

                                                {/* Continue Button */}
                                                <div className="pt-4 border-t border-stone-100  sticky bottom-0 bg-white/80 /80 backdrop-blur-sm py-4">
                                                    <Button
                                                        onClick={handleSaveBrand}
                                                        disabled={savingBrand}
                                                        className={`
                          w-full h-10 font-semibold
                          bg-gradient-to-b from-stone-800 to-stone-950
                          hover:from-stone-700 hover:to-stone-900
                        `}
                                                    >
                                                        {savingBrand ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                                Saving...
                                                            </>
                                                        ) : (
                                                            <>
                                                                Continue
                                                                <ArrowRight className="w-4 h-4 ml-2" />
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}


                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Error Display */}
                    {error && (
                        <div className="mt-6 max-w-xl w-full">
                            <div className={`p-4 rounded-xl text-sm border bg-red-50 text-red-600 border-red-100`}>
                                {error}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}