-- Create Customer Table
CREATE TABLE IF NOT EXISTS customer (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Voucher Table
CREATE TABLE IF NOT EXISTS voucher (
    id TEXT PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Voucher User Table
CREATE TABLE IF NOT EXISTS voucher_user (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
    voucher_id TEXT NOT NULL REFERENCES voucher(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_voucher_user_customer_id ON voucher_user(customer_id);
CREATE INDEX IF NOT EXISTS idx_voucher_user_voucher_id ON voucher_user(voucher_id);

-- Optional: Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_voucher_user_updated_at
    BEFORE UPDATE ON voucher_user
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
