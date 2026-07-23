import { ONE_YEAR_MS } from "@shared/const";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./env";

function getSessionSecret() {
  if (!ENV.cookieSecret) {
    throw new Error("JWT_SECRET is required to sign admin sessions");
  }
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function createAdminSessionToken(adminId: number): Promise<string> {
  const expirationSeconds = Math.floor((Date.now() + ONE_YEAR_MS) / 1000);

  return new SignJWT({ adminId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(getSessionSecret());
}

export async function verifyAdminSessionToken(token: string | undefined | null): Promise<number | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
    });
    const { adminId } = payload as Record<string, unknown>;
    return typeof adminId === "number" ? adminId : null;
  } catch {
    return null;
  }
}
