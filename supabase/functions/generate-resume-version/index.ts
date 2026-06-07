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
    status: "mock",
    resumeVersionId: null,
    next: "Call Dify resume_generate workflow or mock provider, persist target-job ResumeVersion, ResumeChangeLog, AiRun, ExternalAiRun, and user-reviewable patch records.",
  });
});
