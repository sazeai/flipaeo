'use client'

import { Check } from 'lucide-react'
import { motion } from 'motion/react'

interface StepPinStyleProps {
  value: 'organic' | 'editorial'
  onChange: (value: 'organic' | 'editorial') => void
}

const OPTIONS = [
  {
    id: 'organic' as const,
    title: 'Organic Lifestyle',
    subtitle: 'Image-first, feed-native',
    detail: 'Clean, image-forward pins designed for high click-through and natural discovery. Best for everyday product promotion.',
    visual: 'from-amber-50 via-orange-50 to-rose-50',
  },
  {
    id: 'editorial' as const,
    title: 'Editorial Campaign',
    subtitle: 'Structured, magazine-style',
    detail: 'Bold layouts with text overlays designed for promotions, launches, and brand campaign moments.',
    visual: 'from-slate-100 via-neutral-100 to-zinc-100',
  },
]

export function StepPinStyle({ value, onChange }: StepPinStyleProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
          Choose your pin style
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          This controls the overall visual treatment PinLoop applies when composing pins for your feed.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map(option => {
          const selected = value === option.id

          return (
            <motion.button
              key={option.id}
              type="button"
              whileTap={{ scale: 0.985 }}
              onClick={() => onChange(option.id)}
              className={`group cursor-pointer overflow-hidden rounded-2xl border text-left transition-all ${
                selected
                  ? 'border-neutral-900 ring-1 ring-neutral-900'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className={`h-32 w-full bg-gradient-to-br ${option.visual} transition-opacity ${
                selected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
              }`} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                      {option.id === 'organic' ? 'Mode 01' : 'Mode 02'}
                    </span>
                    <div className="mt-1 text-lg font-semibold tracking-tight text-neutral-950">
                      {option.title}
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-500">{option.subtitle}</div>
                  </div>
                  <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                    selected
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white text-transparent'
                  }`}>
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-neutral-600">{option.detail}</p>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
