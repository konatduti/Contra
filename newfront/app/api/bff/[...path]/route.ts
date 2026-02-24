import { NextRequest, NextResponse } from "next/server";

function getBackendBase() {
  return process.env.BACKEND_URL?.replace(/\/$/, "") ?? "";
}

function buildForwardHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() === "host") return;
    headers.set(key, value);
  });

  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  return headers;
}

async function proxyRequest(request: NextRequest, context: { params: { path: string[] } }) {
  const backendBase = getBackendBase();
  const incomingPath = context.params.path.join("/");

  if (!backendBase) {
    console.error("[BFF] Missing BACKEND_URL", { incomingPath, backendUrl: null, statusCode: 500 });
    return NextResponse.json({ error: "BACKEND_URL is not configured" }, { status: 500 });
  }

  const targetUrl = new URL(`${backendBase}/api/v1/${incomingPath}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  const backendResponse = await fetch(targetUrl.toString(), {
    method: request.method,
    headers: buildForwardHeaders(request),
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual"
  });

  if (!backendResponse.ok) {
    console.error("[BFF] Backend request failed", {
      incomingPath,
      backendUrl: targetUrl.toString(),
      statusCode: backendResponse.status
    });
  }

  const responseHeaders = new Headers();
  backendResponse.headers.forEach((value, key) => {
    responseHeaders.append(key, value);
  });

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders
  });
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: { params: { path: string[] } }) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: { params: { path: string[] } }) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: { params: { path: string[] } }) {
  return proxyRequest(request, context);
}

export async function OPTIONS(request: NextRequest, context: { params: { path: string[] } }) {
  return proxyRequest(request, context);
}
