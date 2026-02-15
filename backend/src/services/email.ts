
import { Resend } from 'resend';
import { EmailJob } from '../jobs/queues.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';

export async function sendEmailDirect(data: EmailJob) { // Renamed to avoid Import conflict with queue folder helper
  const { type, to, subject, html, text } = data;
  
  console.log(`📧 Sending email directly (${type}) to ${to}`);

  try {
     // If api key is missing, mock it (prevent crash)
     if (!process.env.RESEND_API_KEY) {
        console.warn("⚠️ RESEND_API_KEY not set. Email simulation:");
        console.log({ to, subject });
        return { success: true, simulated: true };
     }

    const { data: res, error } = await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Resend API Error:', error);
      throw new Error(error.message);
    }

    console.log(`✅ Email sent successfully. ID: ${res?.id}`);
    return { success: true, id: res?.id, to, type };
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err);
    throw err;
  }
}

// Email templates
export const emailTemplates = {
  verification: (verifyUrl: string) => ({
    subject: 'Verify your email - JaagrMind',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome to JaagrMind!</h1>
            <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
            <p><a href="${verifyUrl}" class="button">Verify Email</a></p>
            <p>Or copy and paste this link into your browser:</p>
            <p>${verifyUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <div class="footer">
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to JaagrMind!\n\nPlease verify your email by visiting: ${verifyUrl}\n\nThis link will expire in 24 hours.`,
  }),

  welcome: (name: string) => ({
    subject: 'Welcome to JaagrMind!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome, ${name}!</h1>
            <p>Your email has been verified and your account is now active.</p>
            <p>You can now:</p>
            <ul>
              <li>Write and publish your own stories</li>
              <li>Follow topics and writers you love</li>
              <li>Engage with the community through claps and comments</li>
            </ul>
            <p><a href="${process.env.FRONTEND_URL}" class="button">Start Exploring</a></p>
          </div>
        </body>
      </html>
    `,
    text: `Welcome, ${name}!\n\nYour email has been verified. Start exploring at ${process.env.FRONTEND_URL}`,
  }),

  passwordReset: (resetUrl: string) => ({
    subject: 'Reset your password - JaagrMind',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Reset Your Password</h1>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p><a href="${resetUrl}" class="button">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `Reset your password by visiting: ${resetUrl}\n\nThis link will expire in 1 hour.`,
  }),
};
