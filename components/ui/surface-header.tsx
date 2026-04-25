import { type LucideIcon } from 'lucide-react'

export function SurfaceHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  titleTag = 'h2',
  titleClassName = 'text-[19px] font-bold tracking-tight text-[#1a1a1a]',
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
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[#e2e4e7] bg-white text-[#1a1a1a]">
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#666666]">{eyebrow}</span>
          <TitleTag className={titleClassName}>{title}</TitleTag>
        </div>
      </div>
      <p className="text-[15px] leading-[1.45] text-[#666666]">{description}</p>
    </div>
  )
}
