import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

const Profile = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', bio: '', location: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const profileData = await api.getUserProfile();
      const friendsData = await api.getFriends();
      setProfile(profileData);
      setFriends(friendsData);
      setEditForm({
        displayName: profileData.displayName || '',
        bio: profileData.bio || '',
        location: profileData.location || ''
      });
    } catch (error) {
      console.error("Error cargando perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("¿Seguro que quieres salir?")) {
      await signOut(auth);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.updateUserProfile(editForm);
      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
      alert("Perfil actualizado");
    } catch (error) {
      alert("Error al actualizar");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const results = await api.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Error buscando:", error);
    }
  };

  const handleAddFriend = async (friendId) => {
    try {
      await api.addFriend(friendId);
      alert("¡Amigo añadido!");
      setSearchResults([]);
      setSearchQuery('');
      fetchProfileData(); // Recargar lista
    } catch (error) {
      alert("Error al añadir amigo");
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm("¿Eliminar de amigos?")) return;
    try {
      await api.removeFriend(friendId);
      fetchProfileData();
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  if (loading) return <div>Cargando perfil...</div>;

  return (
    <section style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ borderBottom: '2px solid black' }}>Mi Perfil</h1>

      {/* --- SECCIÓN DATOS PERSONALES --- */}
      <div style={{ border: '1px solid gray', padding: '15px', marginBottom: '20px' }}>
        {!isEditing ? (
          <div>
            {profile?.photoURL && <img src={profile.photoURL} alt="Avatar" width="80" />}
            <p><strong>Nombre:</strong> {profile?.displayName}</p>
            <p><strong>Email:</strong> {profile?.email}</p>
            <p><strong>Bio:</strong> {profile?.bio || 'Sin biografía'}</p>
            <p><strong>Ubicación:</strong> {profile?.location || 'No especificada'}</p>
            <button onClick={() => setIsEditing(true)}>Editar Perfil</button>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile}>
            <h3>Editar Perfil</h3>
            <div>
              <label>Nombre:</label><br />
              <input 
                value={editForm.displayName} 
                onChange={e => setEditForm({...editForm, displayName: e.target.value})}
              />
            </div>
            <div>
              <label>Bio:</label><br />
              <textarea 
                value={editForm.bio} 
                onChange={e => setEditForm({...editForm, bio: e.target.value})}
              />
            </div>
            <div>
              <label>Ubicación:</label><br />
              <input 
                value={editForm.location} 
                onChange={e => setEditForm({...editForm, location: e.target.value})}
              />
            </div>
            <br />
            <button type="submit">Guardar Cambios</button>
            <button type="button" onClick={() => setIsEditing(false)}>Cancelar</button>
          </form>
        )}
      </div>

      {/* --- SECCIÓN BUSCADOR DE AMIGOS --- */}
      <div style={{ border: '1px solid gray', padding: '15px', marginBottom: '20px' }}>
        <h3>Buscar Amigos</h3>
        <form onSubmit={handleSearch}>
          <input 
            placeholder="Buscar por email..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>

        {searchResults.length > 0 && (
          <ul style={{ listStyle: 'none', padding: '10px 0' }}>
            {searchResults.map(u => (
              <li key={u.uid} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: '1px dashed silver', 
                padding: '10px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img 
                    src={u.photoURL || 'https://via.placeholder.com/40'} 
                    alt="Avatar" 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  <div>
                    <strong>{u.displayName}</strong><br />
                    <span style={{ fontSize: '0.8em', color: 'gray' }}>{u.email}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleAddFriend(u.uid)}
                  style={{ backgroundColor: 'lightgreen', padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer' }}
                >
                  Añadir
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* --- SECCIÓN LISTA DE AMIGOS --- */}
      <div style={{ border: '1px solid gray', padding: '15px', marginBottom: '20px' }}>
        <h3>Mis Amigos ({friends.length})</h3>
        {friends.length === 0 ? (
          <p>Aún no tienes amigos añadidos.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {friends.map(f => (
              <li key={f.uid} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '10px', 
                padding: '10px', 
                borderBottom: '1px solid #eee' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img 
                    src={f.photoURL || 'https://via.placeholder.com/40'} 
                    alt="Avatar" 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  <div>
                    <strong>{f.displayName}</strong><br />
                    <span style={{ fontSize: '0.8em', color: 'gray' }}>{f.location || 'Sin ubicación'}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveFriend(f.uid)}
                  style={{ backgroundColor: 'salmon', color: 'white', padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer' }}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button 
        onClick={handleLogout}
        style={{ width: '100%', padding: '10px', marginTop: '20px', cursor: 'pointer' }}
      >
        Cerrar Sesión
      </button>
    </section>
  );
};

export default Profile;
