import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Make sure to set RESEND_API_KEY in your .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { receiverEmail, receiverName, capsuleUrl } = body;

        if (!receiverEmail || !capsuleUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await resend.emails.send({
            from: 'SlowJam <delivery@slowjam.xyz>',
            to: [receiverEmail],
            subject: 'Someone sent you a Song Capsule 🎵',
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
                You have a song waiting.
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
                Someone sent you a song anonymously and sealed it in a digital time capsule with a message just for you.
                </td>
                </tr>

                <!-- Button -->
                <tr>
                <td align="left" style="padding-bottom:40px;">
                <a href="${capsuleUrl}" 
                style="display:inline-block; padding:12px 22px; font-size:14px; font-weight:500; color:#fff; background:#111; text-decoration:none; border-radius:6px;">
                Play Song
                </a>
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
