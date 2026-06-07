import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { requireAdminPlaceholder } from "../_shared/auth.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  const auth = requireAdminPlaceholder(request);

  if (!auth.ok) {
    return jsonResponse({ error: auth.message }, { status: auth.status });
  }

  return jsonResponse({
    status: "not_implemented",
    uploadPath: "resume-files/admin-placeholder/example.pdf",
    next: "Create a signed Supabase Storage upload URL here; complete-resume-upload will later validate the object and pass only a short-lived file reference into Dify when parsing is enabled.",
  });
});
