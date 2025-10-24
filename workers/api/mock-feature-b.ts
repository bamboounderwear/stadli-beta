import type { Env } from "../types";

export async function mockFeatureB(env: Env, request: Request): Promise<Response> {
  // Example: POST that echoes sanitized input
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers: { "content-type": "application/json" } });
  const ct = request.headers.get("content-type") || "";
  let body: any = {};
  if (ct.includes("application/json")) {
    try { body = await request.json(); } catch {}
  } else if (ct.includes("application/x-www-form-urlencoded")) {
    const fd = await request.formData();
    for (const [k, v] of fd.entries()) body[k] = typeof v === "string" ? v : v.name;
  }
  // Basic input sanitation
  for (const k of Object.keys(body)) if (typeof body[k] === "string") body[k] = body[k].slice(0, 1000);
  return new Response(JSON.stringify({ ok: true, body }), { headers: { "content-type": "application/json" } });
}
