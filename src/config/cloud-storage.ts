import { v2 } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
const cloudinary = v2;
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET,
});
export const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
});
