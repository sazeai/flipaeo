app\api\fal\generate\route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { fal } from "@fal-ai/client";
import { enhancePrompt, enhanceCouplePrompt } from "@/lib/genai";
import { hasCredits, deductCredits } from "@/lib/credits";
import { apiRateLimit, checkRateLimit } from "@/utils/rate-limit";

const FAL_KEY = process.env.FAL_KEY;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/fal/webhook`
    : null;

if (!FAL_KEY) {
    console.warn("MISSING FAL_KEY env variable");
}

fal.config({ credentials: FAL_KEY || "" });

const CREDIT_COST = 1;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST: Submit image generation job to fal.ai queue
export async function POST(request: NextRequest) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit check
    const rl = await checkRateLimit(`fal-generate:${user.id}`, apiRateLimit);
    if (!rl.success) {
        console.warn("Rate limit exceeded on fal-generate", { userId: user.id });
    }

    try {
        const body = await request.json();
        const { modelId, prompt, mode, gender, lighting, aspectRatio } = body;

        if (!modelId || !prompt) {
            return NextResponse.json({ error: "modelId and prompt are required" }, { status: 400 });
        }

        // Check credits
        const { hasCredits: hasSufficientCredits, currentBalance } = await hasCredits(user.id, CREDIT_COST);
        if (!hasSufficientCredits) {
            return NextResponse.json({
                error: "Insufficient credits",
                currentBalance
            }, { status: 402 });
        }

        // Verify model belongs to user
        const { data: model, error: modelError } = await supabase
            .from("models")
            .select("id, user_id, type, mode, samples(uri)")
            .eq("id", modelId)
            .single();

        if (modelError || !model || model.user_id !== user.id) {
            return NextResponse.json({ error: "Model not found or forbidden" }, { status: 404 });
        }

        // Get sample image URLs for reference
        const referenceImageUrls = (model.samples || []).map((s: any) => s.uri);
        if (referenceImageUrls.length === 0) {
            return NextResponse.json({ error: "Model has no sample images" }, { status: 400 });
        }

        // Enhance prompt - use couple prompt enhancer for couple models
        const isCouple = model.mode === 'couple';
        const enhancedPrompt = isCouple
            ? await enhanceCouplePrompt(prompt, mode || "FLASH", lighting || "DAYLIGHT")
            : await enhancePrompt(prompt, mode || "FLASH", gender || model.type || "Male", lighting || "DAYLIGHT");

        // Deduct credits upfront (optimistic)
        const { success: deducted } = await deductCredits(user.id, CREDIT_COST);
        if (!deducted) {
            return NextResponse.json({ error: "Failed to deduct credits" }, { status: 500 });
        }

        // Map aspect ratio to fal.ai supported sizes
        // Fal supports: portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9, or custom { width, height }
        let imageSize: string | { width: number; height: number };

        switch (aspectRatio) {
            case "9:16":
                imageSize = "portrait_16_9";  // Tall portrait (phone screen)
                break;
            case "16:9":
                imageSize = "landscape_16_9"; // Wide landscape
                break;
            case "3:4":
                imageSize = "portrait_4_3";   // Standard portrait
                break;
            case "4:5":
                imageSize = { width: 1080, height: 1350 };  // Instagram portrait (not natively supported)
                break;
            case "4:3":
                imageSize = "landscape_4_3";  // Standard landscape
                break;
            case "5:4":
                imageSize = { width: 1350, height: 1080 };  // Slightly wide (not natively supported)
                break;
            default:
                imageSize = "portrait_16_9";  // Default to 9:16
        }

        // Submit to fal.ai queue with webhook
        const { request_id } = await fal.queue.submit("fal-ai/bytedance/seedream/v4.5/edit", {
            input: {
                prompt: enhancedPrompt,
                image_urls: referenceImageUrls,
                image_size: imageSize,
                num_images: 1,
                enable_safety_checker: true,
            },
            webhookUrl: WEBHOOK_URL || undefined,
        });

        // Save job to database
        const { data: job, error: jobError } = await supabase
            .from("generation_jobs")
            .insert({
                user_id: user.id,
                model_id: parseInt(modelId),
                fal_request_id: request_id,
                prompt,
                enhanced_prompt: enhancedPrompt,
                status: "pending",
                credits_deducted: CREDIT_COST,
            })
            .select()
            .single();

        if (jobError) {
            console.error("Failed to save job:", jobError);
            // Still return success since fal job was submitted
        }

        return NextResponse.json({
            success: true,
            jobId: job?.id,
            requestId: request_id,
            status: "pending",
        });

    } catch (error) {
        console.error("Error submitting fal job:", error);
        return NextResponse.json({
            error: "Failed to submit generation job",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}



2. app\api\fal\jobs\route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { fal } from "@fal-ai/client";
import { putR2Object } from "@/lib/r2";

export const dynamic = "force-dynamic";

fal.config({ credentials: process.env.FAL_KEY || "" });

// GET: Fetch user's generation jobs and poll for updates
export async function GET(request: NextRequest) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get("modelId");
    const statusFilter = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    let query = supabase
        .from("generation_jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (modelId) {
        query = query.eq("model_id", parseInt(modelId));
    }

    if (statusFilter) {
        query = query.eq("status", statusFilter);
    }

    const { data: jobs, error } = await query;

    if (error) {
        console.error("Error fetching jobs:", error);
        return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
    }

    // For pending jobs, poll fal.ai for status updates
    const pendingJobs = jobs?.filter(j => j.status === "pending") || [];
    let hasNewCompletions = false;

    if (pendingJobs.length > 0) {
        console.log(`Polling ${pendingJobs.length} pending jobs...`);

        for (const job of pendingJobs.slice(0, 5)) {
            try {
                const falStatus = await fal.queue.status("fal-ai/bytedance/seedream/v4.5/edit", {
                    requestId: job.fal_request_id,
                });

                console.log(`Job ${job.id} fal status:`, falStatus.status);

                if (falStatus.status === "COMPLETED") {
                    // ATOMIC LOCK: Try to claim the job by setting status to 'processing'
                    const { data: claimedJob, error: claimError } = await supabase
                        .from("generation_jobs")
                        .update({ status: "processing" })
                        .eq("id", job.id)
                        .eq("status", "pending")  // Only if still pending
                        .select()
                        .single();

                    if (claimError || !claimedJob) {
                        console.log(`Job ${job.id} already claimed by another process, skipping`);
                        continue;  // Another process (webhook) got it first
                    }

                    console.log(`Polling claimed job ${job.id}, fetching result...`);

                    // Fetch the result
                    const result = await fal.queue.result("fal-ai/bytedance/seedream/v4.5/edit", {
                        requestId: job.fal_request_id,
                    });

                    const falImageUrl = (result.data as any)?.images?.[0]?.url;
                    console.log(`Job ${job.id} completed, fal image URL:`, falImageUrl);

                    if (falImageUrl) {
                        try {
                            // Download image from fal.ai
                            const imageResponse = await fetch(falImageUrl);
                            if (!imageResponse.ok) {
                                throw new Error(`Failed to fetch from fal: ${imageResponse.status}`);
                            }

                            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
                            console.log(`Downloaded image, size: ${imageBuffer.length} bytes`);

                            // Generate R2 key
                            const timestamp = Date.now();
                            const randomId = crypto.randomUUID();
                            const key = `generated/${user.id}/${job.model_id}/${timestamp}-${randomId}.png`;

                            // Upload to R2
                            await putR2Object(key, imageBuffer, "image/png");
                            console.log(`Uploaded to R2: ${key}`);

                            // Construct public URL
                            const r2BaseUrl = process.env.R2_PUBLIC_URL || "";
                            const publicUri = `${r2BaseUrl}/${key}`;

                            // Save to images table
                            const { data: newImage, error: imageError } = await supabase
                                .from("images")
                                .insert({
                                    uri: publicUri,
                                    modelId: job.model_id,
                                })
                                .select()
                                .single();

                            if (imageError) {
                                console.error("Failed to save image to DB:", imageError);
                            } else {
                                console.log(`Saved image to DB, id: ${newImage?.id}`);
                            }

                            // Update job as completed
                            await supabase
                                .from("generation_jobs")
                                .update({
                                    status: "completed",
                                    result_url: publicUri,
                                    image_id: newImage?.id,
                                    completed_at: new Date().toISOString(),
                                })
                                .eq("id", job.id);

                            // If this is a preview job, update the preview_images table
                            if (job.is_preview) {
                                await supabase
                                    .from("preview_images")
                                    .update({
                                        image_url: publicUri,
                                        status: "completed",
                                        completed_at: new Date().toISOString(),
                                    })
                                    .eq("job_id", job.id);

                                console.log(`Preview image completed for job ${job.id}`);
                            }

                            hasNewCompletions = true;
                        } catch (saveError) {
                            console.error("Failed to save generated image:", saveError);

                            // Mark as failed with error message
                            await supabase
                                .from("generation_jobs")
                                .update({
                                    status: "failed",
                                    error_message: `Failed to save: ${saveError instanceof Error ? saveError.message : "Unknown"}`,
                                    completed_at: new Date().toISOString(),
                                })
                                .eq("id", job.id);
                        }
                    }
                } else if ((falStatus as any).status === "FAILED") {
                    await supabase
                        .from("generation_jobs")
                        .update({
                            status: "failed",
                            error_message: "Generation failed on fal.ai",
                            completed_at: new Date().toISOString(),
                        })
                        .eq("id", job.id);
                }
            } catch (e) {
                console.error("Status check failed for job:", job.id, e);
            }
        }
    }

    // If we had completions, refetch the jobs to return updated data
    if (hasNewCompletions) {
        const { data: updatedJobs } = await supabase
            .from("generation_jobs")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(limit);

        return NextResponse.json({ jobs: updatedJobs, hasNewCompletions: true });
    }

    return NextResponse.json({ jobs, hasNewCompletions: false });
}



3. app\api\fal\webhook\route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { putR2Object } from "@/lib/r2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Create a service role client for webhook (bypasses RLS)
function getServiceClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(supabaseUrl, serviceRoleKey);
}

// POST: Handle fal.ai webhook callback
export async function POST(request: NextRequest) {
    const supabase = getServiceClient();

    try {
        const body = await request.json();
        const { request_id, status, payload, error: falError } = body;

        console.log("Fal webhook received:", { request_id, status });

        if (!request_id) {
            return NextResponse.json({ error: "Missing request_id" }, { status: 400 });
        }

        // Find the job by fal_request_id
        const { data: job, error: jobFetchError } = await supabase
            .from("generation_jobs")
            .select("*")
            .eq("fal_request_id", request_id)
            .single();

        if (jobFetchError || !job) {
            console.error("Job not found for request_id:", request_id);
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        // Skip if job already completed/failed/processing
        if (job.status !== "pending") {
            console.log("Job already being processed or completed, skipping:", request_id, job.status);
            return NextResponse.json({ received: true, status: "already_processed" });
        }

        // ATOMIC LOCK: Try to claim the job by setting status to 'processing'
        // Only succeeds if status is still 'pending' (prevents race condition)
        const { data: claimedJob, error: claimError } = await supabase
            .from("generation_jobs")
            .update({ status: "processing" })
            .eq("id", job.id)
            .eq("status", "pending")  // Only update if still pending
            .select()
            .single();

        if (claimError || !claimedJob) {
            console.log("Failed to claim job (another process got it first):", request_id);
            return NextResponse.json({ received: true, status: "claimed_by_other" });
        }

        console.log("Webhook claimed job:", request_id);

        // Handle error status
        if (status === "ERROR") {
            await supabase
                .from("generation_jobs")
                .update({
                    status: "failed",
                    error_message: falError || payload?.detail?.[0]?.msg || "Generation failed",
                    completed_at: new Date().toISOString(),
                })
                .eq("id", job.id);

            // If this is a preview job, update the preview_images table
            if (job.is_preview) {
                await supabase
                    .from("preview_images")
                    .update({
                        status: "failed",
                        completed_at: new Date().toISOString(),
                    })
                    .eq("job_id", job.id);
            }

            // TODO: Consider refunding credits on failure
            console.error("Fal generation failed:", { request_id, error: falError, payload, isPreview: job.is_preview });
            return NextResponse.json({ received: true, status: "error_recorded" });
        }

        // Handle success
        if (status === "OK" && payload?.images?.[0]?.url) {
            const imageUrl = payload.images[0].url;

            try {
                // Download image from fal.ai
                const imageResponse = await fetch(imageUrl);
                if (!imageResponse.ok) throw new Error("Failed to fetch image from fal");

                let imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

                // If this is a preview job, apply watermark (burned into pixels)
                if (job.is_preview) {
                    const { applyWatermark } = await import("@/lib/watermark");
                    console.log(`Applying watermark to preview image for job ${job.id}...`);
                    const watermarked = await applyWatermark(imageBuffer, 'PREVIEW');
                    imageBuffer = Buffer.from(watermarked);
                }

                // Generate R2 key (different path for previews)
                const timestamp = Date.now();
                const randomId = crypto.randomUUID();
                const keyPrefix = job.is_preview ? 'previews' : 'generated';
                const key = `${keyPrefix}/${job.user_id}/${job.model_id}/${timestamp}-${randomId}.png`;

                // Upload to R2
                await putR2Object(key, imageBuffer, "image/png");

                // Construct public URL
                const r2BaseUrl = process.env.R2_PUBLIC_URL || "";
                const publicUri = `${r2BaseUrl}/${key}`;

                // For preview jobs, ONLY save to preview_images (not images table)
                // This prevents preview images from appearing in the gallery
                if (job.is_preview) {
                    await supabase
                        .from("preview_images")
                        .update({
                            image_url: publicUri,
                            status: "completed",
                            completed_at: new Date().toISOString(),
                        })
                        .eq("job_id", job.id);

                    // Update job as completed (no image_id for preview jobs)
                    await supabase
                        .from("generation_jobs")
                        .update({
                            status: "completed",
                            result_url: publicUri,
                            completed_at: new Date().toISOString(),
                        })
                        .eq("id", job.id);

                    console.log("Preview image completed:", { request_id, model_id: job.model_id });
                } else {
                    // Regular job - save to images table for gallery
                    const { data: image, error: imageError } = await supabase
                        .from("images")
                        .insert({
                            uri: publicUri,
                            modelId: job.model_id,
                        })
                        .select()
                        .single();

                    if (imageError) {
                        console.error("Failed to save image to DB:", imageError);
                    }

                    // Update job as completed
                    await supabase
                        .from("generation_jobs")
                        .update({
                            status: "completed",
                            result_url: publicUri,
                            image_id: image?.id,
                            completed_at: new Date().toISOString(),
                        })
                        .eq("id", job.id);
                }

                console.log("Fal generation completed:", { request_id, model_id: job.model_id, isPreview: job.is_preview });

            } catch (saveError) {
                console.error("Failed to save generated image:", saveError);

                // Mark as failed but save the fal URL
                await supabase
                    .from("generation_jobs")
                    .update({
                        status: "failed",
                        result_url: imageUrl, // Save original URL as fallback
                        error_message: "Failed to save image to storage",
                        completed_at: new Date().toISOString(),
                    })
                    .eq("id", job.id);
            }

            return NextResponse.json({ received: true, status: "completed" });
        }

        // Unknown status
        console.warn("Unknown webhook status:", { request_id, status, payload });
        return NextResponse.json({ received: true, status: "unknown" });

    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({
            error: "Webhook processing failed",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}


