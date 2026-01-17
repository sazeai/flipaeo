import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { SEOMetricsDashboard } from "@/components/seo-metrics-dashboard"
import { GlobalCard } from "@/components/ui/global-card"
import Link from "next/link"
import { Lock, Sparkles, BarChart3, Shield, Zap } from "lucide-react"

export const metadata = {
    title: "SEO Health | Site Performance & Metrics",
    description: "View your domain authority, backlinks, PageSpeed scores, and Core Web Vitals"
}

export default async function SEOHealthPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/sign-in")
    }

    // Check for active subscription
    const { data: subscription } = await supabase
        .from("dodo_subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()

    const hasActiveSubscription = !!subscription

    // Get the user's active brand
    const { data: brand } = await supabase
        .from("brand_details")
        .select("id, website_url, brand_data")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

    // Extract domain from brand URL
    let domain = ""
    if (brand?.website_url) {
        domain = brand.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]
    } else if (brand?.brand_data?.website) {
        domain = brand.brand_data.website.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]
    }

    if (!domain) {
        return (
            <div className="container max-w-4xl py-8">
                <div className="text-center py-20">
                    <h1 className="text-2xl font-bold mb-4">No Brand Found</h1>
                    <p className="text-muted-foreground">
                        Please complete onboarding first to analyze your site.
                    </p>
                </div>
            </div>
        )
    }

    // Show locked state if no active subscription
    if (!hasActiveSubscription) {
        return (
            <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
                <GlobalCard className="max-w-lg w-full" contentClassName="p-8">
                    <div className="space-y-6 text-center">
                        {/* Icon */}
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center border border-amber-200/50 shadow-sm">
                                <Lock className="w-7 h-7 text-gray-600" />
                            </div>
                        </div>

                        {/* Copy */}
                        <div className="space-y-3">
                            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
                                SEO Health Dashboard
                            </h1>
                            <p className="text-stone-500 leading-relaxed">
                                Monitor your domain authority, backlinks, PageSpeed scores, and Core Web Vitals with our comprehensive SEO analysis.
                            </p>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-3 text-left">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-stone-50 border border-stone-100">
                                <BarChart3 className="w-4 h-4 text-stone-500" />
                                <span className="text-xs font-medium text-stone-700">Domain Authority</span>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-stone-50 border border-stone-100">
                                <Zap className="w-4 h-4 text-stone-500" />
                                <span className="text-xs font-medium text-stone-700">PageSpeed Scores</span>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-stone-50 border border-stone-100">
                                <Shield className="w-4 h-4 text-stone-500" />
                                <span className="text-xs font-medium text-stone-700">Core Web Vitals</span>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-stone-50 border border-stone-100">
                                <BarChart3 className="w-4 h-4 text-stone-500" />
                                <span className="text-xs font-medium text-stone-700">Backlink Analysis</span>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <Link href="/subscribe" className="block">
                            <button
                                className="w-full h-12 rounded-lg inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm border border-stone-700 transition-all duration-150 ease-out cursor-pointer select-none active:translate-y-[2px] active:shadow-[0_2px_0_0_#1c1917]"
                            >
                                <Sparkles className="w-4 h-4" />
                                Upgrade to Unlock
                            </button>
                        </Link>

                        <p className="text-[10px] text-stone-400 font-medium">
                            Included with all subscription plans
                        </p>
                    </div>
                </GlobalCard>
            </div>
        )
    }

    return (
        <div className="w-full h-full min-h-[calc(100vh-4rem)] flex flex-col">
            <SEOMetricsDashboard domain={domain} brandId={brand?.id} />
        </div>
    )
}
