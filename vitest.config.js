import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Caminho absoluto para o setup, resolvido a partir deste arquivo.
//
// Se os testes falharem com "Vitest failed to find the current suite" logo após
// editar um componente, é cache obsoleto do Vite, não este caminho — limpe com
// `rm -rf node_modules/.vite node_modules/.vitest` e rode de novo.
const setupFile = fileURLToPath(new URL("./tests/setup.js", import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: [setupFile],
    include: ["tests/component/**/*.test.jsx"],
  },
});
