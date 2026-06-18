/**
 * 汇总所有 Supabase mock handler。
 *
 * 顺序无关紧要（MSW 按 method + path 精确匹配），统一在这里导出，
 * browser / node 两个 setup 共用同一份。
 */

import { authHandlers } from "./auth.ts";
import { functionsHandlers } from "./functions.ts";
import { postgrestHandlers } from "./postgrest.ts";
import { storageHandlers } from "./storage.ts";

export const handlers = [
  ...authHandlers,
  ...storageHandlers,
  ...functionsHandlers,
  ...postgrestHandlers,
];
