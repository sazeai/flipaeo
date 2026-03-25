'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  ImageIcon,
  MousePointerClick,
  Eye,
  Bookmark,
  Trash2,
  ExternalLink,
} from 'lucide-react'

interface Pin {
  id: string
  pin_title: string | null
  pin_description: string | null
  rendered_image_url: string | null
  generated_image_url: string | null
  status: string
  outbound_clicks: number
  impressions: number
  saves: number
  published_at: string | null
  pin_url: string | null
  created_at: string
  products?: { title: string } | null
}

export default function PinsPage() {
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    async function fetchPins() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('pins')
        .select('*, products(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data } = await query
      setPins((data as Pin[]) || [])
      setLoading(false)
    }
    fetchPins()
  }, [filter])

  async function handleDelete(pinId: string) {
    const supabase = createClient()
    await supabase.from('pins').delete().eq('id', pinId)
    setPins(prev => prev.filter(p => p.id !== pinId))
  }

  const statusStyles: Record<string, string> = {
    generating: 'bg-amber-100 text-amber-700',
    rendered: 'bg-blue-100 text-blue-700',
    pending_approval: 'bg-orange-100 text-orange-700',
    queued: 'bg-brand-100 text-brand-700',
    published: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100/60 text-red-600',
    failed: 'bg-red-100 text-red-700',
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="aspect-[2/3] bg-muted rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Pins</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pins.length} pin{pins.length !== 1 ? 's' : ''} generated
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending_approval', 'generating', 'rendered', 'queued', 'published', 'rejected', 'failed'].map(f => (
          <button
            key={f}
            onClick={() => { setLoading(true); setFilter(f) }}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all capitalize ${
              filter === f
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Pin Gallery */}
      {pins.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
          <ImageIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="font-medium text-neutral-600 mb-1">No pins yet</h3>
          <p className="text-sm text-muted-foreground">
            Pins will appear here as the engine generates them from your products.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pins.map(pin => {
            const imageUrl = pin.rendered_image_url || pin.generated_image_url
            return (
              <div key={pin.id} className="group relative bg-white border rounded-2xl overflow-hidden hover:shadow-md transition-all">
                {/* Image */}
                <div className="aspect-[2/3] bg-neutral-100 relative">
                  {imageUrl ? (
                    <img src={imageUrl} alt={pin.pin_title || 'Pin'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-neutral-300" />
                    </div>
                  )}
                  {/* Status badge */}
                  <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusStyles[pin.status] || 'bg-neutral-100'}`}>
                    {pin.status}
                  </span>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      {pin.pin_url && (
                        <a
                          href={pin.pin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white rounded-full shadow-lg hover:bg-neutral-100 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(pin.id)}
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{pin.pin_title || 'Untitled Pin'}</p>
                  {(pin as any).products?.title && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {(pin as any).products.title}
                    </p>
                  )}
                  {/* Stats (only for published) */}
                  {pin.status === 'published' && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="w-3 h-3" /> {pin.outbound_clicks}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {pin.impressions}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-3 h-3" /> {pin.saves}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
