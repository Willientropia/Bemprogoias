export function withTimeout(promise, timeoutMs, timeoutError) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(typeof timeoutError === 'function' ? timeoutError() : timeoutError);
    }, timeoutMs);
  });

  return Promise.race([Promise.resolve(promise), deadline])
    .finally(() => clearTimeout(timer));
}
