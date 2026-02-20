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
      
        <div className="mt-10 mx-10 px-16 p-8 rounded-5xl flex flex-col sml-4/5 bg-[#fffBfA] rounded-2xl shadow-xl">

        <div >
            <div className="flex items-center flex justify-center mt-16">
                <img src="../../public/img/Logotipo.png" alt="Logo" width="300" height="300" className="bg-slate-300 inset-shadow-sm inset-shadow-indigo-500 rounded-3xl"/>
            </div>
            <h1 className="mt-24 flex items-center flex justify-center text-8xl font-bold text-[#4B5563] text-[#4B5563] my-auto">Clothe-Me</h1>
        
            <div className="mt-8 flex items-center flex justify-center text-center text-3xl font-bold text-[#878d98] pb-8 ">una aplicación para intercambio de prendas entre miembros de la universidad</div>
        </div>

        <button onClick={handleGoogleLogin} className="py-2 mt-16 mb-10 border-2 border-darkgray shadow-xl rounded-xl flex items-center flex justify-center btn bg-FFFBFA text-4xl text-black border-[#e5e5e5]">
            <svg aria-label="Google logo" width="58" height="58" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g><path d="m0 0H512V512H0" fill="#fff"></path><path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"></path><path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path><path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path><path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path></g></svg>
            <p className="font-sans font-bold">Login with Google</p>
        </button>
    </div>   

    </section>
  );
};

export default Login;