// Gera o ícone do aplicativo Windows (build/icon.ico) a partir da logo.
//
// O .ico precisa ser quadrado, senão o Windows distorce o desenho na barra de
// tarefas. A logo original é retangular, então ela é encaixada num quadrado
// transparente (contain) em vez de esticada.
//
// Rodar depois de trocar a arte: `node scripts/generateAppIcon.js`

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const raiz = fileURLToPath(new URL("../", import.meta.url));
const origem = path.join(raiz, "public", "logo-mark.png");
const destinoDir = path.join(raiz, "build");
const destinoIco = path.join(destinoDir, "icon.ico");

// O Windows escolhe a resolução conforme o contexto: 16px na barra de título,
// 32px na barra de tarefas, 256px na visualização grande do Explorer.
const TAMANHOS = [16, 24, 32, 48, 64, 128, 256];

async function main() {
  mkdirSync(destinoDir, { recursive: true });

  const buffers = await Promise.all(
    TAMANHOS.map((tamanho) =>
      sharp(origem)
        .resize(tamanho, tamanho, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()
    )
  );

  writeFileSync(destinoIco, await pngToIco(buffers));
  console.log(`Ícone gerado: ${destinoIco} (${TAMANHOS.join(", ")}px)`);
}

main().catch((error) => {
  console.error("Falha ao gerar o ícone:", error);
  process.exit(1);
});
