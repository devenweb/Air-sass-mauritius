import { NextRequest } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET(request: NextRequest) {
  // PROD GATE: This route is for debug/diagnostic use only
  if (process.env.NODE_ENV === 'production') {
    return new Response(JSON.stringify({ error: 'Not available' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  const url = new URL(request.url);
  const testEmail = url.searchParams.get('email') || 'kevinadlib@gmail.com';
  
  const user = process.env.MAIL_SERVER_LOGIN || process.env.mailserver_login || 'noreply@royaltravel.mu';
  const pass = process.env.MAIL_SERVER_PASS || process.env.mailserver_pass;
  const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.mail_from_email || 'reservation@royaltravel.mu';

  const configs = [
    { host: 'smtp.mydomain.com', port: 465, secure: true, label: 'Standard Port 465 (Implicit SSL)' },
    { host: 'smtp.mydomain.com', port: 587, secure: false, label: 'Standard Port 587 (STARTTLS)' },
    { host: 'mx.mydomain.com', port: 465, secure: true, label: 'MX Host Port 465' },
    { host: 'mx.mydomain.com', port: 587, secure: false, label: 'MX Host Port 587' },
    { host: '66.96.143.170', port: 465, secure: true, label: 'IP Port 465 (No Cert Check)', rejectUnauthorized: false },
    { host: '66.96.143.170', port: 587, secure: false, label: 'IP Port 587 (No Cert Check)', rejectUnauthorized: false },
    { host: 'mail.royaltravel.mu', port: 465, secure: true, label: 'Domain Host Port 465' },
    { host: 'mail.royaltravel.mu', port: 587, secure: false, label: 'Domain Host Port 587' },
  ];

  const results = [];

  for (const config of configs) {
    try {
      // console.log(`[Debug] Testing: ${config.label}...`);
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: config.rejectUnauthorized !== undefined ? config.rejectUnauthorized : false,
          minVersion: 'TLSv1.2'
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      });

      // Attempt to verify connection first
      await transporter.verify();
      
      // If verification succeeds, try to send a small mail
      const info = await transporter.sendMail({
        from: `"Debug Test" <${fromEmail}>`,
        to: testEmail,
        subject: `SMTP Debug: ${config.label}`,
        text: `Success with ${config.label} at ${new Date().toISOString()}`,
      });

      results.push({
        label: config.label,
        success: true,
        messageId: info.messageId,
        host: config.host,
        port: config.port
      });
      
      // console.log(`[Debug] ✅ Success with ${config.label}`);
      
    } catch (err: any) {
      console.error(`[Debug] ❌ Failed ${config.label}:`, err.message);
      results.push({
        label: config.label,
        success: false,
        error: err.message,
        code: err.code,
        host: config.host,
        port: config.port
      });
    }
  }

  return new Response(JSON.stringify({
    results,
    credentials: {
      user: `${user.substring(0, 3)}...`,
      from: fromEmail,
      hasPass: !!pass
    },
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
