import { Outlet, Link } from 'react-router-dom';
import { Home, PlusSquare, User } from 'lucide-react';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Aquí se renderizan las páginas hijas (Home, Upload, etc.) */}
      <Outlet />

      {/* Navbar Inferior Fijo */}
      <h1>Barra de navegación</h1>
    </div>
  );
};
export default Layout;