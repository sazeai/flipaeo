import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { SEOMetricsDashboard } from "@/components/seo-metrics-dashboard"

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

    return (
        <div className="w-full h-full min-h-[calc(100vh-4rem)] flex flex-col">
            <SEOMetricsDashboard domain={domain} brandId={brand?.id} />
        </div>
    )
}
