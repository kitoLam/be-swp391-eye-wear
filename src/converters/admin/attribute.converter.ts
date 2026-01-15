import { IAttributeDocument } from "../../models/attribute/attribute.model";
import { AttributeCreateDTO } from "../../types/attribute/attribute";
import { StandardAttribute } from "../../types/attribute/attribute.response";
import { formatDateToString } from "../../utils/formatter";

export const toAttributeCreateDTO = (data: IAttributeDocument): AttributeCreateDTO => {
  return {
    name: data.name,
    showType: data.showType
  }
}
export const toStandardAttribute = (data: IAttributeDocument): StandardAttribute => {
  return {
    id: data._id.toString(),
    name: data.name,
    showType: data.showType,
    createdAt: formatDateToString(data.createdAt),
  }
}