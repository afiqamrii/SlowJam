import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Make sure to set RESEND_API_KEY in your .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { receiverEmail, receiverName, capsuleUrl, unlockDate } = body;

        if (!receiverEmail || !capsuleUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let subject = 'Someone sent you a Song Capsule 🎵';
        let title = 'You have a song waiting.';
        let messageHtml = `Someone sent you a song anonymously and sealed it in a digital time capsule with a message just for you.`;
        let buttonHtml = `
            <a href="${capsuleUrl}" 
            style="display:inline-block; padding:12px 22px; font-size:14px; font-weight:500; color:#fff; background:#111; text-decoration:none; border-radius:6px;">
            Play Song
            </a>
        `;

        if (unlockDate) {
            const dateObj = new Date(unlockDate);
            const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            // Format for Google Calendar (YYYYMMDDTHHMMSSZ)
            // Convert local time to UTC for the calendar link
            const utcUnlockDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);

            // Format dates
            const startDateStr = dateObj.toISOString().replace(/-|:|\.\d\d\d/g, '');
            const endDateObj = new Date(dateObj.getTime() + 60 * 60 * 1000); // 1 hour event
            const endDateStr = endDateObj.toISOString().replace(/-|:|\.\d\d\d/g, '');

            const eventTitle = `Unlock Song Capsule from ${receiverName || 'Someone'}`;
            const eventDetails = `Your time capsule is ready to open!\n\nListen here: ${capsuleUrl}`;

            // Create ICS File Link via API (Handles all native calendars)
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'https://slowjam.xyz');
            const icsUrl = `${baseUrl}/api/calendar?title=${encodeURIComponent(eventTitle)}&start=${startDateStr}&end=${endDateStr}&details=${encodeURIComponent(eventDetails)}`;

            subject = 'A Time Capsule was created for you! ⏳';
            title = 'A capsule is waiting for you.';
            messageHtml = `
                Someone created a digital time capsule for you, but it's locked! 
                <br><br>
                It will officially unlock on <strong>${formattedDate} at ${formattedTime}</strong>.
            `;
            buttonHtml = `
                <div style="margin-bottom: 24px;">
                    <a href="${capsuleUrl}" 
                    style="display:inline-block; padding:12px 22px; font-size:14px; font-weight:500; color:#fff; background:#111; text-decoration:none; border-radius:6px;">
                    Link to your Capsule
                    </a>
                </div>
                
                <div style="margin-bottom: 16px; font-size: 14px; color: #555;"><strong>Get reminded when it opens:</strong></div>
                <div style="display: flex; gap: 8px;">
                    <a href="${icsUrl}" download="capsule-reminder.ics"
                    style="display:inline-block; padding:10px 20px; font-size:13px; font-weight:500; color:#111; background:#f4f4f5; text-decoration:none; border-radius:6px; border: 1px solid #e4e4e7;">
                    📅 Add to Calendar
                    </a>
                </div>
                <div style="margin-top: 24px; font-size: 13px; color: #777;">
                    If the button above does not work, here is your link:<br>
                    <a href="${capsuleUrl}" style="color: #666; word-break: break-all;">${capsuleUrl}</a>
                </div>
            `;
        }

        const { data, error } = await resend.emails.send({
            from: 'SlowJam <delivery@slowjam.xyz>',
            to: [receiverEmail],
            subject: subject,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                <meta charset="utf-8">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
                </head>

                <body style="margin:0; padding:0; background:#ffffff; font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#111;">

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                <td align="center" style="padding:40px 16px;">

                <table width="100%" style="max-width:480px;" cellpadding="0" cellspacing="0">

                <!-- Logo -->
                <tr>
                <td style="padding-bottom:32px; text-align:center; font-size:20px; font-weight:600; letter-spacing:-0.3px;">
                <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://slowjam.xyz'}/logo.png" alt="SlowJam Logo" width="56" height="56" style="display:block; margin:0 auto 12px; border-radius:12px; border:1px solid #eaeaea;">
                SlowJam
                </td>
                </tr>

                <!-- Title -->
                <tr>
                <td style="font-size:22px; font-weight:600; padding-bottom:16px;">
                ${title}
                </td>
                </tr>

                <!-- Greeting -->
                <tr>
                <td style="font-size:15px; color:#444; padding-bottom:24px;">
                Hi <strong>${receiverName || 'there'}</strong>,
                </td>
                </tr>

                <!-- Message -->
                <tr>
                <td style="font-size:15px; color:#333; line-height:1.6; padding-bottom:32px;">
                ${messageHtml}
                </td>
                </tr>

                <!-- Button/Actions -->
                <tr>
                <td align="left" style="padding-bottom:40px;">
                ${buttonHtml}
                </td>
                </tr>

                <!-- Explanation -->
                <tr>
                <td style="font-size:13px; color:#555; line-height:1.6; padding-bottom:16px; border-top:1px solid #eaeaea; padding-top:24px;">
                <strong>What is SlowJam?</strong><br>
                SlowJam is a platform that lets people seal songs in digital time capsules to be sent to friends, loved ones, or themselves. This message was sent securely and is completely safe to open.
                </td>
                </tr>

                <!-- Footer -->
                <tr>
                <td style="font-size:12px; color:#aaa; padding-bottom:16px; text-align:center;">
                Sent via <a href="https://slowjam.xyz" style="color:#aaa; text-decoration:underline;">SlowJam</a><br><br>
                &copy; ${new Date().getFullYear()} SlowJam. All rights reserved.
                </td>
                </tr>

                </table>
                </td>
                </tr>
                </table>

                </body>
                </html>
                `
        });

        if (error) {
            console.error('Error sending email:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Email API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
