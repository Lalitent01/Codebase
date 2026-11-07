import {
  Controller,
  Post,
  UseGuards,
  Req,
  Body,
  Headers,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('create-order')
  async createOrder(@Req() req: any, @Body() body: { planId: string }) {
    if (!req.user?.isEmailVerified) {
      throw new ForbiddenException('Please verify your email before making purchases.');
    }
    if (!body?.planId) {
      throw new BadRequestException('planId is required');
    }
    return this.paymentsService.createOrder(req.user.id, body.planId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('verify')
  async verifyPayment(
    @Req() req: any,
    @Body()
    body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
  ) {
    return this.paymentsService.verifyPayment(
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature,
      req.user.id,
    );
  }

  /**
   * Public Webhook Route (No JWT Guard)
   * Invoked directly by Razorpay's servers when payments settle
   */
  @Post('webhook')
  async handleWebhook(
    @Req() req: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    // Uses raw body if available, otherwise falls back to parsed body
    const bodyPayload = (req as any).rawBody || req.body;
    return this.paymentsService.handleWebhook(bodyPayload, signature);
  }
}