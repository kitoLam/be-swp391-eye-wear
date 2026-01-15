import { Types } from "mongoose";
import { AttributeRepository, attributeRepository } from "../../repositories/attribute/attribute.repository";
import { AttributeCreateDTO, AttributeUpdateDTO } from "../../types/attribute/attribute";
import { AuthAdminContext } from "../../types/context/context";
import { NotFoundRequestError } from "../../errors/apiError/api-error";
import * as attributeConverter from '../../converters/admin/attribute.converter';
import { AttributeListQuery } from "../../types/attribute/attribute.query";
class AttributeService {
  /**
   * Tạo mới thuộc tính sản phẩm
   * @param payload - form data yêu cầu tạo từ user
   * @param context - thông tin admin đã login
   * @returns 
   */
  createAttribute = async (payload: AttributeCreateDTO, context: AuthAdminContext) => {
    await attributeRepository.create({
      ...payload,
      createdBy: new Types.ObjectId(context.id)
    });
  }
  /**
   * Cập nhật attribute
   * @param id - id attribute
   * @param payload - thông tin cập nhật
   */
  updateAttribute = async (id: string, payload: AttributeUpdateDTO) => {
    const foundAttribute = await attributeRepository.findOne({
      _id: id,
    });
    if(!foundAttribute) throw new NotFoundRequestError('Attribute not found');
    await attributeRepository.update( id,{
      ...payload
    });
  }
  /**
   * xóa thuộc tính theo id
   * @param id 
   * @param context 
   */
  deleteAttribute = async (id: string, context: AuthAdminContext) => {
    const foundAttribute = await attributeRepository.findOne({
      _id: id,
      deletedAt: null
    });
    if(!foundAttribute) throw new NotFoundRequestError('Attribute not found');
    await attributeRepository.update(id, {
      deletedAt: new Date(),
      deletedBy: new Types.ObjectId(context.id)
    });
  }

  getAttributeDetail = async (id: string) => {
    const foundAttribute = await attributeRepository.findOne({
      _id: id,
    });
    if(!foundAttribute) {
      throw new NotFoundRequestError('Attribute not found');
    }
    console.log(foundAttribute)
    return attributeConverter.toAttributeCreateDTO(foundAttribute);
  }
  getAttributeList = async (query: AttributeListQuery) => {
    const paginationResult = await attributeRepository.findAll({
      page: query.page, limit: query.limit,
    });
    const attributeList = paginationResult.data;
    const pagination = {
      page: paginationResult.page,
      limit: paginationResult.limit,
      total: paginationResult.total,
      totalPages: paginationResult.totalPages,
    }
    return {
      attributeList: attributeList.map(item => attributeConverter.toStandardAttribute(item)),
      pagination,
    };
  }
}

export default new AttributeService();