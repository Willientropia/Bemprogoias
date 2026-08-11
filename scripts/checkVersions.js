// A versão do app vive em dois lugares que precisam concordar: o package.json,
// que vira __APP_VERSION__ no bundle e é o que o app mostra e compara com a
// release do GitHub, e o versionName do Android, que é o que o sistema exibe.
//
// Quando os dois divergem o erro é silencioso e só aparece no celular do
// líder, como um aviso de atualização que nunca some. Por isso este check roda
// antes de cada build.
import { readFileSync } from 'node:fs';

const packageJsonUrl = new URL('../package.json', import.meta.url);
const gradleUrl = new URL('../android/app/build.gradle', import.meta.url);

export function readAppVersions() {
  const { version } = JSON.parse(readFileSync(packageJsonUrl, 'utf8'));
  const gradle = readFileSync(gradleUrl, 'utf8');
  const versionName = gradle.match(/versionName\s+"([^"]+)"/)?.[1] ?? null;
  const versionCode = Number(gradle.match(/versionCode\s+(\d+)/)?.[1] ?? NaN);
  return { version, versionName, versionCode };
}

export function versionProblem({ version, versionName, versionCode }) {
  if (!versionName) return 'Não encontrei versionName em android/app/build.gradle.';
  if (!Number.isInteger(versionCode)) return 'Não encontrei versionCode em android/app/build.gradle.';
  if (version !== versionName) {
    return `package.json diz ${version} e android/app/build.gradle diz ${versionName}. `
      + 'Os dois precisam ser iguais, senão o app pede atualização para sempre.';
  }
  return '';
}

// Só interrompe o build quando executado direto (node scripts/checkVersions.js).
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const versions = readAppVersions();
  const problem = versionProblem(versions);
  if (problem) {
    console.error(`\nVersões inconsistentes: ${problem}\n`);
    process.exit(1);
  }
  console.log(`Versão ${versions.version} (versionCode ${versions.versionCode}) consistente.`);
}
