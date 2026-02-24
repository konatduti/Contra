import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    backendUrlConfigured: Boolean(process.env.BACKEND_URL),
    backendUrl: process.env.BACKEND_URL ?? null,
    time: new Date().toISOString()
  });
}
