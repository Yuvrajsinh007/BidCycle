const axios = require('axios');
const nodemailer = require('nodemailer');

// Brevo (Sendinblue) settings from env
const BREVO_API_URL = process.env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// SMTP settings (optional fallback)
const SMTP_USER = process.env.EMAIL_USER;
const SMTP_PASS = process.env.EMAIL_PASS;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';

const defaultSender = { 
  email: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@bidcycle.com', 
  name: 'BidCycle'
};

// Basic exponential backoff with retries for HTTP requests
const postWithRetry = async (url, payload, options = {}, retries = 3, backoffMs = 500) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const resp = await axios.post(url, payload, options);
      return resp;
    } catch (err) {
      const status = err.response?.status;
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw err;
      }
      if (attempt < retries - 1) {
        const wait = backoffMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
};

// Fallback to SMTP using nodemailer
const sendViaSMTP = async (toEmail, subject, text, html) => {
  if (!SMTP_USER || !SMTP_PASS) {
    return { success: false, error: 'SMTP credentials not configured' };
  }

  const transporterConfig = SMTP_HOST
    ? { host: SMTP_HOST, port: SMTP_PORT ? Number(SMTP_PORT) : 587, secure: SMTP_SECURE, auth: { user: SMTP_USER, pass: SMTP_PASS } }
    : { service: process.env.EMAIL_SERVICE || 'gmail', auth: { user: SMTP_USER, pass: SMTP_PASS } };

  const transporter = nodemailer.createTransport(transporterConfig);

  try {
    const info = await transporter.sendMail({ 
      from: `${defaultSender.name} <${defaultSender.email}>`, 
      to: toEmail, 
      subject, 
      text, 
      html 
    });
    return { success: true, messageId: info.messageId || null };
  } catch (error) {
    console.error('SMTP fallback failed:', error.message || error);
    return { success: false, error: error.message || 'SMTP send failed' };
  }
};

/**
 * Generic send function using Brevo API with retries and SMTP fallback
 */
const sendEmail = async (toEmail, subject, text, html = null) => {
  if (!BREVO_API_KEY) {
    console.warn('BREVO_API_KEY not set — attempting SMTP fallback');
    return await sendViaSMTP(toEmail, subject, text, html || `<p>${text}</p>`);
  }

  const payload = {
    sender: defaultSender,
    to: [{ email: toEmail }],
    subject,
    textContent: text,
    htmlContent: html || `<p>${text}</p>`
  };

  try {
    const resp = await postWithRetry(BREVO_API_URL, payload, {
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
      timeout: 15000
    }, 3, 500);

    const messageId = resp?.data?.messageId || null;
    return { success: true, messageId };
  } catch (error) {
    console.error('Brevo send failed:', error.response?.data || error.message || error);
    // If Brevo fails, try SMTP fallback
    const smtpResult = await sendViaSMTP(toEmail, subject, text, html);
    if (smtpResult.success) return smtpResult;
    return { success: false, error: smtpResult.error || (error.response?.data || error.message) };
  }
};


// ─── Styled HTML email template ─────────────────────────────────────
const getStyledHtml = (heading, content, actionBtn = '') => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .container { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: 1px; }
        .body { padding: 36px 28px; color: #334155; line-height: 1.7; font-size: 15px; }
        .otp-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; letter-spacing: 8px; font-size: 36px; font-weight: 800; color: #0f172a; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>BidCycle</h1>
        </div>
        <div class="body">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">${heading}</h2>
          ${content}
          
          ${actionBtn ? `<div style="text-align: center; margin-top: 32px;">${actionBtn}</div>` : ''}
          
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} BidCycle. All rights reserved.</p>
          <p>This is an automated message — please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send OTP email (for both registration verification and password reset)
const sendOtpEmail = async (email, otp, isPasswordReset = false) => {
  const subject = isPasswordReset ? 'BidCycle — Reset Your Password' : 'BidCycle — Verify Your Email';
  
  const content = `
    <p>Hello,</p>
    <p>${isPasswordReset 
      ? 'We received a request to reset your password. Use the secure code below to proceed:' 
      : 'Thank you for joining BidCycle! Please verify your email address using the secure code below:'
    }</p>
    
    <div class="otp-box">${otp}</div>
    
    <p>This code will expire in <strong>10 minutes</strong>.</p>
    <p style="color: #94a3b8; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
  `;

  const html = getStyledHtml(subject, content);
  const text = `${subject}. Your OTP is: ${otp}. Expires in 10 minutes.`;

  return await sendEmail(email, subject, text, html);
};

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { sendEmail, sendOtpEmail, generateOTP, getStyledHtml };