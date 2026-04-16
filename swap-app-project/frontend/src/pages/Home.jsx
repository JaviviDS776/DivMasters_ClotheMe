import React, { useState, useEffect } from 'react';
import { getPosts, toggleLike, addComment, getComments } from '../services/api';
import toast from 'react-hot-toast';
import { auth } from '../firebase';

const PostCard = ({ post }) => {
  const [likes, setLikes] = useState(post.likesCount || 0);
  const [isLiked, setIsLiked] = useState(false); // Podríamos chequear esto si el backend lo devuelve
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const handleLike = async () => {
    try {
      const result = await toggleLike(post.id);
      setIsLiked(result.liked);
      setLikes(prev => result.liked ? prev + 1 : prev - 1);
    } catch (error) {
      toast.error('Error al dar like');
    }
  };

  const fetchComments = async () => {
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
      setComments([...comments, { ...comment, id: Date.now() }]); // Optimistic update
      setNewComment('');
      toast.success('Comentario añadido');
    } catch (error) {
      toast.error('Error al añadir comentario');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden max-w-2xl mx-auto transition-all hover:border-gray-300">
      {/* Header */}
      <div className="px-4 py-3 flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
          {post.authorName?.charAt(0) || 'U'}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{post.authorName}</p>
          <p className="text-xs text-gray-500">{post.authorEmail}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        <h2 className="text-xl font-bold text-gray-900 mb-1">{post.title}</h2>
        <p className="text-gray-700 text-sm whitespace-pre-wrap">{post.description}</p>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="bg-gray-100">
          <img src={post.imageUrl} alt={post.title} className="w-full max-h-[500px] object-contain mx-auto" />
        </div>
      )}

      {/* Actions (Reddit style) */}
      <div className="px-4 py-2 flex items-center space-x-6 border-t border-gray-50">
        <button 
          onClick={handleLike}
          className={`flex items-center space-x-1 font-medium transition-colors ${isLiked ? 'text-orange-600' : 'text-gray-500 hover:bg-gray-100 p-1 rounded'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span>{likes} Upvotes</span>
        </button>

        <button 
          onClick={fetchComments}
          className="flex items-center space-x-1 text-gray-500 font-medium hover:bg-gray-100 p-1 rounded transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{post.commentsCount || 0} Comentarios</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 animate-fadeIn">
          {loadingComments ? (
            <p className="text-center text-gray-500 text-sm py-4">Cargando comentarios...</p>
          ) : (
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-2">No hay comentarios aún.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-gray-800">{comment.userName}</span>
                      <span className="text-[10px] text-gray-400">{new Date(comment.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-700 bg-white p-2 rounded-lg shadow-sm">{comment.content}</p>
                  </div>
                ))
              )}

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="flex items-center space-x-2 mt-4">
                <input 
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button 
                  type="submit"
                  disabled={!newComment.trim()}
                  className="bg-blue-600 text-white p-2 rounded-full disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
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
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Feed Universitario</h1>
        <button 
          onClick={() => window.location.href='/upload'}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          + Nueva Prenda
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">No hay prendas publicadas todavía.</p>
          <p className="text-gray-400 text-sm mt-2">¡Sé el primero en compartir algo!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
