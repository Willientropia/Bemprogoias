import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readAppVersions, versionProblem } from '../scripts/checkVersions.js';

test('package.json e o Android declaram a mesma versão', () => {
  assert.equal(versionProblem(readAppVersions()), '');
});

test('acusa divergência entre package.json e versionName', () => {
  const problem = versionProblem({ version: '1.0.7', versionName: '1.0.6', versionCode: 7 });
  assert.match(problem, /1\.0\.7.*1\.0\.6/s);
});

test('acusa build.gradle sem versionName ou versionCode', () => {
  assert.match(versionProblem({ version: '1.0.7', versionName: null, versionCode: 7 }), /versionName/);
  assert.match(versionProblem({ version: '1.0.7', versionName: '1.0.7', versionCode: NaN }), /versionCode/);
});

// A versão precisa sair do package.json: quando vinha do .env, um valor
// esquecido lá fazia o app se declarar 1.0.3 depois de instalado pela release
// 1.0.6, e o aviso de atualização nunca sumia. Aqui a config é realmente
// resolvida, para o teste falhar se o valor voltar a ter outra origem.
test('o bundle recebe a versão do package.json', async () => {
  const { default: viteConfig } = await import('../vite.config.js');
  const resolved = await viteConfig({ mode: 'production', command: 'build' });
  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

  assert.equal(resolved.define.__APP_VERSION__, JSON.stringify(version));
});

test('a versão do .env não sobrescreve a do package.json', async () => {
  process.env.VITE_APP_VERSION = '0.0.1-esquecido';
  try {
    const { default: viteConfig } = await import('../vite.config.js');
    const resolved = await viteConfig({ mode: 'production', command: 'build' });
    assert.doesNotMatch(resolved.define.__APP_VERSION__, /esquecido/);
  } finally {
    delete process.env.VITE_APP_VERSION;
  }
});
