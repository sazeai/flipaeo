'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Eye,
  MousePointerClick,
  Bookmark,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Beaker,
  Trophy,
  BarChart3,
  Loader2,
  Crown,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ─── Types ──────────────────────────────────────────────────

interface AnalyticsData {
  summary: {
    impressions: number
    clicks: number
    saves: number
    ctr: number
    impressionsChange: number | null
    clicksChange: number | null
    savesChange: number | null
  }
  timeSeries: {
    date: string
    impressions: number
    clicks: number
    saves: number
    ctr: number
  }[]
  productLeaderboard: {
    id: string
    title: string
    image_url: string | null
    pins: number
    impressions: number
    clicks: number
    saves: number
    ctr: number
  }[]
  health: {
    shadowBanRisk: string
    warmupPhase: string | null
    trustScore: number | null
    accountAgeDays: number | null
    zeroImpressionRate: number
    recentPinCount: number
    lastChecked: string | null
  }
  aestheticWeights: {
    tag: string
    weight: number
    pinsUsed: number
    totalClicks: number
    ctr: number
  }[]
  experiments: any[]
}

type ChartMetric = 'impressions' | 'clicks' | 'saves' | 'ctr'
type DateRange = 7 | 30 | 90

// ─── Helper Components ──────────────────────────────────────

function ChangeIndicator({ value }: { value: number | null }) {
  if (value === null || value === 0) {
    return <span className="flex items-center gap-0.5 text-neutral-400 text-xs"><Minus className="w-3 h-3" /> —</span>
  }
  if (value > 0) {
    return <span className="flex items-center gap-0.5 text-emerald-600 text-xs font-medium"><TrendingUp className="w-3 h-3" /> +{value}%</span>
  }
  return <span className="flex items-center gap-0.5 text-red-500 text-xs font-medium"><TrendingDown className="w-3 h-3" /> {value}%</span>
}

function RiskMeter({ risk }: { risk: string }) {
  const config: Record<string, { label: string; color: string; bg: string; icon: any; desc: string }> = {
    low: { label: 'Healthy', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: ShieldCheck, desc: 'Your account is in good standing. Publishing at normal rate.' },
    medium: { label: 'Caution', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: ShieldAlert, desc: 'Some pins have low distribution. Publishing rate has been reduced automatically to protect your account.' },
    high: { label: 'At Risk', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: ShieldX, desc: 'Most recent pins have zero impressions. Publishing is heavily throttled. This is usually temporary — Pinterest may be reviewing your account.' },
    unknown: { label: 'No Data', color: 'text-neutral-400', bg: 'bg-neutral-50 border-neutral-200', icon: ShieldCheck, desc: 'No health data available yet. Connect your Pinterest account and publish some pins to start tracking.' },
  }
  const c = config[risk] || config.unknown
  const Icon = c.icon

  return (
    <div className={`rounded-2xl border p-5 ${c.bg}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${risk === 'low' ? 'bg-emerald-100' : risk === 'medium' ? 'bg-amber-100' : risk === 'high' ? 'bg-red-100' : 'bg-neutral-100'}`}>
          <Icon className={`w-5 h-5 ${c.color}`} />
        </div>
        <div>
          <p className={`font-semibold ${c.color}`}>{c.label}</p>
          <p className="text-xs text-neutral-500">Account Health</p>
        </div>
      </div>
      <p className="text-sm text-neutral-600 leading-relaxed">{c.desc}</p>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<DateRange>(30)
  const [chartMetric, setChartMetric] = useState<ChartMetric>('impressions')
  const [productSort, setProductSort] = useState<'clicks' | 'impressions' | 'ctr'>('clicks')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/overview?range=${range}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    }
    setLoading(false)
  }, [range])

  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded-xl w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-2xl" />)}
        </div>
        <div className="h-80 bg-muted rounded-2xl" />
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <BarChart3 className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
        <h3 className="font-semibold text-neutral-600 mb-1">No analytics data yet</h3>
        <p className="text-sm text-neutral-400">Analytics will appear once your pins start getting published and collecting impressions.</p>
      </div>
    )
  }

  const { summary, timeSeries, productLeaderboard, health, aestheticWeights, experiments } = data

  // Sort product leaderboard
  const sortedProducts = [...productLeaderboard].sort((a, b) => {
    if (productSort === 'ctr') return b.ctr - a.ctr
    if (productSort === 'impressions') return b.impressions - a.impressions
    return b.clicks - a.clicks
  })

  const chartMetricConfig: Record<ChartMetric, { label: string; color: string; format: (v: number) => string }> = {
    impressions: { label: 'Impressions', color: '#6366f1', format: v => v.toLocaleString() },
    clicks: { label: 'Clicks', color: '#10b981', format: v => v.toLocaleString() },
    saves: { label: 'Saves', color: '#f59e0b', format: v => v.toLocaleString() },
    ctr: { label: 'CTR', color: '#ec4899', format: v => `${v}%` },
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Analytics</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Track your Pinterest performance, discover what works, and optimize your strategy.
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-1.5">
        {([7, 30, 90] as DateRange[]).map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${range === r
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
          >
            {r}d
          </button>
        ))}
      </div>

      {/* ─── Section 1: Hero Stat Cards ──────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Eye}
          label="Impressions"
          value={summary.impressions.toLocaleString()}
          change={summary.impressionsChange}
          color="indigo"
        />
        <StatCard
          icon={MousePointerClick}
          label="Outbound Clicks"
          value={summary.clicks.toLocaleString()}
          change={summary.clicksChange}
          color="emerald"
        />
        <StatCard
          icon={Bookmark}
          label="Saves"
          value={summary.saves.toLocaleString()}
          change={summary.savesChange}
          color="amber"
        />
        <StatCard
          icon={TrendingUp}
          label="Click-Through Rate"
          value={`${summary.ctr}%`}
          change={null}
          color="pink"
        />
      </div>

      {/* ─── Section 2: Performance Chart ────────────────────── */}
      <div className="bg-white rounded-2xl border border-neutral-200/70 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-base font-semibold text-neutral-900">Performance Over Time</h2>
          <div className="flex gap-1">
            {(Object.keys(chartMetricConfig) as ChartMetric[]).map(metric => (
              <button
                key={metric}
                onClick={() => setChartMetric(metric)}
                className={`cursor-pointer px-2.5 py-1 rounded-md text-xs font-medium transition-all ${chartMetric === metric
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-500 hover:bg-neutral-100'
                  }`}
              >
                {chartMetricConfig[metric].label}
              </button>
            ))}
          </div>
        </div>

        {timeSeries.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#999' }}
                tickFormatter={v => {
                  const d = new Date(v)
                  return `${d.getDate()}/${d.getMonth() + 1}`
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#999' }}
                tickFormatter={v => chartMetric === 'ctr' ? `${v}%` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString()}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                formatter={(value: any) => [chartMetricConfig[chartMetric].format(Number(value)), chartMetricConfig[chartMetric].label]}
                labelFormatter={(label: any) => new Date(String(label)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <Line
                type="monotone"
                dataKey={chartMetric}
                stroke={chartMetricConfig[chartMetric].color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-neutral-400 text-sm">
            No data available for this period. Analytics snapshots will appear after your pins start collecting impressions.
          </div>
        )}
      </div>

      {/* Two-column layout for leaderboard + health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* ─── Section 3: Product Leaderboard ──────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200/70 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-neutral-900">Product Leaderboard</h2>
            <div className="flex gap-1">
              {([
                { key: 'clicks' as const, label: 'Clicks' },
                { key: 'impressions' as const, label: 'Views' },
                { key: 'ctr' as const, label: 'CTR' },
              ]).map(s => (
                <button
                  key={s.key}
                  onClick={() => setProductSort(s.key)}
                  className={`cursor-pointer px-2 py-1 rounded-md text-[11px] font-medium transition-all ${productSort === s.key
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-500 hover:bg-neutral-100'
                    }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {sortedProducts.length > 0 ? (
            <div className="space-y-2">
              {sortedProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${idx === 0 ? 'bg-amber-50/70 border border-amber-100' : 'hover:bg-neutral-50'
                    }`}
                >
                  <span className={`text-sm font-bold w-6 text-center shrink-0 ${idx === 0 ? 'text-amber-500' : 'text-neutral-300'
                    }`}>
                    {idx === 0 ? <Crown className="w-4 h-4 mx-auto" /> : `#${idx + 1}`}
                  </span>

                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-neutral-100 shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{product.title}</p>
                    <p className="text-[11px] text-neutral-400">{product.pins} pins published</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-neutral-500 shrink-0">
                    <span className="hidden sm:flex items-center gap-1"><Eye className="w-3 h-3" /> {product.impressions.toLocaleString()}</span>
                    <span className="flex items-center gap-1 font-medium text-neutral-700"><MousePointerClick className="w-3 h-3" /> {product.clicks.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {product.ctr}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-400 text-center py-8">No published pins yet.</p>
          )}
        </div>

        {/* ─── Section 4: Account Health Panel ─────────────────── */}
        <div className="space-y-4">
          <RiskMeter risk={health.shadowBanRisk} />

          <div className="bg-white rounded-2xl border border-neutral-200/70 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">Account Details</h3>

            <div className="space-y-3">
              {/* Warmup Phase */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Phase</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${health.warmupPhase === 'full'
                  ? 'bg-emerald-100 text-emerald-700'
                  : health.warmupPhase === 'warmup_partial'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-sky-100 text-sky-700'
                  }`}>
                  {health.warmupPhase === 'full' ? 'Full Speed' : health.warmupPhase === 'warmup_partial' ? 'Warming Up' : health.warmupPhase === 'warmup_no_url' ? 'Seed Phase' : 'N/A'}
                </span>
              </div>

              {/* Trust Score */}
              {health.trustScore !== null && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-neutral-500">Trust Score</span>
                    <span className="text-xs font-bold text-neutral-700">{health.trustScore}/100</span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${health.trustScore >= 75 ? 'bg-emerald-500' : health.trustScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                      style={{ width: `${Math.min(100, health.trustScore)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Zero Impression Rate */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Zero-impression rate (7d)</span>
                <span className={`text-xs font-semibold ${health.zeroImpressionRate > 50 ? 'text-red-600' : health.zeroImpressionRate > 20 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                  {health.zeroImpressionRate}%
                </span>
              </div>

              {/* Account Age */}
              {health.accountAgeDays !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Account age</span>
                  <span className="text-xs text-neutral-700">{health.accountAgeDays} days</span>
                </div>
              )}

              {/* Recent Pins */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Pins published (7d)</span>
                <span className="text-xs text-neutral-700">{health.recentPinCount}</span>
              </div>
            </div>
          </div>

          {/* Aesthetic Performance */}
          {aestheticWeights.length > 0 && (
            <div className="bg-white rounded-2xl border border-neutral-200/70 p-5">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Aesthetic Performance</h3>
              <div className="space-y-2">
                {aestheticWeights.map((aw, idx) => (
                  <div key={aw.tag} className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold w-5 text-center ${idx === 0 ? 'text-amber-500' : 'text-neutral-300'}`}>
                      {idx === 0 ? '★' : idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-800 truncate">{aw.tag}</p>
                    </div>
                    <span className="text-[11px] text-neutral-500">{aw.pinsUsed} pins</span>
                    <span className="text-[11px] font-semibold text-neutral-700 w-12 text-right">{aw.ctr}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Section 5: A/B Experiment Results ─────────────── */}
      {experiments.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200/70 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <Beaker className="w-4 h-4 text-violet-500" />
            <h2 className="text-base font-semibold text-neutral-900">A/B Experiments</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {experiments.map((exp: any) => {
              const pinA = exp.pin_a
              const pinB = exp.pin_b
              const metricsA = exp.metrics_a || {}
              const metricsB = exp.metrics_b || {}
              const isRunning = exp.status === 'running'
              const isConcluded = exp.status === 'concluded'

              return (
                <div key={exp.id} className="border border-neutral-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-neutral-500 truncate">
                      {exp.products?.title || 'Product'}
                    </p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${isRunning ? 'bg-violet-100 text-violet-700' :
                      isConcluded ? 'bg-emerald-100 text-emerald-700' :
                        'bg-neutral-100 text-neutral-500'
                      }`}>
                      {isRunning ? 'Running' : isConcluded ? 'Concluded' : 'Expired'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Variant A */}
                    <div className={`relative rounded-lg border p-2 ${exp.winner === 'a' ? 'border-emerald-300 bg-emerald-50/50' : 'border-neutral-200'}`}>
                      {exp.winner === 'a' && (
                        <div className="absolute -top-2 -right-2">
                          <Trophy className="w-4 h-4 text-emerald-600" />
                        </div>
                      )}
                      {pinA?.rendered_image_url && (
                        <img src={pinA.rendered_image_url} alt="" className="w-full aspect-[2/3] object-cover rounded-md mb-2" />
                      )}
                      <p className="text-[10px] font-semibold text-neutral-700 mb-0.5">{exp.aesthetic_a}</p>
                      {isConcluded && (
                        <p className="text-[10px] text-neutral-500">CTR: {metricsA.ctr || 0}%</p>
                      )}
                    </div>

                    {/* Variant B */}
                    <div className={`relative rounded-lg border p-2 ${exp.winner === 'b' ? 'border-emerald-300 bg-emerald-50/50' : 'border-neutral-200'}`}>
                      {exp.winner === 'b' && (
                        <div className="absolute -top-2 -right-2">
                          <Trophy className="w-4 h-4 text-emerald-600" />
                        </div>
                      )}
                      {pinB?.rendered_image_url && (
                        <img src={pinB.rendered_image_url} alt="" className="w-full aspect-[2/3] object-cover rounded-md mb-2" />
                      )}
                      <p className="text-[10px] font-semibold text-neutral-700 mb-0.5">{exp.aesthetic_b}</p>
                      {isConcluded && (
                        <p className="text-[10px] text-neutral-500">CTR: {metricsB.ctr || 0}%</p>
                      )}
                    </div>
                  </div>

                  {isRunning && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-violet-600">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Evaluating... {Math.max(0, 7 - Math.floor((Date.now() - new Date(exp.started_at).getTime()) / (1000 * 60 * 60 * 24)))} days remaining</span>
                    </div>
                  )}

                  {exp.winner === 'tie' && (
                    <p className="mt-3 text-xs text-neutral-500 text-center">No clear winner — performance was too similar</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Stat Card Component ─────────────────────────────────────

function StatCard({ icon: Icon, label, value, change, color }: {
  icon: any
  label: string
  value: string
  change: number | null
  color: 'indigo' | 'emerald' | 'amber' | 'pink'
}) {
  const colorStyles = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    pink: 'bg-pink-50 text-pink-600',
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/70 p-4 sm:p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`p-2 rounded-xl ${colorStyles[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-neutral-500 font-medium">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">{value}</p>
      <div className="mt-1.5">
        <ChangeIndicator value={change} />
      </div>
    </div>
  )
}
