import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

// Google Fonts CDN mapping for supported fonts
const FONT_URLS: Record<string, string> = {
  'Playfair Display': 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiukDQ.ttf',
  'Inter': 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf',
  'Roboto': 'https://fonts.gstatic.com/s/roboto/v47/KFOMCnqEu92Fr1MmYUtfBBc4AMP6lbBP.ttf',
  'Outfit': 'https://fonts.gstatic.com/s/outfit/v11/QGYyz_MVcBeNP4NjuGObqx1XmO1I4e61C4S-Ys25Zh0.ttf',
  'Poppins': 'https://fonts.gstatic.com/s/poppins/v22/pxiByp8kv8JHgFVrLCz7Z1xlFd2JQEk.ttf',
  'Montserrat': 'https://fonts.gstatic.com/s/montserrat/v29/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw9aXp-p7K4KLg.ttf',
  'Lora': 'https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787weuyJGmKxemMeZ.ttf',
  'Merriweather': 'https://fonts.gstatic.com/s/merriweather/v30/u-440qOEagQyNhF5d-FsKilJyeC_wXvsF25UBJQFKg.ttf',
  'Raleway': 'https://fonts.gstatic.com/s/raleway/v34/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaorCIPrE.ttf',
  'DM Sans': 'https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAkpFhR0i2Gw.ttf',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get('imageUrl');
    const title = searchParams.get('title');
    const templateId = searchParams.get('templateId');
    const fontChoice = searchParams.get('fontChoice');
    const storeUrl = searchParams.get('storeUrl');
    const pinId = searchParams.get('pinId');
    const layoutMode = searchParams.get('layoutMode');

    if (!imageUrl) {
      return new Response('Missing imageUrl in search params', { status: 400 });
    }

    const displayTitle = title || 'Aesthetic Collection';
    // If brand is in 'organic' layout mode, always force template-5 regardless of AI choice
    const activeTemplate = layoutMode === 'organic' ? 'template-5' : (templateId || 'template-1');
    const fontName = fontChoice || 'Playfair Display';
    const displayStoreUrl = storeUrl ? new URL(storeUrl).hostname.replace('www.', '') : '';

    // Fetch the raw image manually to prevent Satori from silently failing (which causes black screens)
    const bgResponse = await fetch(imageUrl);
    if (!bgResponse.ok) {
      throw new Error(`Background image failed to load with status: ${bgResponse.status}`);
    }
    const bgArrayBuffer = await bgResponse.arrayBuffer();
    /* Convert ArrayBuffer to explicit Base64 data URI to force Satori to explicitly render without making parallel cross-origin fetches */
    const base64Str = Buffer.from(bgArrayBuffer).toString('base64');
    const bgDataUri = `data:${bgResponse.headers.get('content-type') || 'image/png'};base64,${base64Str}`;

    // ─────────────────────────────────────────────────
    // Template 5: Pure Aesthetic (Zero-Text Mode)
    // ─────────────────────────────────────────────────
    if (activeTemplate === 'template-5') {
      return new ImageResponse(
        (
          <div tw="flex w-full h-full relative" style={{ backgroundColor: '#ffffff' }}>
            <img
              src={bgDataUri}
              tw="absolute inset-0 w-full h-full"
              style={{ objectFit: 'cover' }}
              alt="Lifestyle"
            />
            {/* Micro-watermark: barely visible, bottom-left. Copyright + brand safety only. */}
            {displayStoreUrl && (
              <div
                tw="absolute bottom-8 left-8 text-white text-lg"
                style={{ opacity: 0.3, letterSpacing: '0.08em', fontFamily: 'sans-serif' }}
              >
                {displayStoreUrl}
              </div>
            )}
          </div>
        ),
        { width: 1000, height: 1500 }
      );
    }

    // Load the requested font (only needed for templates with text)
    const fontUrl = FONT_URLS[fontName] || FONT_URLS['Playfair Display'];
    const fontData = await fetch(new URL(fontUrl)).then((res) => res.arrayBuffer());

    const fontSize = 64;

    let gradientOverlay;
    let textContainer;

    if (activeTemplate === 'template-2') {
      // Template 2: The Centerpiece
      gradientOverlay = (
        <div tw="absolute inset-0 w-full h-full bg-black/40" />
      );
      textContainer = (
        <div tw="absolute inset-0 w-full h-full flex items-center justify-center text-center px-16">
          <span
            style={{
              color: 'white',
              fontSize,
              fontWeight: 'bold',
              letterSpacing: '0.05em',
              fontFamily: `"${fontName}"`,
              textShadow: '0 4px 16px rgba(0,0,0,0.6)',
            }}
          >
            {displayTitle}
          </span>
        </div>
      );
    } else if (activeTemplate === 'template-3') {
      // Template 3: The Footer
      gradientOverlay = (
        <div
          tw="absolute bottom-0 left-0 w-full h-[50%]"
          style={{
            backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
          }}
        />
      );
      textContainer = (
        <div tw="absolute bottom-36 left-0 w-full flex justify-center text-center px-12">
          <span
            style={{
              color: 'white',
              fontSize,
              fontWeight: 'bold',
              letterSpacing: '0.05em',
              fontFamily: `"${fontName}"`,
              textShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            {displayTitle}
          </span>
        </div>
      );
    } else if (activeTemplate === 'template-4') {
      // Template 4: The Frame
      gradientOverlay = (
        <>
          <div tw="absolute inset-6 border-[4px] border-white/80 rounded-2xl" />
          <div
            tw="absolute top-0 left-0 w-full h-[40%]"
            style={{
              backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
            }}
          />
        </>
      );
      textContainer = (
        <div tw="absolute top-28 left-0 w-full flex justify-center text-center px-16">
          <span
            style={{
              color: 'white',
              fontSize,
              fontWeight: 'bold',
              letterSpacing: '0.05em',
              fontFamily: `"${fontName}"`,
              textShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            {displayTitle}
          </span>
        </div>
      );
    } else {
      // Template 1: The Classic (Default)
      gradientOverlay = (
        <div
          tw="absolute top-0 left-0 w-full h-[40%]"
          style={{
            backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
          }}
        />
      );
      textContainer = (
        <div tw="absolute top-24 left-0 w-full flex justify-center text-center px-12">
          <span
            style={{
              color: 'white',
              fontSize,
              fontWeight: 'bold',
              letterSpacing: '0.05em',
              fontFamily: `"${fontName}"`,
              textShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            {displayTitle}
          </span>
        </div>
      );
    }

    return new ImageResponse(
      (
        <div tw="flex flex-col w-full h-full relative bg-white">
          {/* Background Image */}
          <img
            src={bgDataUri}
            tw="absolute inset-0 w-full h-full"
            style={{ objectFit: 'cover' }}
            alt="Background"
          />
          
          {gradientOverlay}
          {textContainer}
          
          {/* The Trust Badge (Bottom CTA) */}
          <div
            tw="absolute bottom-12 left-1/2 flex text-black px-8 py-4 rounded-full text-3xl font-semibold shadow-xl"
            style={{ 
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.9)'
            }}
          >
            {displayStoreUrl} ↗
          </div>
        </div>
      ),
      {
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
      }
    );
  } catch (error: any) {
    console.error('Error rendering image:', error);
    return new Response(`Failed to generate image: ${error.message}`, {
      status: 500,
    });
  }
}

