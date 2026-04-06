import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { putR2Object } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate a unique key
    const extension = file.name.split(".").pop();
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const key = `user-uploads/${user.id}/${Date.now()}-${uniqueId}.${extension}`;

    await putR2Object(key, buffer, file.type, "public, max-age=31536000, immutable");

    const r2Domain = process.env.R2_PUBLIC_DOMAIN?.replace(/\/$/, "");
    if (!r2Domain) {
      // Fallback if public domain isn't set
      return NextResponse.json({ url: `/api/images/${key}`, key });
    }

    const publicUrl = `${r2Domain}/${key}`;

    return NextResponse.json({ url: publicUrl, key });
  } catch (error: any) {
    console.error("Image upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
