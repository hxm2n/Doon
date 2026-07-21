import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "node24",
    rollupOptions: {
      external: [/^node:/, "electron"],
    },
  },
});
