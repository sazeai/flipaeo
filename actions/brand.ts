"use server"

import { createClient } from "@/utils/supabase/server"
import { getUserBrandLimit, getBrandCount } from "@/lib/brands"
import { BrandDetails } from "@/lib/schemas/brand"

export async function saveBrandAction(
  url: string,
  brandData: BrandDetails,
  competitors?: string[] // Optional competitor domains from onboarding
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get user's brand limit
  let limit = await getUserBrandLimit(user.id)
  // Fail-safe: If limit is 0 (unknown active plan or glitch), allow 1 slot
  if (limit === 0) limit = 1

  // For users with single-brand limit (most common case), always update existing brand
  if (limit === 1) {
    const { data: existingBrand } = await supabase
      .from("brand_details")
      .select("id")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle()

    if (existingBrand) {
      // Update existing brand with new URL and data
      const updatePayload: Record<string, any> = {
        brand_data: brandData,
        website_url: url
      }
      // Save competitors if provided
      if (competitors && competitors.length > 0) {
        updatePayload.discovered_competitors = competitors
          .filter(c => c.trim())
          .map(domain => {
            const clean = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
            return { name: clean, url: `https://${clean}` }
          })
      }
      const { error } = await supabase
        .from("brand_details")
        .update(updatePayload)
        .eq("id", existingBrand.id)
        .eq("user_id", user.id)

      if (error) return { success: false, error: error.message }
      return { success: true, brandId: existingBrand.id }
    }
    // No existing brand, will insert below
  } else {
    // Multi-brand users: check for existing brand with same URL
    const { data: existingBrand } = await supabase
      .from("brand_details")
      .select("id")
      .eq("user_id", user.id)
      .eq("website_url", url)
      .is("deleted_at", null)
      .maybeSingle()

    if (existingBrand) {
      return updateBrandAction(existingBrand.id, brandData)
    }

    // Check limit for multi-brand users
    const currentCount = await getBrandCount(user.id)
    if (currentCount >= limit) {
      return {
        success: false,
        error: `Plan limit reached. You have ${currentCount} brands, but your plan allows ${limit}. Please upgrade.`
      }
    }
  }

  // Insert new brand
  const insertPayload: Record<string, any> = {
    user_id: user.id,
    website_url: url,
    brand_data: brandData,
  }
  // Save competitors if provided
  if (competitors && competitors.length > 0) {
    insertPayload.discovered_competitors = competitors
      .filter(c => c.trim())
      .map(domain => {
        const clean = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
        return { name: clean, url: `https://${clean}` }
      })
  }
  const { data, error } = await supabase
    .from("brand_details")
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, brandId: data.id }
}

export async function updateBrandAction(brandId: string, brandData: BrandDetails) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("brand_details")
    .update({
      brand_data: brandData,
    })
    .eq("id", brandId)
    .eq("user_id", user.id) // Security check

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, brandId }
}

export async function getUserBrands() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase
    .from("brand_details")
    .select("id, website_url, brand_data, created_at")
    .eq("user_id", user.id)
    .is("deleted_at", null) // Exclude soft-deleted brands
    .order("created_at", { ascending: false })

  return data || []
}

export async function getUserBrandStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { brands: [], limit: 0, count: 0 }

  const [limit, brands] = await Promise.all([
    getUserBrandLimit(user.id),
    getUserBrands()
  ])

  return {
    brands,
    limit,
    count: brands.length
  }
}

export async function deleteBrandAction(brandId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Soft delete: set deleted_at instead of actually deleting
  // This prevents the delete-recreate abuse loop
  const { error } = await supabase
    .from("brand_details")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", brandId)
    .eq("user_id", user.id) // Security: Ensure user owns the brand

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
