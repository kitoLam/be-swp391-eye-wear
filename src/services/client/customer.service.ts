import { customerRepository } from "../../repositories/customer/customer.repository";
import { AuthCustomerContext } from "../../types/context/context";
import { UpdateCustomerProfileRequest } from "../../types/customer/customer.request";

class CustomerService {
  updateCustomerProfile = async (customer: AuthCustomerContext, payload: UpdateCustomerProfileRequest) => {
    await customerRepository.update(customer.id, payload);
  }
}

export default new CustomerService();