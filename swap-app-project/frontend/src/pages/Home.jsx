import React, { useState, useEffect, useMemo } from 'react';
import { getPosts, toggleLike, getOrCreateConversation, getMyPosts, proposeExchange } from '../services/api';
import toast from 'react-hot-toast';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { SkeletonPostCard } from '../components/SkeletonCard';
import ArticleDetailModal from '../components/ArticleDetailModal';
import ExchangeProposalModal from '../components/ExchangeProposalModal';
import { useAccessibility } from '../context/AccessibilityContext';
import { Search, Plus, X, Heart, Box, MessageCircle, ArrowLeftRight, Filter, Sparkles, Volume2 } from 'lucide-react';

const ZONES = [
  { id: 'ALL', label: 'Todas las Zonas' },
  { id: 'Rectoría', label: 'Rectoría' },
  { id: 'Biblioteca', label: 'Biblioteca' },
  { id: 'Pasadita', label: 'Pasadita (Banquitas del E)' },
  { id: 'Edificio K', label: 'Edificio K (Papelería)' }
];

const PostCard = ({ post }) => {
  const [likes, setLikes] = useState(post.likesCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { openReader } = useAccessibility();
  const navigate = useNavigate();

  const handleLike = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      const result = await toggleLike(post.id);
      setIsLiked(result.liked);
      setLikes(prev => result.liked ? prev + 1 : prev - 1);
    } catch (error) {
      toast.error('Error al dar like');
    }
  };

  const handleInterest = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const authorId = post.authorId || post.userId;
    if (auth.currentUser?.uid === authorId) return toast.error('Es tu propia prenda');

    try {
      const conv = await getOrCreateConversation(authorId);
      navigate(`/chat/${conv.id}`, { state: { otherUser: { uid: authorId, displayName: post.authorName } } });
    } catch (error) {
      toast.error('Error al iniciar chat');
    }
  };

  const formatShortZone = (zone) => {
    if (!zone) return 'CUALTOS';
    return zone.replace(/^CUALTOS\s*-\s*/i, '');
  };

  return (
    <>
      <div 
        onClick={() => setIsDetailModalOpen(true)}
        className="bg-white rounded-[2rem] border border-slate-100/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_16px_36px_-6px_rgba(79,70,229,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full overflow-hidden group cursor-pointer"
      >
        {/* Contenedor Multimedia de la Prenda */}
        <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            loading="lazy"
          />
          
          {/* Overlay gradiente para contraste de badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

          {/* Badge de Ubicación / Casillero CUALTOS */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 border border-white/60 z-10">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate max-w-[130px]">
              {formatShortZone(post.lockerZone)}
            </span>
          </div>

          {/* Botón Like interactivo */}
          <button 
            onClick={handleLike}
            className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md shadow-md transition-all z-10 active:scale-90 ${
              isLiked 
                ? 'bg-rose-500 text-white shadow-rose-200' 
                : 'bg-white/90 text-slate-600 hover:bg-white hover:text-rose-500'
            }`}
            title="Me gusta"
          >
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
          </button>

          {/* Badge de Likes abajo a la izquierda */}
          <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-white/10 z-10">
            <Heart size={11} className={likes > 0 ? "text-rose-400 fill-rose-400" : "text-white/80"} />
            <span>{likes}</span>
          </div>
        </div>

        {/* Contenido Principal de la Tarjeta */}
        <div className="p-5 flex flex-col flex-grow justify-between">
          <div>
            {/* Cabecera de Autor */}
            <div className="flex items-center gap-2 mb-2.5">
              <Avatar src={post.authorPhotoURL} alt={post.authorName} size="xs" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-slate-700 truncate leading-none">
                  {post.authorName || 'Estudiante CUALTOS'}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Prenda verificada
                </span>
              </div>
            </div>

            {/* Título de la Prenda */}
            <h2 className="text-base font-black text-slate-900 tracking-tight line-clamp-1 group-hover:text-indigo-600 transition-colors mb-1">
              {post.title}
            </h2>

            {/* Descripción */}
            <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-4">
              {post.description || 'Prenda lista para intercambio en casilleros CUALTOS.'}
            </p>
          </div>

          {/* Barra de Acciones Inferior */}
          <div className="pt-3.5 border-t border-slate-100/90 flex items-center justify-between gap-1.5 mt-auto">
            <button 
              onClick={handleInterest}
              className="p-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-xl transition-all border border-slate-100 flex items-center gap-1 text-xs font-bold"
              title="Conversar con el dueño"
            >
              <MessageCircle size={16} />
              <span className="text-[11px] hidden sm:inline">Chat</span>
            </button>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                openReader(post);
              }}
              className="p-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-xl transition-all border border-slate-100 flex items-center gap-1 text-xs font-bold"
              title="Escuchar descripción de la prenda"
            >
              <Volume2 size={16} />
              <span className="text-[11px] hidden sm:inline">Voz</span>
            </button>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExchangeModalOpen(true);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-3.5 rounded-xl font-black text-xs transition-all shadow-md shadow-indigo-100 active:scale-95 tracking-wide"
            >
              <ArrowLeftRight size={14} />
              <span>CANJEAR</span>
            </button>
          </div>
        </div>
      </div>

      <ArticleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        post={post}
        isLiked={isLiked}
        likes={likes}
        onToggleLike={handleLike}
        onOpenExchange={() => setIsExchangeModalOpen(true)}
      />

      <ExchangeProposalModal 
        isOpen={isExchangeModalOpen} 
        onClose={() => setIsExchangeModalOpen(false)} 
        targetPost={post} 
      />
    </>
  );
};

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => { 
    fetchPosts(); 
  }, []);

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

  // Filtrado reactivo en tiempo real
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesQuery = 
        !searchQuery.trim() || 
        post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.authorName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesZone = 
        selectedZone === 'ALL' || 
        (post.lockerZone && post.lockerZone.toLowerCase().includes(selectedZone.toLowerCase()));

      return matchesQuery && matchesZone;
    });
  }, [posts, searchQuery, selectedZone]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles size={12} /> CUALTOS Swap Hub
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tightest mb-2 italic">DESCUBRE</h1>
          <p className="text-slate-500 font-medium">Intercambia estilo sin gastar un centavo con casilleros inteligentes.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar prenda o estilo..." 
              className="bg-white border-none rounded-2xl pl-12 pr-6 py-3.5 w-full sm:w-64 shadow-sm focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-sm text-slate-700" 
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button 
            onClick={() => navigate('/upload')}
            className="bg-black text-white px-7 py-3.5 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95 text-sm flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} strokeWidth={3} />
            PUBLICAR
          </button>
        </div>
      </div>

      {/* Selector de Zonas / Filtros de Campus */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 custom-scrollbar">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider mr-2">
          <Filter size={14} /> Zona:
        </div>
        {ZONES.map(zone => (
          <button
            key={zone.id}
            onClick={() => setSelectedZone(zone.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
              selectedZone === zone.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'
            }`}
          >
            {zone.label}
          </button>
        ))}
      </div>

      {/* Grid de Contenido */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <SkeletonPostCard key={n} />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <ArrowLeftRight size={32} />
          </div>
          <p className="text-slate-700 font-black text-xl mb-1">
            {searchQuery || selectedZone !== 'ALL' ? 'No se encontraron prendas con esos filtros' : 'Tu armario universitario está esperando'}
          </p>
          <p className="text-slate-400 text-sm mt-1 mb-6">
            {searchQuery || selectedZone !== 'ALL' ? 'Prueba cambiando tu término de búsqueda o seleccionando todas las zonas.' : 'Sé el primero en publicar una prenda hoy.'}
          </p>
          {searchQuery || selectedZone !== 'ALL' ? (
            <button 
              onClick={() => { setSearchQuery(''); setSelectedZone('ALL'); }}
              className="bg-slate-100 text-slate-700 px-6 py-3 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all"
            >
              Restablecer Filtros
            </button>
          ) : (
            <button 
              onClick={() => navigate('/upload')}
              className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              Publicar una prenda
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;

