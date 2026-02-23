import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const details = searchParams.get('details');

    if (!title || !start || !end) {
        return new NextResponse('Missing required parameters', { status: 400 });
    }

    const icsContent =
        `BEGIN:VCALENDAR\n` +
        `VERSION:2.0\n` +
        `BEGIN:VEVENT\n` +
        `DTSTART:${start}\n` +
        `DTEND:${end}\n` +
        `SUMMARY:${title}\n` +
        `DESCRIPTION:${details ? details.replace(/\n/g, '\\n') : ''}\n` +
        `END:VEVENT\n` +
        `END:VCALENDAR`;

    return new NextResponse(icsContent, {
        status: 200,
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'attachment; filename="capsule-reminder.ics"',
        },
    });
}
