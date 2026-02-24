import { NextRequest, NextResponse } from "next/server";

const backendBase = process.env.BACKEND_URL?.replace(/\/$/, "");

async function proxyRequest(request: NextRequest, context: { params: { path: string[] } }) {
  if (!backendBase) {
    return NextResponse.json({ error: "BACKEND_URL is not configured" }, { status: 500 });
  }

  const path = context.params.path.join("/");
  const url = new URL(`${backendBase}/api/v1/${path}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    method: request.method,
    headers: {
      cookie: request.headers.get("cookie") ?? "",
      "content-type": request.headers.get("content-type") ?? "application/json"
    },
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
    redirect: "manual",
    cache: "no-store"
  });

  if (!response.ok) {
    console.error("[BFF] Backend request failed", {
      status: response.status,
      backendUrl: url.toString(),
      method: request.method
    });
  }

  const data = await response.text();
  return new NextResponse(data, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json"
    }
  });
}

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
