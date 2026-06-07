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
    score: 72,
    next: "Read ProfileVersion + ResumeVersion + JobDescription, call Dify job_match workflow or mock provider, persist MatchReport, AiRun, ExternalAiRun, and AiRunEvent records.",
  });
});
