import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const isProd = process.env.NODE_ENV === "production";
const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (socket) return; // Evita múltiplas conexões

    const socketUrl = isProd
      ? baseUrl.replace("http://", "wss://").replace("https://", "wss://")
      : baseUrl.replace("http://", "ws://");

    console.log(`🔌 Conectando ao WebSocket: ${socketUrl}`);

    const socketInstance = io(socketUrl, {
      path: "/api/socketio",
      transports: ["websocket"],
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
