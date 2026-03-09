import { PayOS } from '@payos/node';

const clientId = process.env.PAYOS_CLIENT_ID || process.env.PAYOS_CLIENT_KEY;
const apiKey = process.env.PAYOS_API_KEY;
const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

export const isPayOSConfigured = Boolean(clientId && apiKey && checksumKey);

export const payOS = isPayOSConfigured
    ? new PayOS({
          clientId: clientId!,
          apiKey: apiKey!,
          checksumKey: checksumKey!,
      })
    : null;