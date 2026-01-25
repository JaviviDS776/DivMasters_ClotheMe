import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // --- VALIDACIÓN UDG ---
      if (!user.email.endsWith('@alumnos.udg.mx')) {
        alert('ERROR: Solo correos @alumnos.udg.mx'); // Alert nativo para pruebas
        await signOut(auth);
        try { await deleteUser(user); } catch (e) {}
        return;
      }

      // Lógica de base de datos
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          username: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          reputation: 0,
          createdAt: serverTimestamp(),
        });
        console.log("Usuario nuevo creado en Firestore");
      }

      navigate('/');

    } catch (error) {
      console.error(error);
      alert('Error en login: ' + error.message);
    }
  };

  return (
    <section>
      <h1>SwapApp (Modo Prueba)</h1>
      <p>Debes iniciar sesión con tu cuenta institucional UDG.</p>
      
      <button onClick={handleGoogleLogin}>
        Iniciar sesión con Google
      </button>
    </section>
  );
};

export default Login;