import {
  healthResponseSchema,
  type HealthResponse,
} from "@lettermaze/contracts";
import { apiRequest } from "./client";

export function getHealth(): Promise<HealthResponse> {
  return apiRequest("/health", healthResponseSchema);
}
