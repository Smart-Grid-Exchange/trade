export function gen_client_id(user_id: number) {
  const usec = epoch_in_micros();
  return Number.parseInt(`${usec}00${user_id}`);
}

export function epoch_in_micros() {
  const epoch_ms = new Date().getTime();
  const perf_precision = performance.now() ? performance.now() * 1000 : 0;

  return epoch_ms * 1000 + (perf_precision % 1000);
}
