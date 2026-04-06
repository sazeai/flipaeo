'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  CheckCircle,
  X,
  ThumbsDown,
  Loader2,
  ImageIcon,
  Sparkles,
  Pin,
} from 'lucide-react'

interface PendingPin {
  id: string
  pin_title: string | null
  pin_description: string | null
  rendered_image_url: string | null
  generated_image_url: string | null
  template_id: string | null
  is_mood_board: boolean
  created_at: string
  products?: { title: string; image_url: string | null } | null
}

interface PinterestBoard {
  id: string
  name: string
}

type RejectReason = 'bad_image' | 'bad_text' | 'wrong_vibe'

export default function ApprovalPage() {
  const [pins, setPins] = useState<PendingPin[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<Set<string>>(new Set())
  const [approveAllLoading, setApproveAllLoading] = useState(false)
  const [rejectingPin, setRejectingPin] = useState<string | null>(null)

  // Board state
  const [boards, setBoards] = useState<PinterestBoard[]>([])
  const [loadingBoards, setLoadingBoards] = useState(true)
  const [defaultBoardId, setDefaultBoardId] = useState<string>('')
  // Per-pin board selection map
  const [pinBoardMap, setPinBoardMap] = useState<Record<string, string>>({})

  const fetchPending = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('pins')
      .select('*, products(title, image_url)')
      .eq('user_id', user.id)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })

    setPins((data as PendingPin[]) || [])
    setLoading(false)
  }, [])

  // Fetch Pinterest boards
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

  // Fetch default board from brand settings
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
    fetchPending()
    fetchBoards()
    fetchDefaultBoard()
  }, [fetchPending, fetchBoards, fetchDefaultBoard])

  // Initialize pinBoardMap when pins or boards load
  useEffect(() => {
    if (pins.length > 0 && boards.length > 0) {
      const firstBoardId = boards[0]?.id || ''
      const initialMap: Record<string, string> = {}
      for (const pin of pins) {
        if (!pin.is_mood_board) {
          initialMap[pin.id] = firstBoardId
        }
      }
      setPinBoardMap(prev => ({ ...initialMap, ...prev }))
    }
  }, [pins, boards])

  function handleBoardChange(pinId: string, boardId: string) {
    setPinBoardMap(prev => ({ ...prev, [pinId]: boardId }))
  }

  async function handleApprove(pinId: string) {
    setActioning(prev => new Set(prev).add(pinId))
    try {
      const pin = pins.find(p => p.id === pinId)
      const boardId = pin?.is_mood_board ? defaultBoardId : pinBoardMap[pinId]

      const res = await fetch('/api/pins/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinIds: [pinId], boardMap: { [pinId]: boardId } }),
      })
      if (res.ok) {
        setPins(prev => prev.filter(p => p.id !== pinId))
      }
    } catch (err) {
      console.error('Approve failed:', err)
    }
    setActioning(prev => {
      const next = new Set(prev)
      next.delete(pinId)
      return next
    })
  }

  async function handleReject(pinId: string, reason: RejectReason) {
    setActioning(prev => new Set(prev).add(pinId))
    setRejectingPin(null)
    try {
      const res = await fetch('/api/pins/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinId, reason }),
      })
      if (res.ok) {
        setPins(prev => prev.filter(p => p.id !== pinId))
      }
    } catch (err) {
      console.error('Reject failed:', err)
    }
    setActioning(prev => {
      const next = new Set(prev)
      next.delete(pinId)
      return next
    })
  }

  async function handleApproveAll() {
    setApproveAllLoading(true)
    try {
      const allPinIds = pins.map(p => p.id)
      // Build board map: mood boards go to default board, others use their selected board
      const boardMap: Record<string, string> = {}
      for (const pin of pins) {
        boardMap[pin.id] = pin.is_mood_board ? defaultBoardId : (pinBoardMap[pin.id] || boards[0]?.id || '')
      }

      const res = await fetch('/api/pins/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinIds: allPinIds, boardMap }),
      })
      if (res.ok) {
        setPins([])
      }
    } catch (err) {
      console.error('Approve all failed:', err)
    }
    setApproveAllLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-64" />
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="mb-4 aspect-[2/3] bg-muted rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pin Approval</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pins.length === 0
              ? 'All caught up! 🎉'
              : `${pins.length} pin${pins.length !== 1 ? 's' : ''} awaiting your review`}
          </p>
        </div>
        {pins.length > 0 && (
          <button
            onClick={handleApproveAll}
            disabled={approveAllLoading}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {approveAllLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Approve All ({pins.length})
          </button>
        )}
      </div>

      {/* Month 1 Warmup Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-4">
        <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-blue-900 text-sm">Asset Vault & Publishing Rate</h4>
          <p className="text-blue-800 text-xs mt-1 leading-relaxed">
            To protect your Pinterest account from algorithmic spam filters during Month 1, publishing is throttled to a safe rate of ~2 pins per day. Your AI engine will still generate your full monthly quota into your Scheduled Vault here.
          </p>
        </div>
      </div>

      {/* Empty State */}
      {pins.length === 0 ? (
        <div className="text-center py-20 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
          <Sparkles className="w-14 h-14 text-neutral-300 mx-auto mb-4" />
          <h3 className="font-semibold text-neutral-700 mb-2 text-lg">No pins awaiting approval</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            When your PinLoop engine generates new pins, they&apos;ll appear here for your review before publishing to Pinterest.
          </p>
        </div>
      ) : (
        /* Masonry Grid */
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
          {pins.map(pin => {
            const imageUrl = pin.rendered_image_url || pin.generated_image_url
            const isActioning = actioning.has(pin.id)
            const isRejecting = rejectingPin === pin.id

            return (
              <div
                key={pin.id}
                style={{ breakInside: 'avoid' }}
                className="mb-4 bg-white border border-neutral-200/80 rounded-2xl overflow-hidden group relative hover:border-neutral-300 hover:shadow-md transition-all duration-200"
              >
                {/* Loading overlay */}
                {isActioning && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
                  </div>
                )}

                {/* Image */}
                <div className="relative bg-neutral-50">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={pin.pin_title || 'Pin'}
                      className="w-full h-auto block"
                      loading="lazy"
                      style={{ minHeight: '140px' }}
                    />
                  ) : (
                    <div className="w-full flex items-center justify-center py-20">
                      <ImageIcon className="w-10 h-10 text-neutral-200" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="px-3.5 py-3 border-t border-neutral-100">
                  <h3 className="font-semibold text-sm text-neutral-900 line-clamp-2 leading-snug">
                    {pin.pin_title || 'Untitled Pin'}
                  </h3>
                  {pin.products?.title && (
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">{pin.products.title}</p>
                  )}

                  {/* Board Selector or Mood Board Badge */}
                  <div className="mt-2">
                    {pin.is_mood_board ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                        <Pin className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="text-[10px] font-semibold text-amber-700 leading-tight">
                          Mood Board · No Link
                        </span>
                      </div>
                    ) : (
                      <>
                        {loadingBoards ? (
                          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                            <Loader2 className="w-3 h-3 animate-spin" /> Loading boards...
                          </div>
                        ) : (
                          <select
                            value={pinBoardMap[pin.id] || boards[0]?.id || ''}
                            onChange={e => handleBoardChange(pin.id, e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-400"
                          >
                            {boards.map(b => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                        )}
                      </>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-3 relative">
                    <button
                      onClick={() => handleApprove(pin.id)}
                      disabled={isActioning}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => setRejectingPin(isRejecting ? null : pin.id)}
                      disabled={isActioning}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>

                  {/* Reject reason popover */}
                  {isRejecting && (
                    <div className="mt-2 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 animate-in fade-in slide-in-from-top-1 duration-150">
                      <p className="text-[10px] uppercase tracking-wide font-bold text-neutral-400 mb-2">Why?</p>
                      <div className="flex flex-col gap-1.5">
                        {([
                          { key: 'bad_image', label: '🖼️ Bad Image', desc: 'Image quality or content' },
                          { key: 'bad_text', label: '📝 Bad Text', desc: 'Title or overlay text' },
                          { key: 'wrong_vibe', label: '🎨 Wrong Vibe', desc: 'Doesn\'t match brand' },
                        ] as { key: RejectReason; label: string; desc: string }[]).map(r => (
                          <button
                            key={r.key}
                            onClick={() => handleReject(pin.id, r.key)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-white border border-transparent hover:border-neutral-200 transition-all text-xs"
                          >
                            <span className="font-medium">{r.label}</span>
                            <span className="text-neutral-400 text-[10px]">{r.desc}</span>
                          </button>
                        ))}
                      </div>
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
