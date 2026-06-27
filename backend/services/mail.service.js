const nodemailer = require('nodemailer');

// True when SMTP credentials are configured in the environment.
const hasSmtp = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
const getTransporter = () => {
    if (transporter) return transporter;
    if (!hasSmtp()) return null;
    const port = Number(process.env.SMTP_PORT) || 465;
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port,
        secure: port === 465, // true for 465, false for 587
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    return transporter;
};

// Sends the verification code. When SMTP is not configured, falls back to
// logging the code to the server console so the flow is testable in development.
const sendOtpEmail = async (to, otp) => {
    const t = getTransporter();
    if (!t) {
        console.log(`\n[DEV OTP] Verification code for ${to}: ${otp}\n`);
        return { delivered: false };
    }
    await t.sendMail({
        from: process.env.SMTP_FROM || `CholoShobai <${process.env.SMTP_USER}>`,
        to,
        subject: 'Your CholoShobai verification code',
        text: `Your CholoShobai verification code is ${otp}. It expires in 10 minutes.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
                <h2 style="color: #2563eb;">CholoShobai</h2>
                <p>Use the verification code below to finish creating your account.</p>
                <p style="font-size: 30px; font-weight: bold; letter-spacing: 6px; color: #1f2937;">${otp}</p>
                <p style="color: #6b7280;">This code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p>
            </div>
        `
    });
    return { delivered: true };
};

module.exports = { sendOtpEmail, hasSmtp };
