import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const ip =
    process.env.NEXT_PUBLIC_SOCKET_HOST || "https://medstock-lilac.vercel.app";

  if (!ip) {
    return res.status(500).json({ error: "IP não encontrado" });
  }

  res.json({ ip });
}
