import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages: https://kamui391.github.io/prius-parts-demo/
export default defineConfig({
  base: process.env.DEMO_BASE || "/prius-parts-demo/",
  plugins: [
    react(),
    {
      // Pages мэдэгдэхгүй замд 404.html өгдөг тул index.html-ийг хуулж SPA-ийн замуудыг ажиллуулна
      name: "spa-404-fallback",
      closeBundle() {
        const dist = path.resolve(import.meta.dirname, "dist");
        if (fs.existsSync(path.join(dist, "index.html"))) fs.copyFileSync(path.join(dist, "index.html"), path.join(dist, "404.html"));
      },
    },
  ],
  resolve: { alias: { "@shared": path.resolve(import.meta.dirname, "shared") } },
});
