'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Save, Loader2, PauseCircle, PlayCircle, Rocket, ShieldAlert, Moon, Sun } from 'lucide-react'

const FONT_OPTIONS = [
  'Playfair Display',
  'Inter',
  'Roboto',
  'Outfit',
  'Poppins',
  'Montserrat',
  'Lora',
  'Merriweather',
  'Raleway',
  'DM Sans',
]

const AESTHETIC_OPTIONS = [
  'Modern & Minimalist',
  'Warm & Cozy',
  'Bold & Vibrant',
  'Earthy & Natural',
  'Luxury & Premium',
  'Playful & Fun',
  'Scandinavian',
  'Industrial',
  'Bohemian',
  'Coastal',
]

interface BrandSettingsData {
  brand_name: string
  brand_description: string
  store_url: string
  logo_url: string
  font_choice: string
  aesthetic_boundaries: string[]
  automation_paused: boolean
  autopilot_enabled: boolean
  account_age_type: 'brand_new' | 'established' | ''
  pin_layout_mode: 'organic' | 'editorial'
}

export default function BrandSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [form, setForm] = useState<BrandSettingsData>({
    brand_name: '',
    brand_description: '',
    store_url: '',
    logo_url: '',
    font_choice: 'Playfair Display',
    aesthetic_boundaries: [],
    automation_paused: false,
    autopilot_enabled: false,
    account_age_type: '',
    pin_layout_mode: 'organic',
  })
  const [approvedPinsCount, setApprovedPinsCount] = useState(0)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('brand_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        setSettingsId(data.id)
        setForm({
          brand_name: data.brand_name || '',
          brand_description: data.brand_description || '',
          store_url: data.store_url || '',
          logo_url: data.logo_url || '',
          font_choice: data.font_choice || 'Playfair Display',
          aesthetic_boundaries: (data.aesthetic_boundaries as string[]) || [],
          automation_paused: data.automation_paused || false,
          autopilot_enabled: data.autopilot_enabled || false,
          account_age_type: data.account_age_type || '',
          pin_layout_mode: (data.pin_layout_mode as 'organic' | 'editorial') || 'organic',
        })
      }

      // Check how many pins the user has approved (Trust Ladder)
      const { count } = await supabase
        .from('pins')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['queued', 'published'])
      
      setApprovedPinsCount(count || 0)
      
      setLoading(false)
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

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      brand_name: form.brand_name,
      brand_description: form.brand_description,
      store_url: form.store_url,
      logo_url: form.logo_url,
      font_choice: form.font_choice,
      aesthetic_boundaries: form.aesthetic_boundaries,
      automation_paused: form.automation_paused,
      autopilot_enabled: form.autopilot_enabled,
      account_age_type: form.account_age_type,
      pin_layout_mode: form.pin_layout_mode,
    }

    if (settingsId) {
      await supabase.from('brand_settings').update(payload).eq('id', settingsId)
    } else {
      const { data } = await supabase.from('brand_settings').insert(payload).select('id').single()
      if (data) setSettingsId(data.id)
    }

    // Feature 13: Auto-configure warmup_phase based on account age
    if (form.account_age_type) {
      const warmupPhase = form.account_age_type === 'brand_new' ? 'warmup_partial' : 'full'
      await supabase
        .from('pinterest_connections')
        .update({ warmup_phase: warmupPhase })
        .eq('user_id', user.id)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-64" />
        <div className="h-96 bg-muted rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Brand Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure your brand identity. This controls how your pins look and feel.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Universal Pause — Sleep Mode */}
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
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                form.automation_paused ? 'bg-red-400' : 'bg-emerald-500'
              }`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                form.automation_paused ? 'translate-x-1' : 'translate-x-6'
              }`} />
            </button>
          </div>
        </div>

        {/* Full Autopilot Toggle */}
        <div className={`rounded-2xl border-2 p-5 transition-colors ${
          form.autopilot_enabled
            ? 'border-indigo-300 bg-indigo-50/50'
            : 'border-neutral-200 bg-neutral-50'
        } ${approvedPinsCount < 50 ? 'opacity-70' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {approvedPinsCount < 50 ? (
                <ShieldAlert className="w-6 h-6 text-neutral-400 shrink-0" />
              ) : (
                <Rocket className={`w-6 h-6 shrink-0 ${form.autopilot_enabled ? 'text-indigo-600' : 'text-neutral-500'}`} />
              )}
              <div>
                <h3 className="font-semibold text-sm">Full Autopilot</h3>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px]">
                  {approvedPinsCount < 50
                    ? `Unlock by approving 50 pins. (Current: ${approvedPinsCount}/50)`
                    : form.autopilot_enabled 
                      ? 'AI automatically publishes pins.' 
                      : 'AI waits for your manual approval.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={approvedPinsCount < 50}
              onClick={() => setForm(p => ({ ...p, autopilot_enabled: !p.autopilot_enabled }))}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed ${
                form.autopilot_enabled ? 'bg-indigo-500' : 'bg-neutral-300'
              }`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                form.autopilot_enabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Feature 13: Account Age Question (Warm-Up Ramp) */}
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
              className="p-4 rounded-xl border-2 border-blue-200 bg-white hover:border-blue-400 transition-all text-left"
            >
              <div className="font-semibold text-sm">🌱 Brand New</div>
              <p className="text-xs text-muted-foreground mt-1">
                Created in the last 3 months. We&apos;ll ramp up slowly (1 pin/day → 5 pins/day over 4 weeks).
              </p>
            </button>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, account_age_type: 'established' }))}
              className="p-4 rounded-xl border-2 border-blue-200 bg-white hover:border-blue-400 transition-all text-left"
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

      {/* Pin Style Mode (Zero-Text Pivot) */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Pin Style</h3>
          <p className="text-xs text-muted-foreground mt-0.5">How your pins appear in the Pinterest feed.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, pin_layout_mode: 'organic' }))}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              form.pin_layout_mode === 'organic'
                ? 'border-neutral-900 bg-neutral-50'
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
          </button>
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, pin_layout_mode: 'editorial' }))}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              form.pin_layout_mode === 'editorial'
                ? 'border-neutral-900 bg-neutral-50'
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
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Brand Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Brand Name *</label>
          <input
            type="text"
            value={form.brand_name}
            onChange={e => setForm(p => ({ ...p, brand_name: e.target.value }))}
            placeholder="e.g., Artisan Home Co."
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
          />
        </div>

        {/* Brand Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Brand Description</label>
          <textarea
            value={form.brand_description}
            onChange={e => setForm(p => ({ ...p, brand_description: e.target.value }))}
            placeholder="A brief description of your brand and what you sell..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
          />
        </div>

        {/* Store URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Store URL</label>
          <input
            type="url"
            value={form.store_url}
            onChange={e => setForm(p => ({ ...p, store_url: e.target.value }))}
            placeholder="https://yourstore.com"
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
          />
          <p className="text-xs text-muted-foreground">This appears as the CTA badge on your pins.</p>
        </div>

        {/* Font Choice */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Pin Font</label>
          <select
            value={form.font_choice}
            onChange={e => setForm(p => ({ ...p, font_choice: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
          >
            {FONT_OPTIONS.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Curated OCR-approved fonts that Pinterest's visual AI can read.
          </p>
        </div>

        {/* Aesthetic Boundaries */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Aesthetic Boundaries (pick up to 3)</label>
          <p className="text-xs text-muted-foreground">
            Tell the AI Art Director what visual styles to aim for. It will avoid anything outside these boundaries.
          </p>
          <div className="flex flex-wrap gap-2">
            {AESTHETIC_OPTIONS.map(tag => {
              const selected = form.aesthetic_boundaries.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleAesthetic(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    selected
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <button
          onClick={handleSave}
          disabled={saving || !form.brand_name}
          className="bg-neutral-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Save Settings</>
          )}
        </button>
        {saved && (
          <span className="text-sm text-emerald-600 font-medium animate-in fade-in">
            ✓ Saved successfully
          </span>
        )}
      </div>
    </div>
  )
}
