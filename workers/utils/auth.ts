import type { Env, User } from "../types";

// Minimal HMAC-signed session cookie: sid = base64(userId.expiry.signature)
export async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(mac)));
}

export async function verify(data: string, sigB64: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0));
  return await crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(data));
}

export async function createSessionCookie(userId: number, secret: string, hours=12): Promise<string> {
  const exp = Date.now() + hours * 3600 * 1000;
  const payload = `${userId}.${exp}`;
  const sig = await sign(payload, secret);
  const val = `${btoa(payload)}.${sig}`;
  return `sid=${val}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${hours*3600}`;
}

export async function getUserFromRequest(env: Env, request: Request): Promise<User | null> {
  const cookie = request.headers.get("cookie") || "";
  const m = /(?:^|; )sid=([^;]+)/.exec(cookie);
  if (!m) return null;
  const [encoded, sig] = m[1].split(".", 2);
  if (!encoded || !sig) return null;
  const payload = atob(encoded);
  const [uidStr, expStr] = payload.split(".", 2);
  const data = `${uidStr}.${expStr}`;
  const ok = await verify(data, sig, env.SESSION_SECRET);
  if (!ok) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  const uid = Number(uidStr);
  if (!Number.isFinite(uid)) return null;
  const row = await env.DB.prepare("SELECT id, email, role FROM users WHERE id = ?").bind(uid).first<User>();
  return row ?? null;
}

export function clearSessionCookie(): string {
  return "sid=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}
