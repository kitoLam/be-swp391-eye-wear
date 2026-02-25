import { Router } from 'express';
import authRouter from './auth.route';
import cartRouter from './cart.route';
import orderRouter from './order.route';
import invoiceRouter from './invoice.route';
import paymentRouter from './payment.route';
import voucherRouter from './voucher.route';
import checkoutRouter from './checkout.route';
import customerRouter from './customer.route';
import wishlistRouter from './wishlist.route';
import returnTicketRouter from './return-ticket.route';
import aiConversationRouter from './ai-conversation.route';
import aiMessageRouter from './ai-message.route';

const router = Router();

router.use('/auth', authRouter);
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);
router.use('/invoices', invoiceRouter);
router.use('/payments', paymentRouter);
router.use('/vouchers', voucherRouter);
router.use('/checkout', checkoutRouter);
router.use('/customer', customerRouter);
router.use('/wishlist', wishlistRouter);
router.use('/return-tickets', returnTicketRouter);
router.use('/ai-conversation', aiConversationRouter);
router.use('/ai-message', aiMessageRouter);
export default router;
