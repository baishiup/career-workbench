/**
 * 浏览器端 Service Worker 启动入口（dev + 纯静态部署都用它）。
 */

import { setupWorker } from "msw/browser";

import { handlers } from "./handlers/index.ts";

export const worker = setupWorker(...handlers);
