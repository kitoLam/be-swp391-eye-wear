import { addMailToQueue } from '../../queues/mail.queue';
import { Invoice } from '../../types/invoice/invoice';
import { generateInvoiceConfirmationHtml } from '../../templates/emails/invoice-confirmation';
import { CustomerModel } from '../../models/customer/customer.model.mongo';

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

            await addMailToQueue({
                to: customer.email,
                subject: `[Eyewear Optic] Xác nhận đơn hàng #${invoice.invoiceCode}`,
                html: html,
            });

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
