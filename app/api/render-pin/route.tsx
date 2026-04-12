import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFile } from 'node:fs/promises';

export const runtime = 'nodejs';

// Static font URL declarations — each `new URL()` tells Next.js file tracing
// to include the font in the serverless bundle. Must be literal strings, not dynamic.
const FONT_URLS: Record<string, URL> = {
  'Playfair Display': new URL('./fonts/PlayfairDisplay.ttf', import.meta.url),
  'Inter': new URL('./fonts/Inter.ttf', import.meta.url),
  'Roboto': new URL('./fonts/Roboto.ttf', import.meta.url),
  'Outfit': new URL('./fonts/Outfit.ttf', import.meta.url),
  'Poppins': new URL('./fonts/Poppins.ttf', import.meta.url),
  'Montserrat': new URL('./fonts/Montserrat.ttf', import.meta.url),
  'Lora': new URL('./fonts/Lora.ttf', import.meta.url),
  'Merriweather': new URL('./fonts/Merriweather.ttf', import.meta.url),
  'Raleway': new URL('./fonts/Raleway.ttf', import.meta.url),
  'DM Sans': new URL('./fonts/DMSans.ttf', import.meta.url),
};

const MAX_REMOTE_IMAGE_BYTES = 10 * 1024 * 1024;

function getHostnameFromUrlish(value?: string | null) {
  if (!value) return null;
  try {
    const normalized = value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`;
    return new URL(normalized).hostname;
  } catch {
    return null;
  }
}

function isAllowedImageSource(imageUrl: string) {
  if (imageUrl.startsWith('data:image/')) return true;

  try {
    const url = new URL(imageUrl);
    const r2Host = getHostnameFromUrlish(process.env.R2_PUBLIC_DOMAIN);
    const isLocalDevHost = ['localhost', '127.0.0.1'].includes(url.hostname);

    if (isLocalDevHost) {
      return process.env.NODE_ENV !== 'production' && url.protocol === 'http:';
    }

    return url.protocol === 'https:' && !!r2Host && url.hostname === r2Host;
  } catch {
    return false;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString('base64');
}

/**
 * Render Pin — Text Overlay Engine
 * 
 * Supports both GET (for query-based renders) and POST (for base64 large payloads).
 * Uses Node.js runtime (250 MB limit) instead of Edge (1 MB limit) to accommodate
 * bundled font files. Fonts are loaded via fs.readFile from files traced by Next.js.
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

    if (!isAllowedImageSource(imageUrl)) {
      return new Response('Unsupported imageUrl source', { status: 400 });
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
    const fontUrl = FONT_URLS[fontName] || FONT_URLS['Playfair Display'];
    const fontBuffer = await readFile(fontUrl);
    const fontData = fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength);

    // Pre-fetch the background image and convert to base64 data URI.
    // Satori silently produces 0-byte output when it can't reach a URL internally,
    // so we fetch explicitly with a timeout to surface errors properly.
    let imageSrc: string;
    if (imageUrl.startsWith('data:image/')) {
      imageSrc = imageUrl;
    } else {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        const imgRes = await fetch(imageUrl, { signal: controller.signal });
        if (!imgRes.ok) throw new Error(`Image fetch returned ${imgRes.status}`);

        const mimeType = imgRes.headers.get('content-type') || 'application/octet-stream';
        if (!mimeType.startsWith('image/')) {
          throw new Error(`Unexpected content type: ${mimeType}`);
        }

        const imgBuffer = await imgRes.arrayBuffer();
        if (imgBuffer.byteLength < 1000) throw new Error(`Image too small (${imgBuffer.byteLength} bytes)`);
        if (imgBuffer.byteLength > MAX_REMOTE_IMAGE_BYTES) {
          throw new Error(`Image too large (${imgBuffer.byteLength} bytes)`);
        }

        const base64 = arrayBufferToBase64(imgBuffer);
        imageSrc = `data:${mimeType};base64,${base64}`;
      } catch (imgErr: any) {
        console.error('Render-pin: background image fetch failed:', imgErr.message, '| URL:', imageUrl);
        return new Response(`Render failed: could not fetch background image — ${imgErr.message}`, { status: 500 });
      } finally {
        clearTimeout(timeout);
      }
    }

    // ─────────────────────────────────────────────────
    // Template rendering (Unified Logic)
    // ─────────────────────────────────────────────────
    
    // Default Font Size
    const fontSize = 64;

    const renderLayout = (
      <div tw="flex flex-col w-full h-full relative bg-white">
        {/* Background Image: pre-fetched as base64 data URI to avoid Satori silent fetch failures */}
        <img
          src={imageSrc}
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
