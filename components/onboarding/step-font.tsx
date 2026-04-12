'use client'

import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { FONT_OPTIONS } from '@/lib/constants/brand'

interface StepFontProps {
  value: string
  onChange: (value: string) => void
}

export function StepFont({ value, onChange }: StepFontProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
          Pick your pin font
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Curated OCR-approved fonts that Pinterest&apos;s visual AI can read. Select one for your text overlays.
        </p>
      </div>

      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href={`https://fonts.googleapis.com/css2?${FONT_OPTIONS.map(f => `family=${f.google}`).join('&')}&display=swap`}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {FONT_OPTIONS.map(f => {
          const selected = value === f.name

          return (
            <motion.button
              key={f.name}
              type="button"
              whileTap={{ scale: 0.985 }}
              onClick={() => onChange(f.name)}
              className={`cursor-pointer relative min-h-[100px] rounded-xl border p-4 text-left transition-all sm:min-h-[116px] ${
                selected
                  ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
              }`}
            >
              <span className={`absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                selected
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 bg-white text-transparent'
              }`}>
                <Check className="h-3 w-3" />
              </span>
              <span
                className="block truncate pr-6 text-[20px] leading-[1.05] text-neutral-950 sm:text-[26px]"
                style={{ fontFamily: `'${f.name}', sans-serif` }}
              >
                {f.sample}
              </span>
              <span className="mt-2 block truncate text-xs text-neutral-500">{f.name}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
