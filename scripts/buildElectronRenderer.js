// Build da interface para o Electron.
//
// O vite.config lê BUILD_TARGET do ambiente para usar base './' (caminho
// relativo, exigido por file://) e desligar o PWA. Setar a variável aqui, em
// vez de inline no script do npm, mantém o comando igual em qualquer shell —
// `VAR=x` não funciona no PowerShell e `set VAR=x` não funciona no bash.

import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["vite", "build"], {
  stdio: "inherit",
  env: { ...process.env, BUILD_TARGET: "electron" },
  shell: true,
});

process.exit(result.status ?? 1);
