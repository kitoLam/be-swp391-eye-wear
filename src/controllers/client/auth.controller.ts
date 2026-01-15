import { Request, Response } from "express";
import { RegisterCustomerDTO } from "../../types/auth/client/auth";
import authService from "../../services/client/auth.service";
import { ApiResponse } from "../../utils/api-response";

class AuthController {
  registerCustomerAccount = async (req: Request, res: Response) => {
    const body = req.body as RegisterCustomerDTO;
    await authService.registerCustomer(body);
    res.json(ApiResponse.success('Register successfully', {}));
  }
  login = async () => {

  }
  logout = () => {

  }
}

export default new AuthController();