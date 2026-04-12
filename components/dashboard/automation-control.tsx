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
          "rounded-xl border border-neutral-200/80 bg-gradient-to-b from-white to-neutral-50/60 p-6",
          className
        )}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-900">
                  {busy ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Zap className="h-4.5 w-4.5" />}
                </div>
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">Automation</span>
                  <h2 className="text-[18px] font-semibold tracking-tight text-neutral-950">
                    Publishing engine
                  </h2>
                </div>
              </div>
              <p className="text-sm leading-6 text-neutral-600">
              Pause all pin generation and scheduling instantly. This same control is also available in the top header from anywhere in the app.
              </p>
            </div>
          </div>

          <div className="rounded-full border border-neutral-200 bg-white px-3 py-2">
            <div className="flex items-center gap-3">
              <div className="text-right">

                <div className="text-sm font-medium text-neutral-900">
                  {isActive ? "Live" : "Paused"}
                </div>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={handleCheckedChange}
                disabled={busy || !hasSettings}
                aria-label="Toggle automation"
                className="data-[state=checked]:bg-neutral-900 data-[state=unchecked]:bg-neutral-300"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-neutral-500">
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              isActive ? "bg-emerald-500" : "bg-neutral-400"
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
        "cursor-pointer inline-flex h-8 items-center gap-2 rounded-full border border-neutral-200/80 bg-white py-1 pr-1 pl-2.5 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70 sm:h-9 sm:pl-3",
        className
      )}
    >
      <span className="min-w-0 leading-none">
        <span className="block text-[9px] font-medium uppercase tracking-[0.18em] text-neutral-500 sm:text-[10px]">
          Automation
        </span>
        <span className="mt-0.5 block text-[11px] font-medium text-neutral-900 sm:text-xs">
          {headerStatus}
        </span>
      </span>

      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors sm:h-7 sm:w-7",
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
