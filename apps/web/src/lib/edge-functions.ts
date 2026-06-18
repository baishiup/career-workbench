/**
 * Supabase Edge Function 调用共用层。
 *
 * 统一 functions.invoke 的错误展开：把 Edge Function 返回的
 * { error, stage, details } 结构拼成可读的中文错误信息，
 * 各 feature API（resumes / jobs）共用，避免重复实现。
 */
import { getSupabaseClient } from "@/lib/supabase";

const serviceUnavailableMessage = "当前无法连接服务，请稍后重试。";

type EdgeFunctionErrorDetails = {
  details?: unknown;
  status?: number;
};

class EdgeFunctionError extends Error {
  details?: unknown;
  status?: number;

  constructor(message: string, options: EdgeFunctionErrorDetails = {}) {
    super(message);
    this.name = "EdgeFunctionError";
    this.details = options.details;
    this.status = options.status;
  }
}

async function invokeEdgeFunction<TResponse>(
  functionName: string,
  body: BodyInit | Record<string, unknown>,
) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new EdgeFunctionError(serviceUnavailableMessage);
  }

  const { data, error } = await supabase.functions.invoke<TResponse>(
    functionName,
    {
      body,
    },
  );

  if (error) {
    const details = await readFunctionErrorDetails(error);
    throw new EdgeFunctionError(
      buildFunctionErrorMessage(error.message, details),
      details,
    );
  }

  if (!data) {
    throw new EdgeFunctionError("服务暂时没有返回结果，请稍后重试。");
  }

  return data;
}

function buildFunctionErrorMessage(
  fallback: string,
  errorDetails: EdgeFunctionErrorDetails,
) {
  const body = asRecord(errorDetails.details);
  const nested = asRecord(body?.details);
  const upstreamDetails = asRecord(nested?.details);
  const upstreamBody = asRecord(upstreamDetails?.body);
  const stages = [body?.stage, nested?.stage]
    .map((stage) => (typeof stage === "string" ? stage : null))
    .filter(Boolean);
  const upstreamMessage = getFirstString(
    upstreamBody?.message,
    upstreamBody?.error,
    upstreamBody?.code,
  );
  const metadata = [
    errorDetails.status ? `HTTP ${errorDetails.status}` : null,
    stages.length > 0 ? `stage: ${stages.join("/")}` : null,
    typeof upstreamDetails?.status === "number"
      ? `upstream: ${upstreamDetails.status}`
      : null,
    upstreamMessage ? `原因: ${upstreamMessage}` : null,
  ].filter(Boolean);
  const message = getFirstString(body?.error, fallback) ?? fallback;

  return metadata.length > 0 ? `${message}（${metadata.join("，")}）` : message;
}

function getFirstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function asRecord(value: unknown) {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

async function readFunctionErrorDetails(
  error: unknown,
): Promise<EdgeFunctionErrorDetails> {
  const context = (error as { context?: unknown }).context;

  if (!(context instanceof Response)) {
    return {};
  }

  return {
    details: await readResponseBody(context),
    status: context.status,
  };
}

async function readResponseBody(response: Response) {
  const text = await response.clone().text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export { EdgeFunctionError, invokeEdgeFunction };
export type { EdgeFunctionErrorDetails };
