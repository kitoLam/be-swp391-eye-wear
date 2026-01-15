import { CreateCategoryDTO } from "../../types/categories/categories";
import { AuthAdminContext } from "../../types/context/context";

class CategoryService {
  createCategory = async (payload: CreateCategoryDTO, context: AuthAdminContext) => {
    
  }
}
export default new CategoryService();