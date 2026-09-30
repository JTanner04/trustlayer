import { NextResponse } from "next/server";

type BackendAuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
  };
};

export async function authenticate(request: Request, endpoint: "register" | "login") {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const apiUrl = process.env.TRUSTLAYER_API_URL ?? "http://127.0.0.1:3001";
    const upstream = await fetch(`${apiUrl}/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return NextResponse.json(data, { status: upstream.status });
    }

    const result = data as BackendAuthResponse;
    const response = NextResponse.json({ user: result.user });
    response.cookies.set("trustlayer_session", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Could not reach the TrustLayer API. Make sure the backend is running." },
      { status: 503 },
    );
  }
}
