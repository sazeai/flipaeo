'use client'

import { motion } from 'motion/react'
import { AESTHETIC_OPTIONS } from '@/lib/constants/brand'

interface StepAestheticsProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function StepAesthetics({ value, onChange }: StepAestheticsProps) {
  function toggle(name: string) {
    if (value.includes(name)) {
      onChange(value.filter(v => v !== name))
    } else if (value.length < 3) {
      onChange([...value, name])
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
              Set your aesthetic boundaries
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Tell the AI Art Director what visual styles to aim for. It will avoid anything outside these boundaries.
            </p>
          </div>
          <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
            {value.length}/3 selected
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {AESTHETIC_OPTIONS.map(opt => {
          const selected = value.includes(opt.name)
          const disabled = !selected && value.length >= 3

          return (
            <motion.button
              key={opt.name}
              type="button"
              whileTap={disabled ? undefined : { scale: 0.985 }}
              onClick={() => !disabled && toggle(opt.name)}
              className={`cursor-pointer overflow-hidden rounded-xl border text-left transition-all ${
                selected
                  ? 'border-neutral-900 ring-1 ring-neutral-900'
                  : disabled
                    ? 'cursor-not-allowed border-neutral-100 opacity-40'
                    : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className={`h-14 w-full bg-gradient-to-br ${opt.gradient}`} />
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="block text-sm font-semibold text-neutral-950">{opt.name}</span>
                    <span className="mt-1 block text-xs text-neutral-500">{opt.desc}</span>
                  </div>
                  {selected && (
                    <span className="shrink-0 rounded-full bg-neutral-900 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white">
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
  )
}
