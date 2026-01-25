# **Clothe Me! (Nombre provicional)**

Plataforma desarrollada por:

<table align="center">
  <tr>
    <td align="center" >
        <a href="https://github.com/LeMunioz">
            <img src="https://avatars.githubusercontent.com/LeMunioz" width="70" style="border-radius:50%" />
        </a>
        <br/>
        <img src="https://img.shields.io/github/followers/LeMunioz?label=Followers&style=flat-square&logo=github" />
        <img src="https://img.shields.io/github/stars/LeMunioz?affiliations=OWNER&style=flat-square&logo=github" />
    </td>
    <td align="center">
        <a href="https://github.com/JaviviDS776">
            <img src="https://avatars.githubusercontent.com/JaviviDS776" width="70" style="border-radius:50%" />
        </a>
        <br/>
        <img src="https://img.shields.io/github/followers/JaviviDS776?label=Followers&style=flat-square&logo=github" />
        <img src="https://img.shields.io/github/stars/JaviviDS776?affiliations=OWNER&style=flat-square&logo=github" />
    </td>
  </tr>
</table>

> **Plataforma de intercambio de ropa exclusiva para estudiantes UDG, integrada con casilleros inteligentes.**

![Status](https://img.shields.io/badge/Status-En_Desarrollo-yellow)
![Stack](https://img.shields.io/badge/Stack-MERN_%2B_Firebase-blue)
![IoT](https://img.shields.io/badge/IoT-ESP32-green)

## **Descripción**

**ClotheMe** es una aplicación Web Progresiva (PWA) diseñada para facilitar el intercambio de prendas entre estudiantes de la Universidad de Guadalajara. Soluciona el problema de seguridad y logística en los intercambios mediante el uso de **Casilleros Inteligentes (IoT)**.

**El sistema permite:**
1.  Validar identidad institucional (correos `@alumnos.udg.mx`).
2.  Publicar prendas y recibir solicitudes.
3.  Gestionar la entrega física mediante casilleros que se abren con **Códigos QR dinámicos**.



## **Stack Tecnológico**

### Frontend (Cliente)
* **Core:** React + Vite.
* **Estilos:** Tailwind CSS.
* **PWA:** `vite-plugin-pwa`.
* **Navegación:** React Router Dom.
* **Utilidades:** `react-hot-toast`, `lucide-react`, `react-qr-code`.

### Backend (API & Lógica)
* **Servidor:** Node.js + Express.
* **Seguridad:** Middleware de verificación de Token.
* **Despliegue:** Vercel (Serverless functions).

### Base de Datos & Nube (Firebase)
* **Auth:** Google Sign-In (Restringido a dominio UDG).
* **Firestore:** Base de datos NoSQL para usuarios, posts e intercambios.
* **Realtime Database:** Comunicación de baja latencia con el IoT.
* **Storage:** Almacenamiento de fotos de prendas.

### IoT (Casillero Inteligente)
* **Controlador:** ESP32.
* **Sensores:** Celda de Carga (HX711) para detectar prendas.
* **Actuadores:** Cerradura Solenoide / Relé.
* **Protocolo:** Firebase Client (WiFi).

---

## **Instalación y Configuración**

Este proyecto es un Monorepo (Frontend y Backend en el mismo lugar).

### Prerrequisitos
* Node.js (v18 o superior).
* Cuenta de Firebase activa.
* Git.

### 1. Clonar el repositorio
```bash
git clone [https://github.com/tu-usuario/swap-app.git](https://github.com/tu-usuario/swap-app.git)
cd swap-app
```

### 2. Configurar Backend
```Bash
cd backend
npm install
```

**Variables de Entorno:** Crea un archivo .env en la carpeta backend/ con lo siguiente:

```Properties
PORT=3000
FIREBASE_DB_URL=[https://tu-proyecto-rtdb.firebaseio.com/](https://tu-proyecto-rtdb.firebaseio.com/)
```
**Llave de Servicio:** Coloca tu archivo serviceAccountKey.json de Firebase Admin SDK en backend/. Asegúrate de que esté en .gitignore.


### 3. Configurar Frontend
```Bash
cd ../frontend
npm install
```
**Variables de Entorno:** Crea un archivo .env en la carpeta frontend/ con tus credenciales públicas de Firebase:

```Properties
VITE_API_KEY=AIzaSy...
VITE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_PROJECT_ID=tu-proyecto
VITE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
VITE_MESSAGING_SENDER_ID=123456...
VITE_APP_ID=1:12345...
VITE_API_URL=http://localhost:3000 # O tu URL de Vercel en producción
```
**Ejecución Local:**
Necesitarás dos terminales abiertas.

Terminal 1 (Backend):

```Bash
cd backend
npm run dev
# Corre en http://localhost:3000
```
Terminal 2 (Frontend):

```Bash
cd frontend
npm run dev
# Corre en http://localhost:5173
```
## Seguridad Implementada
- **Validación de Dominio:** El Frontend expulsa y borra usuarios que no sean @alumnos.udg.mx.

- **Firestore Rules:** Reglas estrictas que impiden escrituras de usuarios no verificados o intentos de modificar perfiles ajenos.

- **Middleware API:** El Backend verifica cada petición con admin.auth().verifyIdToken(). Sin un JWT válido de Google, el servidor rechaza la conexión.

- **CORS:** Configurado para aceptar peticiones solo del dominio del Frontend.

## Lógica del Casillero (IoT)
El sistema embebido (ESP32) opera como una máquina de estados conectada a Firebase Realtime Database:

> Flujo de trabajo a considerar 

**Asignación:** La App escribe en /lockers/{id} reservando el espacio.

**Entrega (Usuario A):**

- Escanea QR -> App valida -> Backend envía comando OPEN_A.

- Sensor de peso detecta objeto -> Estado cambia a WAITING_FOR_B.

**Recolección/Entrega (Usuario B):**

- Escanea QR -> Backend envía OPEN_B.

- Sensor detecta cambio de peso -> Estado cambia a COMPLETED.