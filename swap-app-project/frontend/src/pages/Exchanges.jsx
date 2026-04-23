import React, { useState, useEffect } from 'react';
import { getExchanges, updateExchangeStatus, requestLockerAssignment, adminUpdateExchangeStatus } from '../services/api';
import { auth } from '../firebase';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { Check, X, Box, QrCode, ArrowRightLeft, ShieldAlert } from 'lucide-react';

const Exchanges = () => {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState(null);

  useEffect(() => {
    fetchExchanges();
  }, []);

  const fetchExchanges = async () => {
    try {
      const data = await getExchanges();
      setExchanges(data);
    } catch (error) {
      toast.error('Error al cargar intercambios');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (exchangeId, status) => {
    try {
      await updateExchangeStatus(exchangeId, status);
      toast.success(`Intercambio ${status === 'accepted' ? 'aceptado' : 'rechazado'}`);
      fetchExchanges();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleAdminAccept = async (exchangeId) => {
    try {
      await adminUpdateExchangeStatus(exchangeId, 'accepted');
      toast.success('Admin: Intercambio aceptado');
      fetchExchanges();
    } catch (error) {
      toast.error('Error en comando admin');
    }
  };

  const handleLockerRequest = async (exchange) => {
    try {
      await requestLockerAssignment(exchange.id, exchange.requesterId);
      toast.success('¡Casillero asignado!');
      fetchExchanges();
    } catch (error) {
      toast.error('Error al solicitar casillero');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">TRUEQUES</h1>
        <p className="text-slate-500 font-medium">Gestiona tus intercambios pendientes y completados.</p>
      </div>

      <div className="grid gap-6">
        {exchanges.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
               <ArrowRightLeft size={24} />
            </div>
            <p className="text-slate-500 font-bold">No hay propuestas por ahora</p>
          </div>
        ) : (
          exchanges.map((ex) => {
            const isRequester = ex.requesterId === auth.currentUser?.uid;
            
            return (
              <div key={ex.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative group overflow-hidden">
                {/* Admin Mode indicator */}
                <button 
                  onClick={() => handleAdminAccept(ex.id)}
                  className="absolute top-4 right-4 text-[9px] bg-rose-50 text-rose-500 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all font-black flex items-center gap-1 border border-rose-100"
                >
                  <ShieldAlert size={10} /> FORCE ACCEPT (DEBUG)
                </button>

                <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                  {/* Visual del Trueque */}
                  <div className="flex items-center gap-4 md:gap-8 flex-1 w-full justify-center lg:justify-start">
                    <div className="text-center">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-slate-50 shadow-sm mb-3">
                        <img src={ex.garmentOffered.imageUrl} className="w-full h-full object-cover" alt="Tu prenda" />
                      </div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Ofrecida</p>
                    </div>

                    <div className="bg-indigo-50 p-3 rounded-full text-indigo-600 animate-pulse">
                      <ArrowRightLeft size={24} strokeWidth={3} />
                    </div>

                    <div className="text-center">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-indigo-50 shadow-sm mb-3">
                        <img src={ex.garmentWanted.imageUrl} className="w-full h-full object-cover" alt="Deseada" />
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
                        'bg-indigo-50 text-indigo-600 border-indigo-100'
                      }`}>
                        {ex.status === 'pending' ? 'Pendiente' : 
                         ex.status === 'accepted' ? 'Aceptado' : 
                         ex.status === 'rejected' ? 'Rechazado' : 'Listo en Casillero'}
                      </span>
                      <p className="text-slate-800 font-black text-sm">{ex.garmentWanted.title}</p>
                    </div>

                    <div className="flex flex-wrap gap-3 w-full justify-center md:justify-end lg:justify-center">
                      {ex.status === 'pending' && !isRequester && (
                        <>
                          <button onClick={() => handleStatusUpdate(ex.id, 'accepted')} className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-slate-800 transition-all shadow-lg">
                            <Check size={16} strokeWidth={3} /> ACEPTAR
                          </button>
                          <button onClick={() => handleStatusUpdate(ex.id, 'rejected')} className="flex items-center gap-2 bg-slate-100 text-slate-500 px-6 py-3 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all">
                            <X size={16} strokeWidth={3} /> RECHAZAR
                          </button>
                        </>
                      )}

                      {ex.status === 'accepted' && (
                        <button onClick={() => handleLockerRequest(ex)} className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                          <Box size={16} strokeWidth={3} /> SOLICITAR CASILLERO
                        </button>
                      )}

                      {ex.qrCodes && (
                        <button onClick={() => setSelectedQR(isRequester ? ex.qrCodes.userA : ex.qrCodes.userB)} className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-slate-800 transition-all shadow-xl">
                          <QrCode size={16} strokeWidth={3} /> VER MI QR
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

      {/* Modal QR mejorado */}
      {selectedQR && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl relative">
            <h3 className="text-2xl font-black text-slate-800 mb-2">Tu Llave Digital</h3>
            <p className="text-slate-500 text-sm mb-8">Escanea esto en el casillero físico para abrirlo.</p>
            
            <div className="bg-white p-6 inline-block border-8 border-slate-50 rounded-[2.5rem] shadow-inner mb-8">
              <QRCode value={selectedQR} size={180} />
            </div>

            <button onClick={() => setSelectedQR(null)} className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-xs hover:bg-slate-200 transition-all">
              CERRAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exchanges;
