import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendVerificationEmail(email: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const senderEmail = process.env.EMAIL_FROM || 'Suroor <onboarding@resend.dev>';
    const url = `${frontendUrl}/auth/verify-email?token=${token}`;

    try {
      console.log(`[EMAIL] Sending verification to: ${email}`);
      const { data, error } = await this.resend.emails.send({
        from: senderEmail,
        to: email,
        subject: 'Verify your Neural Link',
        html: `<p>Welcome to Suroor! Click <a href="${url}">here</a> to verify your account.</p>`,
      });

      if (error) {
        console.error('[EMAIL] Resend Error:', error);
        return { success: false, error };
      }

      console.log('[EMAIL] Verification sent successfully:', data?.id);
      return { success: true, data };
    } catch (error) {
      console.error('[EMAIL] Unexpected failure:', error);
      return { success: false, error };
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const senderEmail = process.env.EMAIL_FROM || 'Suroor <onboarding@resend.dev>';
    const url = `${frontendUrl}/auth/reset-password?token=${token}`;

    try {
      const { data, error } = await this.resend.emails.send({
        from: senderEmail,
        to: email,
        subject: 'Reset your Password',
        html: `<p>Click <a href="${url}">here</a> to reset your password. This link expires in 1 hour.</p>`,
      });

      if (error) {
        console.error('[EMAIL] Reset Email Error:', error);
        return { success: false, error };
      }

      console.log(`[EMAIL] Reset link sent to ${email}`);
      return { success: true, data };
    } catch (error) {
      console.error('[EMAIL] Reset Error:', error);
      return { success: false, error };
    }
  }
}