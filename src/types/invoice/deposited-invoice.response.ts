/**
 * Type definitions for Deposited Invoice Response
 * Used for GET /admin/invoices/deposited endpoint
 */

/**
 * Order type mapping object
 * Contains order ID and its associated types
 */
export interface OrderTypeMapping {
    id: string;
    type: string[]; // Array of OrderType enum values
}

/**
 * Deposited Invoice Response
 * Full invoice data with orders mapped to {id, type} format
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
    orders: OrderTypeMapping[];
    createdAt: Date;
    updatedAt: Date;
}
