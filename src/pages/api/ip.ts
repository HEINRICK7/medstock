import type { NextApiRequest, NextApiResponse } from "next";
import { networkInterfaces } from "os";

function getLocalIp(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "127.0.0.1";
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const isProd = process.env.NODE_ENV === "production";
  const ip = isProd ? process.env.NEXT_PUBLIC_SOCKET_HOT : getLocalIp();

  res.json({ ip });
}
