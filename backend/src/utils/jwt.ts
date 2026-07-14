import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signature(input: string): string {
  return createHmac("sha256", env.jwt.secret).update(input).digest("base64url");
}

export function createToken(user: { id: string; email: string; name: string }): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AuthTokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    iat: now,
    exp: now + parseExpiry(env.jwt.expiresIn),
  };
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode(payload);
  return `${header}.${body}.${signature(`${header}.${body}`)}`;
}

export function verifyToken(token: string): AuthTokenPayload {
  const [header, body, tokenSignature] = token.split(".");
  if (!header || !body || !tokenSignature) throw new Error("Invalid token");

  const expected = Buffer.from(signature(`${header}.${body}`));
  const actual = Buffer.from(tokenSignature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error("Invalid token");
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as AuthTokenPayload;
  if (!payload.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }
  return payload;
}

function parseExpiry(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return 7 * 24 * 60 * 60;
  const units = { s: 1, m: 60, h: 3600, d: 86400 } as const;
  return Number(match[1]) * units[match[2] as keyof typeof units];
}
