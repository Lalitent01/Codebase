import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import Razorpay from 'razorpay';
import { PrismaService } from '../prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;

  constructor(
    private prisma: PrismaService,
    private analyticsService: AnalyticsService,
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'missing_key_id',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'missing_key_secret',
    });
  }

  async createOrder(userId: string, planId: string) {
    if (!planId) throw new BadRequestException('Plan ID is required');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });

    if (!user || !plan) throw new NotFoundException('User or Plan not found');

    // Prevent stacking active time passes
    if (plan.type === 'TIME_PASS') {
      const now = new Date();
      if (user.passExpiry && user.passExpiry > now) {
        throw new BadRequestException('You already have an active Time Pass. Use it before buying a new one.');
      }
    }

    // Ensure amount is an integer in paise
    const amountInPaise = Math.round(plan.price * 100);

    const order = await this.razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    // Log pending transaction with the authoritative planId
    await this.prisma.transaction.create({
      data: {
        userId,
        planId: plan.id,
        razorpayOrderId: order.id,
        amount: amountInPaise,
        status: 'PENDING',
      },
    });

    return order;
  }

  async verifyPayment(orderId: string, paymentId: string, signature: string, userId: string) {
    if (!orderId || !paymentId || !signature) {
      throw new BadRequestException('Missing payment verification details');
    }

    // 1. Fetch the transaction from DB to prevent planId tampering
    const transaction = await this.prisma.transaction.findFirst({
      where: { razorpayOrderId: orderId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Ensure user matches
    if (transaction.userId !== userId) {
      throw new BadRequestException('Unauthorized transaction verification');
    }

    // 2. Prevent Replay Attack / Double Spending
    if (transaction.status === 'COMPLETED') {
      return { success: true, message: 'Payment already verified' };
    }

    // 3. Cryptographic Signature Verification
    const data = `${orderId}|${paymentId}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const generatedSignature = crypto.createHmac('sha256', secret).update(data).digest('hex');

    if (generatedSignature !== signature) {
      throw new BadRequestException('Invalid payment signature');
    }

    // 4. Activate plan using the planId stored securely in the database
    await this.analyticsService.activatePlan(userId, transaction.planId, false);

    // 5. Mark completed
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'COMPLETED',
        razorpayPaymentId: paymentId,
      },
    });

    // 6. Log Analytics
    await this.prisma.analyticsEvent.create({
      data: {
        userId,
        eventType: 'PURCHASE_SUCCESS',
        metadata: { planId: transaction.planId, paymentId, orderId },
      },
    });

    return { success: true };
  }
}