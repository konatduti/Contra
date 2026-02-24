import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const backendUrl = process.env.BACKEND_URL ?? null;

  res.status(200).json({
    ok: true,
    backendUrlConfigured: Boolean(backendUrl),
    backendUrl,
    nodeEnv: process.env.NODE_ENV ?? null,
    time: new Date().toISOString()
  });
}
