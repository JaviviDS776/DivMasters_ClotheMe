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
      <div className="min-h-screen flex items-center justify-center bg-clothes relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/40 to-white/60 backdrop-blur-sm"></div>

      <div className="relative z-10 w-full max-w-md px-6">

        <div className="bg-white/80 backdrop-blur-xl
                    border border-white/50
                    rounded-3xl 
                    shadow-2xl
                    p-10
                    text-center">

          <div className="flex justify-center mb-6">
            <div className="w-28 h-28 bg-gradient-to-br from-purple-300 to-indigo-300 
                        rounded-2xl flex items-center justify-center
                        shadow-lg">

              <img src="img/Logotipo.png" alt="" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-wide text-gray-900 mb-2">
            CLOTHE-ME
          </h1>

          <p className="text-gray-600 text-sm mb-8 leading-relaxed">
            Intercambia prendas fácilmente y dale nueva vida a tu ropa
          </p>

          <button onClick={handleGoogleLogin} className="glow-btn w-full bg-white 
                        flex items-center justify-center gap-3
                        py-3 rounded-xl
                        shadow-lg
                        border border-gray-200
                        hover:shadow-xl
                        hover:scale-105
                        active:scale-95
                        transition-all duration-300">

            <img 
              src="https://www.svgrepo.com/show/475656/google-color.svg" 
              className="w-5 h-5"
            />

            <span className="text-sm font-medium text-gray-700">
              Continuar con Google
            </span>
          </button>

        </div>

      </div>  
    </div>
    </section>
  );
};

export default Login;