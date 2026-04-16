# Plan de Implementación: Perfil Editable y Sistema de Amigos

Este documento detalla los pasos para implementar perfiles de usuario personalizables y una lista de amigos funcional en el proyecto **ClotheMe**.

---

## 1. Análisis de la Arquitectura Actual
- **Frontend:** React + Firebase Auth. Los datos del usuario vienen directamente del objeto de sesión de Firebase.
- **Backend:** Node.js + Express. Ya cuenta con middleware de autenticación (`verifyToken`) y conexión a Firestore via `firebase-admin`.
- **Base de Datos:** Firestore se utilizará para almacenar los datos extendidos del perfil y las relaciones de amistad.

---

## 2. Fase de Backend (API)

### 2.1. Modelo de Datos en Firestore
Se utilizarán dos colecciones principales:
- `users`: Documentos por `uid` con campos: `displayName`, `bio`, `photoURL`, `location`, `preferences`.
- `friendships`: Documentos que relacionan dos `uid` (o un array de `friends` dentro del documento del usuario para simplicidad en este MVP).

### 2.2. Nuevos Endpoints
Crear `src/routes/userRoutes.js` y `src/controllers/userController.js`:
- `GET /api/users/profile`: Obtiene los datos del perfil del usuario autenticado desde Firestore.
- `PUT /api/users/profile`: Actualiza los datos del perfil.
- `GET /api/users/search?q=...`: Busca usuarios por nombre o email para añadir.
- `GET /api/users/friends`: Lista los amigos del usuario.
- `POST /api/users/friends`: Añade un amigo.
- `DELETE /api/users/friends/:friendId`: Elimina un amigo.

---

## 3. Fase de Frontend (Interfaz)

### 3.1. Servicios de API
Actualizar `src/services/api.js` para incluir:
- `getUserProfile()`
- `updateUserProfile(data)`
- `searchUsers(query)`
- `getFriends()`
- `addFriend(friendId)`
- `removeFriend(friendId)`

### 3.2. Componentes y Páginas
1.  **Perfil Editable (`Profile.jsx`):**
    - Estado para alternar entre "Vista" y "Edición".
    - Formulario simple con inputs para nombre, bio y ubicación.
    - Botón de "Guardar" que llame a la API.
2.  **Gestión de Amigos (`FriendsList.jsx`):**
    - Buscador de usuarios.
    - Lista de resultados con botón "Añadir".
    - Lista de amigos actuales con botón "Eliminar".

---

## 4. Diseño y Estética (Minimalismo)
Se aplicará CSS básico únicamente para:
- Diferenciar contenedores (`border: 1px solid`).
- Separar elementos de lista (`margin-bottom`).
- Resaltar botones de acción (colores distintos para añadir/eliminar).
- Estructurar el formulario de edición.

---

## 5. Pasos de Ejecución
1.  **Backend:** Crear controlador y rutas de usuario.
2.  **Backend:** Registrar rutas en `index.js`.
3.  **Frontend:** Implementar funciones en `api.js`.
4.  **Frontend:** Refactorizar `Profile.jsx` para incluir edición.
5.  **Frontend:** Crear sección de amigos en el perfil o nueva página.
6.  **Pruebas:** Verificar flujo completo de añadir/eliminar y persistencia.
