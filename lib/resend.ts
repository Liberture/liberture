import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set in environment variables');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Default from address
export const FROM_EMAIL = 'Liberture <hello@liberture.com>';

// Email sending helpers
export async function sendWelcomeEmail(to: string, name: string) {
  const { WelcomeEmail } = await import('@/emails/templates/welcome');
  
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Welcome to Liberture, ${name}! 🎉`,
    react: WelcomeEmail({ name, email: to }),
  });
}

export async function sendWeeklyDigest(
  to: string,
  name: string,
  data: {
    weekNumber: number;
    newProtocols: Array<{ title: string; pillar: string; url: string }>;
    newArticles: Array<{ title: string; pillar: string; url: string }>;
    streakDays?: number;
  }
) {
  const { WeeklyDigestEmail } = await import('@/emails/templates/weekly-digest');
  
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your Weekly Optimization Report - Week ${data.weekNumber}`,
    react: WeeklyDigestEmail({ name, ...data }),
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Reset Your Liberture Password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a; color: #fff;">
        <h1 style="color: #8B5CF6; margin-bottom: 20px;">Reset Your Password</h1>
        <p style="color: #ccc; line-height: 1.6; margin-bottom: 30px;">
          Click the button below to reset your Liberture password. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #8B5CF6, #06B6D4); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendEmailVerification(to: string, verifyUrl: string) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Verify Your Liberture Email',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a; color: #fff;">
        <h1 style="color: #06B6D4; margin-bottom: 20px;">Verify Your Email</h1>
        <p style="color: #ccc; line-height: 1.6; margin-bottom: 30px;">
          Welcome to Liberture! Please verify your email address to get started.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #8B5CF6, #06B6D4); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Verify Email
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This link expires in 24 hours.
        </p>
      </div>
    `,
  });
}
