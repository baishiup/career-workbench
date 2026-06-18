import react from "@vitejs/plugin-react";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

const mockEnvDefaults = {
  VITE_APP_MODE: "mock",
  VITE_SUPABASE_URL: "https://mock.career-workbench.local",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_mock_local_key",
};

export default defineConfig(({ mode }) => {
  if (mode === "mock") {
    for (const [key, value] of Object.entries(mockEnvDefaults)) {
      process.env[key] ??= value;
    }
  }

  return {
    plugins: [
      codeInspectorPlugin({
        bundler: "vite",
        hotKeys: ["altKey"],
      }),
      react(),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
