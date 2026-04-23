import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, User, MessageCircle, ArrowLeftRight, PlusSquare, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';

const Layout = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/exchanges', icon: ArrowLeftRight, label: 'Trueques' },
    { path: '/upload', icon: PlusSquare, label: 'Subir' },
    { path: '/chats', icon: MessageCircle, label: 'Chats' },
    { path: '/profile', icon: User, label: 'Perfil' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar para Escritorio */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200">
            C
          </div>
          <h1 className="text-xl font-black tracking-tighter text-slate-800">ClotheMe</h1>
        </div>

        <nav className="flex-grow space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${
                isActive(item.path)
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <item.icon size={20} strokeWidth={isActive(item.path) ? 2.5 : 2} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <button 
            onClick={() => auth.signOut()}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl font-semibold text-rose-500 hover:bg-rose-50 transition-all"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Header móvil */}
      <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-black tracking-tighter text-indigo-600">ClotheMe</h1>
        {user?.photoURL ? (
          <img src={user.photoURL} className="w-8 h-8 rounded-full border border-slate-200" alt="avatar" />
        ) : (
          <div className="w-8 h-8 bg-slate-100 rounded-full border border-slate-200" />
        )}
      </header>

      {/* Contenido Principal */}
      <main className="flex-grow pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
          <Outlet />
        </div>
      </main>

      {/* Tab Bar inferior para Móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50 rounded-t-[2.5rem] shadow-2xl">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 transition-all ${
              isActive(item.path) ? 'text-indigo-600 scale-110' : 'text-slate-400'
            }`}
          >
            <item.icon size={24} strokeWidth={isActive(item.path) ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
