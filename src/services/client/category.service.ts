import { ICategoryDocument } from "../../models/categories/categories.model.mongo";
import { categoryRepository } from "../../repositories/categories/categories.repository";

type CategoryTreeItem = {
  id: string;
  name: string;
  thumbnail: string | null;
  children: CategoryTreeItem[];
}
class CategoryService{

  dsfThroughCategoryParent = (v: ICategoryDocument, adjList: Map<string | null, ICategoryDocument[]>): CategoryTreeItem => {
    const parent: CategoryTreeItem = {
      id: v._id.toString(),
      name: v.name,
      thumbnail: v.thumbnail,
      children: []
    }
    for (const item of adjList.get(v._id.toString())!) {
      parent.children.push(this.dsfThroughCategoryParent(item, adjList));
    }
    return parent;
  }

  getAllCategoryTree = async () => {
    const categoryList = await categoryRepository.findAllNoPagination({ deletedAt: null });
    const adjList = new Map<string, ICategoryDocument[]>();
    for (const item of categoryList) {
      adjList.set(item._id.toString(), []);
    }
    for (const item of categoryList) {
      if(item.parentCate == null) continue;
        adjList.set(item.parentCate.toString(), [...adjList.get(item.parentCate.toString())!, item]);
    }
    const treeResult = [];
    for (const item of categoryList) {
      if(item.parentCate == null){
        treeResult.push(this.dsfThroughCategoryParent(item, adjList));
      }
    }
    return treeResult;
  }
}

export default new CategoryService();