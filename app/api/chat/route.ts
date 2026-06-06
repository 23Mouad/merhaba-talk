import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured on server' }, { status: 500 });
    }

    let res;
    let data;
    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: body.systemInstruction,
          contents: body.contents
        }),
      });

      data = await res.json();
      
      if (res.ok) {
        break; // Success
      }
      
      // If error is 429 (Too Many Requests) or 500+ (Server Errors), retry
      if (res.status === 429 || res.status >= 500) {
        retries--;
        if (retries === 0) break;
        await new Promise(r => setTimeout(r, delay));
        delay *= 2; // Exponential backoff
      } else {
        // For other errors (like 400 Bad Request), don't retry
        break;
      }
    }

    if (!res || !res.ok) {
      return NextResponse.json({ error: data?.error?.message || 'API Error after retries' }, { status: res?.status || 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
