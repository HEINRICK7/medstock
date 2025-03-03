import type { NextApiRequest, NextApiResponse } from "next";
import { networkInterfaces } from "os";

function getLocalIp() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address; // Retorna o IP real da máquina na rede
      }
    }
  }
  return "127.0.0.1"; // Fallback
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.json({ ip: getLocalIp() });
}
