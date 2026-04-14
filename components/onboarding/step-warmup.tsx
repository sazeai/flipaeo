'use client'

import { Check, Sparkles, Zap } from 'lucide-react'
import { motion } from 'motion/react'
import { SurfaceHeader } from '@/components/ui/surface-header'

interface StepWarmupProps {
  value: 'brand_new' | 'established' | ''
  onChange: (value: 'brand_new' | 'established') => void
}

const OPTIONS = [
  {
    id: 'brand_new' as const,
    title: 'Brand new',
    subtitle: 'Created within the last 3 months',
    detail: 'Starts gently and ramps up over time to avoid early spam signals. Recommended for new accounts.',
    Icon: Sparkles,
  },
  {
    id: 'established' as const,
    title: 'Established',
    subtitle: 'Already has account history and activity',
    detail: 'Begins publishing at full safe velocity from day one. Best for accounts with existing pins and followers.',
    Icon: Zap,
  },
]

export function StepWarmup({ value, onChange }: StepWarmupProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
          Account protection
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Tell us about your Pinterest account age so EcomPin can publish at a safe velocity and protect your account health.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map(option => {
          const selected = value === option.id

          return (
            <motion.button
              key={option.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(option.id)}
              className={`cursor-pointer rounded-2xl border p-5 text-left transition-all ${
                selected
                  ? 'border-neutral-900 ring-1 ring-neutral-900'
                  : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/40'
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
                    <div className="text-base font-semibold text-neutral-950">{option.title}</div>
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
              <p className="mt-4 text-sm leading-6 text-neutral-600">{option.detail}</p>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
