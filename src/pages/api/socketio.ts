import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { NextApiRequest, NextApiResponse } from "next";

// Definição da tipagem correta para res.socket.server
interface CustomSocketServer extends HttpServer {
  io?: SocketIOServer;
}

type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: CustomSocketServer;
  };
};

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    console.log("🚀 Iniciando servidor WebSocket...");

    const io = new SocketIOServer(res.socket.server as HttpServer, {
      path: "/api/socketio",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("✅ Novo cliente conectado:", socket.id);

      socket.on("disconnect", () => {
        console.log("❌ Cliente desconectado:", socket.id);
      });

      socket.on("mensagem", (msg) => {
        console.log("📩 Mensagem recebida:", msg);
        io.emit("mensagem", msg);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}
