import type { Env } from "../types";

export async function mockFeatureA(env: Env, request: Request): Promise<Response> {
  // Example: a simple JSON API scaffold
  if (request.method !== "GET") return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers: { "content-type": "application/json" } });
  return new Response(JSON.stringify({ message: "mockFeatureA ok", ts: Date.now() }), { headers: { "content-type": "application/json" } });
}
