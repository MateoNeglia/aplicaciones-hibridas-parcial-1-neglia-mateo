import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);    
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '-') 
      .replace(/-+/g, '-'); 
    cb(null, `picture-${uniqueSuffix}-${sanitizedName}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Invalid file type. Only image files (e.g., JPEG, PNG, GIF, WebP) are allowed.'), false);
};

export const upload = multer({
  storage,
  fileFilter,
});