import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false
  }
};

function readRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const backendBase = process.env.BACKEND_URL?.replace(/\/$/, "") ?? "";
  const incomingPath = Array.isArray(req.query.path) ? req.query.path.join("/") : "";

  if (!backendBase) {
    console.error("[BFF] Missing BACKEND_URL", { incomingPath, backendUrl: null, statusCode: 500 });
    return res.status(500).json({ error: "BACKEND_URL is not configured" });
  }

  const query = new URLSearchParams();
  Object.entries(req.query).forEach(([key, value]) => {
    if (key === "path") return;
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
      return;
    }
    if (typeof value === "string") {
      query.append(key, value);
    }
  });

  const backendUrl = `${backendBase}/api/v1/${incomingPath}${query.toString() ? `?${query.toString()}` : ""}`;

  const forwardHeaders = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (!value || key.toLowerCase() === "host") return;
    if (Array.isArray(value)) {
      value.forEach((item) => forwardHeaders.append(key, item));
      return;
    }
    forwardHeaders.set(key, value);
  });

  const method = req.method ?? "GET";
  const body = method === "GET" || method === "HEAD" ? undefined : await readRawBody(req);

  const backendResponse = await fetch(backendUrl, {
    method,
    headers: forwardHeaders,
    body,
    redirect: "manual"
  });

  if (!backendResponse.ok) {
    console.error("[BFF] Backend request failed", {
      incomingPath,
      backendUrl,
      statusCode: backendResponse.status
    });
  }

  res.status(backendResponse.status);
  backendResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") return;
    res.setHeader(key, value);
  });

  const responseBuffer = Buffer.from(await backendResponse.arrayBuffer());
  res.send(responseBuffer);
}
