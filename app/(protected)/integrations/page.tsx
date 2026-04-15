"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Link2, CheckCircle2, Loader2, Key, Link as LinkIcon, AlertCircle } from "lucide-react"
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

  // Shopify inline form state
  const [showShopifyForm, setShowShopifyForm] = useState(false)
  const [storeUrl, setStoreUrl] = useState("")
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [isSavingToken, setIsSavingToken] = useState(false)

  useEffect(() => {
    loadConnections()

    // Check URL params for connection results
    const params = new URLSearchParams(window.location.search)
    if (params.get("etsy") === "connected") {
      toast.success("Etsy shop connected! Products are syncing in the background.")
      window.history.replaceState({}, "", "/integrations")
    }
    if (params.get("pinterest") === "connected") {
      toast.success("Pinterest Business account connected!")
      window.history.replaceState({}, "", "/integrations")
    }
    // Handle errors
    const etsyErr = params.get("etsy_error")
    const pinterestErr = params.get("pinterest_error")
    if (etsyErr) {
      toast.error(`Etsy connection failed: ${etsyErr}`)
      window.history.replaceState({}, "", "/integrations")
    }
    if (pinterestErr) {
      toast.error(`Pinterest connection failed: ${pinterestErr}`)
      window.history.replaceState({}, "", "/integrations")
    }
  }, [])

  async function loadConnections() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const conns: Connection[] = []

      // Pinterest
      const { data: pinterestRows } = await supabase
        .from("pinterest_connections")
        .select("id, pinterest_user_id, warmup_phase, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)

      const pinterest = pinterestRows?.[0]

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

      // Shopify
      const { data: shopifyRows } = await supabase
        .from("shopify_connections")
        .select("id, store_name, store_domain, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)

      const shopify = shopifyRows?.[0]

      if (shopify) {
        conns.push({
          id: shopify.id,
          platform: "shopify",
          username: shopify.store_name || shopify.store_domain,
          status: "connected",
          connectedAt: shopify.created_at,
          meta: shopify.store_domain,
        })

        setShowShopifyForm(false)
      }

      // Etsy
      const { data: etsyRows } = await supabase
        .from("etsy_connections")
        .select("id, shop_name, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)

      const etsy = etsyRows?.[0]

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
    } else if (platform === "etsy") {
      toast.info("Etsy integration is coming soon.")
    } else if (platform === "shopify") {
      setShowShopifyForm(prev => !prev)
    }
  }

  const handleSaveShopifyToken = async () => {
    if (!storeUrl.trim() || !clientId.trim() || !clientSecret.trim()) {
      toast.error("Please enter the store URL, Client ID, and Client Secret.")
      return
    }

    setIsSavingToken(true)
    try {
      const res = await fetch("/api/sync/validate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeUrl: storeUrl.trim(), clientId: clientId.trim(), clientSecret: clientSecret.trim() }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to validate or save token")
      }

      toast.success("Shopify connected! Auto-sync is now active.")
      setShowShopifyForm(false)
      loadConnections() // reload connection list to show it as connected
    } catch (error: any) {
      toast.error(`Validation error: ${error.message}`)
    } finally {
      setIsSavingToken(false)
    }
  }

  const handleDisconnect = async (platform: string, id: string) => {
    const tableMap: Record<string, string> = {
      pinterest: "pinterest_connections",
      shopify: "shopify_connections",
      etsy: "etsy_connections",
    }
    const table = tableMap[platform]
    if (!table) return

    const { error } = await supabase.from(table).delete().eq("id", id)
    if (error) {
      toast.error("Failed to disconnect")
    } else {
      toast.success(`${platform} disconnected`)
      if (platform === "shopify") {
        setShowShopifyForm(false)
        setStoreUrl("")
        setClientId("")
        setClientSecret("")
      }
      await loadConnections()
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
      description: "Direct Etsy connection is coming soon.",
      icon: "🧶",
      required: false,
      comingSoon: true,
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
                Connect your platforms to power the EcomPin engine
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          {platforms.map((platform) => {
            const connection = connections.find(c => c.platform === platform.id)
            const isConnected = !!connection
            const isComingSoon = Boolean(platform.comingSoon) && !isConnected

            return (
              <div
                key={platform.id}
                className={`
                  w-full rounded-xl border transition-all duration-200 overflow-hidden
                  ${isConnected
                    ? "bg-stone-50/30 border-stone-300 ring-1 ring-stone-200"
                    : isComingSoon
                      ? "bg-stone-50/50 border-stone-200"
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
                        {isComingSoon && (
                          <span className="text-[9px] font-bold text-stone-600 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Coming Soon
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

                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="h-8 text-xs font-bold border-green-200 bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700 disabled:opacity-100"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          Connected
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-bold text-stone-500 hover:text-red-600 hover:border-red-200"
                          onClick={() => handleDisconnect(platform.id, connection.id)}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : isComingSoon ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="h-8 text-xs font-bold text-stone-500 border-stone-200 bg-white disabled:opacity-100"
                      >
                        Coming Soon
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

                {/* Inline Shopify Form */}
                {platform.id === "shopify" && showShopifyForm && !isConnected && (
                  <div className="border-t border-stone-200 bg-stone-50/50 p-5 p-r space-y-4">
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 space-y-1.5 flex gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Shopify Authentication Setup:</p>
                        <ol className="list-decimal pl-4 space-y-1 mt-1">
                          <li>Go to Shopify Settings → Apps and sales channels → Develop apps.</li>
                          <li>Click "Create an app" (Name it EcomPin).</li>
                          <li>Go to <b>Configuration</b> → Admin API Scopes: Check <code className="bg-amber-100 px-1 rounded">read_products</code> and Save.</li>
                          <li>Go to <b>API Credentials</b>. Copy the <b>Client ID</b> and <b>Client Secret</b> and paste them below.</li>
                        </ol>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1 uppercase tracking-wider">
                          Shopify Store URL
                        </label>
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                          <input
                            type="text"
                            value={storeUrl}
                            onChange={(e) => setStoreUrl(e.target.value)}
                            placeholder="your-store.myshopify.com"
                            className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1 uppercase tracking-wider">
                            Client ID
                          </label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <input
                              type="text"
                              value={clientId}
                              onChange={(e) => setClientId(e.target.value)}
                              placeholder="Client ID"
                              className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1 uppercase tracking-wider">
                            Client Secret
                          </label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <input
                              type="password"
                              value={clientSecret}
                              onChange={(e) => setClientSecret(e.target.value)}
                              placeholder="Client Secret"
                              className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowShopifyForm(false)}
                        className="text-stone-600"
                        size="sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveShopifyToken}
                        disabled={!storeUrl || !clientId || !clientSecret || isSavingToken}
                        className="bg-stone-900 text-white hover:bg-stone-800"
                        size="sm"
                      >
                        {isSavingToken ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                        ) : (
                          "Save & Connect"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </GlobalCard>


    </div>
  )
}
