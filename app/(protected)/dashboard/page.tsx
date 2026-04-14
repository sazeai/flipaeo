'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  ImageIcon,
  ShoppingBag,
  MousePointerClick,
  Activity,
  ArrowRight,
  Zap,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalProducts: number
  totalPins: number
  publishedPins: number
  totalClicks: number
  warmupPhase: string | null
  hasBrandSettings: boolean
  hasPinterest: boolean
  hasShopify: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [productsRes, pinsRes, publishedRes, brandRes, pinterestRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('pins').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('pins').select('outbound_clicks').eq('user_id', user.id).eq('status', 'published'),
        supabase.from('brand_settings').select('id').eq('user_id', user.id).maybeSingle(),
        supabase.from('pinterest_connections').select('warmup_phase').eq('user_id', user.id).maybeSingle(),
      ])

      // Redirect to onboarding if no brand_settings row exists
      if (!brandRes.data) {
        router.replace('/onboarding')
        return
      }

      const totalClicks = (publishedRes.data || []).reduce((sum: number, p: any) => sum + (p.outbound_clicks || 0), 0)

      setStats({
        totalProducts: productsRes.count || 0,
        totalPins: pinsRes.count || 0,
        publishedPins: publishedRes.data?.length || 0,
        totalClicks,
        warmupPhase: pinterestRes.data?.warmup_phase || null,
        hasBrandSettings: !!brandRes.data,
        hasPinterest: !!pinterestRes.data,
        hasShopify: false,
      })
      setLoading(false)
    }
    fetchStats()
  }, [])

  const warmupLabel = (phase: string | null) => {
    switch (phase) {
      case 'warmup_no_url': return { label: 'Warming Up (No URLs)', color: 'text-amber-600', bg: 'bg-amber-50' }
      case 'warmup_partial': return { label: 'Warming Up (Partial URLs)', color: 'text-blue-600', bg: 'bg-blue-50' }
      case 'full': return { label: 'Full Speed', color: 'text-emerald-600', bg: 'bg-emerald-50' }
      default: return { label: 'Not Connected', color: 'text-neutral-500', bg: 'bg-neutral-50' }
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-muted rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-2xl" />)}
        </div>
      </div>
    )
  }

  const warmup = warmupLabel(stats?.warmupPhase || null)
  const needsSetup = !stats?.hasBrandSettings || !stats?.hasPinterest

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Your autonomous Pinterest engine at a glance.</p>
      </div>

      {/* Setup Banner */}
      {needsSetup && (
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Complete Your Setup
            </h2>
            <p className="text-neutral-300 text-sm mt-1">
              {!stats?.hasBrandSettings && 'Set up your brand settings. '}
              {!stats?.hasPinterest && 'Connect your Pinterest account.'}
            </p>
          </div>
          <Link
            href="/onboarding"
            className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors flex items-center gap-2"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<ShoppingBag className="w-5 h-5" />}
          label="Products"
          value={stats?.totalProducts || 0}
          href="/products"
        />
        <StatCard
          icon={<ImageIcon className="w-5 h-5" />}
          label="Total Pins"
          value={stats?.totalPins || 0}
          href="/pins"
        />
        <StatCard
          icon={<MousePointerClick className="w-5 h-5" />}
          label="Outbound Clicks"
          value={stats?.totalClicks || 0}
          accent
        />
        <div className={`${warmup.bg} rounded-2xl p-5 border border-neutral-100`}>
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <Activity className="w-5 h-5" />
            <span className="text-sm font-medium">Engine Status</span>
          </div>
          <div className={`text-lg font-bold ${warmup.color}`}>{warmup.label}</div>
          {stats?.warmupPhase && stats.warmupPhase !== 'full' && (
            <p className="text-xs text-muted-foreground mt-1">
              Publishing rate is limited during warmup to protect your account.
            </p>
          )}
        </div>
      </div>

      {/* System Health (Anti-Ban Autopilot) */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl p-6 text-white border border-neutral-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Activity className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">System Health: Protect &amp; Scale</h2>
              <p className="text-neutral-400 text-sm">EcomPin automatically manages Pinterest's undocumented API limits to keep your store 100% safe.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Status</div>
              <div className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Autopilot Active
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Cadence Mode</div>
              <div className="text-sm font-medium text-white">Organic Entropy</div>
              <div className="text-xs text-neutral-500 mt-1">Mimicking human behavior</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-neutral-400 mb-1 uppercase tracking-wider font-semibold">Domain Trust</div>
              <div className="text-sm font-medium text-white">Actively Building</div>
              <div className="text-xs text-neutral-500 mt-1">Splicing native Mood Boards</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            href="/products"
            icon={<ShoppingBag className="w-5 h-5" />}
            title="Add Products"
            description="Upload products manually or sync from Shopify/Etsy."
          />
          <QuickAction
            href="/pin-generator"
            icon={<ImageIcon className="w-5 h-5" />}
            title="Test Pin Generator"
            description="Preview pin generation with a product image."
          />
          <QuickAction
            href="/settings"
            icon={<Zap className="w-5 h-5" />}
            title="Brand Settings"
            description="Configure your brand's visual identity for pins."
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, href, accent }: {
  icon: React.ReactNode; label: string; value: number; href?: string; accent?: boolean
}) {
  const content = (
    <div className={`bg-white rounded-2xl p-5 border border-neutral-100 hover:border-neutral-200 transition-colors ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className={`text-3xl font-bold ${accent ? 'text-emerald-600' : ''}`}>
        {value.toLocaleString()}
      </div>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

function QuickAction({ href, icon, title, description }: {
  href: string; icon: React.ReactNode; title: string; description: string
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl p-5 border border-neutral-100 hover:border-neutral-300 transition-all hover:shadow-sm"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-neutral-100 rounded-lg group-hover:bg-neutral-200 transition-colors">
          {icon}
        </div>
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  )
}
