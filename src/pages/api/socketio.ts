import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { NextApiRequest, NextApiResponse } from "next";

// Definição da tipagem correta
interface CustomSocketServer extends HttpServer {
  io?: SocketIOServer;
}

type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: CustomSocketServer;
  };
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (!res.socket.server.io) {
    console.log("🚀 Iniciando servidor WebSocket...");

    const io = new SocketIOServer(res.socket.server as HttpServer, {
      path: "/api/socketio",
      cors: {
        origin: "*", // Permite conexões de qualquer origem
        methods: ["GET", "POST"],
      },
      transports: ["polling"], // 🚨 FORÇA "polling" para funcionar na Vercel
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
  } else {
    console.log("⚡ Servidor WebSocket já estava rodando.");
  }

  res.end();
}
