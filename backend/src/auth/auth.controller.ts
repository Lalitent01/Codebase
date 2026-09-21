import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  UseGuards,
  Req,
  Res,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PersonasService } from '../users/personas.service';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private personasService: PersonasService,
  ) {}

  @Post('signup')
  async signup(@Body() body: any) {
    return this.authService.signup(body.email, body.password, body.username);
  }

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.authService.login(user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Handled by Passport
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
      const result = await this.authService.googleLogin(req);
      return res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
    } catch (err: any) {
      return res.redirect(`${frontendUrl}/auth/login?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('update-profile')
  async updateProfile(@Req() req: any, @Body() body: { bio: string }) {
    return this.personasService.updateBio(req.user.id, body.bio);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('personas')
  async getPersonas(@Req() req: any) {
    return this.personasService.getPersonas(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('personas')
  async createPersona(@Req() req: any, @Body() body: { name: string; description: string }) {
    return this.personasService.createPersona(req.user.id, body);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('resend-verification')
  async resendEmail(@Req() req: any) {
    return this.authService.resendVerification(req.user.id);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; pass: string }) {
    return this.authService.resetPassword(body.token, body.pass);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('personas/:id/active')
  async setActivePersona(@Req() req: any, @Param('id') id: string) {
    return this.personasService.setActive(req.user.id, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('personas/:id')
  async deletePersona(@Req() req: any, @Param('id') id: string) {
    return this.personasService.deletePersona(req.user.id, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('personas/:id')
  async updatePersona(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.personasService.updatePersona(req.user.id, id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@Req() req: any) {
    return req.user;
  }
}