import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
// Demo through a tunnel: build with VITE_API_URL=/api and the frontend server
// forwards /api/* to the backend, so only one public link is needed.
const apiProxy = {
  "/api": {
    target: "http://127.0.0.1:8000",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ""),
  },
};
const tunnelHosts = [".trycloudflare.com"];

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: apiProxy, allowedHosts: tunnelHosts },
  preview: { proxy: apiProxy, allowedHosts: tunnelHosts },
});
