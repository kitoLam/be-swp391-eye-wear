import { CustomerModel } from "../../models/customer/customer.model.mongo";
import { customerRepository } from "../../repositories/customer/customer.repository";
import { AuthCustomerContext } from "../../types/context/context";
import { AddCustomerAddress, AddCustomerPrescription, UpdateCustomerProfileRequest } from "../../types/customer/customer.request";

class CustomerService {
  updateCustomerProfile = async (customer: AuthCustomerContext, payload: UpdateCustomerProfileRequest) => {
    await customerRepository.update(customer.id, payload);
  }

  addCustomerAddress = async (customer: AuthCustomerContext, payload: AddCustomerAddress) => {
    const foundCustomer = await CustomerModel.findOne({_id: customer.id});
    if(!foundCustomer){
      throw new Error('Customer not found');  
    }
    if(payload.isDefault){
      for (const address of foundCustomer.address) {
        address.isDefault = false;
      }
    }
    foundCustomer.address.push(payload);
    await foundCustomer.save();
  }

  getCustomerAddresses = async (customer: AuthCustomerContext) => {
    const foundCustomer = await CustomerModel.findOne({_id: customer.id});
    if(!foundCustomer){
      throw new Error('Customer not found');
    }
    return foundCustomer.address;
  }

  getCustomerAddressDefault = async (customer: AuthCustomerContext) => {
    const foundCustomer = await CustomerModel.findOne({_id: customer.id});
    if(!foundCustomer){
      throw new Error('Customer not found');
    }
    return foundCustomer.address.find(address => address.isDefault) || null;
  }

  resetAddressDefault = async (customer: AuthCustomerContext, addressId: string) => {
    const foundCustomer = await CustomerModel.findOne({_id: customer.id});
    if(!foundCustomer){
      throw new Error('Customer not found');
    }
    for (const address of foundCustomer.address) {
      address.isDefault = (address as any)._id.toString() == addressId;
    }
    await foundCustomer.save();
  }

  removeCustomerAddress = async (customer: AuthCustomerContext, addressId: string) => {
    const foundCustomer = await CustomerModel.findOne({_id: customer.id});
    if(!foundCustomer){
      throw new Error('Customer not found');
    }
    foundCustomer.address = foundCustomer.address.filter(address => (address as any)._id.toString() != addressId);
    await foundCustomer.save();
  }

  addCustomerPrescription = async (customer: AuthCustomerContext, payload: AddCustomerPrescription) => {
    const foundCustomer = await CustomerModel.findOne({_id: customer.id});
    if(!foundCustomer){
      throw new Error('Customer not found');
    }
    foundCustomer.parameters.push(payload);
  }

  // removeCustomerAddress = async (customer: AuthCustomerContext, addressId: string) => {
  //   await customerRepository.removeAddress(customer.id, addressId);
  // }

  // removeCustomerPrescription = async (customer: AuthCustomerContext, prescriptionId: string) => {
  //   await customerRepository.removePrescription(customer.id, prescriptionId);
  // }
}

export default new CustomerService();