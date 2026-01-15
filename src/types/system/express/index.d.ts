import 'express';
import { AuthAdminContext, AuthCustomerContext } from '../../context/context';

declare module 'express' {
  interface Request {
    adminAccount?: AuthAdminContext,
    customer?: AuthCustomerContext,
    validatedQuery?: Record<string, any>
  }
}
export {};
