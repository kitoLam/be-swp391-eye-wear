import multer from "multer"
import { storage } from "../config/cloud-storage"
type AllowMimeType = 'image' | 'video' | 'audio';
export const getUploadMiddleware = (filesLimit: number = 5 * 1024 * 1024) => {
  return  multer({
    storage: storage,
    limits: {
      fileSize: filesLimit
    },
  }); 
}