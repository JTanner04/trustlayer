import { authenticate } from "@/app/lib/auth-api";

export async function POST(request: Request) {
  return authenticate(request, "login");
}
