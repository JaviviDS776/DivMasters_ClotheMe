import React from 'react';
import { X, CheckCircle2, AlertTriangle, ArrowLeftRight, Box, QrCode, Check } from 'lucide-react';

const TradeActionModal = ({ isOpen, onClose, onConfirm, type, exchange, loading }) => {
  if (!isOpen || !exchange) return null;

  const isAccept = type === 'accept';
  const isReject = type === 'reject';
  const isLocker = type === 'locker';
  const isSuccessAccepted = type === 'success_accept';

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-[110] animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full shadow-2xl overflow-hidden relative border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        {/* 1. CONFIRMAR ACEPTAR INTERCAMBIO */}
        {isAccept && (
          <div>
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-4">
              <Check size={28} strokeWidth={3} />
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full inline-block mb-2">
              Aprobación de Trueque
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
              ¿Aceptar este intercambio?
            </h2>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Al aceptar, se formalizará el trato y ambos recibirán la opción de solicitar un casillero inteligente en CUALTOS.
            </p>

            {/* Vista Previa de lo que se cambia */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-6 flex items-center justify-between gap-3">
              <div className="text-center flex-1">
                <div className="w-16 h-16 mx-auto rounded-xl overflow-hidden bg-white border border-slate-200 mb-1">
                  <img src={exchange.garmentOffered?.imageUrl} className="w-full h-full object-cover" alt="Recibirás" />
                </div>
                <p className="text-[9px] font-black text-emerald-600 uppercase">Recibirás</p>
                <p className="text-xs font-bold text-slate-800 truncate">{exchange.garmentOffered?.title}</p>
              </div>

              <ArrowLeftRight size={18} className="text-slate-400 shrink-0" />

              <div className="text-center flex-1">
                <div className="w-16 h-16 mx-auto rounded-xl overflow-hidden bg-white border border-slate-200 mb-1">
                  <img src={exchange.garmentWanted?.imageUrl} className="w-full h-full object-cover" alt="Entregarás" />
                </div>
                <p className="text-[9px] font-black text-slate-500 uppercase">Entregarás</p>
                <p className="text-xs font-bold text-slate-800 truncate">{exchange.garmentWanted?.title}</p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 bg-black text-white py-3.5 rounded-2xl font-black text-xs hover:bg-slate-800 transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Aceptando...' : 'SÍ, ACEPTAR'}
              </button>
            </div>
          </div>
        )}

        {/* 2. CONFIRMAR RECHAZAR INTERCAMBIO */}
        {isReject && (
          <div>
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mb-4">
              <AlertTriangle size={26} />
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-3 py-1 rounded-full inline-block mb-2">
              Rechazar Propuesta
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
              ¿Rechazar este trueque?
            </h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              La propuesta para intercambiar <strong>"{exchange.garmentWanted?.title}"</strong> será declinada. Esta acción no se puede deshacer.
            </p>

            {/* Botones */}
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all"
              >
                Volver
              </button>
              <button 
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 bg-rose-600 text-white py-3.5 rounded-2xl font-black text-xs hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Rechazando...' : 'SÍ, RECHAZAR'}
              </button>
            </div>
          </div>
        )}

        {/* 3. CONFIRMAR SOLICITUD DE CASILLERO */}
        {isLocker && (
          <div>
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-4">
              <Box size={28} />
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-block mb-2">
              Casillero Físico CUALTOS
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
              Solicitar Casillero
            </h2>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Se reservarán 2 casilleros inteligentes automáticos y se generarán los códigos QR únicos para que ambos depositen y recojan sus prendas.
            </p>

            <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100 mb-6 text-xs text-indigo-900">
              <p className="font-bold mb-0.5">Procedimiento seguro:</p>
              <ul className="text-[11px] list-disc list-inside space-y-1 text-indigo-800/90">
                <li>Acude al módulo de casilleros de CUALTOS.</li>
                <li>Escanea tu código QR para abrir el compartimiento.</li>
                <li>Deposita tu prenda y cierra la puerta.</li>
              </ul>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-3.5 rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Asignando...' : 'ASIGNAR AHORA'}
              </button>
            </div>
          </div>
        )}

        {/* 4. FEEDBACK DE ÉXITO TRAS ACEPTAR */}
        {isSuccessAccepted && (
          <div className="text-center py-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-100">
              <CheckCircle2 size={36} strokeWidth={2.5} />
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full inline-block mb-2">
              ¡Trato Aceptado!
            </span>
            <h2 className="text-2xl font-black text-slate-900 mb-2">¡Intercambio Confirmado!</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6 leading-relaxed">
              El trueque ha sido aceptado con éxito. Ahora puedes solicitar tu casillero en CUALTOS para generar las llaves QR.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={onConfirm}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs tracking-wider hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2"
              >
                <Box size={16} />
                {loading ? 'Solicitando...' : 'SOLICITAR CASILLERO AHORA'}
              </button>
              <button
                onClick={onClose}
                className="w-full bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all"
              >
                Ver más tarde
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TradeActionModal;
