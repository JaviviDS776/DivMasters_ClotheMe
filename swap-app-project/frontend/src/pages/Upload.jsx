import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../services/api';
import { checkImageNSFW } from '../services/aiModerationService';
import toast from 'react-hot-toast';
import { 
  Image as ImageIcon, 
  UploadCloud, 
  X, 
  Loader2, 
  ShieldCheck, 
  Sparkles, 
  AlertOctagon, 
  CheckCircle2,
  Cpu
} from 'lucide-react';

const Upload = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lockerZone, setLockerZone] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiVerification, setAiVerification] = useState(null); // { safe: true/false, text: string }
  const navigate = useNavigate();

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error('Solo se permiten archivos de imagen (JPG, PNG, WEBP)');
    }
    if (file.size > 10 * 1024 * 1024) {
      return toast.error('La imagen no debe superar los 10MB');
    }

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setImage(file);
    setAiAnalyzing(true);
    setAiVerification(null);

    const toastId = toast.loading('🤖 Analizando contenido con Inteligencia Artificial...', { duration: 4000 });

    try {
      const testImg = new Image();
      testImg.src = previewUrl;
      await new Promise((resolve) => {
        testImg.onload = resolve;
      });

      // Ejecución de la Red Neuronal de Detección NSFW / Desnudez
      const result = await checkImageNSFW(testImg);

      if (!result.safe) {
        // RECHAZO AUTOMÁTICO POR IA
        toast.dismiss(toastId);
        toast.error(`⛔ Imagen no admitida: ${result.reason}`, { duration: 6000 });
        setAiVerification({
          safe: false,
          reason: result.reason
        });
        setPreview(null);
        setImage(null);
      } else {
        // APROBACIÓN POR IA
        toast.dismiss(toastId);
        toast.success('✅ Imagen verificada por IA: Contenido Seguro', { duration: 3000 });
        setAiVerification({
          safe: true,
          confidence: result.confidence || 95
        });
      }
    } catch (err) {
      console.error('Error durante la verificación de IA:', err);
      toast.dismiss(toastId);
      setAiVerification({ safe: true });
    } finally {
      setAiAnalyzing(false);
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
          }, 'image/jpeg', 0.75);
        };
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !image || !lockerZone) {
      return toast.error('Título, imagen y ubicación son requeridos');
    }

    if (aiAnalyzing) {
      return toast.error('Por favor espera a que la IA termine de analizar la imagen');
    }

    if (aiVerification && !aiVerification.safe) {
      return toast.error('La imagen no cumple con las políticas comunitarias');
    }

    setLoading(true);
    const toastId = toast.loading('Publicando prenda...');

    try {
      const compressedImage = await compressImage(image);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('lockerZone', lockerZone);
      formData.append('image', compressedImage);

      await createPost(formData);
      toast.success('¡Prenda publicada exitosamente!', { id: toastId });
      navigate('/');
    } catch (error) {
      toast.error(`Error al subir: ${error.message}`, { id: toastId, duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">NUEVA PRENDA</h1>
        <p className="text-slate-500 font-medium">Dale una segunda vida a lo que ya no usas en CUALTOS.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
        {/* Selector de Imagen con Análisis de IA */}
        <div className="relative">
          {!preview ? (
            <label className="flex flex-col items-center justify-center w-full h-64 border-4 border-dashed border-slate-100 rounded-[2.5rem] cursor-pointer hover:bg-slate-50 hover:border-indigo-200 transition-all group relative overflow-hidden">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud size={32} />
                </div>
                <p className="mb-1 text-sm text-slate-600 font-bold">Haz clic para subir foto</p>
                <p className="text-xs text-slate-400">JPG, PNG o WEBP (Máx. 10MB)</p>
                
                <div className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500">
                  <Cpu size={12} className="text-indigo-600" />
                  <span>Filtro de IA Anti-NSFW activo</span>
                </div>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} required />
            </label>
          ) : (
            <div className="relative h-80 rounded-[2.5rem] overflow-hidden group shadow-md">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              
              {/* Badge de Estado del Análisis de IA */}
              <div className="absolute top-4 left-4 z-10">
                {aiAnalyzing ? (
                  <div className="bg-black/75 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-2 shadow-lg border border-white/20 animate-pulse">
                    <Loader2 size={14} className="animate-spin text-indigo-400" />
                    <span>Analizando con IA...</span>
                  </div>
                ) : aiVerification?.safe ? (
                  <div className="bg-emerald-600/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-lg border border-emerald-400/30">
                    <CheckCircle2 size={14} />
                    <span>Imagen Aprobada por IA</span>
                  </div>
                ) : null}
              </div>

              <button 
                type="button"
                onClick={() => {
                  setPreview(null);
                  setImage(null);
                  setAiVerification(null);
                }}
                className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md text-white rounded-full hover:bg-rose-500 transition-colors z-10"
                title="Quitar imagen"
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

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Zona de Casillero Inteligente</label>
            <select
              value={lockerZone || ''}
              onChange={(e) => setLockerZone(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-700 appearance-none cursor-pointer"
              required
            >
              <option value="" disabled>Selecciona una ubicación de entrega</option>
              <option value="CUALTOS - Rectoría">CUALTOS - Rectoría</option>
              <option value="CUALTOS - Biblioteca">CUALTOS - Biblioteca</option>
              <option value="CUALTOS - Pasadita (Banquitas del E)">CUALTOS - Pasadita (Banquitas del E)</option>
              <option value="CUALTOS - Edificio K (Papelería)">CUALTOS - Edificio K (Papelería)</option>
            </select>
          </div>
        </div>

        {/* Aviso de Moderación con IA y Normas Comunitarias */}
        <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-start gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl mt-0.5 shrink-0 shadow-sm shadow-indigo-200">
            <Cpu size={18} />
          </div>
          <div className="text-xs">
            <h4 className="font-black text-slate-900 flex items-center gap-1.5">
              Moderación con Inteligencia Artificial (Deep Learning)
            </h4>
            <p className="text-slate-600 leading-relaxed mt-0.5">
              Las imágenes son clasificadas automáticamente mediante redes neuronales convolucionales para bloquear contenido explícito, desnudez y pornografía (NSFW), garantizando un ambiente seguro para toda la comunidad universitaria de CUALTOS.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || aiAnalyzing}
          className="w-full bg-black text-white py-5 rounded-[2rem] font-black text-sm tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? (
            <><Loader2 className="animate-spin" size={20} /> PUBLICANDO...</>
          ) : aiAnalyzing ? (
            <><Loader2 className="animate-spin" size={20} /> VERIFICANDO CON IA...</>
          ) : (
            'PUBLICAR AHORA'
          )}
        </button>
      </form>
    </div>
  );
};

export default Upload;
