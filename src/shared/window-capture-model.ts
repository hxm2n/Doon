import { z } from "zod";
import {
  type TargetAppId,
  targetAppDefinitions,
  targetAppIdSchema,
  windowBoundsSchema,
} from "./window-discovery-model";

export const windowCaptureStatuses = [
  "captured",
  "permission_missing",
  "app_not_running",
  "window_not_found",
  "capture_failed",
  "unsupported_macos",
  "helper_unavailable",
] as const;

export const windowCaptureStatusSchema = z.enum(windowCaptureStatuses);

export const captureWindowInputSchema = z.object({
  targetId: targetAppIdSchema,
});

export const windowCaptureTargetSchema = z.object({
  id: targetAppIdSchema,
  title: z.string(),
  bundleId: z.string(),
});

export const nativeWindowCapturePayloadSchema = z.object({
  platform: z.string(),
  checkedAt: z.string(),
  target: windowCaptureTargetSchema,
  status: windowCaptureStatusSchema,
  screenCaptureTrusted: z.boolean(),
  windowTitle: z.string(),
  windowBounds: windowBoundsSchema.nullable().optional(),
  imageWidth: z.number().int().nonnegative(),
  imageHeight: z.number().int().nonnegative(),
  byteCount: z.number().int().nonnegative(),
  filePath: z.string(),
  errorMessage: z.string().nullable().optional(),
});

export const windowCaptureSnapshotSchema = nativeWindowCapturePayloadSchema.extend({
  helperAvailable: z.boolean(),
});

export type WindowCaptureStatus = z.infer<typeof windowCaptureStatusSchema>;
export type CaptureWindowInput = z.infer<typeof captureWindowInputSchema>;
export type WindowCaptureSnapshot = z.infer<typeof windowCaptureSnapshotSchema>;

export const createUnavailableWindowCaptureSnapshot = (
  targetId: TargetAppId,
  errorMessage: string,
  checkedAt: string,
  platform = "unknown",
): WindowCaptureSnapshot => {
  const target = targetAppDefinitions.find((definition) => definition.id === targetId);
  return {
    platform,
    checkedAt,
    target: target ?? targetAppDefinitions[0],
    helperAvailable: false,
    status: "helper_unavailable",
    screenCaptureTrusted: false,
    windowTitle: "",
    windowBounds: null,
    imageWidth: 0,
    imageHeight: 0,
    byteCount: 0,
    filePath: "",
    errorMessage,
  };
};

export const canUseWindowCapture = (snapshot: WindowCaptureSnapshot): boolean =>
  snapshot.helperAvailable &&
  snapshot.status === "captured" &&
  snapshot.screenCaptureTrusted &&
  snapshot.imageWidth > 0 &&
  snapshot.imageHeight > 0 &&
  snapshot.byteCount > 0;
