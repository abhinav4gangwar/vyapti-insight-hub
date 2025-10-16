import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["vyapti-ec2.homelab-server.online", "vyapti-ec2.staging.homelab-server.online", "suraag-api.vyapti.co.in", "suraag-ai.vyapti.co.in"],
    // allowedHosts: ["192.168.1.30:8000"],
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
