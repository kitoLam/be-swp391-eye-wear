import { BadRequestError, NotFoundRequestError } from "../../errors/apiError/api-error";
import { CustomerModel } from "../../models/customer/customer.model.mongo";
import { customerRepository } from "../../repositories/customer/customer.repository";
import { AuthCustomerContext } from "../../types/context/context";
import { AddCustomerAddress, AddCustomerPrescription, UpdateCustomerAddress, UpdateCustomerPassword, UpdateCustomerProfileRequest } from "../../types/customer/customer.request";
import { comparePassword, hashPassword } from "../../utils/bcrypt.util";

class CustomerService {
  updateCustomerProfile = async (customer: AuthCustomerContext, payload: UpdateCustomerProfileRequest) => {
    await customerRepository.update(customer.id, payload);
  }

  addCustomerAddress = async (customer: AuthCustomerContext, payload: AddCustomerAddress) => {
    const foundCustomer = await CustomerModel.findOne({_id: customer.id});
    if(!foundCustomer){
      throw new NotFoundRequestError('Customer not found');  
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
      throw new NotFoundRequestError('Customer not found');
    }
    return foundCustomer.address;
  }

  getCustomerAddressDefault = async (customer: AuthCustomerContext) => {
    const foundCustomer = await CustomerModel.findOne({_id: customer.id});
    if(!foundCustomer){
      throw new NotFoundRequestError('Customer not found');
    }
    return foundCustomer.address.find(address => address.isDefault) || null;
  }

  updateCustomerAddress = async (customer: AuthCustomerContext, addressId: string, payload: UpdateCustomerAddress) => {
    const foundCustomer = await CustomerModel.findOne({_id: customer.id});
    if(!foundCustomer){
      throw new NotFoundRequestError('Customer not found');
    }
    const addressIndex = foundCustomer.address.findIndex(address => (address as any)._id.toString() === addressId);
    if(addressIndex === -1){
      throw new NotFoundRequestError('Address not found');
    }
    if(payload.isDefault){
      for (const address of foundCustomer.address) {
        address.isDefault = false;
      }
    }
    // Update fields individually to preserve _id
    Object.assign(foundCustomer.address[addressIndex], payload);
    await foundCustomer.save();
  }

  resetAddressDefault = async (customer: AuthCustomerContext, addressId: string) => {
    const foundCustomer = await CustomerModel.findOne({_id: customer.id});
    if(!foundCustomer){
      throw new NotFoundRequestError('Customer not found');
    }
    for (const address of foundCustomer.address) {
      address.isDefault = (address as any)._id.toString() == addressId;
    }
    await foundCustomer.save();
  }

  removeCustomerAddress = async (customer: AuthCustomerContext, addressId: string) => {
    const foundCustomer = await CustomerModel.findOne({_id: customer.id});
    if(!foundCustomer){
      throw new NotFoundRequestError('Customer not found');
    }
    foundCustomer.address = foundCustomer.address.filter(address => (address as any)._id.toString() != addressId);
    await foundCustomer.save();
  }

  addCustomerPrescription = async (customer: AuthCustomerContext, payload: AddCustomerPrescription) => {
    const foundCustomer = await CustomerModel.findOne({_id: customer.id});
    if(!foundCustomer){
      throw new NotFoundRequestError('Customer not found');
    }
    if(payload.isDefault){
      for (const prescription of foundCustomer.parameters) {
        prescription.isDefault = false;
      }
    }
    foundCustomer.parameters.push(payload);
    await foundCustomer.save();
  }

  getCustomerPrescriptions = async (customer: AuthCustomerContext) => {
    const foundCustomer = await CustomerModel.findOne({_id: customer.id});
    if(!foundCustomer){
      throw new NotFoundRequestError('Customer not found');
    }
    return foundCustomer.parameters;
  }

  getCustomerPrescriptionDefault = async (customer: AuthCustomerContext) => {
    const foundCustomer = await CustomerModel.findOne({_id: customer.id});
    if(!foundCustomer){
      throw new NotFoundRequestError('Customer not found');
    }
    return foundCustomer.parameters.find(prescription => prescription.isDefault) || null;
  }

  updateCustomerPrescription = async (customer: AuthCustomerContext, prescriptionId: string, payload: AddCustomerPrescription) => {
    const foundCustomer = await CustomerModel.findOne({_id: customer.id});
    if(!foundCustomer){
      throw new NotFoundRequestError('Customer not found');
    }
    const prescriptionIndex = foundCustomer.parameters.findIndex(prescription => (prescription as any)._id.toString() === prescriptionId);
    if(prescriptionIndex === -1){
      throw new NotFoundRequestError('Prescription not found');
    }
    if(payload.isDefault){
      for (const prescription of foundCustomer.parameters) {
        prescription.isDefault = false;
      }
    }
    // Update fields individually to preserve _id
    Object.assign(foundCustomer.parameters[prescriptionIndex], payload);
    await foundCustomer.save();
  }

  resetPrescriptionDefault = async (customer: AuthCustomerContext, prescriptionId: string) => {
    const foundCustomer = await CustomerModel.findOne({_id: customer.id});
    if(!foundCustomer){
      throw new NotFoundRequestError('Customer not found');
    }
    for (const prescription of foundCustomer.parameters) {
      prescription.isDefault = (prescription as any)._id.toString() == prescriptionId;
    }
    await foundCustomer.save();
  }

  removeCustomerPrescription = async (customer: AuthCustomerContext, prescriptionId: string) => {
    const foundCustomer = await CustomerModel.findOne({_id: customer.id});
    if(!foundCustomer){
      throw new NotFoundRequestError('Customer not found');
    }
    foundCustomer.parameters = foundCustomer.parameters.filter(prescription => (prescription as any)._id.toString() != prescriptionId);
    await foundCustomer.save();
  }

  changePassword = async (customer: AuthCustomerContext, payload: UpdateCustomerPassword) => {
    const foundCustomer = await CustomerModel.findOne({_id: customer.id});
    if(!foundCustomer){
      throw new NotFoundRequestError('Customer not found');
    }


    if(!foundCustomer.providers.includes('local')){
      foundCustomer.providers.push('local');
    }
    else {
      if(!payload.oldPassword){
        throw new BadRequestError('Old password is required to double check for manual account!');
      }
      const isPasswordMatch = comparePassword(payload.oldPassword, foundCustomer.hashedPassword);
      if(!isPasswordMatch){
        throw new BadRequestError('Old password is incorrect');
      }
    }
    foundCustomer.hashedPassword = hashPassword(payload.newPassword);
    await foundCustomer.save();
  }
}

export default new CustomerService();