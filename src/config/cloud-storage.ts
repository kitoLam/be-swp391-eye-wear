import { v2 } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { config } from './env.config';
const cloudinary = v2;
cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.secret_key,
});
export const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
});
