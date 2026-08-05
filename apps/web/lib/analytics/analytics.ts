export interface Analytics {
  track(eventName: string, properties?: Record<string, unknown>): void;
  identify(userId: string, properties?: Record<string, unknown>): void;
  reset(): void;
}

export const noopAnalytics: Analytics = {
  track: () => undefined,
  identify: () => undefined,
  reset: () => undefined,
};
