import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { putR2Object, getR2ObjectStream } from '@/lib/r2';
import { selectWeightedPrompt, seedDefaultPrompts, recordPromptUsage } from '@/lib/prompt-weight-engine';

// Initialize the SDK using the custom API key provided by the user
const ai = new GoogleGenAI({ apiKey: process.env.MYGEMINI_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    let base64ImageData: string;
    let mimeType: string;
    let productId: string | null = null;
    let userId: string | null = null;
    let brandSettingsId: string | null = null;
    let productContext = '';
    let weightedPromptId: string | null = null;
    let aestheticBasePrompt: string | null = null;
    let targetAngle: string | null = null;
    let angleEmbedding: number[] | null = null;
    let isMoodBoard = false;

    if (contentType.includes('application/json')) {
      // --- Autonomous mode: product_id from background task ---
      const body = await req.json();
      productId = body.product_id || null;
      userId = body.user_id;
      targetAngle = body.target_angle || null;
      angleEmbedding = body.angle_embedding || null;
      isMoodBoard = body.is_mood_board === true;

      if (!userId) {
        return NextResponse.json({ error: 'user_id required' }, { status: 400 });
      }

      if (!isMoodBoard && !productId) {
        return NextResponse.json({ error: 'product_id required for standard pins' }, { status: 400 });
      }

      if (isMoodBoard) {
        const { data: brand } = await supabase
          .from('brand_settings')
          .select('id')
          .eq('user_id', userId)
          .single();
        if (brand) brandSettingsId = brand.id;
        
        base64ImageData = '';
        mimeType = '';
      } else {
        // Fetch product
        const { data: product } = await supabase
          .from('products')
          .select('*, brand_settings_id')
          .eq('id', productId)
          .single();

        if (!product || !product.image_r2_key) {
          return NextResponse.json({ error: 'Product not found or no image' }, { status: 404 });
        }

        brandSettingsId = product.brand_settings_id;

        // Fetch product image from R2
        const { body: imageBody, contentType: imgContentType } = await getR2ObjectStream(product.image_r2_key);
        const chunks: Buffer[] = [];
        for await (const chunk of imageBody) {
          chunks.push(Buffer.from(chunk));
        }
        const imageBuffer = Buffer.concat(chunks);
        base64ImageData = imageBuffer.toString('base64');
        mimeType = imgContentType || 'image/webp';

        // Build product context for the Art Director
        productContext = `Product: "${product.title}".`;
        if (product.description) productContext += ` Description: ${product.description}.`;
        if (product.price) productContext += ` Price: $${product.price}.`;
      }

      // Select weighted prompt template
      if (brandSettingsId) {
        // Fetch brand aesthetic boundaries
        const { data: brand } = await supabase
          .from('brand_settings')
          .select('aesthetic_boundaries, pin_layout_mode')
          .eq('id', brandSettingsId)
          .single();

        await seedDefaultPrompts(userId, brandSettingsId);
        const selectedPrompt = await selectWeightedPrompt(
          userId,
          brandSettingsId,
          (brand?.aesthetic_boundaries as string[]) || undefined
        );
        if (selectedPrompt) {
          aestheticBasePrompt = selectedPrompt.prompt_template;
          weightedPromptId = selectedPrompt.id;
        }
      }
    } else {
      // --- Manual mode: raw file upload (existing behavior) ---
      const formData = await req.formData();
      const imageFile = formData.get('image') as File;

      if (!imageFile) {
        return NextResponse.json({ error: 'No image provided' }, { status: 400 });
      }

      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      base64ImageData = buffer.toString('base64');
      mimeType = imageFile.type;
    }

    // Build the Art Director system prompt
    let aestheticGuidance = '';
    if (targetAngle) {
      aestheticGuidance = `\n\nCRITICAL CONTEXT: The specific lifestyle angle you MUST use for this image is: "${targetAngle}". You MUST design the entire environment, lighting, and aesthetic strictly around this angle.`;
    } else if (aestheticBasePrompt) {
      aestheticGuidance = `\n\nUse this as aesthetic inspiration for the environment: "${aestheticBasePrompt}"`;
    }

    // 1. Call Gemini 2.5 Flash to act as the "Art Director"
    let aiContents: any = [];

    if (isMoodBoard) {
      const artDirectorPrompt = `You are an expert Pinterest Marketing Art Director. Generate a beautiful, purely aesthetic "Mood Board" lifestyle photo concept.
      
      1. Write a photorealistic, 8k background prompt for an image generation model to create a stunning, atmospheric scene.${aestheticGuidance}
      2. Write an elegant, 4 to 6 word title for this mood board. Use nouns, not verbs.
      3. Select template-2 (Center text) as the text layout template.`;
      
      aiContents = [{ text: artDirectorPrompt }];
    } else {
      const artDirectorPrompt = `Analyze this product image. You are an expert Pinterest Marketing Art Director.
      ${productContext}
      
      1. Write a photorealistic, 8k background prompt for an image generation model to place this product in a fitting, highly aesthetic lifestyle environment. You MUST explicitly state where to leave negative space (e.g., "Leave negative space at the top", "Leave negative space at the bottom", "Leave negative space in the center", or "Leave negative space around the edges").
      2. Write an elegant, 4 to 6 word title for the product. Use nouns, not verbs. (e.g., "The Minimalist Ceramic Watering Can", "Premium Leather Autumn Collection"). Do not use punctuation.
      3. Select the best text layout template based on where you left negative space in the image prompt.${aestheticGuidance}`;
      
      aiContents = [
        { inlineData: { data: base64ImageData, mimeType: mimeType } },
        { text: artDirectorPrompt },
      ];
    }

    const planResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: aiContents,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            imagePrompt: { 
              type: Type.STRING, 
              description: "The image generation prompt. e.g., 'Product resting on a rustic wooden table, dappled sunlight, photorealistic, 8k. Aspect ratio 2:3. Leave negative space at the bottom.'" 
            },
            title: { 
              type: Type.STRING, 
              description: "Elegant 4-6 word title. Nouns only." 
            },
            templateId: { 
              type: Type.STRING, 
              description: "template-1 (Top text) if negative space is at the top. template-2 (Center text) if negative space is in the center. template-3 (Bottom text) if negative space is at the bottom. template-4 (Frame) if negative space is around the edges. template-5 (Pure Aesthetic) — select this when the product image is so visually compelling that no text overlay is needed; best for luxury items, furniture, or fashion where the scene alone drives the click." 
            }
          },
          required: ["imagePrompt", "title", "templateId"]
        }
      }
    });

    const planText = planResponse.text?.trim() || '{}';
    const plan = JSON.parse(planText);
    
    const dynamicImagePrompt = plan.imagePrompt || 'Product resting on a clean marble countertop, morning sunlight, soft aesthetic shadows, photorealistic, 8k. Aspect ratio 2:3. Leave negative space at the top.';
    const generatedTitle = plan.title || 'The Aesthetic Product Collection';
    const templateId = plan.templateId || 'template-1';

    // 2. Call Gemini image model to generate lifestyle background
    let imageGenContents: any = {};
    if (isMoodBoard) {
      imageGenContents = { parts: [{ text: dynamicImagePrompt }] };
    } else {
      imageGenContents = {
        parts: [
          { inlineData: { data: base64ImageData, mimeType: mimeType } },
          { text: dynamicImagePrompt },
        ],
      };
    }

    const imageResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: imageGenContents,
      config: {
        imageConfig: {
          aspectRatio: "9:16",
        }
      }
    });

    let generatedImageBase64 = '';
    let generatedImageMime = 'image/png';
    
    if (imageResponse.candidates?.[0]?.content?.parts) {
      for (const part of imageResponse.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImageBase64 = part.inlineData.data!;
          generatedImageMime = part.inlineData.mimeType || 'image/png';
          break;
        }
      }
    }

    if (!generatedImageBase64) {
      throw new Error('Failed to generate lifestyle image');
    }

    // 3. If autonomous mode, save to R2 and update DB
    let generatedImageUrl = `data:${generatedImageMime};base64,${generatedImageBase64}`;
    let r2Key: string | null = null;

    if (userId) {
      // Create pin record first to get an ID
      const { data: pin } = await supabase
        .from('pins')
        .insert({
          user_id: userId,
          product_id: productId,
          brand_settings_id: brandSettingsId,
          art_director_prompt: dynamicImagePrompt,
          image_prompt_used: aestheticBasePrompt || null,
          target_angle: targetAngle,
          angle_embedding: angleEmbedding ? `[${angleEmbedding.join(",")}]` : null, // Postgres vector representation
          template_id: templateId,
          pin_title: generatedTitle,
          status: 'generating',
          is_mood_board: isMoodBoard,
        })
        .select('id')
        .single();

      if (pin) {
        // Upload raw generated image to R2
        const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
        r2Key = `pin-images/${userId}/${pin.id}-raw.webp`;
        await putR2Object(r2Key, imageBuffer, 'image/webp');

        const r2Domain = process.env.R2_PUBLIC_DOMAIN?.replace(/\/$/, '');
        generatedImageUrl = r2Domain ? `${r2Domain}/${r2Key}` : generatedImageUrl;

        // Update pin with generated image
        await supabase
          .from('pins')
          .update({
            generated_image_url: generatedImageUrl,
            generated_image_r2_key: r2Key,
            status: 'generating', // Still needs rendering
          })
          .eq('id', pin.id);

        // Record prompt weight usage
        if (weightedPromptId) {
          await recordPromptUsage(weightedPromptId);
        }

        return NextResponse.json({
          pinId: pin.id,
          imageUrl: generatedImageUrl,
          title: generatedTitle,
          templateId: templateId,
          debugPrompt: dynamicImagePrompt,
        });
      }
    }

    // Manual mode response (backwards compatible)
    return NextResponse.json({
      imageUrl: generatedImageUrl,
      title: generatedTitle,
      templateId: templateId,
      debugPrompt: dynamicImagePrompt,
    });

  } catch (error: any) {
    console.error('Error generating pin:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

