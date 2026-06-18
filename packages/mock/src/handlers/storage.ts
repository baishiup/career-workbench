/**
 * Supabase Storage mock。
 *
 * 上传：把文件存进内存 Map（key = bucket/path），回 200。
 * 读取：getPublicUrl 是客户端拼出来的 `/storage/v1/object/public/...`，
 * 这里拦截该 GET 把内存里的二进制吐回去，所以刚上传的头像/Logo 能立刻显示
 * （仅当前会话有效，刷新后内存清空、回落到 seed 的 null 头像）。
 */

import { http, HttpResponse } from "msw";

type StoredObject = { data: ArrayBuffer; contentType: string };

const objects = new Map<string, StoredObject>();

const uploadHandler = http.post(
  "*/storage/v1/object/:bucket/*",
  async ({ request, params }) => {
    const bucket = params.bucket as string;
    const rest = (params as Record<string, string>)["0"] ?? "";
    const key = `${bucket}/${rest}`;
    const data = await request.arrayBuffer();
    objects.set(key, {
      data,
      contentType: request.headers.get("Content-Type") ?? "application/octet-stream",
    });

    return HttpResponse.json({ Id: crypto.randomUUID(), Key: key, path: rest });
  },
);

const putHandler = http.put(
  "*/storage/v1/object/:bucket/*",
  async ({ request, params }) => {
    const bucket = params.bucket as string;
    const rest = (params as Record<string, string>)["0"] ?? "";
    const key = `${bucket}/${rest}`;
    const data = await request.arrayBuffer();
    objects.set(key, {
      data,
      contentType: request.headers.get("Content-Type") ?? "application/octet-stream",
    });

    return HttpResponse.json({ Id: crypto.randomUUID(), Key: key, path: rest });
  },
);

const publicGetHandler = http.get(
  "*/storage/v1/object/public/:bucket/*",
  ({ params }) => {
    const bucket = params.bucket as string;
    const rest = (params as Record<string, string>)["0"] ?? "";
    const stored = objects.get(`${bucket}/${rest}`);

    if (!stored) {
      return new HttpResponse(null, { status: 404 });
    }

    return new HttpResponse(stored.data, {
      status: 200,
      headers: { "Content-Type": stored.contentType },
    });
  },
);

export const storageHandlers = [publicGetHandler, uploadHandler, putHandler];
