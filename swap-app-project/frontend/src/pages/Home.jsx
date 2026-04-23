import React, { useState, useEffect } from 'react';
import { getPosts, toggleLike, addComment, getComments, getOrCreateConversation, getMyPosts, proposeExchange } from '../services/api';
import toast from 'react-hot-toast';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, ArrowLeftRight, X, Search, Plus } from 'lucide-react';

const ExchangeModal = ({ isOpen, onClose, targetPost }) => {
  const [myPosts, setMyPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) fetchMyPosts();
  }, [isOpen]);

  const fetchMyPosts = async () => {
    try {
      const data = await getMyPosts();
      setMyPosts(data);
    } catch (error) {
      toast.error('Error al cargar tus prendas');
    }
  };

  const handleSubmit = async () => {
    if (!selectedPostId) return toast.error('Selecciona una prenda para ofrecer');
    setLoading(true);
    try {
      await proposeExchange({
        recipientId: targetPost.authorId || targetPost.userId,
        garmentWantedId: targetPost.id,
        garmentOfferedId: selectedPostId
      });
      toast.success('¡Propuesta de intercambio enviada!');
      onClose();
    } catch (error) {
      toast.error('Error al enviar propuesta');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X size={20} className="text-slate-400" />
        </button>
        
        <h2 className="text-2xl font-black mb-2 text-slate-800">Hacer un trato</h2>
        <p className="text-sm text-slate-500 mb-8">Elige una de tus prendas para ofrecer por <span className="text-indigo-600 font-bold">{targetPost.title}</span></p>
        
        <div className="flex-grow overflow-y-auto grid grid-cols-2 gap-4 mb-8 pr-2">
          {myPosts.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 text-sm font-medium">No tienes prendas publicadas</p>
              <button onClick={() => navigate('/upload')} className="text-indigo-600 text-xs font-bold mt-2">¡Subir ahora!</button>
            </div>
          ) : (
            myPosts.map(post => (
              <div 
                key={post.id} 
                onClick={() => setSelectedPostId(post.id)}
                className={`cursor-pointer rounded-3xl overflow-hidden border-4 transition-all duration-300 group ${
                  selectedPostId === post.id ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-slate-100'
                }`}
              >
                <div className="aspect-square relative overflow-hidden">
                  <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={post.title} />
                </div>
                <div className="p-3 bg-white">
                  <p className="text-[10px] font-black uppercase text-slate-800 truncate">{post.title}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all">
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading || myPosts.length === 0}
            className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100 transition-all"
          >
            {loading ? 'Enviando...' : 'Proponer Trato'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PostCard = ({ post }) => {
  const [likes, setLikes] = useState(post.likesCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      const result = await toggleLike(post.id);
      setIsLiked(result.liked);
      setLikes(prev => result.liked ? prev + 1 : prev - 1);
    } catch (error) {
      toast.error('Error al dar like');
    }
  };

  const handleInterest = async (e) => {
    e.stopPropagation();
    const authorId = post.authorId || post.userId;
    if (auth.currentUser.uid === authorId) return toast.error('Es tu propia prenda');

    try {
      const conv = await getOrCreateConversation(authorId);
      navigate(`/chat/${conv.id}`, { state: { otherUser: { uid: authorId, displayName: post.authorName } } });
    } catch (error) {
      toast.error('Error al iniciar chat');
    }
  };

  return (
    <>
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
        <div className="relative aspect-[1/1] bg-slate-100 overflow-hidden">
          <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          
          <button 
            onClick={handleLike}
            className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md shadow-lg transition-all ${
              isLiked ? 'bg-rose-500 text-white' : 'bg-white/80 text-slate-600 hover:bg-white'
            }`}
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
          </button>

          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
             <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter italic">NUEVA PRENDA</p>
          </div>
        </div>

        <div className="p-6 flex flex-col flex-grow">
          <h2 className="text-lg font-black text-slate-800 mb-1 truncate">{post.title}</h2>
          <p className="text-slate-500 text-xs line-clamp-2 mb-6 h-8">{post.description}</p>

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-black">
                {post.authorName?.charAt(0) || 'U'}
              </div>
              <span className="text-[11px] font-bold text-slate-600">{post.authorName}</span>
            </div>
            
            <div className="flex gap-2">
              <button onClick={handleInterest} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                <MessageCircle size={18} />
              </button>
              <button 
                onClick={() => setIsExchangeModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
              >
                <ArrowLeftRight size={14} />
                Canjear
              </button>
            </div>
          </div>
        </div>
      </div>

      <ExchangeModal isOpen={isExchangeModalOpen} onClose={() => setIsExchangeModalOpen(false)} targetPost={post} />
    </>
  );
};

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try {
      const data = await getPosts();
      setPosts(data);
    } catch (error) {
      toast.error('Error al cargar el feed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tightest mb-2 italic">DESCUBRE</h1>
          <p className="text-slate-500 font-medium">Intercambia estilo sin gastar un centavo.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative hidden lg:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar estilo..." className="bg-white border-none rounded-2xl pl-12 pr-6 py-3.5 w-64 shadow-sm focus:ring-4 focus:ring-indigo-500/10 transition-all" />
          </div>
          <button 
            onClick={() => navigate('/upload')}
            className="bg-black text-white px-8 py-3.5 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95 text-sm flex items-center gap-2"
          >
            <Plus size={18} strokeWidth={3} />
            PUBLICAR
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ArrowLeftRight size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-400 font-bold text-xl">Tu armario está esperando</p>
          <p className="text-slate-400 text-sm mt-1">Sé el primero en publicar una prenda hoy.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {posts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
};

export default Home;
