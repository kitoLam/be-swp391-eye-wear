import { Request, Response } from "express";
import categoryService from "../../services/admin/category.service";
import { ApiResponse } from "../../utils/api-response";
import { CreateCategoryDTO, UpdateCategoryDTO } from "../../types/categories/categories";

class CategoryController {
  createCategory = async (req: Request, res: Response) => {
    await categoryService.createCategory(req.body as CreateCategoryDTO, req.adminAccount!);
    res.json(ApiResponse.success('Create category successfully', {}));
  }
  updateCategory = async (req: Request, res: Response) => {
    await categoryService.updateCategory(req.params.id as string, req.body as UpdateCategoryDTO);
    res.json(ApiResponse.success('Update category successfully', {}));
  }
  deleteCategory = async (req: Request, res: Response) => {
    await categoryService.deleteCategory(req.params.id as string, req.adminAccount!);
    res.json(ApiResponse.success('Delete category successfully', {}));
  }
}

export default new CategoryController();