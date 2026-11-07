import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import { PrismaService } from '../prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly razorpay: Razorpay;
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
    private readonly configService: ConfigService,
  ) {
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID') || '';
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || '';
    this.webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET') || '';

    if (!this.keyId || !this.keySecret) {
      this.logger.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured in environment.');
    }

    this.razorpay = new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret,
    });
  }

  /**
   * STEP 1: Create Razorpay Order
   */
  async createOrder(userId: string, planId: string) {
    if (!planId) throw new BadRequestException('Plan ID is required');

    const [user, plan] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.plan.findUnique({ where: { id: planId } }),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!plan || !plan.isActive) throw new NotFoundException('Selected plan is not available');

    // Prevent stacking active time passes
    if (plan.type === 'TIME_PASS') {
      const now = new Date();
      if (user.passExpiry && user.passExpiry > now) {
        throw new BadRequestException('You already have an active Time Pass. Use it before purchasing another.');
      }
    }

    // Razorpay amounts are strictly in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(plan.price * 100);

    if (amountInPaise < 100) {
      throw new BadRequestException('Minimum purchase amount is ₹1.00 (100 paise)');
    }

    try {
      const order = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${userId.slice(-6)}_${Date.now()}`,
        notes: {
          userId,
          planId: plan.id,
          planName: plan.name,
        },
      });

      // Record pending transaction with immutable planId
      await this.prisma.transaction.create({
        data: {
          userId,
          planId: plan.id,
          razorpayOrderId: order.id,
          amount: amountInPaise,
          status: 'PENDING',
        },
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: this.keyId,
        planName: plan.name,
        userEmail: user.email,
        username: user.username,
      };
    } catch (error: any) {
      this.logger.error(`Razorpay Order Creation Failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.error?.description || 'Could not initiate payment gateway');
    }
  }

  /**
   * STEP 2: Verify Cryptographic Signature & Activate Plan (Client Flow)
   */
  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
    userId: string,
  ) {
    if (!orderId || !paymentId || !signature) {
      throw new BadRequestException('Missing payment verification parameters (orderId, paymentId, signature)');
    }

    // 1. Fetch transaction record created during order creation
    const transaction = await this.prisma.transaction.findFirst({
      where: { razorpayOrderId: orderId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found for this order');
    }

    if (transaction.userId !== userId) {
      throw new BadRequestException('Unauthorized payment verification');
    }

    // 2. Cryptographic HMAC-SHA256 Signature Verification
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      this.logger.warn(`Signature mismatch! Order: ${orderId}, Provided: ${signature}`);
      throw new BadRequestException('Invalid payment signature. Verification failed.');
    }

    // 3. Atomically transition state to avoid replay attacks and double-activations
    const stateLock = await this.prisma.transaction.updateMany({
      where: {
        id: transaction.id,
        status: 'PENDING',
      },
      data: {
        status: 'COMPLETED',
        razorpayPaymentId: paymentId,
      },
    });

    // If count is 0, another concurrent request (or webhook) already completed this transaction
    if (stateLock.count === 0) {
      return { success: true, message: 'Payment already processed and activated.' };
    }

    // 4. Activate the authoritative plan securely
    await this.analyticsService.activatePlan(userId, transaction.planId, false);

    // 5. Track successful purchase event
    await this.analyticsService.track('PURCHASE_SUCCESS', userId, {
      planId: transaction.planId,
      paymentId,
      orderId,
      amountPaise: transaction.amount,
      via: 'CLIENT_VERIFY',
    });

    return {
      success: true,
      message: 'Payment verified and plan activated successfully.',
    };
  }

  /**
   * STEP 2 (Fallback): Razorpay Server-to-Server Webhook
   * Ensures fulfillment if the user closes their browser or app after UPI payment
   */
  async handleWebhook(rawBody: any, signature: string) {
    if (!this.webhookSecret) {
      this.logger.error('RAZORPAY_WEBHOOK_SECRET is not configured in environment variables.');
      throw new BadRequestException('Webhook configuration missing');
    }

    if (!signature) {
      throw new BadRequestException('Missing x-razorpay-signature header');
    }

    // 1. Determine payload string format
    let payloadString: string;
    if (Buffer.isBuffer(rawBody)) {
      payloadString = rawBody.toString('utf8');
    } else if (typeof rawBody === 'string') {
      payloadString = rawBody;
    } else {
      payloadString = JSON.stringify(rawBody);
    }

    // 2. Cryptographic Signature Verification
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payloadString)
      .digest('hex');

    if (expectedSignature !== signature) {
      this.logger.warn('Razorpay webhook signature verification failed.');
      throw new BadRequestException('Invalid webhook signature');
    }

    // 3. Parse Event Payload
    const event = typeof rawBody === 'string'
      ? JSON.parse(rawBody)
      : Buffer.isBuffer(rawBody)
      ? JSON.parse(rawBody.toString('utf8'))
      : rawBody;

    this.logger.log(`Received Razorpay webhook event: ${event.event}`);

    // 4. Process Payment Success Events
    if (event.event === 'order.paid' || event.event === 'payment.captured') {
      const paymentEntity = event.payload?.payment?.entity;
      if (!paymentEntity) {
        return { status: 'ignored', reason: 'Missing payment entity' };
      }

      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      if (!orderId) {
        return { status: 'ignored', reason: 'Missing order_id' };
      }

      const transaction = await this.prisma.transaction.findFirst({
        where: { razorpayOrderId: orderId },
      });

      // Atomically update only if still PENDING (prevents double activation if client verify already ran)
      if (transaction && transaction.status === 'PENDING') {
        const stateLock = await this.prisma.transaction.updateMany({
          where: {
            id: transaction.id,
            status: 'PENDING',
          },
          data: {
            status: 'COMPLETED',
            razorpayPaymentId: paymentId,
          },
        });

        if (stateLock.count > 0) {
          await this.analyticsService.activatePlan(transaction.userId, transaction.planId, false);
          
          await this.analyticsService.track('PURCHASE_SUCCESS', transaction.userId, {
            planId: transaction.planId,
            paymentId,
            orderId,
            amountPaise: transaction.amount,
            via: 'WEBHOOK',
          });

          this.logger.log(`Order ${orderId} successfully fulfilled via Razorpay webhook.`);
        }
      }
    }

    return { status: 'ok' };
  }
}