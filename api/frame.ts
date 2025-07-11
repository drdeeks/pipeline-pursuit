// Frame API for Pipeline Pursuit
// This handles Farcaster Frame interactions

const baseUrl = process.env.VITE_FARCASTER_APP_URL || 'https://your-domain.com';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { untrustedData, trustedData } = body;

    // Handle frame button clicks
    if (untrustedData?.buttonIndex === 1) {
      // User clicked "Play Pipeline Pursuit"
      return new Response(JSON.stringify({
        frames: [
          {
            image: `${baseUrl}/og-image.png`,
            buttons: [
              {
                label: 'Play Pipeline Pursuit',
                action: 'post',
              },
            ],
            postUrl: `${baseUrl}/api/frame`,
          },
        ],
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Default frame response
    return new Response(JSON.stringify({
      frames: {
        version: 'vNext',
        image: `${baseUrl}/og-image.png`,
        buttons: [
          {
            label: 'Play Pipeline Pursuit',
            action: 'post'
          }
        ],
        postUrl: `${baseUrl}/api/frame`
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Frame API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET() {
  // Return the initial frame
  return new Response(JSON.stringify({
    frames: {
      version: 'vNext',
      image: `${baseUrl}/og-image.png`,
      buttons: [
        {
          label: 'Play Pipeline Pursuit',
          action: 'post'
        }
      ],
      postUrl: `${baseUrl}/api/frame`
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
} 