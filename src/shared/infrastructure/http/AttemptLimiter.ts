/**
 * Cuenta intentos fallidos por clave dentro de una ventana de tiempo. En
 * memoria: alcanza con un solo servidor (Render); con varias instancias
 * habría que pasarlo a Redis.
 */
export class AttemptLimiter {
  private failures = new Map<string, number[]>();

  constructor(
    private readonly maxFailures: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  private recent(key: string): number[] {
    const cutoff = this.now() - this.windowMs;
    const kept = (this.failures.get(key) ?? []).filter((at) => at > cutoff);
    if (kept.length > 0) this.failures.set(key, kept);
    else this.failures.delete(key);
    return kept;
  }

  isBlocked(key: string): boolean {
    return this.recent(key).length >= this.maxFailures;
  }

  recordFailure(key: string): void {
    this.failures.set(key, [...this.recent(key), this.now()]);
  }

  reset(key: string): void {
    this.failures.delete(key);
  }
}
