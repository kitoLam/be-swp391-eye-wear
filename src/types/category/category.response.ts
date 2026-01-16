export interface StandardCategory {
  id: string,
  name: string,
  parentCate: {
    id: string,
    name: string,
  } | null,
  thumbnail: string | null,
  createdAt: string,
}

export interface CategoryTreeItem {
  id: string;
  name: string;
  children: CategoryTreeItem[];
}