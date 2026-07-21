import { z } from "zod";

export const targetAppIds = ["discord", "chrome"] as const;

export const targetAppDefinitions = [
  { id: "discord", title: "Discord", bundleId: "com.hnc.Discord" },
  { id: "chrome", title: "Google Chrome", bundleId: "com.google.Chrome" },
] as const;

export const targetAppStates = ["focused", "running", "not_running", "helper_unavailable"] as const;

export const targetAppIdSchema = z.enum(targetAppIds);
export const targetAppStateSchema = z.enum(targetAppStates);

export const focusTargetAppInputSchema = z.object({
  targetId: targetAppIdSchema,
});

export const windowBoundsSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
  width: z.number().int().nonnegative(),
  height: z.number().int().nonnegative(),
});

export const nativeWindowSchema = z.object({
  ownerName: z.string(),
  ownerPid: z.number().int().nonnegative(),
  title: z.string(),
  bounds: windowBoundsSchema,
});

export const targetAppStatusSchema = z.object({
  id: targetAppIdSchema,
  title: z.string(),
  bundleId: z.string(),
  state: targetAppStateSchema,
  windowCount: z.number().int().nonnegative(),
});

export const nativeWindowDiscoveryPayloadSchema = z.object({
  platform: z.string(),
  checkedAt: z.string(),
  targets: z.array(targetAppStatusSchema),
  windows: z.array(nativeWindowSchema),
});

export const windowDiscoverySnapshotSchema = nativeWindowDiscoveryPayloadSchema.extend({
  helperAvailable: z.boolean(),
  errorMessage: z.string().optional(),
});

export type TargetAppId = z.infer<typeof targetAppIdSchema>;
export type FocusTargetAppInput = z.infer<typeof focusTargetAppInputSchema>;
export type NativeWindowDiscoveryPayload = z.infer<typeof nativeWindowDiscoveryPayloadSchema>;
export type WindowDiscoverySnapshot = z.infer<typeof windowDiscoverySnapshotSchema>;

export const createUnavailableWindowDiscoverySnapshot = (
  errorMessage: string,
  checkedAt: string,
  platform = "unknown",
): WindowDiscoverySnapshot => ({
  platform,
  checkedAt,
  helperAvailable: false,
  errorMessage,
  targets: targetAppDefinitions.map((target) => ({
    ...target,
    state: "helper_unavailable",
    windowCount: 0,
  })),
  windows: [],
});

export const isTargetReadyForGuiControl = (
  snapshot: WindowDiscoverySnapshot,
  targetId: TargetAppId,
): boolean =>
  snapshot.helperAvailable &&
  snapshot.targets.some(
    (target) =>
      target.id === targetId && (target.state === "focused" || target.state === "running"),
  );
