import { Request, Response } from "express";
import { ApiResponse } from "../../utils/api-response";
import { BadRequestError } from "../../errors/apiError/api-error";

class UploadController {
  uploadSingle = (req: Request, res: Response) => {
    if(!req.file){
      throw new BadRequestError('Send at least one file!');
    }
    const fileUrl = req.file.path;
    res.json(ApiResponse.success("Upload successfully", {
      file: fileUrl,
    }));
  }
  uploadMany = (req: Request, res: Response) => {
    if(!req.files || req.files.length === 0){
      throw new BadRequestError('Send at least one file!');
    }
    const fileUrls = (req.files as Express.Multer.File[]).map(file => file.path);
    res.json(ApiResponse.success("Upload successfully", {
      files: fileUrls,
    }));
  }
}

export default new UploadController();