import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic'; // Required for cron jobs

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
    // Basic security check (Optional but recommended for Vercel Cron)
    const authHeader = request.headers.get('authorization');
    if (
        process.env.CRON_SECRET &&
        authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        // Find all capsules that should be unlocked, have an email address, and haven't been sent yet
        const now = new Date().toISOString();

        const { data: capsules, error } = await supabase
            .from('capsules')
            .select('*')
            .not('receiver_email', 'is', null)
            .eq('email_sent', false)
            .lte('unlock_at', now);

        if (error) {
            console.error('Database pull error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!capsules || capsules.length === 0) {
            return NextResponse.json({ message: 'No emails to send right now.' });
        }

        const sentIds: string[] = [];
        const errors: any[] = [];

        // Loop through and send emails
        for (const capsule of capsules) {
            const capsuleUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://slowjam.xyz'}/view/${capsule.id}${capsule.is_private ? `?key=${capsule.share_token}` : ''}`;

            try {
                // We use a generic sender email. You can change this once you add your domain to Resend!
                await resend.emails.send({
                    from: 'SlowJam <delivery@slowjam.xyz>',
                    to: [capsule.receiver_email],
                    subject: 'A Time Capsule just opened for you! ⏳🎵',
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
                            <style>
                                body { margin: 0; padding: 0; background-color: #F9FAFB; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; }
                                .wrapper { width: 100%; table-layout: fixed; background-color: #F9FAFB; padding: 40px 0; }
                                .container { max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #F3F4F6; }
                                .header { padding: 40px 40px 20px; text-align: center; }
                                .logo { font-size: 24px; font-weight: 600; color: #d97757; letter-spacing: -0.5px; margin: 0; }
                                .content { padding: 20px 40px 40px; text-align: center; }
                                .icon { width: 48px; height: 48px; margin: 0 auto 24px; background-color: #FFF1F2; color: #E11D48; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; }
                                .title { font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 16px; }
                                .greeting { font-size: 16px; color: #4B5563; margin: 0 0 24px; line-height: 1.5; }
                                .message-box { background-color: #F9FAFB; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #F3F4F6; }
                                .message-text { font-size: 15px; color: #374151; line-height: 1.6; margin: 0; font-style: italic; }
                                .btn { display: inline-block; background-color: #111827; color: #ffffff !important; font-size: 15px; font-weight: 500; text-decoration: none; padding: 14px 28px; border-radius: 8px; transition: background-color 0.2s; }
                                .footer { text-align: center; padding: 0 40px 40px; }
                                .footer-text { font-size: 13px; color: #9CA3AF; margin: 0; }
                            </style>
                        </head>
                        <body>
                            <div class="wrapper">
                                <div class="container">
                                    <div class="header">
                                        <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://slowjam.xyz'}/logo.png" alt="SlowJam Logo" width="64" height="64" style="display:block; margin:0 auto 16px; border-radius:16px; border:1px solid #F3F4F6;">
                                        <h1 class="logo">SlowJam</h1>
                                    </div>
                                    <div class="content">
                                        <div class="icon">⏳</div>
                                        <h2 class="title">A time capsule has opened.</h2>
                                        <p class="greeting">Hi <span style="font-weight: 600; color: #111827;">${capsule.receiver_name || 'there'}</span>,</p>
                                        
                                        <div class="message-box">
                                            <p class="message-text">"Someone sealed a song in a digital time capsule for you in the past. The wait is finally over, and it's officially unlocked today."</p>
                                        </div>
                                        
                                        <a href="${capsuleUrl}" class="btn">Unlock the Capsule</a>
                                    </div>
                                    <div style="padding: 0 40px 24px; text-align: left; border-top: 1px solid #F3F4F6; padding-top: 24px;">
                                        <p style="font-size: 14px; color: #4B5563; line-height: 1.6; margin: 0;">
                                            <strong style="color: #111827;">What is SlowJam?</strong><br>
                                            SlowJam is a platform that lets people seal songs in digital time capsules to be sent to friends, loved ones, or themselves. This message was sent securely and is completely safe to open.
                                        </p>
                                    </div>
                                    <div class="footer">
                                        <p class="footer-text" style="margin-bottom: 8px;">Sent via <a href="https://slowjam.xyz" style="color: #9CA3AF; text-decoration: underline;">SlowJam</a></p>
                                        <p class="footer-text">&copy; ${new Date().getFullYear()} SlowJam. All rights reserved.</p>
                                    </div>
                                </div>
                            </div>
                        </body>
                        </html>
                    `,
                });

                sentIds.push(capsule.id);
            } catch (err) {
                console.error(`Failed to send email for capsule ${capsule.id}:`, err);
                errors.push({ id: capsule.id, error: err });
            }
        }

        // Mark as sent in the database
        if (sentIds.length > 0) {
            const { error: updateError } = await supabase
                .from('capsules')
                .update({ email_sent: true })
                .in('id', sentIds);

            if (updateError) {
                console.error('Failed to update email_sent status', updateError);
            }
        }

        return NextResponse.json({
            message: `Processed ${capsules.length} capsules`,
            sent: sentIds.length,
            errors,
        });

    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
