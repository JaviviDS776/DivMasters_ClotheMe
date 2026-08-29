import React, { useState, useEffect } from 'react';
import { getExchanges, updateExchangeStatus, requestLockerAssignment, adminUpdateExchangeStatus } from '../services/api';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { SkeletonExchangeCard } from '../components/SkeletonCard';
import TradeActionModal from '../components/TradeActionModal';
import { Check, X, Box, QrCode, ArrowRightLeft, ShieldAlert, Copy, CheckCheck } from 'lucide-react';

const Exchanges = () => {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: null,
    exchange: null,
    loading: false
  });

  useEffect(() => {
    fetchExchanges();

    // Sincronización en tiempo real vía Firestore onSnapshot
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Escuchar intercambios donde soy solicitante o receptor
    const q1 = query(collection(db, 'exchanges'), where('requesterId', '==', currentUser.uid));
    const q2 = query(collection(db, 'exchanges'), where('recipientId', '==', currentUser.uid));

    const unsub1 = onSnapshot(q1, () => {
      fetchExchanges(false);
    });

    const unsub2 = onSnapshot(q2, () => {
      fetchExchanges(false);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const fetchExchanges = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getExchanges();
      setExchanges(data);
    } catch (error) {
      toast.error('Error al cargar intercambios');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleOpenConfirm = (type, exchange) => {
    setActionModal({
      isOpen: true,
      type,
      exchange,
      loading: false
    });
  };

  const handleConfirmAction = async () => {
    const { type, exchange } = actionModal;
    if (!exchange) return;

    setActionModal(prev => ({ ...prev, loading: true }));

    try {
      if (type === 'accept') {
        await updateExchangeStatus(exchange.id, 'accepted');
        toast.success('¡Intercambio aceptado!');
        fetchExchanges(false);
        setActionModal({
          isOpen: true,
          type: 'success_accept',
          exchange,
          loading: false
        });
        return;
      } 
      
      if (type === 'reject') {
        await updateExchangeStatus(exchange.id, 'rejected');
        toast.success('Intercambio rechazado');
        fetchExchanges(false);
        setActionModal({ isOpen: false, type: null, exchange: null, loading: false });
        return;
      }

      if (type === 'locker' || type === 'success_accept') {
        await requestLockerAssignment(exchange.id, exchange.requesterId);
        toast.success('¡Casillero asignado correctamente!');
        fetchExchanges(false);
        setActionModal({ isOpen: false, type: null, exchange: null, loading: false });
        return;
      }
    } catch (error) {
      toast.error(error.message || 'Error al procesar la acción');
      setActionModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleAdminAccept = async (exchangeId) => {
    try {
      await adminUpdateExchangeStatus(exchangeId, 'accepted');
      toast.success('Admin: Intercambio aceptado');
      fetchExchanges(false);
    } catch (error) {
      toast.error('Error en comando admin');
    }
  };

  const handleCopyCode = () => {
    if (!selectedCode) return;
    navigator.clipboard.writeText(selectedCode);
    setCopied(true);
    toast.success('¡Código copiado al portapapeles!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">TRUEQUES</h1>
        <p className="text-slate-500 font-medium">Gestiona tus intercambios pendientes y el estado de entrega en casilleros.</p>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="space-y-6">
            <SkeletonExchangeCard />
            <SkeletonExchangeCard />
          </div>
        ) : exchanges.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
               <ArrowRightLeft size={24} />
            </div>
            <p className="text-slate-500 font-bold">No tienes propuestas activas por ahora</p>
            <p className="text-slate-400 text-xs mt-1">Explora el feed y propón intercambios a otros compañeros de UDG.</p>
          </div>
        ) : (
          exchanges.map((ex) => {
            const isRequester = ex.requesterId === auth.currentUser?.uid;
            
            return (
              <div key={ex.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative group overflow-hidden">
                {/* Botón Admin Debug */}
                <button 
                  onClick={() => handleAdminAccept(ex.id)}
                  className="absolute top-4 right-4 text-[9px] bg-rose-50 text-rose-500 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all font-black flex items-center gap-1 border border-rose-100"
                  title="Modo depuración de intercambio"
                >
                  <ShieldAlert size={10} /> FORCE ACCEPT (DEBUG)
                </button>

                <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                  {/* Visual del Trueque */}
                  <div className="flex items-center gap-4 md:gap-8 flex-1 w-full justify-center lg:justify-start">
                    <div className="text-center">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-slate-50 shadow-sm mb-3 bg-slate-100">
                        <img src={ex.garmentOffered?.imageUrl} className="w-full h-full object-cover" alt="Tu prenda" />
                      </div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Ofrecida</p>
                    </div>

                    <div className="bg-indigo-50 p-3 rounded-full text-indigo-600 animate-pulse">
                      <ArrowRightLeft size={24} strokeWidth={3} />
                    </div>

                    <div className="text-center">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-indigo-50 shadow-sm mb-3 bg-slate-100">
                        <img src={ex.garmentWanted?.imageUrl} className="w-full h-full object-cover" alt="Deseada" />
                      </div>
                      <p className="text-[10px] font-black uppercase text-indigo-600">Deseada</p>
                    </div>
                  </div>

                  {/* Info y Estado */}
                  <div className="flex-1 w-full flex flex-col md:flex-row lg:flex-col items-center md:justify-between lg:justify-center gap-6">
                    <div className="text-center md:text-left lg:text-center">
                      <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border mb-3 ${
                        ex.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        ex.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        ex.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        ex.status === 'completed' ? 'bg-slate-50 text-slate-600 border-slate-100' :
                        ex.status === 'partially_deposited' ? 'bg-cyan-50 text-cyan-600 border-cyan-100' :
                        'bg-indigo-50 text-indigo-600 border-indigo-100'
                      }`}>
                        {ex.status === 'pending' ? 'Pendiente de Aprobación' : 
                         ex.status === 'accepted' ? 'Aceptado' : 
                         ex.status === 'rejected' ? 'Rechazado' : 
                         ex.status === 'completed' ? 'Completado' : 
                         ex.status === 'partially_deposited' ? 'Depósito en Proceso' :
                         'Listo en Casillero'}
                      </span>
                      <p className="text-slate-800 font-black text-sm">{ex.garmentWanted?.title || 'Prenda'}</p>
                    </div>

                    <div className="flex flex-wrap gap-3 w-full justify-center md:justify-end lg:justify-center">
                      {ex.status === 'pending' && !isRequester && (
                        <>
                          <button 
                            onClick={() => handleOpenConfirm('accept', ex)} 
                            className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                          >
                            <Check size={16} strokeWidth={3} /> ACEPTAR
                          </button>
                          <button 
                            onClick={() => handleOpenConfirm('reject', ex)} 
                            className="flex items-center gap-2 bg-slate-100 text-slate-500 px-6 py-3 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all active:scale-95"
                          >
                            <X size={16} strokeWidth={3} /> RECHAZAR
                          </button>
                        </>
                      )}

                      {ex.status === 'accepted' && (
                        <button 
                          onClick={() => handleOpenConfirm('locker', ex)} 
                          className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                        >
                          <Box size={16} strokeWidth={3} /> SOLICITAR CASILLERO
                        </button>
                      )}

                      {ex.qrCodes && ex.status !== 'completed' && (
                        <button 
                          onClick={() => setSelectedCode(isRequester ? ex.qrCodes.userA : ex.qrCodes.userB)} 
                          className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                        >
                          <QrCode size={16} strokeWidth={2.5} /> VER CÓDIGO QR
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Confirmación y Feedback de Acciones (Aceptar/Rechazar/Casillero) */}
      <TradeActionModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, type: null, exchange: null, loading: false })}
        onConfirm={handleConfirmAction}
        type={actionModal.type}
        exchange={actionModal.exchange}
        loading={actionModal.loading}
      />

      {/* Modal QR Code Visual Mejorado */}
      {selectedCode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-[3rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl relative">
            <h3 className="text-2xl font-black text-slate-800 mb-1">Tu Llave Digital</h3>
            <p className="text-slate-500 text-xs mb-6">Presenta este código QR frente a la cámara del casillero físico en CUALTOS.</p>
            
            {/* Visualizador QR */}
            <div className="bg-white p-5 rounded-3xl border-4 border-slate-100 shadow-inner inline-block mx-auto mb-6">
              <QRCode 
                value={selectedCode} 
                size={180}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 180 180`}
              />
            </div>

            {/* Código Hash Alfanumérico */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl mb-6">
              <span className="text-sm font-black tracking-widest text-indigo-600 font-mono">
                {selectedCode}
              </span>
              <button 
                onClick={handleCopyCode}
                className="p-1.5 bg-white text-slate-600 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                title="Copiar código"
              >
                {copied ? <CheckCheck size={16} className="text-emerald-600" /> : <Copy size={16} />}
              </button>
            </div>

            <button 
              onClick={() => setSelectedCode(null)} 
              className="w-full bg-slate-100 text-slate-700 py-3.5 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all"
            >
              CERRAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exchanges;

