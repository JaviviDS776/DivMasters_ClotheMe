import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, Check, Sparkles, Box, CheckCircle2, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { getMyPosts, proposeExchange } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ExchangeProposalModal = ({ isOpen, onClose, targetPost }) => {
  const [myPosts, setMyPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [step, setStep] = useState('select'); // 'select' | 'confirm' | 'success'
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSelectedPost(null);
      fetchMyPosts();
    }
  }, [isOpen]);

  const fetchMyPosts = async () => {
    try {
      const data = await getMyPosts();
      setMyPosts(data);
    } catch {
      toast.error('Error al cargar tus prendas');
    }
  };

  const handleSelectPost = (post) => {
    setSelectedPost(post);
    setStep('confirm');
  };

  const handleConfirmExchange = async () => {
    if (!selectedPost || !targetPost) return;
    setLoading(true);
    try {
      await proposeExchange({
        recipientId: targetPost.authorId || targetPost.userId,
        garmentWantedId: targetPost.id,
        garmentOfferedId: selectedPost.id
      });
      setStep('success');
      toast.success('¡Propuesta enviada con éxito!');
    } catch (error) {
      toast.error(error.message || 'Error al proponer intercambio');
      setLoading(false);
    }
  };

  if (!isOpen || !targetPost) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-[110] animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar */}
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 z-20 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        {/* PASO 1: SELECCIONAR PRENDA PROPIA */}
        {step === 'select' && (
          <div className="flex flex-col h-full">
            <div className="mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-flex items-center gap-1 mb-2">
                <Sparkles size={12} /> Paso 1 de 2
              </span>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Elige tu prenda</h2>
              <p className="text-xs text-slate-500 mt-1">
                Selecciona qué prenda deseas ofrecer a cambio de <span className="text-indigo-600 font-bold">"{targetPost.title}"</span>.
              </p>
            </div>

            <div className="flex-grow overflow-y-auto grid grid-cols-2 gap-3.5 mb-6 pr-1 max-h-[50vh]">
              {myPosts.length === 0 ? (
                <div className="col-span-2 text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-6">
                  <Box className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm font-bold">No tienes prendas publicadas</p>
                  <p className="text-slate-400 text-xs mt-1 mb-4">Debes tener al menos una prenda en tu clóset para hacer un trueque.</p>
                  <button 
                    onClick={() => {
                      onClose();
                      navigate('/upload');
                    }} 
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                  >
                    Publicar Prenda Ahora
                  </button>
                </div>
              ) : (
                myPosts.map((post) => (
                  <div 
                    key={post.id} 
                    onClick={() => handleSelectPost(post)}
                    className="cursor-pointer rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-indigo-600 hover:shadow-lg transition-all duration-300 group bg-slate-50"
                  >
                    <div className="aspect-square relative overflow-hidden bg-slate-200">
                      <img 
                        src={post.imageUrl} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={post.title} 
                      />
                    </div>
                    <div className="p-3 bg-white flex items-center justify-between">
                      <p className="text-xs font-black text-slate-800 truncate">{post.title}</p>
                      <ChevronRight size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                    </div>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={onClose} 
              className="w-full bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* PASO 2: POPUP DE CONFIRMACIÓN VISUAL */}
        {step === 'confirm' && selectedPost && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full inline-flex items-center gap-1 mb-2">
                <AlertCircle size={12} /> Confirmación requerida
              </span>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">¿Confirmar Propuesta?</h2>
              <p className="text-xs text-slate-500 mt-1">
                Revisa los detalles del trueque antes de enviar la solicitud al compañero.
              </p>
            </div>

            {/* Comparativa Visual */}
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 mb-5 flex items-center justify-between gap-3">
              {/* Tu Prenda */}
              <div className="flex-1 text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl overflow-hidden border-2 border-indigo-200 shadow-sm mb-2 bg-white">
                  <img src={selectedPost.imageUrl} alt="Tu prenda" className="w-full h-full object-cover" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Tú ofreces</span>
                <p className="text-xs font-bold text-slate-800 truncate mt-1">{selectedPost.title}</p>
              </div>

              {/* Icono de Intercambio Central */}
              <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-200 shrink-0">
                <ArrowLeftRight size={20} />
              </div>

              {/* Prenda Deseada */}
              <div className="flex-1 text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm mb-2 bg-white">
                  <img src={targetPost.imageUrl} alt="Prenda deseada" className="w-full h-full object-cover" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">Recibirás</span>
                <p className="text-xs font-bold text-slate-800 truncate mt-1">{targetPost.title}</p>
              </div>
            </div>

            {/* Aviso informativo */}
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3.5 mb-6 text-indigo-950 text-xs flex items-start gap-2.5">
              <Box size={16} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Intercambio en CUALTOS</p>
                <p className="text-[11px] text-indigo-800/80 mt-0.5">
                  El trueque se realizará de forma segura en casilleros una vez que el dueño acepte la propuesta.
                </p>
              </div>
            </div>

            {/* Botones de Confirmación */}
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setStep('select')}
                className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-all"
              >
                <ArrowLeft size={16} /> Cambiar
              </button>
              <button 
                type="button"
                onClick={handleConfirmExchange}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-3.5 px-6 rounded-2xl font-black text-xs tracking-wider hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? 'ENVIANDO...' : 'SÍ, ENVIAR SOLICITUD'}
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: FEEDBACK DE ÉXITO CELEBRATORIO */}
        {step === 'success' && (
          <div className="text-center py-6 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-100">
              <CheckCircle2 size={36} strokeWidth={2.5} />
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full inline-block mb-2">
              ¡Solicitud Enviada!
            </span>
            <h2 className="text-2xl font-black text-slate-900 mb-2">¡Trueque Solicitado con Éxito!</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6 leading-relaxed">
              Le avisamos a <strong className="text-slate-700">{targetPost.authorName || 'tu compañero'}</strong>. En cuanto acepte, recibirás la notificación para generar tu código QR del casillero.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  onClose();
                  navigate('/exchanges');
                }}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs tracking-wider hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
              >
                VER MIS TRUEQUES
              </button>
              <button
                onClick={onClose}
                className="w-full bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all"
              >
                Seguir Explorando
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ExchangeProposalModal;
