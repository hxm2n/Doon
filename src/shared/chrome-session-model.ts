import { z } from "zod";
import { windowBoundsSchema } from "./window-discovery-model";

export const chromeSessionStatuses = [
  "chrome_not_running",
  "window_not_found",
  "window_found",
  "launch_requested",
  "helper_unavailable",
] as const;

export const chromeSessionStatusSchema = z.enum(chromeSessionStatuses);

export const chromeSessionIdSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]{8,64}$/);

export const chromeSessionInputSchema = z.object({
  sessionId: chromeSessionIdSchema,
});

export const nativeChromeSessionPayloadSchema = z.object({
  platform: z.string(),
  checkedAt: z.string(),
  sessionId: chromeSessionIdSchema,
  status: chromeSessionStatusSchema,
  launchUrl: z.string(),
  markerTitle: z.string(),
  windowTitle: z.string(),
  windowBounds: windowBoundsSchema.nullable().optional(),
  errorMessage: z.string().nullable().optional(),
});

export const chromeSessionSnapshotSchema = nativeChromeSessionPayloadSchema.extend({
  helperAvailable: z.boolean(),
});

export type ChromeSessionInput = z.infer<typeof chromeSessionInputSchema>;
export type ChromeSessionSnapshot = z.infer<typeof chromeSessionSnapshotSchema>;

export const createChromeSessionId = (seed: string): string => {
  const normalizedSeed = seed
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
  return chromeSessionIdSchema.parse(`doon-${normalizedSeed || "session"}`.slice(0, 64));
};

export const createUnavailableChromeSessionSnapshot = (
  sessionId: string,
  errorMessage: string,
  checkedAt: string,
  platform = "unknown",
): ChromeSessionSnapshot => ({
  platform,
  checkedAt,
  sessionId: chromeSessionIdSchema.parse(sessionId),
  helperAvailable: false,
  status: "helper_unavailable",
  launchUrl: "",
  markerTitle: "",
  windowTitle: "",
  errorMessage,
});

export const isDoonChromeSessionIdentified = (snapshot: ChromeSessionSnapshot): boolean =>
  snapshot.helperAvailable && snapshot.status === "window_found" && snapshot.markerTitle.length > 0;
