import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  const sdHost = process.env.STABLE_DIFFUSION_HOST || 'http://stable-diffusion:7860';

  try {
    const res = await fetch(`${sdHost}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        negative_prompt: 'blurry, low quality, nsfw, watermark',
        steps: 20,
        width: 512,
        height: 512,
        cfg_scale: 7,
        sampler_name: 'DPM++ 2M Karras'
      })
    });
    const data = await res.json();
    const image = data.images?.[0] || null;
    return NextResponse.json({ image });
  } catch (e) {
    return NextResponse.json({ error: 'Stable Diffusion not available' }, { status: 503 });
  }
}
