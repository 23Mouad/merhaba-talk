import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured on server' }, { status: 500 });
    }

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
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
          systemInstruction: { parts: [{ text: "ترجم هذا النص التركي إلى العربية. أعطني الترجمة العربية فقط بدون أي نص إضافي." }] },
          contents: [{ role: 'user', parts: [{ text }] }]
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

    const trans = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'خطأ في الترجمة';
    return NextResponse.json({ translation: trans });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
