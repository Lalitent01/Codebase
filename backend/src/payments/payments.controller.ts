import { Controller, Post, UseGuards, Req, Body, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('create-order')
  async createOrder(@Req() req: any, @Body() body: { planId: string }) {
    if (!req.user?.isEmailVerified) {
      throw new ForbiddenException('Please verify your email to make purchases.');
    }
    if (!body?.planId) {
      throw new BadRequestException('planId is required');
    }
    return this.paymentsService.createOrder(req.user.id, body.planId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('verify')
  async verify(@Req() req: any, @Body() body: any) {
    return this.paymentsService.verifyPayment(
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature,
      req.user.id,
      // planId is intentionally not passed from client to prevent tampering
    );
  }
}