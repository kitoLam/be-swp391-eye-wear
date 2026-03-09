import "socket.io";
import { RoleType } from "../../../config/enums/admin-account";

declare module "socket.io" {
  interface Socket {
    user?: {
      id: string;
      userType: "CUSTOMER" | "STAFF";
      role: RoleType | null;
    };
  }
}