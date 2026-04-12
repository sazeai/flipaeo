'use client'

import { CheckCircle2, ArrowRight, Store, Palette, Type, ShoppingBag, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'motion/react'

interface StepCompleteProps {
  data: {
    brand_name: string
    pin_layout_mode: string
    aesthetic_boundaries: string[]
    font_choice: string
    has_products: boolean
    has_pinterest: boolean
  }
  onFinish: () => void
}

export function StepComplete({ data, onFinish }: StepCompleteProps) {
  const items = [
    {
      icon: Store,
      label: 'Brand',
      value: data.brand_name || 'Not set',
      done: !!data.brand_name,
    },
    {
      icon: ImageIcon,
      label: 'Pin Style',
      value: data.pin_layout_mode === 'editorial' ? 'Editorial Campaign' : 'Organic Lifestyle',
      done: true,
    },
    {
      icon: Palette,
      label: 'Aesthetics',
      value: data.aesthetic_boundaries.length > 0
        ? data.aesthetic_boundaries.join(', ')
        : 'None selected',
      done: data.aesthetic_boundaries.length > 0,
    },
    {
      icon: Type,
      label: 'Font',
      value: data.font_choice,
      done: !!data.font_choice,
    },
    {
      icon: ShoppingBag,
      label: 'Products',
      value: data.has_products ? 'Imported' : 'Skipped',
      done: data.has_products,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
        >
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-2xl font-bold tracking-tight text-neutral-950"
        >
          You&apos;re all set
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-2 text-sm text-neutral-600"
        >
          PinLoop is ready to start generating and publishing pins for your brand.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-2 rounded-2xl border border-neutral-200 bg-neutral-50/50 p-5"
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
          Setup summary
        </p>
        {items.map(item => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3"
          >
            <item.icon className="h-4 w-4 shrink-0 text-neutral-400" />
            <span className="w-20 shrink-0 text-xs font-medium text-neutral-500">{item.label}</span>
            <span className="flex-1 truncate text-sm text-neutral-900">{item.value}</span>
            {item.done && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
            )}
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          onClick={onFinish}
          className="h-12 w-full rounded-xl bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Go to Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  )
}
