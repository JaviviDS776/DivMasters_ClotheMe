import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../services/api';
import toast from 'react-hot-toast';

const Upload = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200; // Reducimos resolución para ahorrar espacio
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Comprimimos a JPEG con calidad 0.7
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !image) {
      return toast.error('Título e imagen son requeridos');
    }

    setLoading(true);
    const toastId = toast.loading('Comprimiendo y subiendo prenda...');

    try {
      // 1. Comprimir la imagen antes de subirla
      const compressedImage = await compressImage(image);
      
      // 2. Crear FormData para enviar la imagen al backend
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('image', compressedImage);

      // 3. Crear post en el Backend
      const result = await createPost(formData);
      console.log('Post creado exitosamente:', result);

      toast.success('¡Prenda subida con éxito!', { id: toastId });
      navigate('/');
    } catch (error) {
      console.error('Error detallado al subir:', error);
      toast.error(`Error al subir la prenda: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Subir Nueva Prenda</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Título de la prenda</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: Camisa de lino vintage"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe el estado, talla, etc."
            rows="3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Imagen</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
        </div>

        {preview && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
            <img src={preview} alt="Preview" className="w-full h-64 object-cover rounded-lg border" />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white font-medium ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
        >
          {loading ? 'Subiendo...' : 'Publicar Prenda'}
        </button>
      </form>
    </div>
  );
};

export default Upload;
