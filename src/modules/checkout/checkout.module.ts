import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { ShippingService } from './shipping.service';
import { CheckoutService } from './checkout.service';
import { OrderService } from './order.service';
import { PaymentService } from './payment.service';
import { CheckoutRepository } from './repositories/checkout.repository';
import { OrderRepository } from './repositories/order.repository';
import { PaymentRepository } from './repositories/payment.repository';
import { VendorOrderRepository } from './repositories/vendor-order.repository';
import { VendorOrderService } from './vendor-order.service';
import { WebhookController } from './webhook.controller';
import { CartRepository } from '../cart/cart.repository';
import { IntegrationService } from './integration.service';
 

@Module({
  controllers: [CheckoutController, WebhookController],
  providers: [
    CheckoutService,
    OrderService,
    PaymentService,
    ShippingService,
    VendorOrderService,
    IntegrationService,
    CheckoutRepository,
    OrderRepository,
    PaymentRepository,
    CartRepository,
    VendorOrderRepository
  ],
  exports: [CheckoutService, OrderService],
})
export class CheckoutModule {}
