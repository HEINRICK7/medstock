import { Server as NetServer, Socket } from "net";
import { Server as SocketIOServer } from "socket.io";
import type { NextApiResponse } from "next";

export interface NextApiResponseServerIo extends NextApiResponse {
  socket: Socket & {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
}
