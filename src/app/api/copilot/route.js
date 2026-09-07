import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function POST(request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Gemini API key missing on server' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const models = [
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-pro',
    ];

    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return NextResponse.json({ text });
          }
        }
      } catch (err) {
        // try next model in fallback cascade
      }
    }

    return NextResponse.json({ error: 'All Gemini model fallbacks failed' }, { status: 502 });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Internal copilot proxy error' },
      { status: 500 }
    );
  }
}
