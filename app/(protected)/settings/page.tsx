"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getUserBrandStatus } from "@/actions/brand"
import { getUserDefaults, setDefaultBrand } from "@/actions/preferences"
import { createClient } from "@/utils/supabase/client"
import { getBrandLinkCountAction } from "@/actions/internal-linking"
import { Check, Globe, Plus, Edit, Settings2, Loader2, Link2, RefreshCcw, ExternalLink, Search, Sparkles, ChevronDown, Key, AlertCircle } from "lucide-react"
import BrandOnboarding from "@/components/brand-onboarding"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { BrandDetails } from "@/lib/schemas/brand"
import { GlobalCard } from "@/components/ui/global-card"
import { CustomSpinner } from "@/components/CustomSpinner"

type BrandInfo = { id: string; website_url: string; created_at: string; brand_data: BrandDetails }
type GSCSite = { siteUrl: string; permissionLevel: string }

export default function SettingsPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [brands, setBrands] = useState<BrandInfo[]>([])
  const [defaultBrandId, setDefaultBrandId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [brandLimit, setBrandLimit] = useState(0)
  const [brandCount, setBrandCount] = useState(0)
  const [isCreatingBrand, setIsCreatingBrand] = useState(false)
  const [editingBrand, setEditingBrand] = useState<BrandInfo | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [linkCounts, setLinkCounts] = useState<Record<string, number>>({})

  // GSC State
  const [gscConnected, setGscConnected] = useState(false)
  const [gscSiteUrl, setGscSiteUrl] = useState<string | null>(null)
  const [gscSites, setGscSites] = useState<GSCSite[]>([])
  const [loadingGsc, setLoadingGsc] = useState(false)
  const [enhancingBrandId, setEnhancingBrandId] = useState<string | null>(null)
  const [showSiteSelector, setShowSiteSelector] = useState(false)

  // Dark mode detection

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const [status, defaults] = await Promise.all([
          getUserBrandStatus(),
          getUserDefaults(),
        ])
        // @ts-ignore
        setBrands(status.brands)
        // @ts-ignore
        setBrandLimit(status.limit)
        // @ts-ignore
        setBrandCount(status.count)
        setDefaultBrandId((defaults as any).default_brand_id)

        // Redirect to onboarding if no brands
        if (!status.brands || (status.brands as BrandInfo[]).length === 0) {
          router.push("/onboarding")
          return
        }
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [supabase, router])

  const fetchLinkCounts = async (brandsList: BrandInfo[]) => {
    const counts: Record<string, number> = {}
    await Promise.all(brandsList.map(async (b) => {
      const res = await getBrandLinkCountAction(b.id)
      if (res.success) counts[b.id] = res.count
    }))
    setLinkCounts(counts)
  }

  useEffect(() => {
    if (brands.length > 0) {
      fetchLinkCounts(brands)
    }
  }, [brands])

  const refreshBrands = async () => {
    const status = await getUserBrandStatus()
    // @ts-ignore
    setBrands(status.brands)
    // @ts-ignore
    setBrandLimit(status.limit)
    // @ts-ignore
    setBrandCount(status.count)
  }

  const handleSyncLinks = async (brandId: string, websiteUrl: string) => {
    setSyncingId(brandId)
    try {
      // Clean URL and assume /sitemap.xml
      let sitemapUrl = websiteUrl.endsWith('/') ? `${websiteUrl}sitemap.xml` : `${websiteUrl}/sitemap.xml`

      const res = await fetch('/api/content-plan/sync-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitemapUrl, brandId })
      })

      if (!res.ok) throw new Error("Failed to start sync")

      toast.success("Sync started! This may take a few minutes for deep indexing.")

      // Update count after a delay (optimistic or just let user refresh)
      setTimeout(() => fetchLinkCounts(brands), 3000)
    } catch (error: any) {
      toast.error(error.message || "Failed to sync links")
    } finally {
      setSyncingId(null)
    }
  }

  // Check GSC connection status on mount
  useEffect(() => {
    async function checkGscConnection() {
      try {
        const res = await fetch("/api/gsc/sites")
        if (res.ok) {
          const data = await res.json()
          setGscConnected(true)
          setGscSites(data.sites || [])
          // Get saved site URL from connection
          const { data: connection } = await supabase
            .from("gsc_connections")
            .select("site_url")
            .single()
          if (connection?.site_url) {
            setGscSiteUrl(connection.site_url)
          }
        } else {
          setGscConnected(false)
        }
      } catch {
        setGscConnected(false)
      }
    }
    checkGscConnection()
  }, [supabase])

  // Handle GSC connection callback
  useEffect(() => {
    const gscParam = searchParams.get("gsc")
    const gscError = searchParams.get("gsc_error")

    if (gscParam === "connected") {
      toast.success("Google Search Console connected!")
      setGscConnected(true)
      // Fetch sites
      fetch("/api/gsc/sites")
        .then(res => res.json())
        .then(data => {
          setGscSites(data.sites || [])
          if (data.sites?.length === 1) {
            setGscSiteUrl(data.sites[0].siteUrl)
            handleSelectSite(data.sites[0].siteUrl)
          } else if (data.sites?.length > 1) {
            setShowSiteSelector(true)
          }
        })
        .catch(() => { })
      // Clear URL params
      window.history.replaceState({}, "", "/settings")
    }

    if (gscError) {
      toast.error(`GSC connection failed: ${gscError}`)
      window.history.replaceState({}, "", "/settings")
    }
  }, [searchParams])

  // Handle site selection
  const handleSelectSite = async (siteUrl: string) => {
    try {
      await fetch("/api/gsc/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteUrl })
      })
      setGscSiteUrl(siteUrl)
      setShowSiteSelector(false)
      toast.success("Site selected!")
    } catch {
      toast.error("Failed to save site selection")
    }
  }

  // Enhance plan with GSC data
  const handleEnhancePlan = async (brand: BrandInfo) => {
    setEnhancingBrandId(brand.id)
    try {
      // First, get the current plan for this brand
      const planRes = await fetch("/api/content-plan")
      if (!planRes.ok) throw new Error("No content plan found")

      const currentPlan = await planRes.json()

      // Generate enhanced plan from GSC data
      const enhanceRes = await fetch("/api/gsc/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandData: brand.brand_data,
          brandName: brand.brand_data?.product_name || "",
          existingPlan: currentPlan.plan_data || [],
          competitorSeeds: currentPlan.competitor_seeds || []
        })
      })

      if (!enhanceRes.ok) {
        const error = await enhanceRes.json()
        throw new Error(error.error || "Failed to enhance plan")
      }

      const { plan: enhancedPlan } = await enhanceRes.json()

      // Update the plan in database
      const updateRes = await fetch("/api/content-plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: currentPlan.id,
          planData: enhancedPlan,
          gscEnhanced: true
        })
      })

      if (!updateRes.ok) throw new Error("Failed to save enhanced plan")

      toast.success(`Plan enhanced with ${enhancedPlan.length} GSC-optimized articles!`)
    } catch (error: any) {
      toast.error(error.message || "Failed to enhance plan")
    } finally {
      setEnhancingBrandId(null)
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3 text-stone-500">
          <CustomSpinner className="w-10 h-10" />
          <span className="text-sm font-medium">Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen font-sans bg-stone-50/30 rounded-t-xl">
      <GlobalCard className="w-full shadow-sm rounded-xl overflow-hidden bg-white  border border-stone-100 ">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-stone-100  bg-white/50 /50 backdrop-blur-sm rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-stone-100  flex items-center justify-center text-stone-500">
              <Settings2 className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold text-stone-900  tracking-tight">
                Settings
              </h1>
              <p className="text-xs text-stone-500 font-medium hidden sm:block">
                Manage your brands
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {/* Brand Settings */}
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">


            {isCreatingBrand || editingBrand ? (
              <div className="p-4 border border-stone-200  rounded-xl bg-stone-50/50 /50">
                <BrandOnboarding
                  initialData={editingBrand?.brand_data}
                  initialUrl={editingBrand?.website_url}
                  brandId={editingBrand?.id}
                  onComplete={async (id) => {
                    setIsCreatingBrand(false)
                    setEditingBrand(null)
                    await refreshBrands()
                    if (!editingBrand) {
                      setDefaultBrandId(id)
                    }
                  }}
                  onCancel={() => {
                    setIsCreatingBrand(false)
                    setEditingBrand(null)
                  }}
                />
              </div>
            ) : (
              <div className="grid sm:grid-cols-1 gap-4">
                {brands.map((b) => {
                  const isSelected = defaultBrandId === b.id;
                  return (
                    <div
                      key={b.id}
                      className={`
                        w-full rounded-xl border transition-all duration-200 overflow-hidden
                        ${isSelected
                          ? 'bg-stone-50 /30 border-stone-300 ring-1 ring-stone-300 shadow-sm'
                          : 'bg-white border-stone-200  hover:border-stone-300'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between p-4 group">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <button
                            onClick={async () => {
                              setSaving(true)
                              try {
                                const res = await setDefaultBrand(b.id)
                                if (res.success) setDefaultBrandId(b.id)
                              } finally {
                                setSaving(false)
                              }
                            }}
                            className={`
                              w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer
                              ${isSelected
                                ? 'bg-stone-900 border-stone-900 text-white'
                                : 'border-stone-300 text-transparent hover:border-stone-400'
                              }
                            `}
                          >
                            <Check className="w-3 h-3" />
                          </button>

                          <div className="flex flex-col min-w-0">
                            <span className={`text-sm font-bold truncate ${isSelected ? 'text-stone-900 ' : 'text-stone-700'}`}>
                              {b.brand_data?.product_name || b.website_url}
                            </span>
                            <span className="text-[10px] text-stone-400 truncate flex items-center gap-1">
                              <Globe className="w-2.5 h-2.5" />
                              {b.website_url}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-stone-700" onClick={() => setEditingBrand(b)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Internal Linking Sync Section */}
                      <div className="px-4 pb-4">
                        <div className="p-3 bg-white  rounded-lg border border-stone-100  flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-stone-50  rounded-md border border-stone-100 ">
                              <Link2 className="w-3.5 h-3.5 text-stone-500" />
                            </div>
                            <div>
                              <div className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Internal Linking</div>
                              <div className="text-[11px] text-stone-600 font-medium leading-tight">
                                {linkCounts[b.id] !== undefined ? `${linkCounts[b.id]} links indexed` : 'Index your site for semantic link suggestions'}
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 text-[10px] gap-1.5 px-3 font-bold bg-stone-100  hover:bg-stone-200 text-stone-900 border-none"
                            onClick={() => handleSyncLinks(b.id, b.website_url)}
                            disabled={syncingId === b.id}
                          >
                            {syncingId === b.id ? (
                              <RefreshCcw className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCcw className="w-3 h-3" />
                            )}
                            {syncingId === b.id ? 'SYNCING...' : 'SYNC SITE'}
                          </Button>
                        </div>
                      </div>

                      {/* Google Search Console Section */}
                      <div className="px-4 pb-4">
                        <div className="p-3 bg-white rounded-lg border border-stone-100 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-green-50 rounded-md border border-green-100">
                                <Search className="w-3.5 h-3.5 text-green-600" />
                              </div>
                              <div>
                                <div className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Search Console</div>
                                <div className="text-[11px] text-stone-600 font-medium leading-tight">
                                  {gscConnected
                                    ? (gscSiteUrl ? `Connected: ${gscSiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}` : 'Select a site')
                                    : 'Enhance plan with real search data'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!gscConnected ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 text-[10px] gap-1.5 px-3 font-bold bg-green-50 hover:bg-green-100 text-green-700 border-none"
                                  onClick={() => window.location.href = "/api/auth/gsc"}
                                >
                                  <Key className="w-3 h-3" />
                                  CONNECT GSC
                                </Button>
                              ) : showSiteSelector && gscSites.length > 1 ? (
                                <select
                                  className="h-8 text-[10px] px-2 rounded-md border border-stone-200 bg-white"
                                  value={gscSiteUrl || ""}
                                  onChange={(e) => handleSelectSite(e.target.value)}
                                >
                                  <option value="">Select site...</option>
                                  {gscSites.map(site => (
                                    <option key={site.siteUrl} value={site.siteUrl}>
                                      {site.siteUrl.replace(/^https?:\/\//, '')}
                                    </option>
                                  ))}
                                </select>
                              ) : gscSiteUrl ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 text-[10px] gap-1.5 px-3 font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white border-none"
                                  onClick={() => handleEnhancePlan(b)}
                                  disabled={enhancingBrandId === b.id}
                                >
                                  {enhancingBrandId === b.id ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      ENHANCING...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3 h-3" />
                                      ENHANCE PLAN
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 text-[10px] gap-1.5 px-3 font-bold bg-stone-100 hover:bg-stone-200 text-stone-900 border-none"
                                  onClick={() => setShowSiteSelector(true)}
                                >
                                  <ChevronDown className="w-3 h-3" />
                                  SELECT SITE
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {brands.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-stone-200  rounded-xl">
                    <p className="text-sm text-stone-500 mb-2">No brands configured</p>
                    <Button onClick={() => setIsCreatingBrand(true)} variant="outline" size="sm">
                      Create your first brand
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </GlobalCard>
    </div>
  )
}
