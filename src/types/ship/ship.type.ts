import z from 'zod';

export const ShipStatus = ['PENDING', 'SHIPPING', 'DELIVERED', 'CANCELED'] as const;

export const ShipSchema = z.object({
    _id: z.string(),
    invoiceId: z.string().min(1, 'Invoice ID is required'),
    shipCode: z.string().nullable().optional(),
    shipAddress: z.string().min(1, 'Ship address is required'),
    estimatedShipDate: z.date(),
    shipCost: z.number().min(0),
    status: z.enum(ShipStatus),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable().optional(),
});

export type Ship = z.infer<typeof ShipSchema>;
