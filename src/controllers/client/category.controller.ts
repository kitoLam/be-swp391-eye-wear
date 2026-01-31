import { Request, Response } from "express";
import categoryService from "../../services/client/category.service";
import { ApiResponse } from "../../utils/api-response";

class CategoryController {
  getTreeCategories = async (req: Request, res: Response) => {
    const categoryTree = await categoryService.getAllCategoryTree();
    res.json(ApiResponse.success('Get category tree successfully', { categoryTree }));
  }
}

export default new CategoryController();