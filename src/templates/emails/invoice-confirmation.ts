import { Invoice } from '../../types/invoice/invoice';

/**
 * Generate HTML for invoice confirmation email
 * @param invoice Invoice details
 */
export const generateInvoiceConfirmationHtml = (invoice: Invoice): string => {
    const formattedPrice = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(invoice.totalPrice);

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                .header { background: #f8f9fa; padding: 10px; border-bottom: 2px solid #007bff; text-align: center; }
                .content { padding: 20px 0; }
                .footer { font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px; margin-top: 20px; text-align: center; }
                .invoice-details { background: #fdfdfd; padding: 15px; border: 1px dashed #ccc; margin: 15px 0; }
                .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
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
                    </div>

                    <p>Bạn có thể theo dõi tình trạng đơn hàng trong phần <strong>Lịch sử đơn hàng</strong> trên website của chúng mình.</p>
                </div>
                <div class="footer">
                    <p>Đây là email tự động, vui lòng không trả lời email này.</p>
                    <p>&copy; 2024 Eyewear Optic. Mọi quyền được bảo lưu.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};
