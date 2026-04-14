import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFile } from 'node:fs/promises';

export const runtime = 'nodejs';

// Single bundled font for CTA badge — Inter (clean sans-serif)
const FONT_URL = new URL('./fonts/Inter.ttf', import.meta.url);

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
    const isLocalDevHost = ['localhost', '127.0.0.1'].includes(url.hostname);

    if (isLocalDevHost) {
      return process.env.NODE_ENV !== 'production' && url.protocol === 'http:';
    }

    if (url.protocol !== 'https:') return false;

    // Allow Cloudflare R2 public bucket URLs (*.r2.dev)
    if (url.hostname.endsWith('.r2.dev')) return true;

    // Also allow custom domain configured via R2_PUBLIC_DOMAIN env var
    const r2Host = getHostnameFromUrlish(process.env.R2_PUBLIC_DOMAIN);
    if (r2Host && url.hostname === r2Host) return true;

    return false;
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
    let imageUrl, storeUrl;

    if (req.method === 'POST') {
      const body = await req.json();
      imageUrl = body.imageUrl;
      storeUrl = body.storeUrl;
    } else {
      const { searchParams } = new URL(req.url);
      imageUrl = searchParams.get('imageUrl');
      storeUrl = searchParams.get('storeUrl');
    }

    if (!imageUrl) {
      return new Response('Missing imageUrl', { status: 400 });
    }

    if (!isAllowedImageSource(imageUrl)) {
      return new Response('Unsupported imageUrl source', { status: 400 });
    }

    const displayTitle = '';
    const fontName = 'Inter';

    let displayStoreUrl = '';
    try {
      if (storeUrl) displayStoreUrl = new URL(storeUrl).hostname.replace('www.', '');
    } catch {
      displayStoreUrl = storeUrl || '';
    }

    // Load single bundled font for CTA badge
    const fontBuffer = await readFile(FONT_URL);
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
    // Simplified rendering: image + optional CTA badge
    // ─────────────────────────────────────────────────

    const renderLayout = (
      <div tw="flex flex-col w-full h-full relative bg-white">
        {/* Background Image: pre-fetched as base64 data URI to avoid Satori silent fetch failures */}
        <img
          src={imageSrc}
          tw="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover' }}
          alt="Background"
        />
        
        {/* CTA Badge (visible if storeUrl provided) */}
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
