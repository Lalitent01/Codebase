import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: {
            createOrder: jest.fn().mockResolvedValue({
              orderId: 'order_test_123',
              amount: 50000,
              currency: 'INR',
              keyId: 'rzp_test_TwXpsd1vpRAeZX',
            }),
            verifyPayment: jest.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});