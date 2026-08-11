// O Firestore Emulator roda em uma JVM (java) que às vezes não é encerrada
// corretamente pelo `firebase emulators:exec` no Windows, prendendo a porta
// 8080 e quebrando a próxima execução dos testes de rules. Este script mata
// qualquer processo java pendurado na porta do emulador antes de tentar
// subir um novo, para que `npm test`/`npm run test:rules` sempre funcione
// sem intervenção manual.

import { execSync } from "node:child_process";

const PORT = 8080;

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" });
  } catch {
    return "";
  }
}

if (process.platform === "win32") {
  const output = run(`netstat -ano | findstr :${PORT}`);
  const pids = [...new Set(
    output
      .split("\n")
      .map((line) => line.trim().split(/\s+/).pop())
      // PID 0 é o processo System (aparece em conexões TIME_WAIT) e não pode
      // nem deve ser finalizado — filtrar evita um erro ruidoso a cada run.
      .filter((pid) => pid && /^\d+$/.test(pid) && pid !== "0")
  )];

  for (const pid of pids) {
    run(`taskkill /F /PID ${pid}`);
  }
} else {
  run(`lsof -ti tcp:${PORT} | xargs -r kill -9`);
}
