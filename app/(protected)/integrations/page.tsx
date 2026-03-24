"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Globe, Link2, CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlobalCard } from "@/components/ui/global-card"
import { CustomSpinner } from "@/components/CustomSpinner"
import { toast } from "sonner"

type Connection = {
  id: string
  platform: string
  username: string
  status: "connected" | "expired" | "error"
  connectedAt: string
  meta?: string
}

export default function IntegrationsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [connections, setConnections] = useState<Connection[]>([])

  useEffect(() => {
    loadConnections()
  }, [])

  async function loadConnections() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const conns: Connection[] = []

      // Pinterest
      const { data: pinterest } = await supabase
        .from("pinterest_connections")
        .select("id, pinterest_user_id, warmup_phase, created_at, updated_at")
        .eq("user_id", user.id)
        .maybeSingle()

      if (pinterest) {
        conns.push({
          id: pinterest.id,
          platform: "pinterest",
          username: pinterest.pinterest_user_id || "Connected",
          status: "connected",
          connectedAt: pinterest.created_at,
          meta: `Warmup: ${pinterest.warmup_phase === "full" ? "Full Speed 🚀" : pinterest.warmup_phase === "warmup_partial" ? "Warming Up 🌡️" : "Building Trust 🌱"}`,
        })
      }

      // Etsy
      const { data: etsy } = await supabase
        .from("etsy_connections")
        .select("id, shop_name, created_at")
        .eq("user_id", user.id)
        .maybeSingle()

      if (etsy) {
        conns.push({
          id: etsy.id,
          platform: "etsy",
          username: etsy.shop_name || "Connected",
          status: "connected",
          connectedAt: etsy.created_at,
        })
      }

      setConnections(conns)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = (platform: string) => {
    if (platform === "pinterest") {
      window.location.href = "/api/auth/pinterest"
    } else {
      toast.info(`${platform} integration coming soon!`)
    }
  }

  const handleDisconnect = async (platform: string, id: string) => {
    const table = platform === "pinterest" ? "pinterest_connections" : "etsy_connections"
    const { error } = await supabase.from(table).delete().eq("id", id)
    if (error) {
      toast.error("Failed to disconnect")
    } else {
      toast.success(`${platform} disconnected`)
      setConnections(prev => prev.filter(c => c.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3 text-stone-500">
          <CustomSpinner className="w-10 h-10" />
          <span className="text-sm font-medium">Loading integrations...</span>
        </div>
      </div>
    )
  }

  const platforms = [
    {
      id: "pinterest",
      name: "Pinterest Business",
      description: "Connect your Pinterest Business account to publish pins automatically.",
      icon: "📌",
      required: true,
    },
    {
      id: "shopify",
      name: "Shopify",
      description: "Sync your Shopify product catalog for automatic pin generation.",
      icon: "🛍️",
      required: false,
    },
    {
      id: "etsy",
      name: "Etsy",
      description: "Import your Etsy listings to generate lifestyle pins.",
      icon: "🧶",
      required: false,
    },
  ]

  return (
    <div className="w-full min-h-screen font-sans bg-stone-50/30 rounded-t-xl">
      <GlobalCard className="w-full shadow-sm rounded-xl overflow-hidden bg-white border border-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-stone-100 bg-white/50 backdrop-blur-sm rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
              <Link2 className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold text-stone-900 tracking-tight">
                Integrations
              </h1>
              <p className="text-xs text-stone-500 font-medium hidden sm:block">
                Connect your platforms to power the PinLoop engine
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          {platforms.map((platform) => {
            const connection = connections.find(c => c.platform === platform.id)
            const isConnected = !!connection

            return (
              <div
                key={platform.id}
                className={`
                  w-full rounded-xl border transition-all duration-200 overflow-hidden
                  ${isConnected
                    ? "bg-stone-50/30 border-stone-300 ring-1 ring-stone-200"
                    : "bg-white border-stone-200 hover:border-stone-300"
                  }
                `}
              >
                <div className="flex items-center justify-between p-4 md:p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-2xl">
                      {platform.icon}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-stone-900">
                          {platform.name}
                        </span>
                        {platform.required && !isConnected && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Required
                          </span>
                        )}
                        {isConnected && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <span className="text-xs text-stone-500 mt-0.5">
                        {isConnected ? (
                          <span className="flex items-center gap-1">
                            <span className="font-medium text-stone-700">{connection.username}</span>
                            {connection.meta && <span className="text-stone-400">· {connection.meta}</span>}
                          </span>
                        ) : (
                          platform.description
                        )}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-bold text-stone-500 hover:text-red-600 hover:border-red-200"
                        onClick={() => handleDisconnect(platform.id, connection.id)}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        className="h-8 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800"
                        onClick={() => handleConnect(platform.id)}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </GlobalCard>
    </div>
  )
}
