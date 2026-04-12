import { type LucideIcon } from 'lucide-react'

export function SurfaceHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  titleTag = 'h2',
  titleClassName = 'text-[18px] font-semibold tracking-tight text-neutral-950',
}: {
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
  titleTag?: 'h2' | 'h3'
  titleClassName?: string
}) {
  const TitleTag = titleTag

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-900">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">{eyebrow}</span>
          <TitleTag className={titleClassName}>{title}</TitleTag>
        </div>
      </div>
      <p className="text-sm leading-6 text-neutral-600">{description}</p>
    </div>
  )
}
