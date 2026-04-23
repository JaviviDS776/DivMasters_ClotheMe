import { auth } from '../firebase';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

export const getMyPosts = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/posts/my-posts`, { headers });
  if (!response.ok) throw new Error('Error al obtener tus prendas');
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
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al crear post');
  }
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

// --- EXCHANGES ---

export const proposeExchange = async (exchangeData) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/exchanges`, {
    method: 'POST',
    headers,
    body: JSON.stringify(exchangeData)
  });
  if (!response.ok) throw new Error('Error al proponer intercambio');
  return await response.json();
};

export const getExchanges = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/exchanges`, { headers });
  if (!response.ok) throw new Error('Error al obtener intercambios');
  return await response.json();
};

export const updateExchangeStatus = async (exchangeId, status) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/exchanges/${exchangeId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error('Error al actualizar intercambio');
  return await response.json();
};

export const adminUpdateExchangeStatus = async (exchangeId, status) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/exchanges/admin/${exchangeId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error('Error en modo admin');
  return await response.json();
};

// --- LOCKER ---
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

// --- USERS & FRIENDS ---

export const getUserProfile = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/users/profile`, { headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Detalles del error del servidor:", errorData);
    throw new Error(errorData.details || 'Error al obtener perfil');
  }
  return await response.json();
};

export const updateUserProfile = async (profileData) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/users/profile`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(profileData)
  });
  if (!response.ok) throw new Error('Error al actualizar perfil');
  return await response.json();
};

export const getAllUsers = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/users/all`, { headers });
  if (!response.ok) throw new Error('Error al obtener todos los usuarios');
  return await response.json();
};

export const searchUsers = async (query) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/users/search?q=${query}`, { headers });
  if (!response.ok) throw new Error('Error al buscar usuarios');
  return await response.json();
};

export const getFriends = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/users/friends`, { headers });
  if (!response.ok) throw new Error('Error al obtener amigos');
  return await response.json();
};

export const addFriend = async (friendId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/users/friends`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ friendId })
  });
  if (!response.ok) throw new Error('Error al añadir amigo');
  return await response.json();
};

export const getUserById = async (userId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/users/${userId}`, { headers });
  if (!response.ok) throw new Error('Error al obtener usuario');
  return await response.json();
};

// --- CHAT ---

export const getConversations = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/chat/conversations`, { headers });
  if (!response.ok) throw new Error('Error al obtener conversaciones');
  return await response.json();
};

export const getOrCreateConversation = async (otherUserId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/chat/conversation`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ otherUserId })
  });
  if (!response.ok) throw new Error('Error al iniciar conversación');
  return await response.json();
};

export const getMessages = async (conversationId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/chat/messages/${conversationId}`, { headers });
  if (!response.ok) throw new Error('Error al obtener mensajes');
  return await response.json();
};

export const sendMessage = async (messageData) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/chat/message`, {
    method: 'POST',
    headers,
    body: JSON.stringify(messageData)
  });
  if (!response.ok) throw new Error('Error al enviar mensaje');
  return await response.json();
};
