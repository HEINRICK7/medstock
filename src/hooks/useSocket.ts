import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "/api/socketio"; // URL do servidor WebSocket

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, { path: "/api/socketio" });

    socketInstance.on("connect", () => {
      console.log("🔌 Conectado ao WebSocket");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Desconectado do WebSocket");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected };
}
