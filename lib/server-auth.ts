import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { getAuthUserById } from "@/lib/auth-store";

const SESSION_COOKIE = "financeai_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "development-only-change-me");
type Session = { userId: string; email: string };
export async function createSession(user: Session) { const token = await new SignJWT(user).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret); (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 }); }
export async function getSession(): Promise<Session | null> { const token = (await cookies()).get(SESSION_COOKIE)?.value; if (!token) return null; try { const { payload } = await jwtVerify(token, secret); if (typeof payload.userId !== "string" || typeof payload.email !== "string") return null; return { userId: payload.userId, email: payload.email }; } catch { return null; } }
export async function requireUser() { const session = await getSession(); if (!session) throw new Error("UNAUTHORIZED"); if (!(await getAuthUserById(session.userId))) throw new Error("UNAUTHORIZED"); return session; }
export async function clearSession() { (await cookies()).delete(SESSION_COOKIE); }
