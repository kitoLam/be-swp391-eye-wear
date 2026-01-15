import {
    BadRequestError,
    ConflictRequestError,
    NotFoundRequestError,
} from '../../errors/apiError/api-error';
import { categoryRepository } from '../../repositories/categories/categories.repository';
import {
    CreateCategoryDTO,
    UpdateCategoryDTO,
} from '../../types/categories/categories';
import { AuthAdminContext } from '../../types/context/context';

class CategoryService {
    /**
     * hàm xử lí logic nghiệp vụ tạo danh mục sản phẩm
     * @param payload - thôgn tin danh mục sẽ lưu
     * @param context - thông tin admin đã authen
     */
    createCategory = async (
        payload: CreateCategoryDTO,
        context: AuthAdminContext
    ) => {
        if (payload.parentId != null) {
            // check parentCate exist
            const foundParentCate = await categoryRepository.findOne({
                _id: payload.parentId,
                deletedAt: null,
            });
            if (!foundParentCate) {
                throw new NotFoundRequestError('Not found parent category');
            }
            // save new category
            await categoryRepository.create({
                ...payload,
                parentCate: foundParentCate._id,
                createdBy: context.id,
            });
        } else {
            await categoryRepository.create({
                ...payload,
                parentCate: null,
                createdBy: context.id,
            });
        }
    };
    /**
     *
     * @param id
     * @param payload
     */
    updateCategory = async (id: string, payload: UpdateCategoryDTO) => {
        // check category exist
        const foundCategory = await categoryRepository.findOne({
            _id: id,
            deletedAt: null,
        });
        if (!foundCategory) {
            throw new NotFoundRequestError('Not found category');
        }
        // chỉ đổi parent category hiện tại không có con
        if(payload.parentId != foundCategory.parentCate){
          const existChildren = await categoryRepository.exists({
              parentCate: foundCategory._id,
              deletedAt: null,
          });
          if(existChildren){
            throw new ConflictRequestError("You need to ensure current category has no sub category");
          }
        }
        if (payload.parentId != null) {
            // tìm cha tồn tại và khác chính nó
            const foundParentCate = await categoryRepository.findOne({
                _id: payload.parentId,
                deletedAt: null,
            });
            if (foundParentCate == null) {
                throw new NotFoundRequestError('Not found parent category');
            }
            if (foundParentCate._id.toString() == id) {
                throw new ConflictRequestError(
                    'Parent category can not be current category'
                );
            }
            // save new category
            await categoryRepository.update(id, {
                ...payload,
                parentCate: foundParentCate._id,
            });
        } else {
            await categoryRepository.update(id, {
                ...payload,
                parentCate: null,
            });
        }
    };
}
export default new CategoryService();