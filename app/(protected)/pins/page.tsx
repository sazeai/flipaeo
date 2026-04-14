'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  ImageIcon,
  MousePointerClick,
  Eye,
  Bookmark,
  Loader2,
  Sparkles,
  Pencil,
  CheckCircle,
  X,
  Check,
  Maximize2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { PinEditModal } from '@/components/pin-edit-modal'

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
  is_mood_board?: boolean
  pinterest_board_id?: string | null
  products?: { title: string; image_url?: string | null; product_url?: string | null } | null
}

interface PinterestBoard {
  id: string
  name: string
}

type RejectReason = 'bad_image' | 'bad_text' | 'wrong_vibe'

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending_approval', label: 'Needs Review' },
  { key: 'queued', label: 'Queued' },
  { key: 'published', label: 'Published' },
  { key: 'generating', label: 'Generating' },
  { key: 'rendered', label: 'Rendered' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'failed', label: 'Failed' },
] as const

const STATUS_LABELS: Record<string, string> = {
  pending_approval: 'Needs Review',
  generating: 'Generating',
  rendered: 'Rendered',
  queued: 'Queued',
  published: 'Published',
  rejected: 'Rejected',
  failed: 'Failed',
}

const STATUS_STYLES: Record<string, string> = {
  generating: 'bg-amber-100/90 text-amber-800',
  rendered: 'bg-sky-100/90 text-sky-800',
  pending_approval: 'bg-orange-100/90 text-orange-800',
  queued: 'bg-violet-100/90 text-violet-800',
  published: 'bg-emerald-100/90 text-emerald-800',
  rejected: 'bg-red-100/90 text-red-700',
  failed: 'bg-red-100/90 text-red-700',
}

export default function PinsPage() {
  const [pins, setPins] = useState<Pin[]>([])
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  // Modal
  const [editingPin, setEditingPin] = useState<Pin | null>(null)

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  // Quick-reject reason picker
  const [rejectingPinId, setRejectingPinId] = useState<string | null>(null)

  // Image viewer
  const [viewingImage, setViewingImage] = useState<{ url: string; title: string } | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Board state (fetched once, shared with modal)
  const [boards, setBoards] = useState<PinterestBoard[]>([])
  const [loadingBoards, setLoadingBoards] = useState(true)
  const [defaultBoardId, setDefaultBoardId] = useState<string>('')

  const fetchPins = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch counts
    const { data: allPins } = await supabase
      .from('pins')
      .select('status')
      .eq('user_id', user.id)

    if (allPins) {
      const counts: Record<string, number> = {}
      for (const p of allPins) {
        counts[p.status] = (counts[p.status] || 0) + 1
      }
      setStatusCounts(counts)
    }

    // Fetch filtered pins
    let query = supabase
      .from('pins')
      .select('*, products(title, image_url, product_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query
    setPins((data as Pin[]) || [])
    setLoading(false)
  }, [filter])

  const fetchBoards = useCallback(async () => {
    setLoadingBoards(true)
    try {
      const res = await fetch('/api/pinterest/boards')
      if (res.ok) {
        const data = await res.json()
        setBoards(data.boards || [])
      }
    } catch (err) {
      console.error('Failed to fetch boards:', err)
    }
    setLoadingBoards(false)
  }, [])

  const fetchDefaultBoard = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: brand } = await supabase
      .from('brand_settings')
      .select('default_board_id')
      .eq('user_id', user.id)
      .single()

    if (brand?.default_board_id) {
      setDefaultBoardId(brand.default_board_id)
    }
  }, [])

  useEffect(() => {
    fetchPins()
    fetchBoards()
    fetchDefaultBoard()
  }, [fetchPins, fetchBoards, fetchDefaultBoard])

  // Clear selection when filter changes
  useEffect(() => {
    setSelected(new Set())
  }, [filter])

  // ─── Actions ───────────────────────────────────────────────

  async function handleApprove(pinId: string, boardId: string) {
    try {
      const res = await fetch('/api/pins/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinIds: [pinId], boardMap: { [pinId]: boardId } }),
      })
      if (res.ok) {
        setPins(prev => prev.map(p => p.id === pinId ? { ...p, status: 'queued' } : p))
        setStatusCounts(prev => ({
          ...prev,
          pending_approval: Math.max(0, (prev.pending_approval || 0) - 1),
          queued: (prev.queued || 0) + 1,
        }))
      }
    } catch (err) {
      console.error('Approve failed:', err)
    }
  }

  async function handleReject(pinId: string, reason: RejectReason) {
    try {
      const res = await fetch('/api/pins/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinId, reason }),
      })
      if (res.ok) {
        setPins(prev => prev.map(p => p.id === pinId ? { ...p, status: 'rejected' } : p))
        setStatusCounts(prev => ({
          ...prev,
          pending_approval: Math.max(0, (prev.pending_approval || 0) - 1),
          rejected: (prev.rejected || 0) + 1,
        }))
      }
    } catch (err) {
      console.error('Reject failed:', err)
    }
  }

  async function handleDelete(pinId: string) {
    const pin = pins.find(p => p.id === pinId)
    const supabase = createClient()
    await supabase.from('pins').delete().eq('id', pinId)
    setPins(prev => prev.filter(p => p.id !== pinId))
    setSelected(prev => { const n = new Set(prev); n.delete(pinId); return n })
    if (pin) {
      setStatusCounts(prev => ({
        ...prev,
        [pin.status]: Math.max(0, (prev[pin.status] || 0) - 1),
      }))
    }
  }

  function handleSaved(updates: { id: string; pin_title: string; pin_description: string; pinterest_board_id?: string }) {
    setPins(prev => prev.map(p => p.id === updates.id ? { ...p, ...updates } : p))
    setEditingPin(null)
  }

  // ─── Bulk actions ──────────────────────────────────────────

  function toggleSelect(pinId: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(pinId)) next.delete(pinId)
      else next.add(pinId)
      return next
    })
  }

  function selectAllVisible() {
    setSelected(new Set(pins.map(p => p.id)))
  }

  async function bulkApprove() {
    setBulkLoading(true)
    const ids = [...selected].filter(id => pins.find(p => p.id === id)?.status === 'pending_approval')
    if (ids.length === 0) { setBulkLoading(false); return }

    const boardMap: Record<string, string> = {}
    const fallbackBoard = defaultBoardId || boards[0]?.id || ''
    for (const id of ids) {
      const pin = pins.find(p => p.id === id)
      boardMap[id] = pin?.pinterest_board_id || fallbackBoard
    }

    try {
      const res = await fetch('/api/pins/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinIds: ids, boardMap }),
      })
      if (res.ok) {
        setPins(prev => prev.map(p => ids.includes(p.id) ? { ...p, status: 'queued' } : p))
        setStatusCounts(prev => ({
          ...prev,
          pending_approval: Math.max(0, (prev.pending_approval || 0) - ids.length),
          queued: (prev.queued || 0) + ids.length,
        }))
        setSelected(new Set())
      }
    } catch (err) {
      console.error('Bulk approve failed:', err)
    }
    setBulkLoading(false)
  }

  async function bulkReject(reason: RejectReason) {
    setBulkLoading(true)
    const ids = [...selected].filter(id => pins.find(p => p.id === id)?.status === 'pending_approval')

    for (const id of ids) {
      try {
        await fetch('/api/pins/reject', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pinId: id, reason }),
        })
      } catch {}
    }

    setPins(prev => prev.map(p => ids.includes(p.id) ? { ...p, status: 'rejected' } : p))
    setStatusCounts(prev => ({
      ...prev,
      pending_approval: Math.max(0, (prev.pending_approval || 0) - ids.length),
      rejected: (prev.rejected || 0) + ids.length,
    }))
    setSelected(new Set())
    setBulkLoading(false)
  }

  // ─── Derived state ────────────────────────────────────────

  const pendingCount = statusCounts['pending_approval'] || 0
  const totalCount = Object.values(statusCounts).reduce((a, b) => a + b, 0)
  const selectedCount = selected.size
  const selectedPendingCount = [...selected].filter(id => pins.find(p => p.id === id)?.status === 'pending_approval').length
  const anySelected = selectedCount > 0

  // ─── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded-xl w-48" />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-8 w-20 bg-muted rounded-full" />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-neutral-200/70 overflow-hidden">
              <div className="mx-3 mt-3 rounded-xl bg-muted aspect-[3/4]" />
              <div className="px-3.5 pt-3 pb-3.5 space-y-2">
                <div className="h-3 bg-muted rounded w-16" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">My Pins</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Review, approve, and track all your generated pins.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_FILTERS.map(({ key, label }) => {
          const count = key === 'all' ? totalCount : (statusCounts[key] || 0)
          const isActive = filter === key
          return (
            <button
              key={key}
              onClick={() => { setLoading(true); setFilter(key) }}
              className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`text-[10px] font-bold min-w-[18px] text-center px-1 py-px rounded-md ${
                  isActive ? 'bg-white/20 text-white' : 'bg-neutral-200/60 text-neutral-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Bulk selection bar */}
      {anySelected && (
        <div className="flex items-center gap-3 px-4 py-3 bg-neutral-900 text-white rounded-xl">
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <div className="w-px h-4 bg-white/20" />
          <button onClick={() => setSelected(new Set())} className="cursor-pointer text-xs font-medium text-white/70 hover:text-white transition-colors">
            Deselect all
          </button>
          <button onClick={selectAllVisible} className="cursor-pointer text-xs font-medium text-white/70 hover:text-white transition-colors">
            Select all
          </button>
          <div className="flex-1" />
          {selectedPendingCount > 0 && (
            <>
              <button
                onClick={bulkApprove}
                disabled={bulkLoading}
                className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {bulkLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                Approve {selectedPendingCount}
              </button>
              <button
                onClick={() => bulkReject('wrong_vibe')}
                disabled={bulkLoading}
                className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <X className="w-3 h-3" /> Reject {selectedPendingCount}
              </button>
            </>
          )}
        </div>
      )}

      {/* Month 1 warmup banner */}
      {filter === 'pending_approval' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-4">
          <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 text-sm">Asset Vault & Publishing Rate</h4>
            <p className="text-blue-800 text-xs mt-1 leading-relaxed">
              To protect your Pinterest account from algorithmic spam filters during Month 1, publishing is throttled to a safe rate of ~2 pins per day. Your AI engine will still generate your full monthly quota into your Scheduled Vault here.
            </p>
          </div>
        </div>
      )}

      {/* Pin Gallery */}
      {pins.length === 0 ? (
        <div className="text-center py-20 bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-200">
          <ImageIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="font-semibold text-neutral-600 mb-1">
            {filter === 'pending_approval' ? 'All caught up!' : 'No pins yet'}
          </h3>
          <p className="text-sm text-neutral-400 max-w-sm mx-auto">
            {filter === 'pending_approval'
              ? "When your PinLoop engine generates new pins, they'll appear here for review."
              : 'Pins will appear here as the engine generates them from your products.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {pins.map(pin => {
            const imageUrl = pin.rendered_image_url || pin.generated_image_url
            const isSelected = selected.has(pin.id)
            const isPublished = pin.status === 'published'

            return (
              <div
                key={pin.id}
                className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isSelected
                    ? 'ring-2 ring-neutral-900 ring-offset-2 border-neutral-300'
                    : 'border-neutral-200/70 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-200/50'
                }`}
              >
                {/* Image container — fixed height, padded, light bg */}
                <div className="relative mx-2 mt-2 sm:mx-3 sm:mt-3 rounded-xl bg-neutral-100 overflow-hidden">
                  <div className="flex items-center justify-center">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={pin.pin_title || 'Pin'}
                        className="w-full h-full object-cover rounded-xl"
                        loading="lazy"
                      />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-neutral-300" />
                    )}
                  </div>

                  {/* Status badge */}
                  <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur-sm ${
                    STATUS_STYLES[pin.status] || 'bg-neutral-100/90 text-neutral-600'
                  }`}>
                    {STATUS_LABELS[pin.status] || pin.status}
                  </span>

                  {/* Checkbox — always visible on mobile */}
                  <button
                    onClick={e => { e.stopPropagation(); toggleSelect(pin.id) }}
                    className={`cursor-pointer absolute top-2 right-2 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-neutral-900 border-neutral-900 text-white'
                        : 'bg-white/90 border-white/70 backdrop-blur-sm opacity-100 md:opacity-0 md:group-hover:opacity-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                  </button>

                  {/* Expand image — always visible on mobile */}
                  {imageUrl && (
                    <button
                      onClick={e => { e.stopPropagation(); setViewingImage({ url: imageUrl, title: pin.pin_title || 'Pin' }); setZoomLevel(1) }}
                      className="cursor-pointer absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-black/50 backdrop-blur-sm text-white/80 hover:text-white flex items-center justify-center transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      title="View full image"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Content section */}
                <div className="px-2 pt-3 pb-3.5 sm:px-3.5 space-y-1">
                  {pin.products?.title && (
                    <p className="text-[11px] font-medium text-emerald-600 truncate">{pin.products.title}</p>
                  )}
                  <p className="text-[13px] font-semibold text-neutral-900 line-clamp-2 leading-snug mt-0.5">
                    {pin.pin_title || 'Untitled Pin'}
                  </p>

                  {/* Published analytics */}
                  {isPublished && (pin.impressions > 0 || pin.outbound_clicks > 0 || pin.saves > 0) && (
                    <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-neutral-100 text-[11px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {pin.impressions.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="w-3 h-3" /> {pin.outbound_clicks.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-3 h-3" /> {pin.saves.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {/* Quick actions */}
                  {pin.status === 'pending_approval' ? (
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const board = defaultBoardId || boards[0]?.id
                            if (board) handleApprove(pin.id, board)
                          }}
                          className="cursor-pointer flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 sm:px-2 sm:py-2 bg-emerald-600 text-white rounded-lg text-[11px] sm:text-xs font-semibold hover:bg-emerald-700 transition-colors min-w-0"
                        >
                          <CheckCircle className="w-3.5 h-3.5 shrink-0 hidden md:block" /> <span className="truncate">Approve</span>
                        </button>
                        <button
                          onClick={() => setRejectingPinId(rejectingPinId === pin.id ? null : pin.id)}
                          className={`cursor-pointer flex-1 flex items-center justify-center gap-1 px-1.5 py-1.5 sm:px-2 sm:py-2 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors min-w-0 ${
                            rejectingPinId === pin.id
                              ? 'bg-red-600 text-white'
                              : 'bg-red-500 text-white hover:bg-red-600'
                          }`}
                        >
                          <X className="w-3.5 h-3.5 shrink-0 hidden md:block" /> <span className="truncate">Reject</span>
                        </button>
                        <button
                          onClick={() => setEditingPin(pin)}
                          className="cursor-pointer flex items-center justify-center w-8 h-8 shrink-0 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                          title="Edit Pin"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {rejectingPinId === pin.id && (
                        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                          {[
                            { reason: 'bad_image' as RejectReason, label: 'Image', fullLabel: 'Bad Image' },
                            { reason: 'bad_text' as RejectReason, label: 'Text', fullLabel: 'Bad Text' },
                            { reason: 'wrong_vibe' as RejectReason, label: 'Vibe', fullLabel: 'Wrong Vibe' },
                          ].map(({ reason, label, fullLabel }) => (
                            <button
                              key={reason}
                              onClick={() => { handleReject(pin.id, reason); setRejectingPinId(null) }}
                              className="cursor-pointer flex-1 px-1 py-1.5 text-[10px] sm:text-[11px] font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors text-center"
                            >
                              <span className="sm:hidden">{label}</span><span className="hidden sm:inline">{fullLabel}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingPin(pin)}
                      className="cursor-pointer w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors"
                    >
                      <Pencil className="w-3 h-3" /> Edit Pin
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Pin Modal */}
      <PinEditModal
        pin={editingPin}
        boards={boards}
        loadingBoards={loadingBoards}
        defaultBoardId={defaultBoardId}
        onClose={() => setEditingPin(null)}
        onSaved={handleSaved}
        onApproved={(pinId, boardId) => { handleApprove(pinId, boardId); setEditingPin(null) }}
        onRejected={(pinId, reason) => { handleReject(pinId, reason); setEditingPin(null) }}
        onDeleted={(pinId) => { handleDelete(pinId); setEditingPin(null) }}
      />

      {/* Fullscreen Image Viewer */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center"
          onClick={() => setViewingImage(null)}
        >
          {/* Top bar */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-3 z-10">
            <p className="text-white/70 text-sm font-medium truncate max-w-[60%]">{viewingImage.title}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); setZoomLevel(z => Math.max(0.5, z - 0.5)) }}
                className="cursor-pointer w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-white/60 text-xs font-mono min-w-[3rem] text-center">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={e => { e.stopPropagation(); setZoomLevel(z => Math.min(5, z + 0.5)) }}
                className="cursor-pointer w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewingImage(null)}
                className="cursor-pointer w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Image */}
          <div
            className="overflow-auto max-w-full max-h-full flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
            style={{ touchAction: 'pinch-zoom' }}
          >
            <img
              src={viewingImage.url}
              alt={viewingImage.title}
              className="transition-transform duration-200 ease-out rounded-lg select-none"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', maxHeight: '85vh', maxWidth: '90vw', objectFit: 'contain' }}
              draggable={false}
              onDoubleClick={() => setZoomLevel(z => z === 1 ? 2.5 : 1)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
