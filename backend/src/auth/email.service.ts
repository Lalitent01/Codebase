import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly senderEmail: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is not configured.');
    }
    this.resend = new Resend(apiKey || '');
    this.senderEmail = this.configService.get<string>('EMAIL_FROM') || 'Suroor <support@suroor.cc>';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const url = `${this.frontendUrl}/auth/verify-email?token=${token}`;

    try {
      this.logger.log(`Sending verification email to: ${email}`);
      const { data, error } = await this.resend.emails.send({
        from: this.senderEmail,
        to: email,
        subject: 'Verify your Neural Link | Suroor',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Welcome to Suroor</h2>
            <p>Please confirm your email address to complete your registration and secure your account.</p>
            <p style="margin: 24px 0;">
              <a href="${url}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Verify Email Address
              </a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">If the button above does not work, copy and paste this link into your browser:<br/><a href="${url}">${url}</a></p>
          </div>
        `,
      });

      if (error) {
        this.logger.error(`Resend API Error (Verification): ${error.message}`);
        throw new InternalServerErrorException('Failed to dispatch verification email');
      }

      this.logger.log(`Verification email sent: ${data?.id}`);
    } catch (error: any) {
      this.logger.error(`Unexpected failure sending verification email: ${error.message}`);
      throw new InternalServerErrorException('Could not send verification email at this time');
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const url = `${this.frontendUrl}/auth/reset-password?token=${token}`;

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.senderEmail,
        to: email,
        subject: 'Reset your Suroor Password',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>You recently requested to reset your password. Click the link below to set a new password. This link will expire in 1 hour.</p>
            <p style="margin: 24px 0;">
              <a href="${url}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Reset Password
              </a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      });

      if (error) {
        this.logger.error(`Resend API Error (Reset): ${error.message}`);
        throw new InternalServerErrorException('Failed to dispatch password reset email');
      }

      this.logger.log(`Reset email sent: ${data?.id}`);
    } catch (error: any) {
      this.logger.error(`Unexpected failure sending password reset email: ${error.message}`);
      throw new InternalServerErrorException('Could not send password reset email at this time');
    }
  }
}