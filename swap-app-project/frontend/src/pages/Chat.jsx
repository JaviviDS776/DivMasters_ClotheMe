import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { sendMessage, getUserById } from '../services/api';
import toast from 'react-hot-toast';

const Chat = () => {
  const { conversationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(location.state?.initialMessage || '');
  const [otherUser, setOtherUser] = useState(location.state?.otherUser || null);
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Escuchar mensajes en tiempo real vía Firestore (onSnapshot)
  useEffect(() => {
    if (!conversationId) return;

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
      setLoading(false);
      
      // Intentar identificar al otro usuario si no lo tenemos
      if (!otherUser && msgs.length > 0) {
        const otherId = msgs.find(m => m.senderId !== auth.currentUser?.uid)?.senderId;
        if (otherId) {
          getUserById(otherId).then(setOtherUser).catch(console.error);
        }
      }
    }, (error) => {
      console.error("Error en onSnapshot:", error);
      toast.error("Error al recibir mensajes en tiempo real");
    });

    return () => unsubscribe();
  }, [conversationId]);

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const textToSend = newMessage;
    setNewMessage(''); // Limpiar rápido para mejor UX

    try {
      // Usamos el endpoint REST que ya creamos (que guarda en Firestore)
      await sendMessage({
        conversationId,
        text: textToSend,
        receiverId: otherUser?.uid || ''
      });
      // No necesitamos emitir por socket ni añadirlo manualmente al estado
      // porque onSnapshot detectará el nuevo documento en Firestore y lo pintará
    } catch (error) {
      toast.error('Error al enviar mensaje');
      setNewMessage(textToSend); // Devolver el texto si falló
    }
  };

  if (loading && messages.length === 0) {
    return <div className="p-8 text-center">Cargando chat...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto h-[85vh] flex flex-col bg-white shadow-xl rounded-2xl overflow-hidden mt-2 border border-gray-100">
      {/* Header del Chat */}
      <div className="p-4 bg-white border-b flex items-center gap-3">
        <button onClick={() => navigate('/chats')} className="p-2 hover:bg-gray-100 rounded-full md:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {otherUser?.photoURL ? (
          <img src={otherUser.photoURL} alt="" className="w-10 h-10 rounded-full object-cover border" />
        ) : (
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {otherUser?.displayName?.charAt(0).toUpperCase() || '?'}
          </div>
        )}
        
        <div>
          <h2 className="font-bold text-gray-800">{otherUser?.displayName || 'Chat'}</h2>
          <p className="text-[10px] text-green-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> En línea
          </p>
        </div>
      </div>
      
      {/* Cuerpo del Chat */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg, index) => {
          const isMe = msg.senderId === auth.currentUser?.uid;
          return (
            <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[75%] p-3 px-4 rounded-2xl text-sm shadow-sm ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                }`}
              >
                {msg.text}
                <div className={`text-[9px] mt-1 opacity-70 ${isMe ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp?.seconds 
                    ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                    : '...'}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input del Chat */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex gap-2 items-center">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..." 
          className="flex-grow bg-gray-100 border-none rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
        />
        <button 
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-blue-500/30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default Chat;
