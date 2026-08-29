const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImage = async (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'clotheme_posts',
        tags: ['clotheme', 'cualtos_swap', 'garment'],
        allowed_formats: ['jpg', 'png', 'webp', 'jpeg'],
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Error al subir imagen a Cloudinary:', error);
          return reject(new Error(error.message || 'Error al procesar la imagen en Cloudinary'));
        }
        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};

module.exports = { uploadImage };
