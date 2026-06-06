import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    // Try fetching transcript
    // For Turkish videos we ideally want 'tr', but youtube-transcript auto-fetches the default one or allows specifying lang.
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'tr' }).catch(async () => {
      // Fallback to default if 'tr' specifically is not found
      return await YoutubeTranscript.fetchTranscript(videoId);
    });

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: 'No transcript found for this video' }, { status: 404 });
    }

    // Map to our app's transcript format
    const formatted = transcript.map((item) => ({
      time: Math.floor(item.offset / 1000),
      tr: item.text,
      ar: '...', // We don't pre-translate here to save time/cost. Users can click to translate.
      en: ''
    }));

    return NextResponse.json({ transcript: formatted });
  } catch (error: any) {
    console.error('Transcript error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch transcript' }, { status: 500 });
  }
}
