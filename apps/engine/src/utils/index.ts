export function epoch_in_micros() {
  const epoch_ms = new Date().getTime();
  const perf_precision =
    typeof performance !== undefined && performance.now()
      ? performance.now() * 1000
      : 0;

  return epoch_ms * 1000 + (perf_precision % 1000);
}
