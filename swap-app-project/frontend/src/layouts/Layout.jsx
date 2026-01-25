import { Outlet, Link } from 'react-router-dom';

const Layout = () => {
  return (
    <div>
      {/* Contenido Principal */}
      <main>
        <Outlet />
      </main>

      <hr />

      {/* Navegación inferior (Raw HTML) */}
      <nav>
        <h3>Menú de Navegación</h3>
        <ul>
          <li>
            <Link to="/">[Ir al Inicio]</Link>
          </li>
          <li>
            <Link to="/profile">[Ir al Perfil]</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Layout;