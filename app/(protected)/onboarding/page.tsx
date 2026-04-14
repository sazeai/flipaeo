'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, ArrowRight, Loader2, SkipForward } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { type BrandSettingsData } from '@/lib/constants/brand'

import { StepBrand } from '@/components/onboarding/step-brand'
import { StepAesthetics } from '@/components/onboarding/step-aesthetics'
import { StepProducts } from '@/components/onboarding/step-products'
import { StepPinterest } from '@/components/onboarding/step-pinterest'
import { StepWarmup } from '@/components/onboarding/step-warmup'
import { StepComplete } from '@/components/onboarding/step-complete'

const TOTAL_STEPS = 6
const SKIPPABLE_STEPS = [3, 4, 5]

const STEP_LABELS = [
  'Brand',
  'Aesthetics',
  'Products',
  'Pinterest',
  'Protection',
  'Launch',
]

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const stepParam = parseInt(searchParams.get('step') || '1', 10)
  const currentStep = Math.min(Math.max(stepParam, 1), TOTAL_STEPS)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = back
  const settingsIdRef = useRef<string | null>(null)
  const userIdRef = useRef<string | null>(null)
  const [hasProducts, setHasProducts] = useState(false)
  const [hasPinterest, setHasPinterest] = useState(false)

  const [form, setForm] = useState<BrandSettingsData>({
    brand_name: '',
    brand_description: '',
    store_url: '',
    logo_url: '',
    aesthetic_boundaries: [],
    default_board_id: '',
    account_age_type: '',
    show_brand_url: true,
  })

  // Load existing brand_settings on mount
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      userIdRef.current = user.id

      const [{ data: settings }, { count: productCount }, { data: pinterest }] = await Promise.all([
        supabase.from('brand_settings').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('pinterest_connections').select('id').eq('user_id', user.id).maybeSingle(),
      ])

      if (settings) {
        settingsIdRef.current = settings.id
        setForm({
          brand_name: settings.brand_name || '',
          brand_description: settings.brand_description || '',
          store_url: settings.store_url || '',
          logo_url: settings.logo_url || '',
          aesthetic_boundaries: (settings.aesthetic_boundaries as string[]) || [],
          default_board_id: settings.default_board_id || '',
          account_age_type: settings.account_age_type || '',
          show_brand_url: settings.show_brand_url ?? true,
        })
      }

      setHasProducts((productCount ?? 0) > 0)
      setHasPinterest(!!pinterest)
      setLoading(false)
    }
    load()
  }, [router])

  function goTo(step: number, dir: 1 | -1 = 1) {
    setDirection(dir)
    router.replace(`/onboarding?step=${step}`, { scroll: false })
  }

  // Upsert brand_settings with the given partial payload
  async function saveBrandSettings(payload: Record<string, unknown>) {
    const userId = userIdRef.current
    if (!userId) return

    const supabase = createClient()
    const fullPayload = { user_id: userId, ...payload }

    if (settingsIdRef.current) {
      const { error } = await supabase
        .from('brand_settings')
        .update(fullPayload)
        .eq('id', settingsIdRef.current)
      if (error) throw error
    } else {
      const { data, error } = await supabase
        .from('brand_settings')
        .insert(fullPayload)
        .select('id')
        .single()
      if (error) throw error
      if (data) settingsIdRef.current = data.id
    }
  }

  async function handleContinue() {
    setSaving(true)
    try {
      switch (currentStep) {
        case 1: {
          if (!form.brand_name.trim()) {
            toast.error('Brand name is required')
            setSaving(false)
            return
          }
          await saveBrandSettings({
            brand_name: form.brand_name.trim(),
            brand_description: form.brand_description.trim(),
            store_url: form.store_url.trim(),
            logo_url: form.logo_url,
          })
          break
        }
        case 2: {
          if (form.aesthetic_boundaries.length === 0) {
            toast.error('Select at least one aesthetic')
            setSaving(false)
            return
          }
          await saveBrandSettings({ aesthetic_boundaries: form.aesthetic_boundaries })
          break
        }
        case 3: {
          // Products step — data saved via CSV/Shopify APIs, no brand_settings update needed
          break
        }
        case 4: {
          // Pinterest step — connection saved via OAuth callback
          break
        }
        case 5: {
          if (form.account_age_type) {
            await saveBrandSettings({ account_age_type: form.account_age_type })
            // Also update warmup phase on pinterest_connections
            const supabase = createClient()
            const warmupPhase = form.account_age_type === 'brand_new' ? 'warmup_partial' : 'full'
            await supabase
              .from('pinterest_connections')
              .update({ warmup_phase: warmupPhase })
              .eq('user_id', userIdRef.current!)
          }
          break
        }
      }

      if (currentStep < TOTAL_STEPS) {
        goTo(currentStep + 1, 1)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      goTo(currentStep - 1, -1)
    }
  }

  function handleSkip() {
    if (currentStep < TOTAL_STEPS) {
      goTo(currentStep + 1, 1)
    }
  }

  const handlePinterestConnected = useCallback(() => {
    setHasPinterest(true)
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
      </div>
    )
  }

  const progress = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Progress Header */}
      {currentStep < TOTAL_STEPS && (
        <div className="mb-10">
          {/* Step indicators — desktop */}
          <div className="mb-3 hidden items-center justify-between sm:flex">
            {STEP_LABELS.map((label, i) => {
              const stepNum = i + 1
              const isActive = stepNum === currentStep
              const isDone = stepNum < currentStep

              return (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-neutral-900 text-white'
                      : isDone
                        ? 'bg-neutral-200 text-neutral-600'
                        : 'bg-neutral-100 text-neutral-400'
                  }`}>
                    {stepNum}
                  </div>
                  <span className={`text-[10px] font-medium transition-colors ${
                    isActive ? 'text-neutral-900' : 'text-neutral-400'
                  }`}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Step indicator — mobile */}
          <div className="mb-3 flex items-center justify-between sm:hidden">
            <span className="text-xs font-medium text-neutral-500">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <span className="text-xs font-medium text-neutral-900">
              {STEP_LABELS[currentStep - 1]}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <motion.div
              className="h-full rounded-full bg-neutral-900"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          initial={{ opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -40 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          {currentStep === 1 && (
            <StepBrand
              data={{
                brand_name: form.brand_name,
                brand_description: form.brand_description,
                store_url: form.store_url,
                logo_url: form.logo_url,
              }}
              onChange={updates => setForm(prev => ({ ...prev, ...updates }))}
            />
          )}

          {currentStep === 2 && (
            <StepAesthetics
              value={form.aesthetic_boundaries}
              onChange={v => setForm(prev => ({ ...prev, aesthetic_boundaries: v }))}
            />
          )}

          {currentStep === 3 && <StepProducts />}

          {currentStep === 4 && (
            <StepPinterest onConnected={handlePinterestConnected} />
          )}

          {currentStep === 5 && (
            <StepWarmup
              value={form.account_age_type}
              onChange={v => setForm(prev => ({ ...prev, account_age_type: v }))}
            />
          )}

          {currentStep === 6 && (
            <StepComplete
              data={{
                brand_name: form.brand_name,
                aesthetic_boundaries: form.aesthetic_boundaries,
                has_products: hasProducts,
                has_pinterest: hasPinterest,
              }}
              onFinish={() => router.push('/dashboard')}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {currentStep < TOTAL_STEPS && (
        <div className="mt-10 flex items-center justify-between gap-4">
          <div>
            {currentStep > 1 && (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="h-11 rounded-xl px-4 text-sm text-neutral-600 hover:text-neutral-900"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {SKIPPABLE_STEPS.includes(currentStep) && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="h-11 rounded-xl px-4 text-sm text-neutral-500 hover:text-neutral-700"
              >
                Skip
                <SkipForward className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            )}

            <Button
              onClick={handleContinue}
              disabled={saving}
              className="h-11 rounded-xl bg-neutral-900 px-6 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
