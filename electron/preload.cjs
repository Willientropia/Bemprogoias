const { contextBridge } = require("electron");

// Com contextIsolation ligado, a página não enxerga nada do Node — só o que
// for exposto aqui de propósito. Hoje o app precisa apenas saber que está
// rodando no desktop, para escolher o HashRouter em vez do BrowserRouter.
contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,
  appVersion: process.env.npm_package_version ?? null,
});
