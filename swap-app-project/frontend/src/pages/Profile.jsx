import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  const handleLogout = async () => {
    if (window.confirm("¿Seguro que quieres salir?")) {
      await signOut(auth);
    }
  };

  return (
    <section>
      <h1>Perfil de Usuario</h1>

      {/* Información del usuario */}
      <div>
        {user?.photoURL && (
          <img 
            src={user.photoURL} 
            alt="Foto de perfil" 
            width="100" 
            height="100"
          />
        )}
        <p><strong>Nombre:</strong> {user?.displayName}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>UID:</strong> {user?.uid}</p>
      </div>

      <hr />

      {/* Estadísticas simples */}
      <ul>
        <li>Reputación: 0</li>
        <li>Intercambios realizados: 0</li>
      </ul>

      <hr />

      <button onClick={handleLogout}>
        Cerrar Sesión (Logout)
      </button>
    </section>
  );
};

export default Profile;