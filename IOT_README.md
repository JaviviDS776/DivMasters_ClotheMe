# Proyecto ClotheMe: Implementación IoT (Casillero Inteligente)

Este documento detalla los componentes, conexiones y el código necesario para construir el hardware del casillero inteligente utilizando un **ESP32**.

## 🛠 Componentes Necesarios

| Componente | Descripción |
| :--- | :--- |
| **ESP32 DevKit V1** | Microcontrolador principal con WiFi integrado. |
| **Lector QR GM65 / GM67** | Módulo de escaneo con salida Serial (UART). |
| **Módulo Relé (5V/12V)** | Para controlar la cerradura electrónica. |
| **Cerradura Solenoide** | El actuador físico que bloquea/desbloquea el casillero. |
| **LEDs (Rojo y Verde)** | Para indicadores visuales de estado. |
| **Buzzer Pasivo** | Para alertas sonoras al escanear. |
| **Fuente de Poder** | 5V para el ESP32 y 12V para el solenoide (según modelo). |

## 🔌 Conexiones (Wiring)

### 1. Lector QR (GM65) al ESP32
| GM65 Pin | ESP32 Pin | Notas |
| :--- | :--- | :--- |
| VCC | 3.3V / 5V | Verificar especificación del sensor. |
| GND | GND | Tierra común. |
| TX | GPIO 16 (RX2) | Transmisión de datos. |
| RX | GPIO 17 (TX2) | Recepción de comandos (opcional). |

### 2. Módulo Relé al ESP32
| Relé Pin | ESP32 Pin | Notas |
| :--- | :--- | :--- |
| VCC | VIN (5V) | Alimentación del módulo. |
| GND | GND | Tierra común. |
| IN / SIG | GPIO 26 | Pulso para activar el relé. |

### 3. Indicadores (LEDs y Buzzer)
| Componente | ESP32 Pin | Notas |
| :--- | :--- | :--- |
| LED Verde | GPIO 27 | Acceso concedido. |
| LED Rojo | GPIO 25 | Acceso denegado / Error. |
| Buzzer | GPIO 33 | Pitido al escanear. |

---

## 🚀 Configuración del Software

1.  **Arduino IDE:** Instala el soporte para placas ESP32.
2.  **Librerías:**
    *   `ArduinoJson` por Benoit Blanchon (Instalar desde el Gestor de Librerías).
    *   `HTTPClient` (Viene por defecto en el core de ESP32).
3.  **Código:** Abre `clotheme-locker-esp32.ino` y configura:
    *   `SSID` y `PASSWORD` de tu WiFi.
    *   `BACKEND_URL` (Usa la IP local de tu PC si el backend corre localmente, ej: `http://192.168.1.50:3000`).

## 📋 Lógica de Funcionamiento

1.  **Standby:** El sistema espera a que el lector QR envíe datos por el puerto Serial2.
2.  **Escaneo:** Al leer un código, el ESP32 emite un pitido y envía una petición `POST` al backend con el `lockerId`, el código escaneado y la `apiKey`.
3.  **Validación:**
    *   Si el backend responde `{ "access": true }`: Se enciende el LED verde, se activa el relé (abre la puerta) y suena el buzzer.
    *   Si el backend responde `{ "access": false }`: Se enciende el LED rojo y suena un tono de error.
4.  **Cierre:** Tras 5 segundos (configurable), el relé se desactiva para permitir que la puerta se bloquee al cerrar.
