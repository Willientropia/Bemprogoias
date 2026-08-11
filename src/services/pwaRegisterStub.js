// Substitui `virtual:pwa-register` no build do Electron.
//
// Aquele módulo é criado pelo vite-plugin-pwa, que fica desligado no desktop:
// o app empacotado já tem os arquivos em disco e não precisa de service
// worker. Sem este stub o build quebra ao resolver o import.
//
// Devolve a mesma forma da API real (uma função de update) para o serviço que
// a consome continuar funcionando sem nenhum `if` espalhado pelo código.
export function registerSW() {
  return async () => {};
}
