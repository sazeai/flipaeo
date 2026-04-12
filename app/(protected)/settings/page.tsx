'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Check, Store, Palette, ShieldCheck, Sparkles, Zap, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AutomationControl } from '@/components/dashboard/automation-control'

const FONT_OPTIONS: { name: string; google: string; sample: string }[] = [
  { name: 'Playfair Display', google: 'Playfair+Display:wght@700', sample: 'Elegant Serif' },
  { name: 'Inter', google: 'Inter:wght@600', sample: 'Modern Sans' },
  { name: 'Roboto', google: 'Roboto:wght@500', sample: 'Readable Sans' },
  { name: 'Outfit', google: 'Outfit:wght@600', sample: 'Geometric' },
  { name: 'Poppins', google: 'Poppins:wght@600', sample: 'Rounded Sans' },
  { name: 'Montserrat', google: 'Montserrat:wght@600', sample: 'Bold Sans' },
  { name: 'Lora', google: 'Lora:wght@600', sample: 'Book Serif' },
  { name: 'Merriweather', google: 'Merriweather:wght@700', sample: 'Warm Serif' },
  { name: 'Raleway', google: 'Raleway:wght@600', sample: 'Thin Elegance' },
  { name: 'DM Sans', google: 'DM+Sans:wght@600', sample: 'Minimal Sans' },
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

const EMPTY_BOARD_VALUE = '__no_board__'

interface BrandSettingsData {
  brand_name: string
  brand_description: string
  store_url: string
  logo_url: string
  font_choice: string
  aesthetic_boundaries: string[]
  default_board_id: string
  account_age_type: 'brand_new' | 'established' | ''
  pin_layout_mode: 'organic' | 'editorial'
}

function SurfaceHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  titleTag = 'h2',
  titleClassName = 'text-[18px] font-semibold tracking-tight text-neutral-950',
}: {
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
  titleTag?: 'h2' | 'h3'
  titleClassName?: string
}) {
  const TitleTag = titleTag

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-900">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">{eyebrow}</span>
          <TitleTag className={titleClassName}>{title}</TitleTag>
        </div>
      </div>
      <p className="text-sm leading-6 text-neutral-600">{description}</p>
    </div>
  )
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
        <div className="h-96 bg-muted rounded-xl" />
      </div>
    )
  }

  const surfaceClass = 'rounded-xl border border-neutral-200/80 bg-white/95 p-4 sm:p-6'

  return (
    <div className="pb-16">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href={`https://fonts.googleapis.com/css2?${FONT_OPTIONS.map(f => `family=${f.google}`).join('&')}&display=swap`}
      />

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Brand Settings</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Refine how PinLoop looks, publishes, and behaves for your brand.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-500">
          <Check className="h-3.5 w-3.5" />
          Changes save automatically
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] xl:gap-10">
        <div className="space-y-6">
          <AutomationControl variant="panel" />

          <section className={surfaceClass}>
            <div className="mb-6">
              <SurfaceHeader
                icon={Zap}
                eyebrow="Publishing"
                title="Destination and safety"
                description="Choose where approved pins go and how cautiously PinLoop should ramp up activity."
              />
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-900">Default Pinterest Board</label>
                <p className="text-xs text-neutral-500">Where approved pins should publish by default.</p>
                {loadingBoards ? (
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Fetching your boards...
                  </div>
                ) : (
                  <Select
                    value={form.default_board_id || EMPTY_BOARD_VALUE}
                    onValueChange={value => setForm(p => ({
                      ...p,
                      default_board_id: value === EMPTY_BOARD_VALUE ? '' : value,
                    }))}
                    disabled={!boards.length}
                  >
                    <SelectTrigger className="h-12 w-full rounded-xl border-neutral-200 bg-white px-4 text-sm text-neutral-900 shadow-none focus:ring-2 focus:ring-neutral-900">
                      <SelectValue placeholder="Select a board" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-neutral-200 bg-white shadow-lg">
                      <SelectItem value={EMPTY_BOARD_VALUE} className="rounded-lg py-2.5 text-sm">
                        No default board
                      </SelectItem>
                      {boards.map(b => (
                        <SelectItem key={b.id} value={b.id} className="rounded-lg py-2.5 text-sm">
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-5">
                <SurfaceHeader
                  icon={ShieldCheck}
                  eyebrow="Account protection"
                  title="Warm-up profile"
                  titleTag="h3"
                  titleClassName="text-sm font-semibold text-neutral-950"
                  description="This sets how cautiously PinLoop increases publishing volume to keep your Pinterest account healthy."
                />

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {[
                    {
                      id: 'brand_new' as const,
                      title: 'Brand new',
                      subtitle: 'Created within the last 3 months',
                      detail: 'Starts gently and ramps up over time to avoid early spam signals.',
                      Icon: Sparkles,
                    },
                    {
                      id: 'established' as const,
                      title: 'Established',
                      subtitle: 'Already has account history and activity',
                      detail: 'Begins publishing at full safe velocity from day one.',
                      Icon: Zap,
                    },
                  ].map(option => {
                    const selected = form.account_age_type === option.id

                    return (
                      <motion.button
                        key={option.id}
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setForm(p => ({ ...p, account_age_type: option.id }))}
                        className={`cursor-pointer rounded-xl border p-4 text-left transition-all ${
                          selected
                            ? 'border-neutral-900 bg-white'
                            : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border ${
                              selected ? 'border-neutral-300 bg-neutral-50 text-neutral-900' : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                            }`}>
                              <option.Icon className="h-4.5 w-4.5" />
                            </span>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-neutral-950">{option.title}</div>
                              <div className="mt-1 text-xs leading-5 text-neutral-500">{option.subtitle}</div>
                            </div>
                          </div>
                          <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                            selected
                              ? 'border-neutral-900 bg-neutral-900 text-white'
                              : 'border-neutral-200 bg-white text-transparent'
                          }`}>
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        </div>
                        <p className="mt-4 text-[13px] leading-6 text-neutral-600">{option.detail}</p>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className={surfaceClass}>
            <div className="mb-6">
              <SurfaceHeader
                icon={Store}
                eyebrow="Brand identity"
                title="Core brand profile"
                description="Name your brand clearly so PinLoop can write, render, and label pins consistently."
              />
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-900">Brand Name</label>
                <Input
                  value={form.brand_name}
                  onChange={e => setForm(p => ({ ...p, brand_name: e.target.value }))}
                  placeholder="e.g., Artisan Home Co."
                  className="h-11 rounded-xl border-neutral-200 bg-white px-4"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-900">Brand Description</label>
                <Textarea
                  value={form.brand_description}
                  onChange={e => setForm(p => ({ ...p, brand_description: e.target.value }))}
                  placeholder="A concise description of your brand, products, and taste."
                  rows={4}
                  className="rounded-xl border-neutral-200 bg-white px-4 py-3 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-900">Store URL</label>
                <Input
                  type="url"
                  value={form.store_url}
                  onChange={e => setForm(p => ({ ...p, store_url: e.target.value }))}
                  placeholder="https://yourstore.com"
                  className="h-11 rounded-xl border-neutral-200 bg-white px-4"
                />
                <p className="text-xs text-neutral-500">Used as the destination and CTA source across generated pins.</p>
              </div>
            </div>
          </section>
        </div>

        <section className={surfaceClass}>
          <div className="mb-6">
            <SurfaceHeader
              icon={Palette}
              eyebrow="Visual style"
              title="Creative direction"
              description="Define the visual system PinLoop should follow when composing pins for your feed."
            />
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-neutral-900">Pin Style</label>
                <p className="mt-1 text-xs text-neutral-500">Choose the overall visual treatment for generated pins.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  {
                    id: 'organic' as const,
                    title: 'Organic lifestyle',
                    detail: 'Image-first and native to the feed. Best for high click-through and natural discovery.',
                  },
                  {
                    id: 'editorial' as const,
                    title: 'Editorial campaign',
                    detail: 'Structured magazine-style layouts designed for promotions, launches, and campaign moments.',
                  },
                ].map(option => {
                  const selected = form.pin_layout_mode === option.id

                  return (
                    <motion.button
                      key={option.id}
                      type="button"
                      whileTap={{ scale: 0.985 }}
                      onClick={() => setForm(p => ({ ...p, pin_layout_mode: option.id }))}
                      className={`cursor-pointer rounded-xl border p-5 text-left transition-all ${
                        selected
                          ? 'border-neutral-900 bg-neutral-50'
                          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                            {option.id === 'organic' ? 'Mode 01' : 'Mode 02'}
                          </div>
                          <div className="mt-2 text-base font-semibold tracking-tight text-neutral-950">{option.title}</div>
                        </div>
                        {selected && (
                          <span className="rounded-full border border-neutral-300 bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-700">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="mt-4 text-sm leading-6 text-neutral-600">{option.detail}</p>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-neutral-900">Pin Font</label>
                <p className="mt-1 text-xs text-neutral-500">Curated OCR-approved fonts that Pinterest's visual AI can read. Select one.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {FONT_OPTIONS.map(f => {
                  const isSelected = form.font_choice === f.name

                  return (
                    <motion.button
                      key={f.name}
                      type="button"
                      whileTap={{ scale: 0.985 }}
                      onClick={() => setForm(p => ({ ...p, font_choice: f.name }))}
                      className={`cursor-pointer relative min-h-[94px] rounded-xl border p-3 text-left transition-all sm:min-h-[108px] sm:p-4 ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-50'
                          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
                      }`}
                    >
                      <span className={`absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 bg-white text-transparent'
                      }`}>
                        <Check className="h-3 w-3" />
                      </span>
                      <span
                        className="block truncate pr-6 text-[18px] leading-[1.05] text-neutral-950 sm:text-[24px]"
                        style={{ fontFamily: `'${f.name}', sans-serif` }}
                      >
                        {f.sample}
                      </span>
                      <span className="mt-1.5 block truncate text-[11px] text-neutral-500 sm:mt-2 sm:text-xs">{f.name}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-900">Aesthetic Boundaries</label>
                  <p className="mt-1 text-xs text-neutral-500">Tell the AI Art Director what visual styles to aim for. It will avoid anything outside these boundaries.</p>
                </div>
                <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">Up to 3</span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {AESTHETIC_OPTIONS.map(opt => {
                  const selected = form.aesthetic_boundaries.includes(opt.name)

                  return (
                    <motion.button
                      key={opt.name}
                      type="button"
                      whileTap={{ scale: 0.985 }}
                      onClick={() => toggleAesthetic(opt.name)}
                      className={`cursor-pointer overflow-hidden rounded-xl border text-left transition-all ${
                        selected
                          ? 'border-neutral-900 bg-white'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <div className={`h-16 w-full bg-gradient-to-br ${opt.gradient}`} />
                      <div className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="block text-sm font-semibold text-neutral-950">{opt.name}</span>
                            <span className="mt-1 block text-xs text-neutral-500">{opt.desc}</span>
                          </div>
                          {selected && (
                            <span className="rounded-full bg-neutral-900 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white">
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
