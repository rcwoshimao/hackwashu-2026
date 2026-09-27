type Clock = {
  set(callback: () => void, delayMs: number): unknown;
  clear(timer: unknown): void;
};

const systemClock: Clock = {
  set: (callback, delayMs) => setTimeout(callback, delayMs),
  clear: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
};

export class FlightPlanPublishQueue {
  private readonly pending = new Map<string, unknown>();

  constructor(
    private readonly publish: (repo: string) => Promise<void>,
    private readonly failed: (repo: string) => void,
    private readonly delayMs: number,
    private readonly clock: Clock = systemClock,
  ) {}

  schedule(repo: string): void {
    const old = this.pending.get(repo);
    if (old !== undefined) this.clock.clear(old);
    const timer = this.clock.set(() => {
      this.pending.delete(repo);
      void this.publish(repo).catch(() => this.failed(repo));
    }, this.delayMs);
    this.pending.set(repo, timer);
  }
}
