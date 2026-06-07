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
    resumeFileId: null,
    next: "Validate uploaded Storage object, insert resume_files row, call Dify resume_parse workflow or mock parser, persist ExternalAiRun, then save a user-confirmable profile draft.",
  });
});
