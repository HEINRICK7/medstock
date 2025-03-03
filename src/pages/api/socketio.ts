/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as SocketIOServer } from "socket.io";

export const config = {
  api: {
    bodyParser: false, // Desativar o bodyParser para WebSockets
  },
};
export default function handler(req: NextApiRequest, res: any) {
  if (!res.socket.server.io) {
    console.log("🔌 Inicializando WebSocket...");

    const httpServer: NetServer = res.socket.server as any;
    const io = new SocketIOServer(httpServer, {
      path: "/api/socketio",
      cors: {
        origin: "*", // Permitir conexões externas (apenas para dev)
      },
      transports: ["websocket"], // 🔥 Força WebSocket e evita polling
    });

    io.on("connection", (socket) => {
      console.log("🚀 Cliente conectado:", socket.id);

      socket.on("mensagem", (data) => {
        console.log("📩 Mensagem recebida:", data);
        io.emit("mensagem", data);
      });

      socket.on("disconnect", () => {
        console.log("❌ Cliente desconectado:", socket.id);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}
