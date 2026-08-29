import React, { useEffect } from 'react';
import { X, Heart, MessageCircle, ArrowLeftRight, Box, MapPin, Calendar, Volume2, Sparkles } from 'lucide-react';
import Avatar from './Avatar';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { getOrCreateConversation } from '../services/api';
import { useAccessibility } from '../context/AccessibilityContext';
import toast from 'react-hot-toast';

const ArticleDetailModal = ({ isOpen, onClose, post, isLiked, likes, onToggleLike, onOpenExchange }) => {
  const navigate = useNavigate();
  const { openReader } = useAccessibility();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  const formatDate = (dateVal) => {
    if (!dateVal) return 'Reciente';
    if (typeof dateVal?.toDate === 'function') {
      return dateVal.toDate().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (dateVal?.seconds || dateVal?._seconds) {
      const sec = dateVal.seconds || dateVal._seconds;
      return new Date(sec * 1000).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    try {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    } catch {
      // fallback
    }
    return 'Reciente';
  };

  const handleMessageUser = async () => {
    const authorId = post.authorId || post.userId;
    if (auth.currentUser?.uid === authorId) {
      return toast.error('Esta es tu propia prenda');
    }
    try {
      const conv = await getOrCreateConversation(authorId);
      onClose();
      navigate(`/chat/${conv.id}`, { 
        state: { 
          otherUser: { 
            uid: authorId, 
            displayName: post.authorName || 'Usuario' 
          } 
        } 
      });
    } catch (error) {
      toast.error('Error al iniciar conversación');
    }
  };

  const authorId = post.authorId || post.userId;
  const isOwner = auth.currentUser?.uid === authorId;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-[100] animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-[2.5rem] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 z-20 p-2.5 bg-white/90 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-full shadow-md backdrop-blur-md transition-all active:scale-95"
          title="Cerrar"
        >
          <X size={20} />
        </button>

        {/* Contenido scrolleable del modal */}
        <div className="overflow-y-auto flex-grow grid grid-cols-1 md:grid-cols-2">
          
          {/* Columna Izquierda: Fotografía de la Prenda */}
          <div className="bg-slate-900 flex flex-col justify-between p-4 sm:p-6 relative min-h-[350px] md:min-h-[480px]">
            
            {/* Header flotante con Like */}
            <div className="flex items-center justify-end z-10 mb-3">
              <button 
                onClick={onToggleLike}
                className={`p-3 rounded-full backdrop-blur-md shadow-lg transition-all ${
                  isLiked ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title="Me gusta"
              >
                <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Imagen Principal */}
            <div className="relative flex-grow flex items-center justify-center rounded-2xl overflow-hidden bg-slate-950/40 p-2">
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="max-h-[400px] w-auto max-w-full object-contain rounded-2xl shadow-xl transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>

            {/* Pie de foto: Ubicación y Likes */}
            <div className="mt-3 flex items-center justify-between text-slate-400 text-xs">
              <span className="flex items-center gap-1.5 font-bold">
                <Box size={14} className="text-indigo-400" />
                {post.lockerZone || 'CUALTOS - General'}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Heart size={12} className="text-rose-500 fill-rose-500" /> {likes} me gusta
              </span>
            </div>
          </div>

          {/* Columna Derecha: Información de Prenda y Autor */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Categoría / Zona */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-1.5 border border-indigo-100">
                    <MapPin size={11} /> {post.lockerZone || 'CUALTOS'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Calendar size={11} /> {formatDate(post.createdAt)}
                  </span>
                </div>

                {/* Botón Lector Inmersivo */}
                <button
                  onClick={() => {
                    onClose();
                    openReader(post);
                  }}
                  className="p-1.5 px-3 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-[10px] flex items-center gap-1.5 transition-all active:scale-95 border border-indigo-100 shadow-sm"
                  title="Abrir en Lector Inmersivo con voz accesible"
                >
                  <Volume2 size={13} />
                  <span>Escuchar (Lector)</span>
                </button>
              </div>

              {/* Título */}
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
                {post.title}
              </h2>

              {/* Descripción */}
              <div className="mb-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Descripción</h4>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {post.description || 'El usuario no proporcionó una descripción adicional para esta prenda.'}
                </p>
              </div>

              {/* Punto de Entrega e Info de Casillero */}
              <div className="bg-indigo-50/70 border border-indigo-100/80 rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl mt-0.5">
                    <Box size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Punto de Entrega Inteligente</h4>
                    <p className="text-indigo-900 font-bold text-sm">{post.lockerZone || 'CUALTOS - Rectoría'}</p>
                    <p className="text-indigo-700/80 text-[11px] mt-0.5 font-medium">Intercambio seguro y anónimo mediante casillero con código QR.</p>
                  </div>
                </div>
              </div>

              {/* Detalles del Autor / Estudiante */}
              <div className="border-t border-slate-100 pt-5 mb-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Publicado por</h4>
                <div className="flex items-center justify-between bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <Avatar src={post.authorPhotoURL} alt={post.authorName} size="md" />
                    <div>
                      <h4 className="text-sm font-black text-slate-800">{post.authorName || 'Estudiante CUALTOS'}</h4>
                      <p className="text-xs font-medium text-slate-500">{post.authorEmail || 'Comunidad CUALTOS'}</p>
                    </div>
                  </div>

                  {!isOwner && (
                    <button
                      onClick={handleMessageUser}
                      className="p-2.5 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm border border-slate-200/70 font-bold text-xs flex items-center gap-1.5"
                      title="Enviar mensaje directo"
                    >
                      <MessageCircle size={16} />
                      <span className="hidden sm:inline">Mensaje</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones Finales (Botón de Intercambio) */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              {!isOwner ? (
                <>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenExchange();
                    }}
                    className="flex-1 bg-indigo-600 text-white py-4 px-6 rounded-2xl font-black text-sm tracking-wide hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2.5"
                  >
                    <ArrowLeftRight size={18} />
                    PROMOVER INTERCAMBIO
                  </button>
                  <button
                    onClick={handleMessageUser}
                    className="sm:hidden w-full bg-slate-100 text-slate-700 py-3.5 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={16} />
                    Contactar Vendedor
                  </button>
                </>
              ) : (
                <div className="w-full text-center py-3 bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs">
                  Esta es tu publicación activa
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default ArticleDetailModal;
