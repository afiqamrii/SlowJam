import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { trackName, artistName, message, senderName, receiverName } = await request.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'Gemini API Key missing' }, { status: 500 });
        }

        if (!trackName || !artistName) {
            return NextResponse.json({ error: 'Missing track data' }, { status: 400 });
        }

        const prompt = `You are a sweet, sensitive music expert explaining why someone sent a specific song to their friend/loved one.
        
Context:
- Sender: ${senderName || 'Someone'}
- Receiver: ${receiverName || 'their friend'}
- Song: "${trackName}" by ${artistName}
- The sender's personal message to the receiver: "${message || 'No message provided'}"

Task:
Write exactly 2-3 warm and sweet sentences explaining the meaning of the song "${trackName}", and creatively connect it to the sender's message. 
Use very simple, easy to understand English. Make it sound like a heartfelt reflection.
If there are any words or short phrases that are particularly important or evocative, **bold them** using markdown.
Leave a blank line, then at the very end add a short, memorable quote about music, love, or friendship, and include who said it. Do NOT use a hyphen or dash before the author's name.

Example Format:
[Your 2-3 sweet sentences here, potentially with **bolded** words]

"Quote here"
Author Name`;

        // Using raw fetch to bypass SDK 404 bugs for new gemini models
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': process.env.GEMINI_API_KEY || '',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Google API responded with error:', errorText);
            throw new Error(`Google API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No text returned from Gemini payload');
        }

        return NextResponse.json({ meaning: text.trim() });
    } catch (error) {
        console.error('Gemini API Error:', error);
        return NextResponse.json({ error: 'Failed to generate meaning' }, { status: 500 });
    }
}
