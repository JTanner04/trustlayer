import { NextRequest, NextResponse } from "next/server";

type Context = { params: Promise<{ path: string[] }> };

function allowed(path: string[], method: string) {
  const value = path.join("/");
  return (
    (method === "GET" && (value === "me" || value === "agreements" || value === "reviews")) ||
    (method === "POST" && (value === "agreements" || value === "reviews")) ||
    (method === "GET" && /^agreements\/[^/]+$/.test(value)) ||
    (method === "PUT" && /^profiles\/[^/]+$/.test(value)) ||
    (method === "POST" && /^agreements\/[^/]+\/(accept|complete)$/.test(value)) ||
    (method === "GET" && /^reviews\/[^/]+\/verification$/.test(value))
  );
}

async function forward(request: NextRequest, context: Context) {
  const { path } = await context.params;
  if (!allowed(path, request.method)) return NextResponse.json({ error: "Unsupported API request." }, { status: 404 });
  const token = request.cookies.get("trustlayer_session")?.value;
  if (!token) return NextResponse.json({ error: "Please log in to continue." }, { status: 401 });
  const apiUrl = process.env.TRUSTLAYER_API_URL ?? "http://127.0.0.1:3001";
  const url = new URL(`${apiUrl}/${path.join("/")}`);
  url.search = request.nextUrl.search;
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.text();
  try {
    const upstream = await fetch(url, { method: request.method, headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body, cache: "no-store" });
    return new NextResponse(await upstream.text(), { status: upstream.status, headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "Could not reach the TrustLayer API." }, { status: 503 });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
