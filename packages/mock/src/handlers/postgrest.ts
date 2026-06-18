/**
 * 通用 PostgREST 协议模拟器。
 *
 * 一套 handler 覆盖所有表的 GET/HEAD/POST/PATCH/DELETE。关键协议点：
 * - `.single()` 走 `Accept: application/vnd.pgrst.object+json` → 回裸对象，0 行回 406/PGRST116；
 *   其余（普通 select、`.maybeSingle()`）回数组，`.maybeSingle()` 由客户端自行折叠。
 * - `head:true` + `Prefer: count=exact` → 读 `Content-Range` 尾部的总数。
 * - 写操作 `Prefer: return=representation` → 回写入后的行；upsert 看 `resolution=merge-duplicates`。
 * 过滤目前覆盖项目实际用到的 `eq` 与 `cs`（jsonb 包含），未知算子忽略而非误删。
 */

import { http, HttpResponse } from "msw";

import { mockDb } from "../db/store.ts";
import { TABLE_PRIMARY_KEY, type TableName } from "../db/schema.ts";

type Row = Record<string, unknown>;

const REST_PATH = "*/rest/v1/:table";
const RESERVED_PARAMS = new Set([
  "select",
  "order",
  "limit",
  "offset",
  "on_conflict",
  "columns",
]);

const PGRST_OBJECT_ACCEPT = "application/vnd.pgrst.object";

type Filter = { column: string; op: string; operand: string };

function isKnownTable(table: string): table is TableName {
  return table in TABLE_PRIMARY_KEY;
}

function notFound(table: string) {
  return HttpResponse.json(
    {
      code: "PGRST205",
      details: null,
      hint: null,
      message: `Mock DB 未定义表 ${table}`,
    },
    { status: 404 },
  );
}

function parseFilters(url: URL): Filter[] {
  const filters: Filter[] = [];
  for (const [key, value] of url.searchParams) {
    if (RESERVED_PARAMS.has(key)) {
      continue;
    }
    const match = value.match(/^([a-zA-Z]+)\.([\s\S]*)$/);
    if (!match) {
      continue;
    }
    filters.push({ column: key, op: match[1], operand: match[2] });
  }
  return filters;
}

function matchesFilter(row: Row, filter: Filter): boolean {
  const value = row[filter.column];

  switch (filter.op) {
    case "eq":
      return String(value) === filter.operand;
    case "neq":
      return String(value) !== filter.operand;
    case "is":
      return filter.operand === "null" ? value == null : true;
    case "in": {
      // operand 形如 (a,b,c)
      const list = filter.operand.replace(/^\(|\)$/g, "").split(",");
      return list.some((item) => String(value) === item.replace(/^"|"$/g, ""));
    }
    case "cs": {
      // jsonb 包含：operand 是 JSON 对象，逐键比对。
      try {
        const expected = JSON.parse(filter.operand) as Row;
        if (value == null || typeof value !== "object") {
          return false;
        }
        const target = value as Row;
        return Object.entries(expected).every(
          ([key, expectedValue]) =>
            JSON.stringify(target[key]) === JSON.stringify(expectedValue),
        );
      } catch {
        return false;
      }
    }
    default:
      // 未实现的算子：不参与过滤，避免误删/误判。
      return true;
  }
}

function applyFilters(rows: Row[], filters: Filter[]): Row[] {
  return rows.filter((row) => filters.every((filter) => matchesFilter(row, filter)));
}

function applyOrder(rows: Row[], url: URL): Row[] {
  const order = url.searchParams.get("order");
  if (!order) {
    return rows;
  }
  const [column, direction] = order.split(".");
  const descending = direction === "desc";
  return [...rows].sort((a, b) => {
    const av = a[column];
    const bv = b[column];
    if (av === bv) {
      return 0;
    }
    if (av == null) {
      return 1;
    }
    if (bv == null) {
      return -1;
    }
    const result = av < bv ? -1 : 1;
    return descending ? -result : result;
  });
}

function applyRange(rows: Row[], url: URL): Row[] {
  const offsetParam = url.searchParams.get("offset");
  const limitParam = url.searchParams.get("limit");
  const offset = offsetParam ? Number.parseInt(offsetParam, 10) : 0;
  const start = Number.isFinite(offset) ? offset : 0;
  if (limitParam) {
    const limit = Number.parseInt(limitParam, 10);
    if (Number.isFinite(limit)) {
      return rows.slice(start, start + limit);
    }
  }
  return start > 0 ? rows.slice(start) : rows;
}

function wantsSingleObject(request: Request): boolean {
  return (request.headers.get("Accept") ?? "").includes(PGRST_OBJECT_ACCEPT);
}

function wantsRepresentation(request: Request): boolean {
  return (request.headers.get("Prefer") ?? "").includes("return=representation");
}

function isMergeDuplicates(request: Request): boolean {
  return (request.headers.get("Prefer") ?? "").includes("resolution=merge-duplicates");
}

function pgrstNotAcceptable() {
  return HttpResponse.json(
    {
      code: "PGRST116",
      details: "Results contain 0 rows, application/vnd.pgrst.object+json requires 1 row",
      hint: null,
      message: "JSON object requested, multiple (or no) rows returned",
    },
    { status: 406 },
  );
}

/** 按 single / array 语义封装 select 的成功响应。 */
function respondRows(request: Request, rows: Row[], countHeader?: string) {
  const headers = countHeader ? { "Content-Range": countHeader } : undefined;

  if (wantsSingleObject(request)) {
    if (rows.length === 0) {
      return pgrstNotAcceptable();
    }
    return HttpResponse.json(rows[0], { headers });
  }

  return HttpResponse.json(rows, { headers });
}

function nowIso() {
  return new Date().toISOString();
}

async function readJsonBody(request: Request): Promise<Row[]> {
  const body = await request.json().catch(() => null);
  if (Array.isArray(body)) {
    return body as Row[];
  }
  if (body && typeof body === "object") {
    return [body as Row];
  }
  return [];
}

const getHandler = http.get(REST_PATH, ({ request, params }) => {
  const table = params.table as string;
  if (!isKnownTable(table)) {
    return notFound(table);
  }

  const url = new URL(request.url);
  const filters = parseFilters(url);
  const all = mockDb.table(table) as unknown as Row[];
  const filtered = applyRange(applyOrder(applyFilters(all, filters), url), url);

  const wantsCount = (request.headers.get("Prefer") ?? "").includes("count=");
  const total = applyFilters(all, filters).length;
  const countHeader = wantsCount
    ? `${total > 0 ? `0-${total - 1}` : "*"}/${total}`
    : undefined;

  return respondRows(request, filtered, countHeader);
});

const headHandler = http.head(REST_PATH, ({ request, params }) => {
  const table = params.table as string;
  if (!isKnownTable(table)) {
    return new HttpResponse(null, { status: 404 });
  }

  const url = new URL(request.url);
  const filters = parseFilters(url);
  const all = mockDb.table(table) as unknown as Row[];
  const total = applyFilters(all, filters).length;

  return new HttpResponse(null, {
    status: 200,
    headers: {
      "Content-Range": `${total > 0 ? `0-${total - 1}` : "*"}/${total}`,
    },
  });
});

const postHandler = http.post(REST_PATH, async ({ request, params }) => {
  const table = params.table as string;
  if (!isKnownTable(table)) {
    return notFound(table);
  }

  const primaryKey = TABLE_PRIMARY_KEY[table];
  const url = new URL(request.url);
  const conflictColumn = url.searchParams.get("on_conflict") ?? primaryKey;
  const rows = mockDb.table(table) as unknown as Row[];
  const incoming = await readJsonBody(request);
  const merge = isMergeDuplicates(request);
  const timestamp = nowIso();
  const written: Row[] = [];

  for (const raw of incoming) {
    const record: Row = { ...raw };
    if (record[primaryKey] == null) {
      record[primaryKey] = crypto.randomUUID();
    }
    if (record.created_at == null) {
      record.created_at = timestamp;
    }
    if (record.updated_at == null) {
      record.updated_at = timestamp;
    }

    const existingIndex = rows.findIndex(
      (row) => String(row[conflictColumn]) === String(record[conflictColumn]),
    );

    if (existingIndex >= 0 && merge) {
      const merged = { ...rows[existingIndex], ...record };
      rows[existingIndex] = merged;
      written.push(merged);
    } else if (existingIndex >= 0) {
      return HttpResponse.json(
        {
          code: "23505",
          details: null,
          hint: null,
          message: `duplicate key value violates unique constraint on ${table}`,
        },
        { status: 409 },
      );
    } else {
      rows.push(record);
      written.push(record);
    }
  }

  mockDb.persist();

  if (!wantsRepresentation(request)) {
    return new HttpResponse(null, { status: 201 });
  }
  return respondRows(request, written);
});

const patchHandler = http.patch(REST_PATH, async ({ request, params }) => {
  const table = params.table as string;
  if (!isKnownTable(table)) {
    return notFound(table);
  }

  const url = new URL(request.url);
  const filters = parseFilters(url);
  const rows = mockDb.table(table) as unknown as Row[];
  const [patch] = await readJsonBody(request);
  const updated: Row[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    if (filters.every((filter) => matchesFilter(rows[index], filter))) {
      const next = { ...rows[index], ...(patch ?? {}) };
      rows[index] = next;
      updated.push(next);
    }
  }

  mockDb.persist();

  if (!wantsRepresentation(request)) {
    return new HttpResponse(null, { status: 204 });
  }
  return respondRows(request, updated);
});

const deleteHandler = http.delete(REST_PATH, ({ request, params }) => {
  const table = params.table as string;
  if (!isKnownTable(table)) {
    return notFound(table);
  }

  const url = new URL(request.url);
  const filters = parseFilters(url);
  const rows = mockDb.table(table) as unknown as Row[];
  const removed: Row[] = [];
  const kept: Row[] = [];

  for (const row of rows) {
    if (filters.length > 0 && filters.every((filter) => matchesFilter(row, filter))) {
      removed.push(row);
    } else {
      kept.push(row);
    }
  }

  mockDb.setTable(table, kept as never);

  if (!wantsRepresentation(request)) {
    return new HttpResponse(null, { status: 204 });
  }
  return respondRows(request, removed);
});

export const postgrestHandlers = [
  headHandler,
  getHandler,
  postHandler,
  patchHandler,
  deleteHandler,
];
