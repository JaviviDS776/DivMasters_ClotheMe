import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const Locker = () => {
  const { exchangeId } = useParams();
  const [exchangeData, setExchangeData] = useState(null);
  // Asumimos que tienes el ID del usuario actual en un Context
  const currentUserId = "UID_DEL_USUARIO_ACTUAL"; 

  useEffect(() => {
    // Escuchar cambios en tiempo real del intercambio
    const unsub = onSnapshot(doc(db, "exchanges", exchangeId), (doc) => {
      setExchangeData(doc.data());
    });
    return () => unsub();
  }, [exchangeId]);

  if (!exchangeData) return <div className="p-10 text-center">Cargando...</div>;

  // Determinar qué QR mostrar (A o B)
  const isUserA = exchangeData.requesterId === currentUserId;
  const myQrCode = isUserA ? exchangeData.qrCodes.userA : exchangeData.qrCodes.userB;

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
        <h1 className="text-2xl font-bold mb-4 text-primary">Tu Llave Digital</h1>
        <p className="mb-6 text-gray-500">Escanea esto en el casillero {exchangeData.lockerId}</p>
        
        <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-300">
          <QRCode 
            value={myQrCode} 
            size={200}
            level="H" // High error correction
          />
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-secondary uppercase">
            Estado: {exchangeData.status.replace('_', ' ')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Locker;