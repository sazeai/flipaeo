import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Local font files bundled with the Edge function (reliable, no CDN dependency)
const FONT_FILES: Record<string, string> = {
  'Playfair Display': 'PlayfairDisplay.ttf',
  'Inter': 'Inter.ttf',
  'Roboto': 'Roboto.ttf',
  'Outfit': 'Outfit.ttf',
  'Poppins': 'Poppins.ttf',
  'Montserrat': 'Montserrat.ttf',
  'Lora': 'Lora.ttf',
  'Merriweather': 'Merriweather.ttf',
  'Raleway': 'Raleway.ttf',
  'DM Sans': 'DMSans.ttf',
};

/**
 * Render Pin — Text Overlay Engine
 * 
 * Supports both GET (for query-based renders) and POST (for base64 large payloads).
 * 
 * THE FIX:
 * 1. Removed 'sharp' entirely. Native binaries like sharp don't work on Vercel Edge.
 * 2. Added `runtime = 'edge'` to ensure ImageResponse behaves correctly with POST.
 * 3. Unified the render logic to be identical to the successful prototype.
 */
export async function POST(req: NextRequest) {
  return handleRender(req);
}

export async function GET(req: NextRequest) {
  return handleRender(req);
}

async function handleRender(req: NextRequest) {
  try {
    let imageUrl, title, templateId, fontChoice, storeUrl, layoutMode;

    if (req.method === 'POST') {
      const body = await req.json();
      imageUrl = body.imageUrl;
      title = body.title;
      templateId = body.templateId;
      fontChoice = body.fontChoice;
      storeUrl = body.storeUrl;
      layoutMode = body.layoutMode;
    } else {
      const { searchParams } = new URL(req.url);
      imageUrl = searchParams.get('imageUrl');
      title = searchParams.get('title');
      templateId = searchParams.get('templateId');
      fontChoice = searchParams.get('fontChoice');
      storeUrl = searchParams.get('storeUrl');
      layoutMode = searchParams.get('layoutMode');
    }

    if (!imageUrl) {
      return new Response('Missing imageUrl', { status: 400 });
    }

    const displayTitle = title || 'Aesthetic Collection';
    const activeTemplate = layoutMode === 'organic' ? 'template-5' : (templateId || 'template-1');
    const fontName = fontChoice || 'Playfair Display';

    let displayStoreUrl = '';
    try {
      if (storeUrl) displayStoreUrl = new URL(storeUrl).hostname.replace('www.', '');
    } catch {
      displayStoreUrl = storeUrl || '';
    }

    // Load font from local bundled files (no CDN dependency)
    const fontFile = FONT_FILES[fontName] || FONT_FILES['Playfair Display'];
    const fontData = await fetch(new URL(`./fonts/${fontFile}`, import.meta.url)).then((res) => {
      if (!res.ok) throw new Error(`Font load failed: ${fontFile} (${res.status})`);
      return res.arrayBuffer();
    });

    // ─────────────────────────────────────────────────
    // Template rendering (Unified Logic)
    // ─────────────────────────────────────────────────
    
    // Default Font Size
    const fontSize = 64;

    const renderLayout = (
      <div tw="flex flex-col w-full h-full relative bg-white">
        {/* Background Image: Satori handles base64 URIs and URLs equally well as long as they are accessible */}
        <img
          src={imageUrl}
          tw="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover' }}
          alt="Background"
        />
        
        {/* Templates */}
        {activeTemplate !== 'template-5' && (
          <>
            {activeTemplate === 'template-2' ? (
              <div tw="absolute inset-0 w-full h-full bg-black/40 flex items-center justify-center text-center px-16">
                <span style={{ color: 'white', fontSize, fontWeight: 'bold', fontFamily: `"${fontName}"`, textShadow: '0 4px 16px rgba(0,0,0,0.6)' }}>
                  {displayTitle}
                </span>
              </div>
            ) : activeTemplate === 'template-3' ? (
              <>
                <div tw="absolute bottom-0 left-0 w-full h-[50%]" style={{ backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
                <div tw="absolute bottom-36 left-0 w-full flex justify-center text-center px-12">
                  <span style={{ color: 'white', fontSize, fontWeight: 'bold', fontFamily: `"${fontName}"`, textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                    {displayTitle}
                  </span>
                </div>
              </>
            ) : activeTemplate === 'template-4' ? (
              <>
                <div tw="absolute inset-6 border-[4px] border-white/80 rounded-2xl" />
                <div tw="absolute top-0 left-0 w-full h-[40%]" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }} />
                <div tw="absolute top-28 left-0 w-full flex justify-center text-center px-16">
                  <span style={{ color: 'white', fontSize, fontWeight: 'bold', fontFamily: `"${fontName}"`, textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                    {displayTitle}
                  </span>
                </div>
              </>
            ) : (
              /* Template 1: Classic */
              <>
                <div tw="absolute top-0 left-0 w-full h-[40%]" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }} />
                <div tw="absolute top-24 left-0 w-full flex justify-center text-center px-12">
                  <span style={{ color: 'white', fontSize, fontWeight: 'bold', fontFamily: `"${fontName}"`, textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                    {displayTitle}
                  </span>
                </div>
              </>
            )}
          </>
        )}
        
        {/* CTA Badge (Always visible if storeUrl provided) */}
        {displayStoreUrl && (
          <div
            tw="absolute bottom-12 left-1/2 flex text-black px-8 py-4 rounded-full text-3xl font-semibold shadow-xl"
            style={{ transform: 'translateX(-50%)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
          >
            {displayStoreUrl} ↗
          </div>
        )}
      </div>
    );

    return new ImageResponse(renderLayout, {
      width: 1000,
      height: 1500,
      fonts: [
        {
          name: fontName,
          data: fontData,
          style: 'normal',
          weight: 700,
        },
      ],
    });
  } catch (error: any) {
    console.error('Render-pin error:', error);
    return new Response(`Render failed: ${error.message}`, { status: 500 });
  }
}
