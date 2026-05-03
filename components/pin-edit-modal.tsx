'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Loader2,
  CheckCircle,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

interface PinData {
  id: string
  product_id?: string | null
  pin_title: string | null
  pin_description: string | null
  rendered_image_url: string | null
  generated_image_url: string | null
  status: string
  is_mood_board?: boolean
  pinterest_board_id?: string | null
  products?: { title: string; image_url?: string | null; product_url?: string | null } | null
}

interface PinterestBoard {
  id: string
  name: string
}

type RejectReason = 'bad_image' | 'wrong_vibe'

interface PinEditModalProps {
  pin: PinData | null
  boards: PinterestBoard[]
  loadingBoards: boolean
  defaultBoardId: string
  onClose: () => void
  onSaved: (updates: { id: string; pin_title: string; pin_description: string; pinterest_board_id?: string }) => void
  onApproved: (pinId: string, boardId: string) => void
  onRejected: (pinId: string, reason: RejectReason) => void
  onDeleted: (pinId: string) => void
}

const TITLE_MAX = 100
const DESC_MAX = 500

const REJECT_REASONS: { key: RejectReason; label: string; icon: string }[] = [
  { key: 'bad_image', label: 'Bad image', icon: '🖼️' },
  { key: 'wrong_vibe', label: 'Wrong vibe', icon: '🎨' },
]

export function PinEditModal({
  pin,
  boards,
  loadingBoards,
  defaultBoardId,
  onClose,
  onSaved,
  onApproved,
  onRejected,
  onDeleted,
}: PinEditModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [boardId, setBoardId] = useState('')
  const [destinationUrl, setDestinationUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [showRejectMenu, setShowRejectMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Hydrate form when pin changes
  useEffect(() => {
    if (pin) {
      setTitle(pin.pin_title || '')
      setDescription(pin.pin_description || '')
      setBoardId(pin.pinterest_board_id || defaultBoardId || boards[0]?.id || '')
      setDestinationUrl(pin.products?.product_url || '')
      setShowRejectMenu(false)
      setShowDeleteConfirm(false)
    }
  }, [pin, defaultBoardId, boards])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!pin) return null

  const isPending = pin.status === 'pending_approval'

  const hasChanges =
    title !== (pin.pin_title || '') ||
    description !== (pin.pin_description || '') ||
    boardId !== (pin.pinterest_board_id || defaultBoardId || boards[0]?.id || '') ||
    destinationUrl !== (pin.products?.product_url || '')

  async function handleSave() {
    setSaving(true)
    try {
      // Save pin metadata
      const res = await fetch(`/api/pins/${pin!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin_title: title,
          pin_description: description,
          pinterest_board_id: boardId || undefined,
        }),
      })

      // If destination URL changed, also update the product
      if (pin!.product_id && destinationUrl !== (pin!.products?.product_url || '')) {
        await fetch(`/api/products/${pin!.product_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_url: destinationUrl || null }),
        })
      }

      if (res.ok) {
        onSaved({ id: pin!.id, pin_title: title, pin_description: description, pinterest_board_id: boardId })
      }
    } catch (err) {
      console.error('Save failed:', err)
    }
    setSaving(false)
  }

  async function handleSaveAndApprove() {
    if (!boardId) {
      toast.error("Please connect your Pinterest account and select a default board first.")
      return
    }

    setApproving(true)
    try {
      // Save first
      await fetch(`/api/pins/${pin!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin_title: title,
          pin_description: description,
          pinterest_board_id: boardId || undefined,
        }),
      })
      // Then approve
      onApproved(pin!.id, boardId)
    } catch (err) {
      console.error('Save & Approve failed:', err)
    }
    setApproving(false)
  }

  return (
    <AnimatePresence>
      {pin && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 md:w-full md:max-w-lg md:max-h-[90vh] flex flex-col"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200/60 flex flex-col overflow-hidden max-h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 shrink-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-bold text-neutral-900">Edit Pin</h2>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pin.status === 'pending_approval' ? 'bg-orange-100 text-orange-700' :
                    pin.status === 'queued' ? 'bg-blue-100 text-blue-700' :
                      pin.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                        pin.status === 'rejected' ? 'bg-red-100 text-red-600' :
                          'bg-neutral-100 text-neutral-600'
                    }`}>
                    {pin.status === 'pending_approval' ? 'Needs Review' : pin.status}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              </div>

              {/* Form */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-700">Title</label>
                    <span className={`text-[10px] font-medium tabular-nums ${title.length > TITLE_MAX ? 'text-red-500' : 'text-neutral-400'
                      }`}>
                      {title.length}/{TITLE_MAX}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Pin title..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f2f3f5] border border-[#e2e4e7]/80 focus:border-neutral-300 transition-all resize-none text-sm text-neutral-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-700">Description</label>
                    <span className={`text-[10px] font-medium tabular-nums ${description.length > DESC_MAX ? 'text-red-500' : 'text-neutral-400'
                      }`}>
                      {description.length}/{DESC_MAX}
                    </span>
                  </div>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Pin description..."
                    rows={4}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f2f3f5] border border-[#e2e4e7]/80 focus:border-neutral-300 transition-all resize-none text-sm text-neutral-500"
                  />
                </div>

                {/* Destination URL (editable) */}
                <div>
                  <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Destination URL</label>
                  <input
                    type="url"
                    value={destinationUrl}
                    onChange={e => setDestinationUrl(e.target.value)}
                    placeholder="https://your-store.com/product/..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border transition-all text-sm ${
                      destinationUrl && !/^https?:\/\/.+/.test(destinationUrl)
                        ? 'bg-red-50 border-red-200 text-red-600 focus:border-red-300'
                        : 'bg-[#f2f3f5] border-[#e2e4e7]/80 text-neutral-700 focus:border-neutral-300'
                    }`}
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    {destinationUrl && !/^https?:\/\/.+/.test(destinationUrl)
                      ? '⚠️ Invalid URL — must start with https:// to publish successfully.'
                      : 'From your product — people go here when they click this pin on Pinterest.'}
                  </p>
                </div>

                {/* Board */}
                <div>
                  <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Pinterest Board</label>
                  {loadingBoards ? (
                    <div className="flex items-center gap-2 px-3.5 py-2.5 text-xs text-neutral-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading boards...
                    </div>
                  ) : boards.length === 0 ? (
                    <div className="w-full px-3.5 py-2.5 border bg-[#f2f3f5] rounded-xl border border-[#e2e4e7]/80 text-sm text-neutral-500 truncate">
                      No Pinterest account connected
                    </div>
                  ) : (
                    <select
                      value={boardId}
                      onChange={e => setBoardId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all appearance-none cursor-pointer"
                    >
                      {boards.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-4 py-4 border-t border-neutral-100 shrink-0 space-y-3">
                {/* Primary actions */}
                <div className="flex items-center gap-2.5">
                  {isPending ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving || approving}
                        className="flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-lg border border-neutral-200 bg-white text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-all disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Save Draft
                      </button>
                      <button
                        onClick={handleSaveAndApprove}
                        disabled={saving || approving}
                        className="flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-all disabled:opacity-50"
                      >
                        {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Save & Approve
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleSave}
                      disabled={saving || !hasChanges}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-all disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Save Changes
                    </button>
                  )}
                </div>

                {/* Secondary actions row */}
                <div className="flex items-center justify-between">
                  {/* Reject (only for pending) */}
                  {isPending && (
                    <div className="relative">
                      <button
                        onClick={() => setShowRejectMenu(!showRejectMenu)}
                        className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors px-2 py-1 -ml-2 rounded-lg hover:bg-red-50"
                      >
                        Reject
                      </button>
                      {showRejectMenu && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl border border-neutral-200 shadow-xl p-2 min-w-[180px] z-10">
                          <p className="text-[10px] uppercase tracking-wide font-bold text-neutral-400 px-2.5 py-1.5">Reject because...</p>
                          {REJECT_REASONS.map(r => (
                            <button
                              key={r.key}
                              onClick={() => { onRejected(pin.id, r.key); onClose() }}
                              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left hover:bg-neutral-50 transition-colors text-xs"
                            >
                              <span>{r.icon}</span>
                              <span className="font-medium text-neutral-700">{r.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {!isPending && <div />}

                  {/* Delete */}
                  <div className="relative">
                    {showDeleteConfirm ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">Delete pin?</span>
                        <button
                          onClick={() => { onDeleted(pin.id); onClose() }}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Yes, delete
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="text-xs text-neutral-400 hover:text-neutral-600 px-2 py-1 rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-xs font-medium text-neutral-400 hover:text-red-500 transition-colors px-2 py-1 -mr-2 rounded-lg hover:bg-red-50 flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
