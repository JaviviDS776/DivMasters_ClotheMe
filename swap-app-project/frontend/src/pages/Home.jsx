import React, { useState, useEffect } from 'react';
import { getPosts, toggleLike, addComment, getComments } from '../services/api';
import toast from 'react-hot-toast';
import { auth } from '../firebase';

const PostCard = ({ post }) => {
  const [likes, setLikes] = useState(post.likesCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

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

  const fetchComments = async (e) => {
    e.stopPropagation();
    if (!showComments) {
      setLoadingComments(true);
      try {
        const data = await getComments(post.id);
        setComments(data);
      } catch (error) {
        toast.error('Error al cargar comentarios');
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const comment = await addComment(post.id, newComment);
      setComments([...comments, { ...comment, id: Date.now() }]);
      setNewComment('');
      toast.success('Comentario añadido');
    } catch (error) {
      toast.error('Error al añadir comentario');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-300">
      {/* Image Container - Fixed Aspect Ratio for consistency */}
      <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden group">
        {post.imageUrl ? (
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            Sin imagen
          </div>
        )}
        
        {/* Quick Action Overlay (Like) */}
        <button 
          onClick={handleLike}
          className={`absolute bottom-3 right-3 p-2 rounded-full shadow-md transition-all ${
            isLiked ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-white'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Info Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-bold text-gray-900 line-clamp-1">{post.title}</h2>
          <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-600 rounded-lg shrink-0 ml-2">
            Nuevo
          </span>
        </div>
        
        <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-grow">
          {post.description}
        </p>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">
              {post.authorName?.charAt(0) || 'U'}
            </div>
            <span className="text-xs font-medium text-gray-700 truncate max-w-[80px]">
              {post.authorName}
            </span>
          </div>
          
          <button 
            onClick={fetchComments}
            className="text-xs text-gray-400 hover:text-blue-500 transition-colors flex items-center space-x-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{post.commentsCount || 0}</span>
          </button>
        </div>
      </div>

      {/* Comments Drawer (Minimalist) */}
      {showComments && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 max-h-48 overflow-y-auto">
          {loadingComments ? (
            <p className="text-[10px] text-center text-gray-400">Cargando...</p>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="text-xs">
                  <span className="font-bold text-gray-800 mr-1">{c.userName}:</span>
                  <span className="text-gray-600">{c.content}</span>
                </div>
              ))}
              <form onSubmit={handleAddComment} className="flex mt-2">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Comentar..." 
                  className="w-full text-xs bg-white border border-gray-200 rounded-full px-3 py-1 outline-none focus:border-blue-400"
                />
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">ClotheMe</h1>
          <p className="text-sm text-gray-500 font-medium">Intercambia estilo, crea comunidad.</p>
        </div>
        <button 
          onClick={() => window.location.href='/upload'}
          className="bg-black text-white px-6 py-2.5 rounded-full font-bold hover:bg-gray-800 transition-all shadow-sm active:scale-95 text-sm"
        >
          Publicar prenda
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="mb-4 text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium text-lg">Aún no hay tesoros por aquí</p>
          <button className="mt-2 text-blue-600 font-bold hover:underline">¡Sé el primero!</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
