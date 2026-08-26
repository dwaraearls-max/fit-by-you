import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

import { prisma } from "./db";

const COOKIE_NAME = "fby_session";
const SESSION_DAYS = 30;

/** Secure cookies only when the app URL is HTTPS (or explicitly forced). */
function sessionCookieSecure(): boolean {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return appUrl.startsWith("https://");
}

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set to at least 32 characters. See .env.example.",
    );
  }
  return new TextEncoder().encode(value);
}

/**
 * Sessions are opaque random tokens stored as a SHA-256 digest, wrapped in a
 * signed JWT for transport. The digest means a stolen database row cannot be
 * replayed as a cookie, and the JWT signature means a forged cookie never
 * reaches the database at all.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type SessionPayload = {
  sessionId: string;
  userId: string;
  businessId: string | null;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(input: {
  userId: string;
  businessId: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      userId: input.userId,
      tokenHash: hashToken(token),
      businessId: input.businessId,
      userAgent: input.userAgent?.slice(0, 400) ?? null,
      ipAddress: input.ipAddress ?? null,
      expiresAt,
    },
  });

  const jwt = await new SignJWT({
    sessionId: session.id,
    userId: input.userId,
    token,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: sessionCookieSecure(),
    path: "/",
    expires: expiresAt,
  });
}

type RawSession = {
  sessionId: string;
  userId: string;
  businessId: string | null;
  user: { id: string; name: string; email: string; avatarKey: string | null };
};

/**
 * Resolves the cookie to a live session row. Returns null for anything that is
 * missing, expired, forged or revoked — callers never have to distinguish.
 */
export async function getSession(): Promise<RawSession | null> {
  const store = await cookies();
  const cookie = store.get(COOKIE_NAME)?.value;
  if (!cookie) return null;

  let claims: Record<string, unknown>;
  try {
    const { payload } = await jwtVerify(cookie, secret());
    claims = payload as Record<string, unknown>;
  } catch {
    return null;
  }

  if (
    typeof claims.sessionId !== "string" ||
    typeof claims.userId !== "string" ||
    typeof claims.token !== "string"
  ) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { id: claims.sessionId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarKey: true } },
    },
  });

  if (!session || session.userId !== claims.userId) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;

  // Constant-time comparison of the presented token against the stored digest.
  const presented = Buffer.from(hashToken(claims.token), "utf8");
  const stored = Buffer.from(session.tokenHash, "utf8");
  if (presented.length !== stored.length || !timingSafeEqual(presented, stored)) {
    return null;
  }

  return {
    sessionId: session.id,
    userId: session.userId,
    businessId: session.businessId,
    user: session.user,
  };
}

/** Switches the session's active business, for users who belong to several. */
export async function setActiveBusiness(
  sessionId: string,
  businessId: string,
): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { businessId, lastUsedAt: new Date() },
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const cookie = store.get(COOKIE_NAME)?.value;

  if (cookie) {
    try {
      const { payload } = await jwtVerify(cookie, secret());
      if (typeof payload.sessionId === "string") {
        await prisma.session.deleteMany({ where: { id: payload.sessionId } });
      }
    } catch {
      // A cookie we cannot verify has nothing to revoke.
    }
  }

  store.delete(COOKIE_NAME);
}

/** Signs the user out of every device. Used after a password change. */
export async function destroyAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  return token;
}

export async function consumePasswordResetToken(
  token: string,
): Promise<string | null> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return null;
  }

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record.userId;
}
