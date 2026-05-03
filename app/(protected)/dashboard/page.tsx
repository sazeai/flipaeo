'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  Eye,
  MousePointerClick,
  ImageIcon,
  ArrowRight,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ShoppingBag,
  Link2,
  Plug,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ──────────────────────────────────────────────────

interface DashboardData {
  // Stat cards
  publishedPins: number
  totalImpressions: number
  totalClicks: number
  // Pipeline counts
  pipeline: {
    pending_approval: number
    queued: number
    published: number
    failed: number
    generating: number
    rendered: number
  }
  // Recent activity
  recentActivity: {
    id: string
    pin_title: string | null
    status: string
    created_at: string
    published_at: string | null
    product_title: string | null
  }[]
  // Account
  hasBrandSettings: boolean
  hasPinterest: boolean
  warmupPhase: string | null
  trustScore: number | null
  lastPublishAt: string | null
  // Product health
  totalProducts: number
  productsWithValidUrl: number
  productsMissingUrl: number
}

// ─── Main Page ──────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Parallel fetches for speed
      const [
        brandRes,
        pinterestRes,
        allPinsRes,
        publishedRes,
        productsRes,
        recentRes,
      ] = await Promise.all([
        supabase.from('brand_settings').select('id').eq('user_id', user.id).maybeSingle(),
        supabase.from('pinterest_connections').select('warmup_phase, trust_score').eq('user_id', user.id).maybeSingle(),
        supabase.from('pins').select('status').eq('user_id', user.id),
        supabase.from('pins').select('impressions, outbound_clicks, published_at').eq('user_id', user.id).eq('status', 'published'),
        supabase.from('products').select('id, product_url').eq('user_id', user.id),
        supabase.from('pins').select('id, pin_title, status, created_at, published_at, products(title)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
      ])

      // Redirect to onboarding if no brand_settings
      if (!brandRes.data) {
        router.replace('/onboarding')
        return
      }

      // Pipeline counts
      const pipeline = { pending_approval: 0, queued: 0, published: 0, failed: 0, generating: 0, rendered: 0 }
      for (const p of (allPinsRes.data || [])) {
        if (p.status in pipeline) {
          pipeline[p.status as keyof typeof pipeline]++
        }
      }

      // Published metrics
      const publishedPins = publishedRes.data || []
      const totalImpressions = publishedPins.reduce((sum, p: any) => sum + (p.impressions || 0), 0)
      const totalClicks = publishedPins.reduce((sum, p: any) => sum + (p.outbound_clicks || 0), 0)

      // Last publish time
      const lastPublishAt = publishedPins.length > 0
        ? publishedPins
          .filter((p: any) => p.published_at)
          .sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())[0]?.published_at || null
        : null

      // Product URL health
      const products = productsRes.data || []
      const productsWithValidUrl = products.filter((p: any) => p.product_url && /^https?:\/\/.+/.test(p.product_url)).length
      const productsMissingUrl = products.length - productsWithValidUrl

      // Recent activity
      const recentActivity = (recentRes.data || []).map((p: any) => ({
        id: p.id,
        pin_title: p.pin_title,
        status: p.status,
        created_at: p.created_at,
        published_at: p.published_at,
        product_title: p.products?.title || null,
      }))

      setData({
        publishedPins: publishedPins.length,
        totalImpressions,
        totalClicks,
        pipeline,
        recentActivity,
        hasBrandSettings: !!brandRes.data,
        hasPinterest: !!pinterestRes.data,
        warmupPhase: pinterestRes.data?.warmup_phase || null,
        trustScore: pinterestRes.data?.trust_score || null,
        lastPublishAt,
        totalProducts: products.length,
        productsWithValidUrl,
        productsMissingUrl,
      })
      setLoading(false)
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-[#f4f5f7] rounded-xl w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-[#f4f5f7] rounded-xl" />)}
        </div>
        <div className="h-24 bg-[#f4f5f7] rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-72 bg-[#f4f5f7] rounded-xl" />
          <div className="h-72 bg-[#f4f5f7] rounded-xl" />
        </div>
      </div>
    )
  }

  if (!data) return null

  const needsSetup = !data.hasBrandSettings || !data.hasPinterest
  const totalPipeline = data.pipeline.pending_approval + data.pipeline.queued + data.pipeline.published + data.pipeline.failed

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#111827]">Dashboard</h1>
        <p className="text-[#6b7280] text-sm mt-0.5 font-medium">Your autonomous Pinterest engine at a glance.</p>
      </div>

      {/* ─── Setup Banner (conditional) ──────────────────────── */}
      {needsSetup && (
        <div className="neo-container rounded-xl p-1.5">
          <div className="neo-inner-recess rounded-lg p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full neo-dark-btn flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#111827]">Complete Your Setup</h2>
                <p className="text-xs text-[#6b7280] font-medium mt-0.5">
                  {!data.hasBrandSettings && 'Configure your brand settings. '}
                  {!data.hasPinterest && 'Connect your Pinterest account to start publishing.'}
                </p>
              </div>
            </div>
            <Link
              href={!data.hasBrandSettings ? '/onboarding' : '/integrations'}
              className="neo-dark-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ─── Hero Stat Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <NeoStatCard
          icon={<ImageIcon className="w-5 h-5" />}
          label="Published Pins"
          value={data.publishedPins}
          href="/pins"
        />
        <NeoStatCard
          icon={<Eye className="w-5 h-5" />}
          label="Total Impressions"
          value={data.totalImpressions}
        />
        <NeoStatCard
          icon={<MousePointerClick className="w-5 h-5" />}
          label="Outbound Clicks"
          value={data.totalClicks}
        />
      </div>

      {/* ─── Pin Pipeline ────────────────────────────────────── */}
      <div className="neo-container rounded-xl p-1.5">
        <div className="neo-inner-recess rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#111827]">Pin Pipeline</h3>
            <Link href="/pins" className="text-xs font-semibold text-[#6b7280] hover:text-[#111827] transition-colors flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Segmented bar */}
          {totalPipeline > 0 ? (
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-[#f4f5f7] mb-4">
              {data.pipeline.published > 0 && (
                <div
                  className="h-full bg-[#10b981] transition-all"
                  style={{ width: `${(data.pipeline.published / totalPipeline) * 100}%` }}
                />
              )}
              {data.pipeline.queued > 0 && (
                <div
                  className="h-full bg-[#6366f1] transition-all"
                  style={{ width: `${(data.pipeline.queued / totalPipeline) * 100}%` }}
                />
              )}
              {data.pipeline.pending_approval > 0 && (
                <div
                  className="h-full bg-[#f59e0b] transition-all"
                  style={{ width: `${(data.pipeline.pending_approval / totalPipeline) * 100}%` }}
                />
              )}
              {data.pipeline.failed > 0 && (
                <div
                  className="h-full bg-[#ef4444] transition-all"
                  style={{ width: `${(data.pipeline.failed / totalPipeline) * 100}%` }}
                />
              )}
            </div>
          ) : (
            <div className="w-full h-3 rounded-full bg-[#f4f5f7] mb-4" />
          )}

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <PipelineStat label="Needs Review" count={data.pipeline.pending_approval} color="#f59e0b" />
            <PipelineStat label="Queued" count={data.pipeline.queued} color="#6366f1" />
            <PipelineStat label="Published" count={data.pipeline.published} color="#10b981" />
            <PipelineStat label="Failed" count={data.pipeline.failed} color="#ef4444" />
          </div>
        </div>
      </div>

      {/* ─── Two-Column: Activity + Status ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Activity (2/3) */}
        <div className="lg:col-span-2 neo-container rounded-xl p-1.5">
          <div className="neo-inner-recess rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#111827]">Recent Activity</h3>
              <Link href="/pins" className="text-xs font-semibold text-[#6b7280] hover:text-[#111827] transition-colors flex items-center gap-1">
                All Pins <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {data.recentActivity.length > 0 ? (
              <div className="space-y-1">
                {data.recentActivity.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#f9fafb] transition-colors">
                    <ActivityIcon status={item.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#111827] truncate">
                        {item.pin_title || item.product_title || 'Untitled pin'}
                      </p>
                      <p className="text-[11px] text-[#6b7280] font-medium">
                        {statusLabel(item.status)} · {timeAgo(item.published_at || item.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="w-8 h-8 text-[#d1d5db] mx-auto mb-2" />
                <p className="text-xs text-[#6b7280] font-medium">No pin activity yet. Generate your first pins!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-5">

          {/* Account Status */}
          <div className="neo-container rounded-xl p-1.5">
            <div className="neo-inner-recess rounded-lg p-5">
              <h3 className="text-sm font-bold text-[#111827] mb-4">Account Status</h3>

              <div className="space-y-3">
                {/* Pinterest Connection */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plug className="w-3.5 h-3.5 text-[#6b7280]" />
                    <span className="text-xs text-[#6b7280] font-medium">Pinterest</span>
                  </div>
                  {data.hasPinterest ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#ecfdf5] text-[#059669]">Connected</span>
                  ) : (
                    <Link href="/integrations" className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#fef3c7] text-[#d97706] hover:bg-[#fde68a] transition-colors">
                      Connect →
                    </Link>
                  )}
                </div>

                {/* Warmup Phase */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-[#6b7280]" />
                    <span className="text-xs text-[#6b7280] font-medium">Engine Phase</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    data.warmupPhase === 'full' ? 'bg-[#ecfdf5] text-[#059669]' :
                    data.warmupPhase ? 'bg-[#fef3c7] text-[#d97706]' :
                    'bg-[#f3f4f6] text-[#6b7280]'
                  }`}>
                    {data.warmupPhase === 'full' ? 'Full Speed' :
                     data.warmupPhase === 'warmup_partial' ? 'Warming Up' :
                     data.warmupPhase === 'warmup_no_url' ? 'Seed Phase' : 'Inactive'}
                  </span>
                </div>

                {/* Trust Score */}
                {data.trustScore !== null && data.trustScore !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-[#6b7280] font-medium">Trust Score</span>
                      <span className="text-xs font-bold text-[#111827]">{data.trustScore}/100</span>
                    </div>
                    <div className="w-full bg-[#f4f5f7] rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          data.trustScore >= 75 ? 'bg-[#10b981]' : data.trustScore >= 40 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'
                        }`}
                        style={{ width: `${Math.min(100, data.trustScore)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Last Publish */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#6b7280]" />
                    <span className="text-xs text-[#6b7280] font-medium">Last Published</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#111827]">
                    {data.lastPublishAt ? timeAgo(data.lastPublishAt) : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Health */}
          <div className="neo-container rounded-xl p-1.5">
            <div className="neo-inner-recess rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#111827]">Product Health</h3>
                <Link href="/products" className="text-xs font-semibold text-[#6b7280] hover:text-[#111827] transition-colors flex items-center gap-1">
                  Manage <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#6b7280]" />
                    <span className="text-xs text-[#6b7280] font-medium">Total Products</span>
                  </div>
                  <span className="text-xs font-bold text-[#111827]">{data.totalProducts}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-[#10b981]" />
                    <span className="text-xs text-[#6b7280] font-medium">Valid URLs</span>
                  </div>
                  <span className="text-xs font-bold text-[#10b981]">{data.productsWithValidUrl}</span>
                </div>

                {data.productsMissingUrl > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b]" />
                      <span className="text-xs text-[#6b7280] font-medium">Missing URLs</span>
                    </div>
                    <Link
                      href="/products"
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#fef3c7] text-[#d97706] hover:bg-[#fde68a] transition-colors"
                    >
                      Fix {data.productsMissingUrl} →
                    </Link>
                  </div>
                )}

                {data.productsMissingUrl > 0 && (
                  <p className="text-[10px] text-[#9ca3af] font-medium leading-relaxed mt-1">
                    Pins for products without valid URLs will publish without a destination link.
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Sub-Components ─────────────────────────────────────────

function NeoStatCard({ icon, label, value, href }: {
  icon: React.ReactNode
  label: string
  value: number
  href?: string
}) {
  const card = (
    <div className="neo-container rounded-xl p-1.5 flex flex-col">
      <div className="neo-inner-recess rounded-lg p-4 flex items-center gap-4">
        <div className="w-11 h-11 rounded-full neo-dark-btn flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-[#111827] leading-none mb-0.5 tracking-tight">
            {value.toLocaleString()}
          </h3>
          <p className="text-xs font-medium text-[#6b7280]">{label}</p>
        </div>
      </div>
      {href && (
        <div className="py-2 flex justify-center items-center">
          <span className="text-[11px] font-semibold text-[#6b7280] group-hover:text-[#111827] transition-colors flex items-center gap-1">
            View Details <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      )}
    </div>
  )

  return href ? <Link href={href} className="group">{card}</Link> : card
}

function PipelineStat({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <div>
        <p className="text-xs font-bold text-[#111827]">{count}</p>
        <p className="text-[10px] font-medium text-[#6b7280]">{label}</p>
      </div>
    </div>
  )
}

function ActivityIcon({ status }: { status: string }) {
  switch (status) {
    case 'published':
      return <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" /></div>
    case 'queued':
      return <div className="w-7 h-7 rounded-lg bg-[#eef2ff] flex items-center justify-center"><Clock className="w-3.5 h-3.5 text-[#6366f1]" /></div>
    case 'pending_approval':
      return <div className="w-7 h-7 rounded-lg bg-[#fef3c7] flex items-center justify-center"><Eye className="w-3.5 h-3.5 text-[#d97706]" /></div>
    case 'failed':
      return <div className="w-7 h-7 rounded-lg bg-[#fef2f2] flex items-center justify-center"><XCircle className="w-3.5 h-3.5 text-[#ef4444]" /></div>
    case 'generating':
    case 'rendered':
      return <div className="w-7 h-7 rounded-lg bg-[#f3f4f6] flex items-center justify-center"><Loader2 className="w-3.5 h-3.5 text-[#6b7280] animate-spin" /></div>
    default:
      return <div className="w-7 h-7 rounded-lg bg-[#f3f4f6] flex items-center justify-center"><ImageIcon className="w-3.5 h-3.5 text-[#6b7280]" /></div>
  }
}

// ─── Helpers ────────────────────────────────────────────────

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_approval: 'Needs review',
    queued: 'Queued for publishing',
    published: 'Published',
    failed: 'Failed',
    generating: 'Generating',
    rendered: 'Rendered',
    rejected: 'Rejected',
  }
  return labels[status] || status
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
