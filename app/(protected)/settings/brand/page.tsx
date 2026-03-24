'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Save, Loader2 } from 'lucide-react'

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
  })

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
        })
      }
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
    }

    if (settingsId) {
      await supabase.from('brand_settings').update(payload).eq('id', settingsId)
    } else {
      const { data } = await supabase.from('brand_settings').insert(payload).select('id').single()
      if (data) setSettingsId(data.id)
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
