import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.json({
    ip: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000",
  });
}
