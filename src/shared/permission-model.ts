import { z } from "zod";

export const systemPermissionIds = ["accessibility", "screen_recording", "notifications"] as const;

export const systemPermissionStates = [
  "granted",
  "denied",
  "restricted",
  "not_determined",
  "not_supported",
  "unknown",
] as const;

export const systemPermissionIdSchema = z.enum(systemPermissionIds);
export const systemPermissionStateSchema = z.enum(systemPermissionStates);

export const systemPermissionStatusSchema = z.object({
  id: systemPermissionIdSchema,
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  state: systemPermissionStateSchema,
  required: z.boolean(),
  actionLabel: z.string().trim().min(1),
});

export const systemPermissionSnapshotSchema = z.object({
  platform: z.string().trim().min(1),
  checkedAt: z.string().datetime(),
  permissions: z.array(systemPermissionStatusSchema).length(systemPermissionIds.length),
});

export const openSystemPermissionSettingsInputSchema = z.object({
  permissionId: systemPermissionIdSchema,
});

export type SystemPermissionId = z.infer<typeof systemPermissionIdSchema>;
export type SystemPermissionState = z.infer<typeof systemPermissionStateSchema>;
export type SystemPermissionStatus = z.infer<typeof systemPermissionStatusSchema>;
export type SystemPermissionSnapshot = z.infer<typeof systemPermissionSnapshotSchema>;
export type OpenSystemPermissionSettingsInput = z.infer<
  typeof openSystemPermissionSettingsInputSchema
>;

export const areRequiredSystemPermissionsGranted = (snapshot: SystemPermissionSnapshot): boolean =>
  snapshot.permissions.every(
    (permission) => !permission.required || permission.state === "granted",
  );
