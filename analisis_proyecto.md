# Análisis de Proyecto: ClotheMe

Este documento detalla los problemas encontrados durante el análisis técnico del proyecto ClotheMe (Frontend, Backend e IoT) y proporciona soluciones recomendadas para cada uno.

---

## 1. Arquitectura y Despliegue

### 1.1. Incompatibilidad de Socket.io con Vercel
*   **Problema:** El backend utiliza `socket.io` para el chat en tiempo real, pero el proyecto está configurado para desplegarse en **Vercel**. Las Vercel Serverless Functions son sin estado (stateless) y se cierran tras responder la petición; no permiten conexiones WebSocket persistentes.
*   **Solución:** 
    *   **Opción A:** Migrar la lógica del chat a **Firebase Realtime Database** o **Firestore (onSnapshot)**. Estas herramientas manejan la persistencia del socket por ti de forma nativa en entornos serverless.
    *   **Opción B:** Desplegar el backend en un servicio que soporte servidores persistentes como **Render, Railway, Fly.io o un VPS**.

### 1.2. Mantenimiento de Estado en el IoT
*   **Problema:** La lógica del casillero en `lockerController.js` depende de `active_exchanges` en Firebase RTDB. Si el servidor se cae o se reinicia, el flujo del intercambio podría quedar inconsistente si no se sincroniza correctamente con Firestore.
*   **Solución:** Implementar un sistema de "recuperación de estado" donde el ESP32 pueda consultar el estado actual del intercambio al reconectarse, y asegurar que cada paso (depósito/recogida) sea atómico en Firestore y RTDB.

---

## 2. Seguridad

### 2.1. Endpoints de Administración Expuestos
*   **Problema:** Las rutas `/api/locker/seed` y `/api/locker/all` en `lockerRoutes.js` son públicas. Cualquiera puede reiniciar la base de datos de casilleros o ver todos los intercambios activos.
*   **Solución:** Aplicar el middleware `verifyToken` y validar que el usuario tenga un rol de administrador o que la petición incluya una clave secreta de administración.

### 2.2. API Key de IoT Hardcodeada
*   **Problema:** En `lockerController.js`, se define un valor por defecto para `IOT_API_KEY` (`clotheme_secret_iot_token_2024`) en el código.
*   **Solución:** Eliminar el valor por defecto en el código y forzar su lectura desde `process.env`. Si la variable no existe, el servidor debería arrojar un error al iniciar.

### 2.3. Credenciales en Claro en el ESP32
*   **Problema:** El archivo `clotheme-locker-esp32.ino` contiene el SSID, Password y la API Key en texto plano. Si el código se sube a un repositorio público, las credenciales quedan expuestas.
*   **Solución:** Utilizar una librería como **WiFiManager** para configurar el WiFi mediante un portal cautivo, o almacenar las credenciales en la memoria **NVS/Preferences** del ESP32, cifrándolas si es necesario.

### 2.4. Comunicación HTTP No Segura
*   **Problema:** El ESP32 utiliza `HTTPClient` sin SSL (puerto 80). Esto permite que un atacante en la misma red intercepte los QR y la API Key.
*   **Solución:** Implementar **HTTPS** (puerto 443) en el ESP32. Para Vercel, esto es obligatorio. Se debe usar `WiFiClientSecure` y cargar el certificado raíz (Root CA) del servidor.

---

## 3. Calidad de Código y Rendimiento

### 3.1. Búsqueda Lineal de Códigos QR
*   **Problema:** El método `verifyLockerCode` recorre todos los intercambios activos en un bucle `for...in` para encontrar el QR. Esto es $O(n)$ y se volverá lento conforme crezca la plataforma.
*   **Solución:** Indexar los intercambios activos por el hash del código QR en Firebase RTDB. Esto permite obtener el intercambio directamente por su clave sin recorrer toda la lista ($O(1)$).

### 3.2. Dependencias Muertas (Dead Code)
*   **Problema:** El `package.json` del backend incluye `openai` y `sightengine`, pero no se utilizan en la lógica principal de los controladores analizados.
*   **Solución:** Eliminar estas librerías si no hay planes inmediatos de usarlas para reducir la superficie de ataque y el peso de la instalación.

### 3.3. Código Bloqueante en IoT
*   **Problema:** El uso de `delay(5000)` en el ESP32 bloquea todo el ciclo de ejecución. Si el dispositivo tuviera que gestionar varios casilleros o enviar latidos de estado (heartbeats), no podría hacerlo durante ese tiempo.
*   **Solución:** Utilizar temporizadores no bloqueantes basados en la función `millis()`.

### 3.4. Errores de Sincronización (Race Conditions)
*   **Problema:** En `checkExchangeCompletion`, se lee el estado y luego se actualiza. Si dos usuarios escanean al mismo tiempo, ambos podrían intentar completar el intercambio simultáneamente.
*   **Solución:** Utilizar **Transacciones** de Firebase (Firestore y RTDB) para asegurar que las actualizaciones sean atómicas.

---

## 4. Frontend y UX

### 4.1. Estados de Carga Pobres
*   **Problema:** El componente `ProtectedRoute` muestra un simple texto "Cargando autenticación...".
*   **Solución:** Implementar un **Spinner** de carga global o **Skeletons** en las páginas para mejorar la percepción de velocidad del usuario.

### 4.2. Error 404 en `qr-tester.html`
*   **Problema:** El archivo `error.md` reporta un error 404 al llamar a `/api/locker/all`. Esto suele ocurrir por una mala configuración del `BASE_URL` en entornos locales vs producción.
*   **Solución:** Centralizar la configuración de la URL de la API y asegurarse de que el tester use el puerto correcto (3000 por defecto).

### 4.3. Reglas de Firestore
*   **Problema:** El README menciona reglas estrictas, pero no se encuentran archivos `.rules` en el repositorio.
*   **Solución:** Documentar o incluir el archivo `firestore.rules` y `database.rules.json` en el repositorio para asegurar la integridad de los datos en caso de despliegue desde cero.

---

## 5. Documentación

### 5.1. Discrepancia en Firebase Admin
*   **Problema:** El README indica subir un archivo `serviceAccountKey.json`, pero el código de `firebaseService.js` espera una variable de entorno `SERVICE_ACCOUNT` en Base64.
*   **Solución:** Actualizar el README para reflejar el método de la variable Base64, que es el estándar recomendado para Vercel.

---

## Resumen de Prioridades

1.  **Crítico:** Resolver la incompatibilidad de Socket.io con Vercel (Migrar a Firestore/RTDB Snapshots).
2.  **Alta:** Proteger los endpoints de administración (`/seed`, `/all`) y pasar la comunicación del IoT a HTTPS.
3.  **Media:** Optimizar la búsqueda de códigos QR y limpiar dependencias no utilizadas.
4.  **Baja:** Mejorar los estados de carga en el frontend y unificar la documentación de configuración.
