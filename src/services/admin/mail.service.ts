import { addMailToQueue } from '../../queues/mail.queue';
import { Invoice } from '../../types/invoice/invoice';
import { generateInvoiceConfirmationHtml } from '../../templates/emails/invoice-confirmation';
import { CustomerModel } from '../../models/customer/customer.model.mongo';
import { sendMail } from '../../utils/mail.util';

class MailAdminService {
    /**
     * Send invoice confirmation email to customer
     * @param invoice The created invoice object
     */
    public async sendInvoiceConfirmation(invoice: Invoice) {
        try {
            // Find the customer to get their email address
            const customer = await CustomerModel.findById(invoice.owner);
            if (!customer || !customer.email) {
                console.error(
                    `[MailService] Customer not found or has no email: ${invoice.owner}`
                );
                return;
            }

            const html = generateInvoiceConfirmationHtml(invoice);

   
            const to = customer.email;
            const subject = `[Eyewear Optic] Xác nhận đơn hàng #${invoice.invoiceCode}`;
            await sendMail(to, subject, html);
                        console.log(`[MailWorker] Successfully sent email to: ${to}`);
            console.log(
                `[MailService] Invoice confirmation queued for: ${customer.email}`
            );
        } catch (error) {
            console.error(
                `[MailService] Error queuing invoice confirmation:`,
                error
            );
        }
    }
}

export const mailAdminService = new MailAdminService();
