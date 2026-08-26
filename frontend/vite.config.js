import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  server: {
    host: "0.0.0.0",   // 🔥 allow access from network & public IP
    port: 5173,        // default port
    strictPort: true,  // ensures it doesn’t auto-change
  },
});