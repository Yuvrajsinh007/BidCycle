const nodemailer = require('nodemailer');

// Lazy-initialized transporter (created on first email send, after dotenv has loaded)
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ EMAIL_USER or EMAIL_PASS not set in .env');
      return null;
    }
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    // console.log('Gmail SMTP transporter created for:', process.env.EMAIL_USER);
  }
  return transporter;
};

/**
 * Generic email sender
 */
const sendEmail = async (toEmail, subject, text, html = null) => {
  const t = getTransporter();
  if (!t) {
    return { success: false, error: 'Email credentials not configured' };
  }

  try {
    const info = await t.sendMail({
      from: `"BidCycle" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      text: text,
      html: html,
    });

    // console.log('Email sent successfully to %s (ID: %s)', toEmail, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send failed:', error.message);
    return { success: false, error: error.message };
  }
};


// Styled HTML email template
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