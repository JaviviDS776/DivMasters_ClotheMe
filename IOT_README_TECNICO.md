# Especificación Técnica para Implementación IoT (ESP32) - ClotheMe

Este documento describe detalladamente la lógica de funcionamiento del simulador `qr-tester.html` y los endpoints del backend asociados, con el fin de servir como guía para el desarrollo del firmware de un controlador ESP32 que gestione los casilleros físicos.

## 1. Arquitectura de Comunicación
El ESP32 actúa como un cliente HTTP que se comunica con una API REST (Node.js/Vercel).

- **Protocolo:** HTTP/1.1 (o HTTPS dependiendo del despliegue).
- **Formato de datos:** JSON.
- **Seguridad:** Uso de una `IOT_API_KEY` compartida entre el backend y el hardware.

## 2. Especificación de Endpoints (Foco Hardware)

### 2.1 Verificación de Código QR
Es la función principal. Se ejecuta cada vez que el escáner detecta un código.

- **URL:** `{{BACKEND_URL}}/api/locker/verify`
- **Método:** `POST`
- **Headers:** 
  - `Content-Type: application/json`
- **Cuerpo (Request):**
```json
{
  "scannedCode": "VALOR_DEL_QR_ESCANEADO",
  "apiKey": "clotheme_secret_iot_token_2024"
}
```

- **Respuesta Exitosa (`access: true`):**
```json
{
  "access": true,
  "action": "open_for_deposit" | "open_for_pickup",
  "lockerId": "L01",
  "message": "Usuario A: Deposita en L01",
  "item": "👕"
}
```

- **Respuesta Denegada (`access: false`):**
```json
{
  "access": false,
  "error": "Código QR no reconocido" | "Esperando depósito del Usuario B..."
}
```

## 3. Lógica de Control de Hardware (Estado de Máquina)

Basado en el comportamiento de `qr-tester.html`, el ESP32 debe implementar los siguientes estados:

### A. Estado de Reposo (IDLE)
- **LED Status:** Amarillo/Fijo (`led-wait`).
- **Pantalla:** Mostrar "CLOTHE-ME: LISTO" o "Escanea tu QR".
- **Acción:** Esperar interrupción o lectura Serial del módulo escáner QR.

### B. Estado de Validación (VALIDATING)
- **Activación:** Se recibe una cadena de texto por el puerto Serial.
- **LED Status:** Azul o Verde Parpadeante (`led-active`).
- **Acción:** Realizar petición HTTP POST al endpoint `/api/locker/verify`.
- **Pantalla:** "VALIDANDO...".

### C. Estado de Apertura (OPENING)
- **Activación:** Respuesta JSON con `access: true`.
- **Acción:**
  1. Identificar el `lockerId` recibido.
  2. Activar el Relé/Solenoide correspondiente al pin GPIO asociado a ese `lockerId`.
  3. Mostrar en pantalla el `message` recibido.
- **LED Status:** Verde Fijo.

### D. Estado de Error (ERROR)
- **Activación:** Respuesta JSON con `access: false` o error de conexión HTTP.
- **Acción:**
  1. Mostrar el `error` en pantalla por 3-5 segundos.
  2. Emitir pitido (opcional si hay Buzzer).
- **LED Status:** Rojo Fijo (`led-error`).
- **Retorno:** Volver al estado IDLE.

## 4. Mapeo de Componentes Sugerido

| Función | Componente Físico | Protocolo / GPIO |
| :--- | :--- | :--- |
| Escáner QR | Módulo GM60 / Similar | UART (RX/TX) |
| Pantalla | OLED SSD1306 o LCD I2C | I2C (SDA/SCL) |
| Cerraduras | Solenoides de 12V + Relés/Mosfets | Digital Output (GPIO) |
| Sensores Peso | Celdas de Carga + HX711 | Digital Serial (DT/SCK) |
| Indicadores | LEDs RGB o Individuales | Digital Output (PWM) |

## 5. Seguridad y Robustez

1. **API Key:** Debe estar definida como una constante en el código C++ del ESP32. Nunca debe exponerse en logs serie en modo producción.
2. **Timeout:** La petición HTTP debe tener un timeout (ej. 5s) para evitar que el sistema se congele si no hay internet.
3. **Cierre de Puerta:** El sistema debe detectar (mediante el sensor de peso o un switch de fin de carrera) cuándo se cierra la puerta para notificar al backend si fuera necesario, o simplemente limpiar el estado local.

## 6. Endpoints de Administración (Opcionales para el ESP32)
El `qr-tester.html` incluye `/api/locker/all` y `/api/locker/seed`. Estos **no son necesarios** para la operación normal del hardware, pero pueden usarse para una "Consola de Diagnóstico" física si se desea. Requieren un token de administrador que el ESP32 normalmente no poseerá por seguridad.