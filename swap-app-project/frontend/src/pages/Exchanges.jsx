import React, { useState, useEffect } from 'react';
import { getExchanges, updateExchangeStatus, requestLockerAssignment, adminUpdateExchangeStatus } from '../services/api';
import { auth } from '../firebase';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';

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
      toast.success('Modo Admin: Intercambio forzado a Aceptado');
      fetchExchanges();
    } catch (error) {
      toast.error('Error en comando admin');
    }
  };

  const handleLockerRequest = async (exchange) => {
    try {
      const result = await requestLockerAssignment(exchange.id, exchange.requesterId);
      toast.success('¡Casillero asignado!');
      fetchExchanges();
    } catch (error) {
      toast.error('Error al solicitar casillero');
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando intercambios...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-black mb-8 text-gray-900 tracking-tight">Mis Intercambios</h1>

      <div className="space-y-6">
        {exchanges.length === 0 ? (
          <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">No tienes intercambios propuestos aún.</p>
          </div>
        ) : (
          exchanges.map((ex) => {
            const isRequester = ex.requesterId === auth.currentUser?.uid;
            
            return (
              <div key={ex.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 relative">
                {/* Botón Admin Flotante (Solo para pruebas) */}
                <button 
                  onClick={() => handleAdminAccept(ex.id)}
                  className="absolute top-2 right-2 text-[8px] bg-red-100 text-red-600 px-2 py-1 rounded opacity-30 hover:opacity-100 transition-opacity font-bold uppercase"
                >
                  Admin: Force Accept
                </button>

                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Prenda Ofrecida */}
                  <div className="flex-1 text-center">
                    <p className="text-[10px] font-bold uppercase text-blue-600 mb-2">Ofrecida</p>
                    <img 
                      src={ex.garmentOffered.imageUrl} 
                      className="w-32 h-32 mx-auto object-cover rounded-xl mb-2 border" 
                      alt="Ofrecida"
                    />
                    <p className="text-sm font-bold truncate">{ex.garmentOffered.title}</p>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="bg-gray-100 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                  </div>

                  {/* Prenda Deseada */}
                  <div className="flex-1 text-center">
                    <p className="text-[10px] font-bold uppercase text-indigo-600 mb-2">Deseada</p>
                    <img 
                      src={ex.garmentWanted.imageUrl} 
                      className="w-32 h-32 mx-auto object-cover rounded-xl mb-2 border" 
                      alt="Deseada"
                    />
                    <p className="text-sm font-bold truncate">{ex.garmentWanted.title}</p>
                  </div>

                  {/* Estado y Acciones */}
                  <div className="flex-1 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
                    <div className="mb-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ex.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        ex.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        ex.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {ex.status === 'pending' ? 'Pendiente' : 
                         ex.status === 'accepted' ? 'Aceptado' : 
                         ex.status === 'rejected' ? 'Rechazado' : 'En Casillero'}
                      </span>
                    </div>

                    {ex.status === 'pending' && !isRequester && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleStatusUpdate(ex.id, 'accepted')}
                          className="flex-1 bg-black text-white py-2 rounded-lg text-xs font-bold hover:bg-gray-800"
                        >
                          Aceptar
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(ex.id, 'rejected')}
                          className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-xs font-bold hover:bg-gray-200"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}

                    {ex.status === 'accepted' && (
                      <button 
                        onClick={() => handleLockerRequest(ex)}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700"
                      >
                        Solicitar Casillero
                      </button>
                    )}

                    {ex.qrCodes && (
                      <button 
                        onClick={() => setSelectedQR(isRequester ? ex.qrCodes.userA : ex.qrCodes.userB)}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-700"
                      >
                        Ver mi código QR
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de QR */}
      {selectedQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
            <h3 className="text-xl font-bold mb-4">Tu código de intercambio</h3>
            <div className="bg-white p-4 inline-block border-4 border-black rounded-2xl mb-4">
              <QRCode value={selectedQR} size={200} />
            </div>
            <p className="text-sm text-gray-500 mb-6">Muestra este código en el tótem del casillero para completar el intercambio.</p>
            <button 
              onClick={() => setSelectedQR(null)}
              className="w-full bg-black text-white py-3 rounded-xl font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exchanges;
