import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toast } from "@heroui/react";
import "./globals.css";
import { App } from "./App";

function render() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
      <Toast.Provider />
    </StrictMode>,
  );
}

async function bootstrap() {
  // 纯 mock 模式：先用 MSW 接管 Supabase 网络请求，再渲染应用，
  // 保证首屏的 auth/数据请求一律落到内存数据库。
  if (import.meta.env.VITE_APP_MODE === "mock") {
    const { startMockWorker } = await import("@career-workbench/mock");
    await startMockWorker({
      serviceWorkerUrl: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    });
  }

  render();
}

void bootstrap();
