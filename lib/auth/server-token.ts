import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function getServerBackendToken(
  request: NextRequest,
): Promise<string | null> {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req: request, secret });

  return typeof token?.backendToken === "string" ? token.backendToken : null;
}
