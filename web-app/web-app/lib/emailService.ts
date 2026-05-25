import nodemailer from 'nodemailer'
import { createClient } from './supabaseServer'

/**
 * Shared Email Service for Travellounge Ecosystem
 * Handles SMTP transporter initialization and template rendering
 */

let transporter: nodemailer.Transporter | null = null
let lastConfigHash: string | null = null;

/**
 * Fetches SMTP configuration from site_settings table with fallback to process.env
 */
async function getEmailSettings() {
    try {
        const supabase = await createClient()
        const { data: settings } = await supabase
            .from('site_settings')
            .select('*')
            .in('key', ['email_config', 'general_config'])

        const emailConfig = settings?.find((s: any) => s.key === 'email_config')?.value || {}
        const generalConfig = settings?.find((s: any) => s.key === 'general_config')?.value || {}

        return {
            host: (emailConfig.mailServerUrl || process.env.MAIL_SERVER_URL || '').trim(),
            port: parseInt((emailConfig.mailServerPort || process.env.MAIL_SERVER_PORT || '587').trim()),
            user: (emailConfig.mailServerLogin || process.env.MAIL_SERVER_LOGIN || '').trim(),
            pass: (emailConfig.mailServerPass || process.env.MAIL_SERVER_PASS || '').trim(),
            fromEmail: (emailConfig.mailFromEmail || process.env.MAIL_FROM_EMAIL || 'noreply@travellounge.mu').trim(),
            fromName: (emailConfig.mailFromName || process.env.MAIL_FROM_NAME || 'Travel Lounge').trim(),
            logoUrl: generalConfig.logoUrl || 'https://travellounge.mu/assets/logo.png',
            address: generalConfig.contactAddress || 'Mauritius',
            phone: generalConfig.contactPhone || '+230 5509 7702'
        }
    } catch (error) {
        console.error('[Email] Failed to fetch settings from DB, using defaults:', error)
        return {
            host: (process.env.MAIL_SERVER_URL || '').trim(),
            port: parseInt((process.env.MAIL_SERVER_PORT || '587').trim()),
            user: (process.env.MAIL_SERVER_LOGIN || '').trim(),
            pass: (process.env.MAIL_SERVER_PASS || '').trim(),
            fromEmail: (process.env.MAIL_FROM_EMAIL || 'noreply@travellounge.mu').trim(),
            fromName: (process.env.MAIL_FROM_NAME || 'Travel Lounge').trim(),
            logoUrl: 'https://travellounge.mu/assets/logo.png',
            address: 'Mauritius',
            phone: '+230 5509 7702'
        }
    }
}

async function getTransporter() {
    const config = await getEmailSettings();
    const configHash = JSON.stringify({ host: config.host, port: config.port, user: config.user });

    if (!transporter || configHash !== lastConfigHash) {
        const secure = config.port === 465;
        
        // console.log('[Email] Initializing transporter with config:', {
        //     host: config.host || 'missing',
        //     port: config.port,
        //     secure,
        //     hasUser: !!config.user
        // });

        transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure, 
            auth: {
                user: config.user,
                pass: config.pass
            },
            tls: {
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2'
            },
            ...(config.port === 25 ? { ignoreTLS: true } : {}),
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 20000,
        });
        lastConfigHash = configHash;
    }
    return transporter
}

export type EmailPayload = {
    to: string
    cc?: string
    templateName: string
    variables: Record<string, string | number | boolean | null | undefined>
}

/**
 * Strips HTML tags and handles basic whitespace for plain-text email version
 */
function stripHtml(html: string): string {
    return html
        .replace(/<style([\s\S]*?)<\/style>/gi, '')
        .replace(/<script([\s\S]*?)<\/script>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
}

/**
 * Wraps content in a professional, responsive HTML template
 */
function wrapProfessionalTemplate(content: string, vars: any) {
    const logoUrl = vars.logo_url || 'https://travellounge.mu/assets/logo.png';
    const accentColor = '#DC2626';
    const footerEmail = vars.footer_email || 'noreply@travellounge.mu';
    const footerPhone = vars.footer_phone || '+230 5509 7702';

    return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Travel Lounge</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style type="text/css">
        body { margin: 0; padding: 0; min-width: 100%; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f7; color: #51545E; }
        table { border-spacing: 0; font-family: sans-serif; color: #333333; }
        td { padding: 0; }
        img { border: 0; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f4f4f7; padding-bottom: 40px; }
        .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; font-family: sans-serif; color: #4A4A4A; border-radius: 8px; overflow: hidden; margin-top: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .header { padding: 40px 0; text-align: center; }
        .content { padding: 40px 30px; line-height: 1.6; font-size: 16px; }
        .footer { padding: 30px; text-align: center; font-size: 12px; color: #A8AAAD; }
        .button { background-color: ${accentColor}; color: #ffffff !important; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-top: 20px; }
        .booking-details { background-color: #F8F9FA; border-radius: 8px; padding: 25px; margin: 25px 0; border: 1px solid #EDEFF2; }
        .detail-row { padding: 8px 0; border-bottom: 1px solid #EDEFF2; display: table; width: 100%; }
        .detail-label { display: table-cell; font-weight: bold; color: #85878E; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; width: 40%; }
        .detail-value { display: table-cell; color: #51545E; font-weight: 600; text-align: right; }
        @media only screen and (max-width: 600px) {
            .main { width: 100% !important; border-radius: 0 !important; margin-top: 0 !important; }
            .content { padding: 30px 20px !important; }
        }
    </style>
</head>
<body>
    <center class="wrapper">
        <div class="header">
            <a href="https://travellounge.mu">
                <img src="${logoUrl}" alt="Travel Lounge" style="max-height: 50px; width: auto;" />
            </a>
        </div>
        <table class="main">
            <tr>
                <td class="content">
                    ${content}
                </td>
            </tr>
        </table>
        <div class="footer">
            <p>&copy; 2026 Travel Lounge. All rights reserved.</p>
            <p>Mauritius | ${footerPhone} | ${footerEmail}</p>
            <p><a href="https://travellounge.mu" style="color: #A8AAAD; text-decoration: underline;">www.travellounge.mu</a></p>
        </div>
    </center>
</body>
</html>
`;
}

/**
 * Fetches template from Supabase and fills placeholders with variables
 */
export async function sendTemplatedEmail({ to, cc, templateName, variables }: EmailPayload) {
    try {
        // console.log(`[Email] Triggering template '${templateName}' for ${to}${cc ? ` (CC: ${cc})` : ''}`);
        
        const config = await getEmailSettings();
        const supabase = await createClient()
        
        // 1. Fetch Template
        const { data: template, error } = await supabase
            .from('email_templates')
            .select('*')
            .eq('name', templateName) 
            .single()

        if (error || !template) {
            console.error(`[Email] Template '${templateName}' fetch failed:`, error);
            return { success: false, error: `Template '${templateName}' not found.` };
        }

        // 2. Process Subject & Body
        let subject = template.subject || 'Travel Lounge Notification';
        let bodyContent = template.body || '';

        // Helper to escape HTML for security in email body
        const escapeHtml = (val: any) => {
            const text = String(val ?? '');
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };

        const trimmedVariables = Object.entries(variables).reduce((acc, [key, val]) => {
            acc[key] = typeof val === 'string' ? val.trim() : val;
            return acc;
        }, {} as any);

        const allVars = { 
            logo_url: config.logoUrl,
            footer_email: config.fromEmail,
            footer_phone: config.phone,
            ...trimmedVariables 
        };

        Object.entries(allVars).forEach(([key, value]) => {
            const stringValue = String(value ?? '')
            
            // 1. Raw HTML placeholders
            const rawRegex = new RegExp(`{{raw:${key}}}`, 'gi')
            bodyContent = bodyContent.replace(rawRegex, stringValue)

            // 2. Standard escaped placeholders
            const regex = new RegExp(`{{${key}}}`, 'gi')
            subject = subject.replace(regex, stringValue)
            bodyContent = bodyContent.replace(regex, escapeHtml(stringValue))
        })

        // Wrap in professional template
        const finalHtml = wrapProfessionalTemplate(bodyContent, allVars);

        // 3. Send Email
        const mailTransporter = await getTransporter();
        const info = await mailTransporter.sendMail({
            from: `"${config.fromName}" <${config.fromEmail}>`,
            to,
            cc,
            subject,
            text: stripHtml(bodyContent), 
            html: finalHtml,
        })

        // console.log(`[Email] Success: '${templateName}' -> ${to} [${info.messageId}]`);
        return { success: true, messageId: info.messageId }
        
    } catch (err) {
        console.error(`[Email] Critical Failure sending '${templateName}' to ${to}:`, err)
        // Reset transporter on connection errors to force re-init next time
        transporter = null;
        return { success: false, error: (err as Error).message }
    }
}

/**
 * Basic raw email sender for ad-hoc notifications
 */
export async function sendRawEmail({ to, cc, subject, html, text }: { to: string, cc?: string, subject: string, html: string, text?: string }) {
    try {
        // console.log(`[Email] Sending raw email to ${to}${cc ? ` (CC: ${cc})` : ''} with subject: ${subject}`);
        
        const config = await getEmailSettings();
        const mailTransporter = await getTransporter();

        const info = await mailTransporter.sendMail({
            from: `"${config.fromName}" <${config.fromEmail}>`,
            to,
            cc,
            subject,
            text: text || stripHtml(html),
            html: wrapProfessionalTemplate(html, { 
                logo_url: config.logoUrl,
                footer_email: config.fromEmail,
                footer_phone: config.phone
            }),
        })
        
        // console.log(`[Email] Raw email sent successfully to ${to}. MessageId: ${info.messageId}`)
        return { success: true, messageId: info.messageId }
    } catch (err) {
        console.error('[Email] Raw Send Error:', err)
        transporter = null;
        return { success: false, error: (err as Error).message }
    }
}