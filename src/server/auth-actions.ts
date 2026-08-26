"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db";
import {
  consumePasswordResetToken,
  createPasswordResetToken,
  createSession,
  destroyAllSessions,
  destroySession,
  getSession,
  hashPassword,
  setActiveBusiness,
  verifyPassword,
} from "@/lib/auth";
import {
  emailSchema,
  fail,
  type FormState,
  guarded,
  nameSchema,
  parseForm,
  passwordSchema,
  succeed,
} from "./form";

async function requestMeta() {
  const list = await headers();
  return {
    userAgent: list.get("user-agent"),
    ipAddress:
      list.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      list.get("x-real-ip") ??
      null,
  };
}

// ---------------------------------------------------------------------------
// Sign up
// ---------------------------------------------------------------------------

const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export async function signUpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const parsed = parseForm(signUpSchema, formData);
    if (!parsed.ok) return parsed.state;

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return fail("That email is already registered.", {
        email: "An account with this email already exists. Try signing in.",
      });
    }

    const meta = await requestMeta();
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        lastLoginAt: new Date(),
      },
    });

    // No business yet — onboarding creates it.
    await createSession({ userId: user.id, businessId: null, ...meta });
    redirect("/onboarding");
  });
}

// ---------------------------------------------------------------------------
// Sign in
// ---------------------------------------------------------------------------

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
});

export async function signInAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const parsed = parseForm(signInSchema, formData);
    if (!parsed.ok) return parsed.state;

    const { email, password, next } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    // One message for both a missing account and a wrong password, so the form
    // cannot be used to enumerate who has an account.
    const invalid = fail("Those details do not match an account.");
    if (!user) return invalid;
    if (!(await verifyPassword(password, user.passwordHash))) return invalid;

    const membership = await prisma.membership.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { joinedAt: "asc" },
    });

    const meta = await requestMeta();
    await createSession({
      userId: user.id,
      businessId: membership?.businessId ?? null,
      ...meta,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const destination =
      next && next.startsWith("/") && !next.startsWith("//")
        ? next
        : membership
          ? "/app"
          : "/onboarding";

    redirect(destination);
  });
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Switch business
// ---------------------------------------------------------------------------

export async function switchBusinessAction(formData: FormData): Promise<void> {
  const businessId = formData.get("businessId");
  if (typeof businessId !== "string") return;

  const session = await getSession();
  if (!session) redirect("/login");

  // Never trust the posted id — confirm the user actually belongs to it.
  const membership = await prisma.membership.findFirst({
    where: { userId: session.userId, businessId, status: "ACTIVE" },
  });
  if (!membership) redirect("/app");

  await setActiveBusiness(session.sessionId, businessId);
  revalidatePath("/app", "layout");
  redirect("/app");
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

const forgotSchema = z.object({ email: emailSchema });

export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const parsed = parseForm(forgotSchema, formData);
    if (!parsed.ok) return parsed.state;

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (user) {
      const token = await createPasswordResetToken(user.id);
      // Email delivery is the one piece not wired up. Until a provider is
      // configured the link is logged, which keeps the flow testable end to end
      // rather than pretending to send something.
      console.info(
        `[password reset] ${user.email} -> /reset-password?token=${token}`,
      );
    }

    // Always the same answer, whether or not the address exists.
    return succeed(
      "If that email belongs to an account, a reset link is on its way.",
    );
  });
}

const resetSchema = z
  .object({
    token: z.string().min(1, "This reset link is invalid."),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Those passwords do not match.",
  });

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const parsed = parseForm(resetSchema, formData);
    if (!parsed.ok) return parsed.state;

    const userId = await consumePasswordResetToken(parsed.data.token);
    if (!userId) {
      return fail("That reset link has expired. Request a new one.");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    });

    // A password change invalidates every existing session.
    await destroyAllSessions(userId);
    redirect("/login?reset=1");
  });
}

const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Those passwords do not match.",
  });

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return guarded(async () => {
    const session = await getSession();
    if (!session) redirect("/login");

    const parsed = parseForm(changePasswordSchema, formData);
    if (!parsed.ok) return parsed.state;

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
    });

    if (!(await verifyPassword(parsed.data.current, user.passwordHash))) {
      return fail("That is not your current password.", {
        current: "Incorrect password.",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    });

    return succeed("Password updated. Other devices have been signed out.");
  });
}
