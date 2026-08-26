import { defineConfig, loadEnv } from "vite";
import { dirname } from "path";
import { fileURLToPath } from "url";
import https from "https";
import react from "@vitejs/plugin-react";

process.env = { ...process.env, ...loadEnv("", process.cwd()) };

const isBuild = process.env.npm_lifecycle_event === "build";

// Never log the key itself — build logs are routinely pasted into issues.
console.log("SHOPIFY_API_KEY:", process.env.SHOPIFY_API_KEY ? "set" : "MISSING");
console.log("HOST:", process.env.HOST || "not set");

if (isBuild && !process.env.CI && !process.env.SHOPIFY_API_KEY) {
  console.warn(
    "\n⚠️  Building without SHOPIFY_API_KEY. The admin UI will refuse to load.\n" +
      "    Pass it as a Docker build argument, not just a runtime variable.\n"
  );
}

if (isBuild && !process.env.GLIDETOP_EXTENSION_UUID) {
  console.warn(
    "\nℹ️  GLIDETOP_EXTENSION_UUID is not set. The 'Open theme editor' buttons\n" +
      "    will land on the App embeds panel without pre-selecting GlideTop.\n"
  );
}

const proxyOptions = {
  target: `http://127.0.0.1:${process.env.BACKEND_PORT}`,
  changeOrigin: false,
  secure: true,
  ws: false,
};

const host = process.env.HOST
  ? process.env.HOST.replace(/https?:\/\//, "")
  : "localhost";

let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host: host,
    port: process.env.FRONTEND_PORT,
    clientPort: 443,
  };
}

export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  plugins: [react()],
  define: {
    "process.env.SHOPIFY_API_KEY": JSON.stringify(process.env.SHOPIFY_API_KEY),
    "process.env.GLIDETOP_EXTENSION_UUID": JSON.stringify(
      process.env.GLIDETOP_EXTENSION_UUID || ""
    ),
    "process.env.GLIDETOP_SUPPORT_EMAIL": JSON.stringify(
      process.env.GLIDETOP_SUPPORT_EMAIL || ""
    ),
  },
  resolve: {
    preserveSymlinks: true,
  },
  server: {
    host: "localhost",
    port: process.env.FRONTEND_PORT,
    hmr: hmrConfig,
    proxy: {
      "^/(\\?.*)?$": proxyOptions,
      "^/api(/|(\\?.*)?$)": proxyOptions,
    },
  },
});
