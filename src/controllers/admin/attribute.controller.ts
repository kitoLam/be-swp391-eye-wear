import attributeService from "../../services/admin/attribute.service"
import {Request, Response} from 'express';
import { AttributeCreateDTO, AttributeUpdateDTO } from "../../types/attribute/attribute";
import { ApiResponse } from "../../utils/api-response";
import { attributeMessage } from "../../config/constants/response-messages/attribute.constant";
class AttributeController {
  createAttribute = async (req: Request, res: Response) => {
    await attributeService.createAttribute(req.body as AttributeCreateDTO, req.adminAccount!);
    res.json(ApiResponse.success(attributeMessage.success.create, {}));
  }
  updateAttribute = async (req: Request, res: Response) => {
    const attributeId = req.params.id as string;
    console.log(attributeId)
    await attributeService.updateAttribute(attributeId, req.body as AttributeUpdateDTO);
    res.json(ApiResponse.success(attributeMessage.success.update, {}));
  }
  deleteAttribute = async (req: Request, res: Response) => {
    const attributeId = req.params.id as string;
    await attributeService.deleteAttribute(attributeId, req.adminAccount!);
    res.json(ApiResponse.success(attributeMessage.success.update, {}));
  }
  getAttributeDetail = async (req: Request, res: Response) => {
    
  }
  getAttributeList = async (req: Request, res: Response) => {
    
  }
}
export default new AttributeController();