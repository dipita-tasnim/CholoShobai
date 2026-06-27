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

const otpSubject = 'Your CholoShobai verification code';
const otpText = (otp) => `Your CholoShobai verification code is ${otp}. It expires in 10 minutes.`;
const otpHtml = (otp) => `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #2563eb;">CholoShobai</h2>
        <p>Use the verification code below to finish creating your account.</p>
        <p style="font-size: 30px; font-weight: bold; letter-spacing: 6px; color: #1f2937;">${otp}</p>
        <p style="color: #6b7280;">This code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p>
    </div>
`;

// Send through the Brevo HTTP API (port 443, not blocked by SMTP restrictions).
const sendViaBrevo = async (to, otp) => {
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
            subject: otpSubject,
            htmlContent: otpHtml(otp),
            textContent: otpText(otp)
        })
    });
    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Brevo API error ${res.status}: ${detail}`);
    }
    return { delivered: true };
};

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

const sendViaSmtp = async (to, otp) => {
    await getTransporter().sendMail({
        from: process.env.SMTP_FROM || `CholoShobai <${process.env.SMTP_USER}>`,
        to,
        subject: otpSubject,
        text: otpText(otp),
        html: otpHtml(otp)
    });
    return { delivered: true };
};

// Sends the verification code. Prefers Brevo (HTTPS) when configured, then SMTP,
// otherwise falls back to logging the code to the console for development.
const sendOtpEmail = async (to, otp) => {
    if (hasBrevo()) {
        return await sendViaBrevo(to, otp);
    }
    if (hasSmtp()) {
        return await sendViaSmtp(to, otp);
    }
    console.log(`\n[DEV OTP] Verification code for ${to}: ${otp}\n`);
    return { delivered: false };
};

module.exports = { sendOtpEmail, hasSmtp, hasBrevo, hasMailProvider };
