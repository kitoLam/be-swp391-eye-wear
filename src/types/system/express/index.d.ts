import 'express';

declare module 'express' {
  interface Request {
    adminAccount?: {
      id: string;
    },
    customer?: {
      id: string;
    }
  }
}
export {};
