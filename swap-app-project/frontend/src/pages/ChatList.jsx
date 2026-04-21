import React, { useState, useEffect } from 'react';
import { getConversations } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ChatList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations();
        setConversations(data);
      } catch (error) {
        toast.error('Error al cargar conversaciones');
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  if (loading) return <div className="p-8 text-center">Cargando chats...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800">Tus Mensajes</h2>
      </div>
      
      <div className="divide-y divide-gray-100">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No tienes conversaciones aún.
          </div>
        ) : (
          conversations.map((conv) => (
            <div 
              key={conv.id} 
              onClick={() => navigate(`/chat/${conv.id}`)}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center space-x-4"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                {/* Aquí idealmente mostrarías la foto del otro participante */}
                💬
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-gray-900 truncate">
                    Conversación con {conv.participants.length} usuarios
                  </h3>
                  <span className="text-[10px] text-gray-400">
                    {conv.lastActivity?.seconds ? new Date(conv.lastActivity.seconds * 1000).toLocaleDateString() : 'Reciente'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-1">
                  {conv.lastMessage || 'Sin mensajes todavía'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
