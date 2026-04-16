/**
 * Circuit Breaker pattern for protecting external service calls.
 *
 * States:
 * - **closed**: requests flow normally; failures are counted.
 * - **open**: requests are blocked; after `resetTimeout` the breaker transitions to half-open.
 * - **half-open**: one probe request is allowed; success resets to closed, failure re-opens.
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 3,
    private resetTimeout: number = 60000, // 1 minute
  ) {}

  /** Returns true when a request is allowed through the breaker. */
  canExecute(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }
    // half-open: allow one probe request
    return true;
  }

  /** Record a successful response — resets the breaker to closed. */
  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  /** Record a failure — opens the breaker when the threshold is reached. */
  recordFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  /** Current breaker state (useful for diagnostics / logging). */
  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }
}
