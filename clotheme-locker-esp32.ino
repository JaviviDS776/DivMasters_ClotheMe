/*
 * ClotheMe - Smart Locker Controller (ESP32)
 * Autor: DivMasters Team
 * 
 * Mejoras: HTTPS, Non-blocking delays (millis), Security placeholders.
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- CONFIGURACIÓN DE RED (Usar variables de entorno o gestor de config en prod) ---
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// --- CONFIGURACIÓN API (HTTPS RECOMENDADO) ---
const String backendUrl = "https://TU_BACKEND_URL.vercel.app/api/locker/verify";
const String apiKey = "TU_SECRET_IOT_API_KEY"; // Debe coincidir con el .env del backend
const String lockerId = "L01";

// Certificado Raíz (Root CA) para Vercel/Cloudflare (Opcional si se usa insecure para pruebas, pero recomendado)
// const char* root_ca = "..."; 

// --- PINES ---
const int PIN_RELAY = 26;
const int PIN_LED_GREEN = 27;
const int PIN_LED_RED = 25;
const int PIN_BUZZER = 33;

// Puerto Serial para el Lector QR (GM65 usa UART)
HardwareSerial SerialQR(2);

// Variables para control no bloqueante
unsigned long relayActiveMillis = 0;
bool isRelayActive = false;
const long RELAY_TIMEOUT = 5000; // 5 segundos

void setup() {
  Serial.begin(115200);
  SerialQR.begin(9600, SERIAL_8N1, 16, 17);

  pinMode(PIN_RELAY, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  digitalWrite(PIN_RELAY, LOW);
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED, LOW);

  connectWiFi();
}

void loop() {
  // 1. Mantener WiFi
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // 2. Control del Relé (No bloqueante)
  if (isRelayActive && (millis() - relayActiveMillis >= RELAY_TIMEOUT)) {
    digitalWrite(PIN_RELAY, LOW);
    digitalWrite(PIN_LED_GREEN, LOW);
    isRelayActive = false;
    Serial.println("Cerradura bloqueada (Timeout)");
  }

  // 3. Lectura de QR
  if (SerialQR.available()) {
    String scannedCode = SerialQR.readStringUntil('\r');
    scannedCode.trim();

    if (scannedCode.length() > 0) {
      Serial.println("QR Detectado: " + scannedCode);
      beep(100);
      verifyCode(scannedCode);
    }
  }
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("Conectando a WiFi...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConectado! IP: " + WiFi.localIP().toString());
    blinkLED(PIN_LED_GREEN, 3, 100);
  } else {
    Serial.println("\nFallo al conectar WiFi.");
    blinkLED(PIN_LED_RED, 3, 100);
  }
}

void verifyCode(String code) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  // En desarrollo puedes usar client.setInsecure() si no tienes el certificado a mano,
  // pero para producción DEBES usar el Root CA.
  client.setInsecure(); 

  HTTPClient http;
  
  if (http.begin(client, backendUrl)) {
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<256> doc;
    doc["lockerId"] = lockerId;
    doc["scannedCode"] = code;
    doc["apiKey"] = apiKey;

    String requestBody;
    serializeJson(doc, requestBody);

    Serial.println("Verificando en backend (HTTPS)...");
    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode == 200) {
      String response = http.getString();
      Serial.println("Respuesta: " + response);

      StaticJsonDocument<256> resDoc;
      DeserializationError error = deserializeJson(resDoc, response);

      if (!error) {
        bool access = resDoc["access"] | false;
        if (access) {
          grantAccess();
        } else {
          denyAccess();
        }
      }
    } else {
      Serial.printf("Error HTTP: %d\n", httpResponseCode);
      denyAccess();
    }
    http.end();
  }
}

void grantAccess() {
  Serial.println("Acceso CONCEDIDO");
  digitalWrite(PIN_LED_GREEN, HIGH);
  digitalWrite(PIN_RELAY, HIGH);
  
  relayActiveMillis = millis();
  isRelayActive = true;
  
  beep(500);
}

void denyAccess() {
  Serial.println("Acceso DENEGADO");
  digitalWrite(PIN_LED_RED, HIGH);
  beep(100); delay(100); beep(100);
  
  // Pequeña pausa bloqueante aquí es aceptable ya que es un estado de error
  delay(1000);
  digitalWrite(PIN_LED_RED, LOW);
}

void beep(int duration) {
  digitalWrite(PIN_BUZZER, HIGH);
  delay(duration);
  digitalWrite(PIN_BUZZER, LOW);
}

void blinkLED(int pin, int times, int duration) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(duration);
    digitalWrite(pin, LOW);
    delay(duration);
  }
}
