import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "chrome132",
    rollupOptions: {
      external: [/^node:/, "electron"],
    },
  },
});
