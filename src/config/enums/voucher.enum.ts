// Voucher Type Enum
export enum VoucherType {
    FIXED = 'FIXED',
    PERCENTAGE = 'PERCENTAGE',
    FREE_SHIP = 'FREE_SHIP',
}

// Voucher Status Enum
export enum VoucherStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    DISABLE = 'DISABLE',
}

// Voucher Apply Scope Enum
export enum VoucherApplyScope {
    ALL = 'ALL',
    SPECIFIC = 'SPECIFIC',
}

// Voucher Claim Status Enum
export enum VoucherClaimStatus {
    WAITING_CLAIM = 'WAITING_CLAIM',
    CLAIMED = 'CLAIMED',
}
