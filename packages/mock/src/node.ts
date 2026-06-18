/**
 * Node 端入口（给单测 / SSR 用）。浏览器代码不要 import 这里。
 */

import { setupServer } from "msw/node";

import { handlers } from "./handlers/index.ts";

export const server = setupServer(...handlers);
