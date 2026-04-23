import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../services/api';
import toast from 'react-hot-toast';
import { Image as ImageIcon, UploadCloud, X, Loader2 } from 'lucide-react';

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
          const MAX_WIDTH = 1200;
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
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !image) return toast.error('Título e imagen son requeridos');

    setLoading(true);
    const toastId = toast.loading('Preparando prenda...');

    try {
      const compressedImage = await compressImage(image);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('image', compressedImage);

      await createPost(formData);
      toast.success('¡Prenda publicada!', { id: toastId });
      navigate('/');
    } catch (error) {
      toast.error(`Error al subir: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">NUEVA PRENDA</h1>
        <p className="text-slate-500 font-medium">Dale una segunda vida a lo que ya no usas.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
        {/* Selector de Imagen */}
        <div className="relative">
          {!preview ? (
            <label className="flex flex-col items-center justify-center w-full h-64 border-4 border-dashed border-slate-100 rounded-[2.5rem] cursor-pointer hover:bg-slate-50 hover:border-indigo-200 transition-all group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud size={32} />
                </div>
                <p className="mb-1 text-sm text-slate-600 font-bold">Haz clic para subir foto</p>
                <p className="text-xs text-slate-400">JPG, PNG o WEBP (Máx. 10MB)</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} required />
            </label>
          ) : (
            <div className="relative h-80 rounded-[2.5rem] overflow-hidden group">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <button 
                type="button"
                onClick={() => {setPreview(null); setImage(null);}}
                className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Título de la prenda</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-700"
              placeholder="Ej: Chaqueta Denim Vintage"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Descripción (Opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-700"
              placeholder="Cuéntanos más sobre el estado, talla..."
              rows="4"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-5 rounded-[2rem] font-black text-sm tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? (
            <><Loader2 className="animate-spin" size={20} /> PUBLICANDO...</>
          ) : (
            'PUBLICAR AHORA'
          )}
        </button>
      </form>
    </div>
  );
};

export default Upload;
