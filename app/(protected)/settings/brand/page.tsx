'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Moon, Sun, Check, Store, Palette, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const FONT_OPTIONS: { name: string; google: string; sample: string }[] = [
  { name: 'Playfair Display', google: 'Playfair+Display:wght@700', sample: 'Elegant Serif Style' },
  { name: 'Inter', google: 'Inter:wght@600', sample: 'Clean Modern Sans' },
  { name: 'Roboto', google: 'Roboto:wght@500', sample: 'Universal & Readable' },
  { name: 'Outfit', google: 'Outfit:wght@600', sample: 'Geometric & Fresh' },
  { name: 'Poppins', google: 'Poppins:wght@600', sample: 'Friendly Rounded Sans' },
  { name: 'Montserrat', google: 'Montserrat:wght@600', sample: 'Bold & Confident' },
  { name: 'Lora', google: 'Lora:wght@600', sample: 'Classic Book Serif' },
  { name: 'Merriweather', google: 'Merriweather:wght@700', sample: 'Readable & Warm' },
  { name: 'Raleway', google: 'Raleway:wght@600', sample: 'Thin Elegance' },
  { name: 'DM Sans', google: 'DM+Sans:wght@600', sample: 'Compact & Minimal' },
]

const AESTHETIC_OPTIONS: { name: string; gradient: string; emoji: string; desc: string }[] = [
  { name: 'Modern & Minimalist', gradient: 'from-neutral-100 to-neutral-300', emoji: '◻️', desc: 'White space, clean lines' },
  { name: 'Warm & Cozy', gradient: 'from-amber-100 to-orange-200', emoji: '🕯️', desc: 'Soft tones, warm textures' },
  { name: 'Bold & Vibrant', gradient: 'from-fuchsia-300 to-orange-300', emoji: '🎨', desc: 'Saturated, eye-catching' },
  { name: 'Earthy & Natural', gradient: 'from-lime-100 to-emerald-200', emoji: '🌿', desc: 'Organic greens, linen, wood' },
  { name: 'Luxury & Premium', gradient: 'from-amber-200 to-yellow-400', emoji: '✨', desc: 'Gold accents, dark moods' },
  { name: 'Playful & Fun', gradient: 'from-pink-200 to-sky-200', emoji: '🎈', desc: 'Pastels, rounded, cheerful' },
  { name: 'Scandinavian', gradient: 'from-slate-100 to-sky-100', emoji: '❄️', desc: 'Light wood, hygge, airy' },
  { name: 'Industrial', gradient: 'from-zinc-300 to-stone-400', emoji: '⚙️', desc: 'Raw concrete, metal, dark' },
  { name: 'Bohemian', gradient: 'from-orange-200 to-rose-200', emoji: '🪬', desc: 'Macramé, rattan, terracotta' },
  { name: 'Coastal', gradient: 'from-cyan-100 to-blue-200', emoji: '🌊', desc: 'Ocean blues, sandy neutrals' },
]

interface BrandSettingsData {
  brand_name: string
  brand_description: string
  store_url: string
  logo_url: string
  font_choice: string
  aesthetic_boundaries: string[]
  automation_paused: boolean
  default_board_id: string
  account_age_type: 'brand_new' | 'established' | ''
  pin_layout_mode: 'organic' | 'editorial'
}

export default function BrandSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [form, setForm] = useState<BrandSettingsData>({
    brand_name: '',
    brand_description: '',
    store_url: '',
    logo_url: '',
    font_choice: 'Playfair Display',
    aesthetic_boundaries: [],
    automation_paused: false,
    default_board_id: '',
    account_age_type: '',
    pin_layout_mode: 'organic',
  })
  const [boards, setBoards] = useState<{ id: string; name: string }[]>([])
  const [loadingBoards, setLoadingBoards] = useState(false)

  // Refs for debounced auto-save (avoids stale closures)
  const hasLoaded = useRef(false)
  const settingsIdRef = useRef<string | null>(null)
  const userIdRef = useRef<string | null>(null)

  useEffect(() => { settingsIdRef.current = settingsId }, [settingsId])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userIdRef.current = user.id

      const { data } = await supabase
        .from('brand_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        setSettingsId(data.id)
        settingsIdRef.current = data.id
        setForm({
          brand_name: data.brand_name || '',
          brand_description: data.brand_description || '',
          store_url: data.store_url || '',
          logo_url: data.logo_url || '',
          font_choice: data.font_choice || 'Playfair Display',
          aesthetic_boundaries: (data.aesthetic_boundaries as string[]) || [],
          automation_paused: data.automation_paused || false,
          default_board_id: data.default_board_id || '',
          account_age_type: data.account_age_type || '',
          pin_layout_mode: (data.pin_layout_mode as 'organic' | 'editorial') || 'organic',
        })
      }

      // Fetch user's Pinterest boards
      try {
        setLoadingBoards(true)
        const res = await fetch('/api/pinterest/boards')
        if (res.ok) {
          const bData = await res.json()
          setBoards(bData.boards || [])
        }
      } catch (err) {
        console.error('Failed to fetch boards', err)
      } finally {
        setLoadingBoards(false)
      }

      setLoading(false)
      // Allow auto-save only after initial load completes
      setTimeout(() => { hasLoaded.current = true }, 50)
    }
    load()
  }, [])

  const toggleAesthetic = (tag: string) => {
    setForm(prev => ({
      ...prev,
      aesthetic_boundaries: prev.aesthetic_boundaries.includes(tag)
        ? prev.aesthetic_boundaries.filter(t => t !== tag)
        : prev.aesthetic_boundaries.length < 3
          ? [...prev.aesthetic_boundaries, tag]
          : prev.aesthetic_boundaries,
    }))
  }

  // Debounced auto-save — fires 800ms after any form change
  useEffect(() => {
    if (!hasLoaded.current) return

    const timer = setTimeout(async () => {
      const userId = userIdRef.current
      if (!userId || !form.brand_name) return

      const supabase = createClient()
      const payload = {
        user_id: userId,
        brand_name: form.brand_name,
        brand_description: form.brand_description,
        store_url: form.store_url,
        logo_url: form.logo_url,
        font_choice: form.font_choice,
        aesthetic_boundaries: form.aesthetic_boundaries,
        automation_paused: form.automation_paused,
        default_board_id: form.default_board_id,
        account_age_type: form.account_age_type,
        pin_layout_mode: form.pin_layout_mode,
      }

      try {
        if (settingsIdRef.current) {
          const { error } = await supabase.from('brand_settings').update(payload).eq('id', settingsIdRef.current)
          if (error) throw error
        } else {
          const { data, error } = await supabase.from('brand_settings').insert(payload).select('id').single()
          if (error) throw error
          if (data) { setSettingsId(data.id); settingsIdRef.current = data.id }
        }

        if (form.account_age_type) {
          const warmupPhase = form.account_age_type === 'brand_new' ? 'warmup_partial' : 'full'
          await supabase.from('pinterest_connections').update({ warmup_phase: warmupPhase }).eq('user_id', userId)
        }

        toast.success('Changes saved', { duration: 1500 })
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to save')
      }
    }, 800)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-64" />
        <div className="h-96 bg-muted rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl pb-16">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href={`https://fonts.googleapis.com/css2?${FONT_OPTIONS.map(f => `family=${f.google}`).join('&')}&display=swap`}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Brand Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure your brand identity. Changes save automatically.
        </p>
      </div>

      {/* ─── Section: Brand Identity ─── */}
      <section className="mb-10">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
            <Store className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Brand Identity</h2>
            <p className="text-xs text-muted-foreground">Name, description, and store link</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Brand Name *</label>
            <Input
              value={form.brand_name}
              onChange={e => setForm(p => ({ ...p, brand_name: e.target.value }))}
              placeholder="e.g., Artisan Home Co."
              className="rounded-xl h-11"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Brand Description</label>
            <Textarea
              value={form.brand_description}
              onChange={e => setForm(p => ({ ...p, brand_description: e.target.value }))}
              placeholder="A brief description of your brand and what you sell..."
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Store URL</label>
            <Input
              type="url"
              value={form.store_url}
              onChange={e => setForm(p => ({ ...p, store_url: e.target.value }))}
              placeholder="https://yourstore.com"
              className="rounded-xl h-11"
            />
            <p className="text-xs text-muted-foreground">This appears as the CTA badge on your pins.</p>
          </div>
        </div>
      </section>

      <hr className="border-neutral-100 mb-10" />

      {/* ─── Section: Visual Style ─── */}
      <section className="mb-10">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
            <Palette className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Visual Style</h2>
            <p className="text-xs text-muted-foreground">Control how your pins look in the feed</p>
          </div>
        </div>

        <div className="space-y-7">
          {/* Pin Style */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Pin Style</label>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setForm(p => ({ ...p, pin_layout_mode: 'organic' }))}
                className={`cursor-pointer p-4 rounded-xl border-2 text-left transition-all ${
                  form.pin_layout_mode === 'organic'
                    ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                    : 'border-neutral-200 bg-white hover:border-neutral-400'
                }`}
              >
                <div className="font-semibold text-sm mb-1">🌿 Organic Lifestyle</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pure image. Zero text overlay. Blends into the feed like Target or Crate &amp; Barrel. <strong>Highest click-through rate.</strong>
                </p>
                {form.pin_layout_mode === 'organic' && (
                  <span className="mt-2 inline-block text-[10px] font-semibold text-neutral-900 bg-neutral-200 px-2 py-0.5 rounded-full">ACTIVE</span>
                )}
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setForm(p => ({ ...p, pin_layout_mode: 'editorial' }))}
                className={`cursor-pointer p-4 rounded-xl border-2 text-left transition-all ${
                  form.pin_layout_mode === 'editorial'
                    ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                    : 'border-neutral-200 bg-white hover:border-neutral-400'
                }`}
              >
                <div className="font-semibold text-sm mb-1">✏️ Editorial / Campaign</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AI selects a magazine-style text layout. Best for promotions, seasonal campaigns, or infographic content.
                </p>
                {form.pin_layout_mode === 'editorial' && (
                  <span className="mt-2 inline-block text-[10px] font-semibold text-neutral-900 bg-neutral-200 px-2 py-0.5 rounded-full">ACTIVE</span>
                )}
              </motion.button>
            </div>
          </div>

          {/* Font Choice */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Pin Font</label>
            <p className="text-xs text-muted-foreground">
              Curated OCR-approved fonts that Pinterest&apos;s visual AI can read. Select one.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map(f => {
                const isSelected = form.font_choice === f.name
                return (
                  <motion.button
                    key={f.name}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setForm(p => ({ ...p, font_choice: f.name }))}
                    className={`cursor-pointer text-left p-3.5 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                        : 'border-neutral-200 bg-white hover:border-neutral-400'
                    }`}
                  >
                    <span
                      className="block text-lg leading-tight truncate"
                      style={{ fontFamily: `'${f.name}', sans-serif` }}
                    >
                      {f.sample}
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-1">{f.name}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Aesthetic Boundaries */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Aesthetic Boundaries (pick up to 3)</label>
            <p className="text-xs text-muted-foreground">
              Tell the AI Art Director what visual styles to aim for. It will avoid anything outside these boundaries.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AESTHETIC_OPTIONS.map(opt => {
                const selected = form.aesthetic_boundaries.includes(opt.name)
                return (
                  <motion.button
                    key={opt.name}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => toggleAesthetic(opt.name)}
                    className={`cursor-pointer relative text-left rounded-xl border-2 overflow-hidden transition-all ${
                      selected
                        ? 'border-neutral-900 ring-1 ring-neutral-900 shadow-sm'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <div className={`h-16 w-full bg-gradient-to-br ${opt.gradient} flex items-center justify-center text-2xl`}>
                      {opt.emoji}
                    </div>
                    <div className="px-3 py-2.5">
                      <span className="block text-xs font-semibold text-neutral-900 leading-tight">{opt.name}</span>
                      <span className="block text-[10px] text-muted-foreground mt-0.5">{opt.desc}</span>
                    </div>
                    {selected && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <hr className="border-neutral-100 mb-10" />

      {/* ─── Section: Automation ─── */}
      <section className="mb-10">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Automation</h2>
            <p className="text-xs text-muted-foreground">Controls for scheduling, publishing, and safety</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Sleep Mode */}
          <div className={`rounded-2xl border-2 p-5 transition-colors ${
            form.automation_paused
              ? 'border-red-300 bg-red-50/50'
              : 'border-emerald-200 bg-emerald-50/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {form.automation_paused ? (
                  <Moon className="w-6 h-6 text-red-500 shrink-0" />
                ) : (
                  <Sun className="w-6 h-6 text-emerald-600 shrink-0" />
                )}
                <div>
                  <h3 className="font-semibold text-sm">
                    {form.automation_paused ? '🛑 Sleep Mode' : '✅ Engine Active'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px]">
                    {form.automation_paused
                      ? 'ALL automation is paused. No generation, no publishing.'
                      : 'AI is generating and scheduling pins normally.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, automation_paused: !p.automation_paused }))}
                className={`cursor-pointer relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                  form.automation_paused ? 'bg-red-400' : 'bg-emerald-500'
                }`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  form.automation_paused ? 'translate-x-1' : 'translate-x-6'
                }`} />
              </button>
            </div>
          </div>

          {/* Default Board */}
          <div className="rounded-2xl border-2 border-neutral-200 bg-neutral-50/50 p-5">
            <h3 className="font-semibold text-sm mb-2">📌 Default Pinterest Board</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Pre-select where your manually approved pins should be saved on Pinterest.
            </p>
            {loadingBoards ? (
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Fetching your boards...
              </div>
            ) : (
              <select
                value={form.default_board_id}
                onChange={e => setForm(p => ({ ...p, default_board_id: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="">-- Select a Board (Required) --</option>
                {boards.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Account Age */}
          {!form.account_age_type && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
              <h3 className="font-semibold text-base mb-1">🛡️ Account Protection Setup</h3>
              <p className="text-sm text-muted-foreground mb-4">
                To protect your Pinterest account from spam filters, we need to know one thing:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, account_age_type: 'brand_new' }))}
                  className="cursor-pointer p-4 rounded-xl border-2 border-blue-200 bg-white hover:border-blue-400 transition-all text-left"
                >
                  <div className="font-semibold text-sm">🌱 Brand New</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created in the last 3 months. We&apos;ll ramp up slowly (1 pin/day → 5 pins/day over 4 weeks).
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, account_age_type: 'established' }))}
                  className="cursor-pointer p-4 rounded-xl border-2 border-blue-200 bg-white hover:border-blue-400 transition-all text-left"
                >
                  <div className="font-semibold text-sm">🏛️ Established</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active for 3+ months with existing pins. We&apos;ll publish at full speed immediately.
                  </p>
                </button>
              </div>
            </div>
          )}

          {form.account_age_type && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="text-sm">
                {form.account_age_type === 'brand_new' ? '🌱' : '🏛️'}
              </span>
              <div>
                <span className="text-sm font-medium">
                  {form.account_age_type === 'brand_new' ? 'Warm-Up Mode Active' : 'Full Speed Mode'}
                </span>
                <p className="text-xs text-muted-foreground">
                  {form.account_age_type === 'brand_new'
                    ? 'Publishing is throttled for 4 weeks to protect your account.'
                    : 'Your account is publishing at maximum safe velocity.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, account_age_type: '' }))}
                className="ml-auto text-xs text-muted-foreground hover:text-neutral-800 underline"
              >
                Change
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Auto-save indicator */}
      <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-neutral-100">
        <Check className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">All changes saved automatically</span>
      </div>
    </div>
  )
}
