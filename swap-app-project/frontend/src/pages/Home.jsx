import React from 'react';
import { auth } from '../firebase';
import toast from 'react-hot-toast';

const Home = () => {

  const testConnection = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return alert("No hay usuario");

      const token = await user.getIdToken();
      
      // Asegúrate que esta URL sea la correcta de tu backend
      const response = await fetch('https://swapappbackend.vercel.app/api/ping-protected', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        alert(`ÉXITO BACKEND: ${data.message}`);
      } else {
        alert(`ERROR BACKEND: ${data.error}`);
      }

    } catch (error) {
      console.error(error);
      alert("Error de conexión (Revisa consola)");
    }
  };

  return (
    <section>
      <h1>Feed Principal</h1>
      
      <div style={{ marginBottom: '20px', border: '1px solid black', padding: '10px' }}>
        <h3>Zona de Pruebas</h3>
        <button onClick={testConnection}>
          Ping al Backend
        </button>
      </div>
    </section>
  );
};

export default Home;