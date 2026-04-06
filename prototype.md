import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // We use POST instead of GET because the base64 image URL can be very large 
    // and would exceed the maximum URL length limits if passed as a query parameter.
    const body = await req.json();
    const { imageUrl, title, templateId } = body;

    if (!imageUrl) {
      return new Response('Missing imageUrl in request body', { status: 400 });
    }

    const displayTitle = title || 'Aesthetic Collection';
    const activeTemplate = templateId || 'template-1';

    // Load custom font (Playfair Display)
    const fontData = await fetch(
      new URL('https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiukDQ.ttf')
    ).then((res) => res.arrayBuffer());

    // Decreased font size for better fit with 4-6 words
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
              fontFamily: '"Playfair Display"',
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
              fontFamily: '"Playfair Display"',
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
              fontFamily: '"Playfair Display"',
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
              fontFamily: '"Playfair Display"',
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
            src={imageUrl}
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
            shopname.com ↗
          </div>
        </div>
      ),
      {
        width: 1000,
        height: 1500,
        fonts: [
          {
            name: 'Playfair Display',
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
