const axios = require('axios');

// Brevo (Sendinblue) settings from env
const BREVO_API_URL = process.env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

const defaultSender = { 
  email: process.env.EMAIL_FROM || 'no-reply@bidcycle.com', 
  name: 'BidCycle' 
};

/**
 * 🎨 HELPER: Professional Email Template Wrapper
 * Wraps content in a responsive, branded HTML structure.
 */
const getStyledHtml = (heading, content, actionButton = null) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; background-color: #f4f7fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 30px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 1px; }
        .content { padding: 40px 30px; color: #374151; line-height: 1.6; font-size: 16px; }
        .otp-box { background-color: #f3f4f6; border-radius: 8px; padding: 15px; text-align: center; margin: 25px 0; letter-spacing: 5px; font-size: 32px; font-weight: bold; color: #1f2937; border: 2px dashed #d1d5db; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
        .highlight { color: #4f46e5; font-weight: 600; }
        .success-text { color: #059669; font-weight: bold; }
        @media only screen and (max-width: 600px) {
          .container { margin: 0; border-radius: 0; }
          .content { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>BidCycle</h1>
        </div>
        <div class="content">
          <h2 style="color: #111827; margin-top: 0;">${heading}</h2>
          ${content}
          ${actionButton ? `<div style="text-align: center;">${actionButton}</div>` : ''}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} BidCycle. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Basic exponential backoff with retries
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

// Generic send function
const sendEmail = async (toEmail, subject, text, html = null) => {
  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY not set. Email not sent.');
    return { success: false, error: 'Configuration Missing' };
  }

  const payload = {
    sender: defaultSender,
    to: [{ email: toEmail }],
    subject,
    textContent: text,
    htmlContent: html || getStyledHtml(subject, `<p>${text}</p>`)
  };

  try {
    const resp = await postWithRetry(BREVO_API_URL, payload, {
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
      timeout: 15000
    }, 3, 500);

    return { success: true, messageId: resp?.data?.messageId };
  } catch (error) {
    console.error('Brevo send failed:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

// Updated OTP Email with new styling
const sendOtpEmail = async (email, otp, isPasswordReset = false) => {
  const subject = isPasswordReset ? 'Reset Your Password' : 'Verify Your Email';
  
  const content = `
    <p>Hello,</p>
    <p>${isPasswordReset 
      ? 'We received a request to reset your password. Use the code below to proceed:' 
      : 'Thank you for registering with BidCycle. Please verify your email address using the code below:'
    }</p>
    
    <div class="otp-box">${otp}</div>
    
    <p>This code will expire in <strong>10 minutes</strong>.</p>
    <p>If you did not request this, you can safely ignore this email.</p>
  `;

  const html = getStyledHtml(subject, content);
  
  // Create plain text fallback
  const text = `${subject}. Your OTP is: ${otp}. Expires in 10 mins.`;

  return await sendEmail(email, subject, text, html);
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { sendEmail, sendOtpEmail, generateOTP, getStyledHtml };