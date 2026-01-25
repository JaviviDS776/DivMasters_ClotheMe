import { auth } from '../firebase';

export const requestLockerAssignment = async (exchangeId, userB_ID) => {
  // 1. Obtener el usuario actual
  const user = auth.currentUser;
  
  if (!user) throw new Error("Usuario no autenticado");

  // 2. ¡MAGIA! Obtener el Token JWT (Firebase lo refresca si es necesario)
  const token = await user.getIdToken();

  // 3. Hacer la petición al Backend con el Token
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/locker/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // AQUÍ VA LA CREDENCIAL:
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ 
      exchangeId, 
      userA: user.uid, // Tu ID
      userB: userB_ID 
    })
  });

  if (!response.ok) throw new Error('Error al asignar casillero');
  
  return await response.json();
};