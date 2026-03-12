import { auth } from '../firebase';

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = async (isFormData = false) => {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

// --- POSTS ---

export const getPosts = async () => {
  const response = await fetch(`${API_URL}/api/posts`);
  if (!response.ok) throw new Error('Error al obtener posts');
  return await response.json();
};

export const createPost = async (postData) => {
  const isFormData = postData instanceof FormData;
  const headers = await getAuthHeaders(isFormData);
  
  const response = await fetch(`${API_URL}/api/posts`, {
    method: 'POST',
    headers,
    body: isFormData ? postData : JSON.stringify(postData)
  });
  if (!response.ok) throw new Error('Error al crear post');
  return await response.json();
};

export const toggleLike = async (postId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
    method: 'POST',
    headers
  });
  if (!response.ok) throw new Error('Error al procesar like');
  return await response.json();
};

export const addComment = async (postId, content) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/posts/${postId}/comment`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content })
  });
  if (!response.ok) throw new Error('Error al añadir comentario');
  return await response.json();
};

export const getComments = async (postId) => {
  const response = await fetch(`${API_URL}/api/posts/${postId}/comments`);
  if (!response.ok) throw new Error('Error al obtener comentarios');
  return await response.json();
};

// --- LOCKER (Existing) ---
export const requestLockerAssignment = async (exchangeId, userB_ID) => {
  const headers = await getAuthHeaders();
  const user = auth.currentUser;
  
  const response = await fetch(`${API_URL}/api/locker/assign`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ 
      exchangeId, 
      userA: user.uid,
      userB: userB_ID 
    })
  });

  if (!response.ok) throw new Error('Error al asignar casillero');
  return await response.json();
};
