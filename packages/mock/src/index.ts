/**
 * @career-workbench/mock 公开出口。
 *
 * 纯 mock 运行能力：用 MSW 在网络层拦截 Supabase 的 REST / Auth / Functions /
 * Storage 请求，配一套带 localStorage 持久化的内存数据库，让 web 应用在没有任何
 * 后端的情况下也能完整跑起来、并部署成纯静态站。
 *
 * 浏览器侧只需在 render 前 `await startMockWorker()`。
 */

import { mockDb } from "./db/store.ts";

export type StartMockWorkerOptions = {
  /** Service Worker 脚本路径，默认 `${BASE_URL}mockServiceWorker.js`。 */
  serviceWorkerUrl?: string;
  /** 命中不到 handler 时的行为，默认 'bypass'（放过真实请求，便于排查）。 */
  onUnhandledRequest?: "bypass" | "warn" | "error";
  /** 是否打印启动日志。 */
  quiet?: boolean;
};

/**
 * 启动浏览器端 mock。动态 import './browser' 以确保 msw/browser 只在
 * 真正需要时进入包体，普通（真实 Supabase）构建不会被它拖累。
 */
export async function startMockWorker(
  options: StartMockWorkerOptions = {},
): Promise<void> {
  const { worker } = await import("./browser.ts");

  await worker.start({
    serviceWorker: options.serviceWorkerUrl
      ? { url: options.serviceWorkerUrl }
      : undefined,
    onUnhandledRequest: options.onUnhandledRequest ?? "bypass",
    quiet: options.quiet ?? false,
  });

  if (!options.quiet) {
    // eslint-disable-next-line no-console
    console.info(
      "[mock] Supabase 已被 MSW 接管，应用以纯 mock 模式运行（localStorage 持久化）。",
    );
  }
}

/** 把内存数据库重置回 seed（清掉本地写入），供 demo「重置数据」入口调用。 */
export function resetMockDatabase(): void {
  mockDb.reset();
}

export { mockDb };
