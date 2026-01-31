import { Request, Response } from "express";
import categoryService from "../../services/admin/category.service";
import { ApiResponse } from "../../utils/api-response";
import { CreateCategoryDTO, UpdateCategoryDTO } from "../../types/category/category.dto";
import { CategoryListQuery } from "../../types/category/category.query";

class CategoryController {
  createCategory = async (req: Request, res: Response) => {
    await categoryService.createCategory(req.validatedBody as CreateCategoryDTO, req.adminAccount!);
    res.json(ApiResponse.success('Create category successfully', {}));
  }
  updateCategory = async (req: Request, res: Response) => {
    await categoryService.updateCategory(req.params.id as string, req.validatedBody as UpdateCategoryDTO);
    res.json(ApiResponse.success('Update category successfully', {}));
  }
  deleteCategory = async (req: Request, res: Response) => {
    await categoryService.deleteCategory(req.params.id as string, req.adminAccount!);
    res.json(ApiResponse.success('Delete category successfully', {}));
  }

  getCategoryDetail = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const categoryDetail = await categoryService.getCategoryDetail(id);
    res.json(ApiResponse.success('Get category detail successfully', { category: categoryDetail }));
  }

  getCategories = async (req: Request, res: Response) => {
    const query = req.validatedQuery as CategoryListQuery;
    const data = await categoryService.getCategoryList(query);
    return res.json(ApiResponse.success('Get categories successfully', data));
  }

}

export default new CategoryController();