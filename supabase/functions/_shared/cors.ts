/**
 * Edge Function 共用 CORS 与 JSON response helper。
 *
 * 当前函数都由浏览器通过 Supabase client invoke，必须允许 authorization
 * 和 apikey 等 Supabase headers。SDK 默认值会随 supabase-js 新增 header 同步。
 */
import { corsHeaders as defaultCorsHeaders } from "npm:@supabase/supabase-js@2/cors";

export const corsHeaders = defaultCorsHeaders;

export function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...init?.headers,
    },
  });
}
