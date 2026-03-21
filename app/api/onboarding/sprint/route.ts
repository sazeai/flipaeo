import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const {
      user_sprint_id,
      primary_blog_sitemap_url,
      additional_sitemap_urls = [],
      conversion_goal,
      target_region,
      target_language,
    } = body || {}

    if (!user_sprint_id) {
      return NextResponse.json({ error: "user_sprint_id is required" }, { status: 400 })
    }
    if (!primary_blog_sitemap_url || typeof primary_blog_sitemap_url !== "string") {
      return NextResponse.json({ error: "primary_blog_sitemap_url is required" }, { status: 400 })
    }

    const { data: sprint } = await supabase
      .from("user_sprints")
      .select("id, user_id, metadata")
      .eq("id", user_sprint_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!sprint) return NextResponse.json({ error: "Sprint not found" }, { status: 404 })

    const mergedMetadata = {
      ...(sprint.metadata || {}),
      onboarding: {
        primary_blog_sitemap_url,
        additional_sitemap_urls: Array.isArray(additional_sitemap_urls) ? additional_sitemap_urls : [],
        conversion_goal: conversion_goal || null,
        target_region: target_region || null,
        target_language: target_language || null,
        updated_at: new Date().toISOString(),
      },
    }

    const { error: updateError } = await supabase
      .from("user_sprints")
      .update({ metadata: mergedMetadata, updated_at: new Date().toISOString() })
      .eq("id", user_sprint_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to save onboarding" }, { status: 500 })
  }
}
