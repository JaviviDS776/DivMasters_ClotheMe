const { Server } = require("socket.io");
const { db } = require("../services/firebaseService");
const admin = require("firebase-admin");

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // En producción ajustarlo a los orígenes permitidos
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("👤 Usuario conectado:", socket.id);

    // Unirse a una sala de chat específica (conversación)
    socket.on("join_room", (data) => {
      const { conversationId } = data;
      socket.join(conversationId);
      console.log(`🏠 Usuario ${socket.id} se unió a la sala: ${conversationId}`);
    });

    // Manejar envío de mensajes
    socket.on("send_message", async (data) => {
      const { conversationId, senderId, text, receiverId, skipSave } = data;

      const newMessage = {
        senderId,
        receiverId,
        text,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };

      try {
        if (!skipSave) {
          // Guardar en Firestore solo si no se guardó vía REST
          await db.collection("conversations")
            .doc(conversationId)
            .collection("messages")
            .add(newMessage);

          // Actualizar última actividad de la conversación
          await db.collection("conversations").doc(conversationId).set({
            lastMessage: text,
            lastActivity: admin.firestore.FieldValue.serverTimestamp(),
            participants: [senderId, receiverId]
          }, { merge: true });
        }

        // Emitir a los usuarios en la sala en tiempo real
        io.to(conversationId).emit("receive_message", {
          ...newMessage,
          timestamp: { seconds: Math.floor(Date.now() / 1000) } // Mock para feedback inmediato
        });

      } catch (error) {
        console.error("❌ Error enviando mensaje:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Usuario desconectado:", socket.id);
    });
  });

  return io;
};

module.exports = setupSocket;
