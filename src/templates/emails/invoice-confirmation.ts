import { Invoice } from '../../types/invoice/invoice';

/**
 * Generate HTML for invoice confirmation email
 * @param invoice Invoice details
 */
export const generateInvoiceConfirmationHtml = (invoice: Invoice): string => {
    const formattedPrice = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(invoice.totalPrice + invoice.feeShip - invoice.totalDiscount);

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f7f6; margin: 0; padding: 20px 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #E2F5EE; }
                .header { background: #3BC19D; color: #ffffff; padding: 15px; border-radius: 8px 8px 0 0; text-align: center; }
                .content { padding: 20px 0; }
                .footer { font-size: 12px; color: #777; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px; text-align: center; }
                .invoice-details { background: #ffffff; padding: 15px; border: 1px dashed #3BC19D; margin: 15px 0; }
                .btn { display: inline-block; padding: 10px 20px; background: #3BC19D; color: white; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Xác nhận đơn hàng thành công</h2>
                </div>
                <div class="content">
                    <p>Chào <strong>${invoice.fullName}</strong>,</p>
                    <p>Cảm ơn bạn đã đặt hàng tại <strong>Eyewear Optic</strong>. Chúng mình đã nhận được yêu cầu đặt hàng của bạn và đang tiến hành xử lý.</p>
                    
                    <div class="invoice-details">
                        <p><strong>Mã hóa đơn:</strong> #${invoice.invoiceCode}</p>
                        <p><strong>Tổng giá trị:</strong> ${formattedPrice}</p>
                        <p><strong>Người nhận:</strong> ${invoice.fullName}</p>
                        <p><strong>Số điện thoại:</strong> ${invoice.phone}</p>
                        <p><strong>Địa chỉ:</strong> ${invoice.address.street}, ${invoice.address.ward}, ${invoice.address.city}</p>
                        <p><strong>Chi tiết đơn hàng: </strong><a href="https://eyewear-optic.shop/account/orders/${invoice._id.toString()}">Tại đây</a></p>
                    </div>

                    <p>Bạn có thể theo dõi tình trạng đơn hàng trong phần <strong>Lịch sử đơn hàng</strong> trên website của chúng mình.</p>
                    <p><strong>Lưu ý: </strong>Được return <strong>Order</strong> khi đã nhận hàng và hàng có hư hỏng, hoặc hàng không đúng với Order đã đặt, không đảm bảo trạng thái ban đầu trước khi giao hàng, phải kèm ảnh minh chứng và phải trong thời gian hệ thống cho phép được return là  3 ngày.</p>
                </div>
                <div class="footer">
                    <p>Đây là email tự động, vui lòng không trả lời email này.</p>
                    <p>&copy; 2026 Eyewear Optic. Mọi quyền được bảo lưu.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};
