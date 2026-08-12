const { app, BrowserWindow, screen, shell } = require("electron");
const path = require("node:path");

// Em desenvolvimento a janela aponta para o dev server do Vite (com HMR);
// no app empacotado, para o build que vai dentro do executável.
const DEV_SERVER_URL = process.env.ELECTRON_DEV_SERVER_URL;
const isDev = Boolean(DEV_SERVER_URL);

// O painel troca para o layout empilhado (mobile) abaixo de 1100px de LARGURA
// CSS — que não é a largura em pixels da tela. Num monitor 1536x960 a 125% de
// escala, sobram ~1229px de CSS; uma janela pedindo 1440 não cabe, o Windows
// encolhe, e o painel cai no breakpoint achando que está num celular.
const PAINEL_LARGURA_IDEAL = 1440;
const PAINEL_ALTURA_IDEAL = 900;

function tamanhoInicial() {
  // workAreaSize já vem em pixels independentes de dispositivo (o mesmo
  // sistema de medida do CSS), então dá para comparar direto com o breakpoint.
  const { workAreaSize } = screen.getPrimaryDisplay();
  return {
    width: Math.min(PAINEL_LARGURA_IDEAL, workAreaSize.width),
    height: Math.min(PAINEL_ALTURA_IDEAL, workAreaSize.height),
  };
}

function createWindow() {
  const { width, height } = tamanhoInicial();

  const window = new BrowserWindow({
    width,
    height,
    // Sem minWidth acima do breakpoint o gestor consegue arrastar a janela até
    // um tamanho onde o painel vira layout de celular no desktop.
    minWidth: 1120,
    minHeight: 680,
    backgroundColor: "#f4f4f2",
    show: false,
    title: "Bem pro Goiás — Painel",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      // O painel só renderiza a própria interface; nada aqui precisa de acesso
      // a Node. Manter o isolamento evita que uma falha no conteúdo web vire
      // acesso ao sistema de arquivos da máquina do gestor.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Evita o flash de janela branca enquanto a interface carrega.
  window.once("ready-to-show", () => window.show());

  if (isDev) {
    window.loadURL(DEV_SERVER_URL);
  } else {
    window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  // Links externos (wa.me, por exemplo) abrem no navegador do sistema em vez
  // de sequestrar a janela do painel.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    const destino = new URL(url);
    const atual = new URL(window.webContents.getURL());
    if (destino.origin !== atual.origin) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  return window;
}

// Só uma instância: abrir o atalho de novo foca a janela existente em vez de
// subir um segundo painel conectado ao mesmo Firestore.
const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  let mainWindow = null;

  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    mainWindow = createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
