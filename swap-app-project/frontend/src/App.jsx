import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Importaremos las páginas (crearemos archivos placeholder en el siguiente paso)
import Login from './pages/Login';
import Home from './pages/Home';
import Locker from './pages/Locker';
import Upload from './pages/Upload';
import Layout from './layouts/Layout';

// Componente para proteger rutas (Si no hay usuario, manda a Login)
const ProtectedRoute = ({ children }) => {
  const user = true; // TODO: Conectar con Firebase Auth real
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      {/* Toaster es para las notificaciones bonitas */}
      <Toaster position="top-center" />
      
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas por el Layout (Barra de navegación) */}
        <Route element={<Layout />}>
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          } />
          {/* Ruta dinámica para el casillero */}
          <Route path="/locker/:exchangeId" element={
            <ProtectedRoute>
              <Locker />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;