import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import toast from 'react-hot-toast';
import { User, MapPin, Mail, LogOut, UserPlus, UserMinus, Search, Edit2, X, Check, Users } from 'lucide-react';

const Profile = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', bio: '', location: '' });
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchProfileData();
    fetchAllUsers();
  }, []);

  const fetchProfileData = async () => {
    try {
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

  const fetchAllUsers = async () => {
    try {
      const users = await api.getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("¿Seguro que quieres cerrar sesión?")) {
      await signOut(auth);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.updateUserProfile(editForm);
      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await api.searchUsers(searchQuery);
      const filtered = results.filter(u => 
        u.uid !== auth.currentUser.uid && 
        !friends.some(f => f.uid === u.uid)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error("Error buscando:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (friendId) => {
    try {
      await api.addFriend(friendId);
      toast.success("¡Amigo añadido!");
      setSearchResults([]);
      setSearchQuery('');
      fetchProfileData();
      fetchAllUsers();
    } catch (error) {
      toast.error("Error al añadir amigo");
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm("¿Eliminar de amigos?")) return;
    try {
      await api.removeFriend(friendId);
      toast.success("Amigo eliminado");
      fetchProfileData();
      fetchAllUsers();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER PERFIL */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-10"></div>
        
        <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="relative">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Avatar" className="w-32 h-32 rounded-[2rem] object-cover border-4 border-white shadow-xl" />
            ) : (
              <div className="w-32 h-32 bg-indigo-100 rounded-[2rem] flex items-center justify-center text-indigo-600 border-4 border-white shadow-xl">
                <User size={48} strokeWidth={1.5} />
              </div>
            )}
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="absolute -bottom-2 -right-2 p-2.5 bg-white text-slate-600 rounded-2xl shadow-lg hover:bg-slate-50 transition-all border border-slate-100"
            >
              {isEditing ? <X size={18} /> : <Edit2 size={18} />}
            </button>
          </div>

          <div className="flex-grow text-center md:text-left mb-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">
              {profile?.displayName || 'Usuario'}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                <Mail size={14} className="text-indigo-500" /> {profile?.email}
              </span>
              {profile?.location && (
                <span className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                  <MapPin size={14} className="text-indigo-500" /> {profile.location}
                </span>
              )}
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-bold text-sm hover:bg-rose-100 transition-all mb-2"
          >
            <LogOut size={16} /> Salir
          </button>
        </div>

        {isEditing && (
          <form onSubmit={handleUpdateProfile} className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-1">Nombre Público</label>
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                value={editForm.displayName} 
                onChange={e => setEditForm({...editForm, displayName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-1">Ubicación</label>
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm"
                value={editForm.location} 
                onChange={e => setEditForm({...editForm, location: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-1">Sobre mí</label>
              <textarea 
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm min-h-[100px]"
                value={editForm.bio} 
                onChange={e => setEditForm({...editForm, bio: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 text-slate-500 font-bold text-sm">Cancelar</button>
              <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2">
                <Check size={18} /> Guardar Cambios
              </button>
            </div>
          </form>
        )}

        {!isEditing && profile?.bio && (
          <div className="mt-8 p-6 bg-slate-50 rounded-3xl">
            <p className="text-slate-600 text-sm italic leading-relaxed">"{profile.bio}"</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA 1: DESCUBRIR (TODOS LOS USUARIOS) */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 ml-2 uppercase italic">
            <Users size={20} className="text-indigo-600" /> Descubrir
          </h2>
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 h-[500px] flex flex-col">
            <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {allUsers.length === 0 ? (
                <div className="text-center py-12">
                   <div className="w-8 h-8 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                </div>
              ) : (
                allUsers.map(u => {
                  const isFriend = friends.some(f => f.uid === u.uid);
                  return (
                    <div key={u.uid} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl hover:bg-indigo-50 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={u.photoURL || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-2xl object-cover" />
                          {u.isOnline && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{u.displayName}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{u.isOnline ? 'En línea' : 'Desconectado'}</p>
                        </div>
                      </div>
                      {!isFriend && (
                        <button 
                          onClick={() => handleAddFriend(u.uid)}
                          className="p-2.5 bg-white text-indigo-600 rounded-xl shadow-sm hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          <UserPlus size={18} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA 2: BUSCAR */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 ml-2 uppercase italic">
            <Search size={20} className="text-indigo-600" /> Buscar
          </h2>
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 h-[500px] flex flex-col">
            <form onSubmit={handleSearch} className="relative mb-6">
              <input 
                placeholder="Email o nombre..." 
                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-medium"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  if(e.target.value.length > 2) handleSearch();
                }}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </form>

            <div className="flex-grow overflow-y-auto space-y-3 pr-2">
              {searching ? (
                <div className="flex justify-center py-12">
                   <div className="w-8 h-8 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(u => (
                  <div key={u.uid} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl hover:bg-indigo-50 transition-all group">
                    <div className="flex items-center gap-3">
                      <img src={u.photoURL || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-2xl object-cover" />
                      <div>
                        <p className="text-sm font-black text-slate-800">{u.displayName}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{u.email}</p>
                      </div>
                    </div>
                    <button onClick={() => handleAddFriend(u.uid)} className="p-2.5 bg-white text-indigo-600 rounded-xl shadow-sm hover:bg-indigo-600 hover:text-white transition-all">
                      <UserPlus size={18} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 flex flex-col items-center opacity-40">
                  <Search size={40} className="text-slate-300 mb-2" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Escribe para buscar</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMNA 3: MIS AMIGOS */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 ml-2 uppercase italic">
            <User size={20} className="text-indigo-600" /> Mis Amigos ({friends.length})
          </h2>
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 h-[500px] flex flex-col">
            <div className="flex-grow overflow-y-auto space-y-3 pr-2">
              {friends.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 opacity-40">
                  <User size={40} className="text-slate-300 mb-2" />
                  <p className="text-slate-400 text-sm font-medium italic">Sin amigos aún</p>
                </div>
              ) : (
                friends.map(f => {
                  const lastActive = f?.lastActive;
                  const now = Date.now();
                  const onlineThreshold = 5 * 60 * 1000;
                  let isOnline = false;
                  if (lastActive) {
                    const lastActiveTime = lastActive._seconds ? lastActive._seconds * 1000 : new Date(lastActive).getTime();
                    isOnline = (now - lastActiveTime) < onlineThreshold;
                  }

                  return (
                    <div key={f.uid} className="flex items-center justify-between p-4 border border-slate-50 rounded-3xl hover:border-indigo-100 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={f.photoURL || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-2xl object-cover" />
                          {isOnline && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{f.displayName}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1">
                            {isOnline ? (
                              <span className="text-green-500 font-bold">En línea</span>
                            ) : (
                              <span className="flex items-center gap-1"><MapPin size={10} /> {f.location || 'Narnia'}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveFriend(f.uid)} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                        <UserMinus size={18} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
