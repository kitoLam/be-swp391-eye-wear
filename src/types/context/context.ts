import { RoleType } from "../../config/enums/admin-account";

export interface AuthAdminContext {
  id: string;
  role: RoleType;
}
export interface AuthCustomerContext {
  id: string;
}