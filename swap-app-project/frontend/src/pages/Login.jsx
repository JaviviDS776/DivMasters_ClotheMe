import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import './login.css'; 

const Login = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email.endsWith('@alumnos.udg.mx')) {
        alert('ERROR: Solo correos @alumnos.udg.mx');
        await signOut(auth);
        try { await deleteUser(user); } catch (e) {}
        return;
      }

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
      }

      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Error en login: ' + error.message);
    }
  };

  return (
    <section className="relative min-h-screen">

      {/* Divs del fondo animado —> login.css */}
      <div className="bg"></div>
      <div className="bg bg2"></div>
      <div className="bg bg3"></div>

      <div className="flex items-center justify-center lg:justify-end min-h-screen lg:pr-12">

        {/* Bandeja del login */}
        <div className="mx-6 px-8 py-10 flex flex-col bg-[#fffBfA] rounded-3xl shadow-xl
                        w-full max-w-sm
                        lg:w-2/5 lg:max-w-lg lg:py-6 lg:px-12">

          {/* Nombre */}
          <div className="flex items-center justify-center mt-8 lg:mt-0">
            <img
              src="/img/Logotipo.png"
              alt="Clothe-Me Logo"
              className="rounded-3xl w-40 h-40 lg:w-36 lg:h-36 bg-slate-300"
            />
          </div>

          {/* Titulo */}
          <h1 className="mt-8 text-center text-5xl font-bold text-[#4B5563]
                         lg:text-5xl lg:mt-6">
            Clothe-Me
          </h1>

          {/* Texto */}
          <p className="mt-4 text-center text-2xl text-[#878d98] pb-6
                        lg:text-lg lg:mt-3 lg:pb-3">
            Una aplicación para intercambio de prendas entre miembros de la universidad
          </p>

          {/* Boton Google */}
          <button
            onClick={handleGoogleLogin}
            className="mt-8 mb-4 py-3 border-2 border-[#e5e5e5] shadow-xl rounded-xl
                       flex items-center justify-center gap-3
                       bg-white text-black text-2xl font-bold
                       hover:bg-gray-50 transition-colors
                       lg:mt-6 lg:mb-0 lg:text-lg"
          >
            <svg aria-label="Google logo" width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
              <g>
                <path d="m0 0H512V512H0" fill="#fff"></path>
                <path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"></path>
                <path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path>
                <path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path>
                <path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path>
              </g>
            </svg>
            Login with Google
          </button>

        </div>
      </div>
    </section>
  );
};

export default Login;
