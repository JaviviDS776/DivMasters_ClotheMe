import React, { useState, useEffect } from 'react';
import { getConversations } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
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
        console.error('Error al cargar chats:', error);
        toast.error('Error al cargar conversaciones');
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const getOtherParticipant = (conv) => {
    const myUid = auth.currentUser?.uid;
    return conv.participantsData?.find(p => p.uid !== myUid) || { displayName: 'Usuario' };
  };

  if (loading) return <div className="p-8 text-center">Cargando chats...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Tus Mensajes</h2>
      </div>
      
      <div className="divide-y divide-gray-100">
        {conversations.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-4xl mb-4">💬</div>
            <p>No tienes conversaciones aún.</p>
            <p className="text-sm">¡Inicia un chat desde el perfil de alguien!</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const other = getOtherParticipant(conv);
            return (
              <div 
                key={conv.id} 
                onClick={() => navigate(`/chat/${conv.id}`, { state: { otherUser: other } })}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center space-x-4"
              >
                {other.photoURL ? (
                  <img src={other.photoURL} alt={other.displayName} className="w-12 h-12 rounded-full object-cover border" />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {other.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="flex-grow">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-gray-900 truncate">
                      {other.displayName}
                    </h3>
                    <span className="text-[10px] text-gray-400">
                      {conv.lastActivity?.seconds 
                        ? new Date(conv.lastActivity.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : 'Reciente'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {conv.lastMessage || 'Haz clic para empezar a chatear'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
