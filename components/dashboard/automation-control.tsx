"use client"

import * as React from "react"
import { Loader2, Pause, Play, Zap } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

const AUTOMATION_EVENT = "pinloop:automation-status"

type AutomationControlProps = {
  variant?: "header" | "panel"
  className?: string
}

function emitAutomationStatus(paused: boolean) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(AUTOMATION_EVENT, { detail: { paused } }))
}

export function AutomationControl({
  variant = "header",
  className,
}: AutomationControlProps) {
  const [paused, setPaused] = React.useState<boolean | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [hasSettings, setHasSettings] = React.useState(true)

  const loadState = React.useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from("brand_settings")
      .select("automation_paused")
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) return

    if (!data) {
      setHasSettings(false)
      setPaused(false)
      return
    }

    setHasSettings(true)
    setPaused(Boolean(data.automation_paused))
  }, [])

  React.useEffect(() => {
    loadState()

    const handleStatusChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ paused: boolean }>
      setPaused(customEvent.detail.paused)
    }

    window.addEventListener(AUTOMATION_EVENT, handleStatusChange as EventListener)
    return () => {
      window.removeEventListener(AUTOMATION_EVENT, handleStatusChange as EventListener)
    }
  }, [loadState])

  const handleCheckedChange = async (checked: boolean) => {
    if (busy || paused === null) return

    if (!hasSettings) {
      toast.error("Complete brand settings first")
      return
    }

    const nextPaused = !checked
    const previousPaused = paused

    setPaused(nextPaused)
    setBusy(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setPaused(previousPaused)
      setBusy(false)
      return
    }

    const { error } = await supabase
      .from("brand_settings")
      .update({ automation_paused: nextPaused })
      .eq("user_id", user.id)

    if (error) {
      setPaused(previousPaused)
      setBusy(false)
      toast.error("Failed to update automation")
      return
    }

    emitAutomationStatus(nextPaused)
    setBusy(false)
    toast.success(nextPaused ? "Automation paused" : "Automation resumed", {
      duration: 1400,
    })
  }

  const isActive = paused === false
  const headerStatus = !hasSettings ? "Setup" : isActive ? "Live" : "Paused"

  if (variant === "panel") {
    return (
      <div
        className={cn(
          "bg-white border border-[#e2e4e7] rounded-xl  p-4 relative z-10",
          className
        )}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[#e2e4e7] bg-white text-[#1a1a1a]">
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" strokeWidth={2.2} />}
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#666666]">Automation</span>
                <h2 className="text-[19px] font-bold tracking-tight text-[#1a1a1a]">
                  Publishing engine
                </h2>
              </div>
            </div>

            <div className="flex items-center bg-[#f2f3f5] p-1 rounded-lg border border-[#e2e4e7]/80 shrink-0 mt-0.5">
              <div className="flex items-center gap-3 bg-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-[#e2e4e7]">
                <div className="text-[14px] sm:text-[15px] font-bold text-[#1a1a1a] hidden sm:block">
                  {isActive ? "Live" : "Paused"}
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={handleCheckedChange}
                  disabled={busy || !hasSettings}
                  aria-label="Toggle automation"
                  className="data-[state=checked]:bg-[#1a1a1a] data-[state=unchecked]:bg-[#e5e7eb] shadow-inner"
                />
              </div>
            </div>
          </div>

          <div className="max-w-2xl">
            <p className="text-[15px] leading-[1.45] text-[#666666]">
              Pause all pin generation and scheduling instantly. This same control is also available in the top header from anywhere in the app.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-[13px] text-[#666666]">
          <span
            className={cn(
              "inline-block h-2 w-2 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.1)]",
              isActive ? "bg-[#1C5F4A]" : "bg-[#9ca3af]"
            )}
          />
          {hasSettings
            ? isActive
              ? "New pins continue generating and scheduling normally."
              : "Generation and publishing remain paused until you switch it back on."
            : "Brand settings need to be completed before automation can be controlled."}
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => void handleCheckedChange(!isActive)}
      disabled={busy || paused === null}
      aria-label={isActive ? "Pause automation" : "Resume automation"}
      aria-pressed={isActive}
      className={cn(
        "cursor-pointer inline-flex h-8 items-center gap-2 rounded-lg border border-neutral-200/80 bg-white pr-1 pl-2 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70 sm:h-9 sm:pl-2",
        className
      )}
    >
      <span className="min-w-0 leading-none">
        <span className="block text-[9px] font-medium uppercase tracking-none text-neutral-500">
          Automation
        </span>
        <span className="block text-[11px] font-medium text-neutral-900 sm:text-xs">
          {headerStatus}
        </span>
      </span>

      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors sm:h-7 sm:w-7",
          !hasSettings
            ? "bg-amber-50 text-amber-700"
            : isActive
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-900"
        )}
      >
        {busy ? (
          <Loader2 className="h-3 w-3 animate-spin sm:h-3.5 sm:w-3.5" />
        ) : isActive ? (
          <Pause className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        ) : (
          <Play className="h-3 w-3 translate-x-[0.5px] fill-current sm:h-3.5 sm:w-3.5" />
        )}
      </span>
    </button>
  )
}
