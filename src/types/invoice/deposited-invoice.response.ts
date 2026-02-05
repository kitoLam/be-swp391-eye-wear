
/**
 * Deposited Invoice Response
 * Full invoice data with orders list id
 */
export interface DepositedInvoiceResponse {
    _id: string;
    invoiceCode: string;
    owner: string;
    totalPrice: number;
    totalDiscount: number;
    status: string;
    fullName: string;
    phone: string;
    address: {
        street: string;
        ward: string;
        city: string;
    };
    orders: string[];
    createdAt: Date;
    updatedAt: Date;
}
