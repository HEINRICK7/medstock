import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const isProd = process.env.NODE_ENV === "production";
const baseUrl =
  process.env.NEXT_PUBLIC_SOCKET_HOST || "medstock-lilac.vercel.app";

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (socket) return; // Evita múltiplas conexões

    const socketUrl = isProd
      ? baseUrl.replace("http://", "https://")
      : baseUrl.replace("http://", "ws://");

    console.log(`🔌 Tentando conectar ao WebSocket: ${socketUrl}`);

    const socketInstance = io(socketUrl, {
      path: "/api/socketio",
      transports: ["polling"], // 🚨 Agora apenas polling
      reconnectionAttempts: 5, // Tenta reconectar automaticamente
      secure: isProd, // Usa HTTPS em produção
    });

    socketInstance.on("connect", () => {
      console.log("✅ Conectado ao WebSocket!");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Desconectado do WebSocket.");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      console.log("🔌 Desconectando do WebSocket...");
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected };
}
