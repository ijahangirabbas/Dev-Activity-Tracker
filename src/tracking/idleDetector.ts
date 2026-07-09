export class IdleDetector {
  private timeoutMs: number;
  private lastActivityTime: number;
  private isIdleState: boolean;
  private intervalId: NodeJS.Timeout | undefined;
  private onIdleStateChanged: (isIdle: boolean) => void;

  constructor(timeoutSeconds: number, onIdleStateChanged: (isIdle: boolean) => void) {
    this.timeoutMs = timeoutSeconds * 1000;
    this.lastActivityTime = Date.now();
    this.isIdleState = false;
    this.onIdleStateChanged = onIdleStateChanged;
  }

  public start(): void {
    this.lastActivityTime = Date.now();
    this.isIdleState = false;
    
    // Check state every second
    this.intervalId = setInterval(() => {
      this.checkIdle();
    }, 1000);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  public updateTimeout(timeoutSeconds: number): void {
    this.timeoutMs = timeoutSeconds * 1000;
  }

  public recordActivity(): void {
    this.lastActivityTime = Date.now();
    if (this.isIdleState) {
      this.isIdleState = false;
      this.onIdleStateChanged(false);
    }
  }

  private checkIdle(): void {
    if (this.isIdleState) {
      return;
    }
    const now = Date.now();
    if (now - this.lastActivityTime >= this.timeoutMs) {
      this.isIdleState = true;
      this.onIdleStateChanged(true);
    }
  }

  public isIdle(): boolean {
    return this.isIdleState;
  }

  public getLastActivityTime(): number {
    return this.lastActivityTime;
  }
}
