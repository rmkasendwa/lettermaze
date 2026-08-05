export type HealthResponse =
  | { status: "ok"; database: "connected" }
  | { status: "error"; database: "disconnected" };
