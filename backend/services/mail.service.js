const nodemailer = require('nodemailer');

// True when a Brevo API key is configured. Brevo sends over HTTPS, which works
// on hosts that block outbound SMTP ports (for example Render's free tier).
const hasBrevo = () => !!process.env.BREVO_API_KEY;

// True when SMTP credentials are configured (used for local development).
const hasSmtp = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);

// True when any real email provider is configured.
const hasMailProvider = () => hasBrevo() || hasSmtp();

// The verified sender address.
const senderEmail = () =>
    process.env.BREVO_SENDER || process.env.SMTP_USER || 'no-reply@choloshobai.app';

let transporter = null;
const getTransporter = () => {
    if (transporter) return transporter;
    if (!hasSmtp()) return null;
    const port = Number(process.env.SMTP_PORT) || 465;
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port,
        secure: port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    });
    return transporter;
};

// Core: send a single email via Brevo, then SMTP, otherwise log it (dev).
const sendOne = async (to, subject, text, html) => {
    if (hasBrevo()) {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': process.env.BREVO_API_KEY,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify({
                sender: { email: senderEmail(), name: 'CholoShobai' },
                to: [{ email: to }],
                subject,
                htmlContent: html,
                textContent: text
            })
        });
        if (!res.ok) {
            const detail = await res.text().catch(() => '');
            throw new Error(`Brevo API error ${res.status}: ${detail}`);
        }
        return { delivered: true };
    }
    if (hasSmtp()) {
        await getTransporter().sendMail({
            from: process.env.SMTP_FROM || `CholoShobai <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html
        });
        return { delivered: true };
    }
    console.log(`\n[DEV EMAIL] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return { delivered: false };
};

const otpHtml = (otp) => `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #2563eb;">CholoShobai</h2>
        <p>Use the verification code below to finish creating your account.</p>
        <p style="font-size: 30px; font-weight: bold; letter-spacing: 6px; color: #1f2937;">${otp}</p>
        <p style="color: #6b7280;">This code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p>
    </div>
`;

// Sends the OTP verification code.
const sendOtpEmail = async (to, otp) =>
    sendOne(
        to,
        'Your CholoShobai verification code',
        `Your CholoShobai verification code is ${otp}. It expires in 10 minutes.`,
        otpHtml(otp)
    );

const announcementHtml = (title, message) => `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
        <h2 style="color: #0f172a;">CholoShobai</h2>
        ${title ? `<h3 style="color: #1f2937; margin-bottom: 8px;">${title}</h3>` : ''}
        <p style="color: #334155; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">You are receiving this because you have a CholoShobai account.</p>
    </div>
`;

// Sends an announcement to many recipients as individual emails so that
// recipients do not see each other's addresses.
const sendBroadcastEmail = async (recipients, title, message) => {
    const subject = title ? `CholoShobai: ${title}` : 'CholoShobai announcement';
    const html = announcementHtml(title, message);
    const results = await Promise.allSettled(
        recipients.map((to) => sendOne(to, subject, message, html))
    );
    const delivered = results.filter((r) => r.status === 'fulfilled' && r.value && r.value.delivered).length;
    return { total: recipients.length, delivered };
};

module.exports = { sendOtpEmail, sendBroadcastEmail, hasSmtp, hasBrevo, hasMailProvider };
