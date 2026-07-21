import { z } from "zod";
import {
  type TargetAppId,
  targetAppDefinitions,
  targetAppIdSchema,
} from "./window-discovery-model";

export const accessibilityTreeStatuses = [
  "readable",
  "empty",
  "permission_missing",
  "app_not_running",
  "helper_unavailable",
] as const;

export const accessibilityTreeStatusSchema = z.enum(accessibilityTreeStatuses);

export const readAccessibilityTreeInputSchema = z.object({
  targetId: targetAppIdSchema,
});

export const accessibilityTargetSchema = z.object({
  id: targetAppIdSchema,
  title: z.string(),
  bundleId: z.string(),
});

export const accessibilityNodeSchema = z.object({
  role: z.string(),
  title: z.string(),
  value: z.string(),
  description: z.string(),
  depth: z.number().int().nonnegative(),
  childCount: z.number().int().nonnegative(),
});

export const nativeAccessibilityTreePayloadSchema = z.object({
  platform: z.string(),
  checkedAt: z.string(),
  target: accessibilityTargetSchema,
  status: accessibilityTreeStatusSchema,
  accessTrusted: z.boolean(),
  nodeCount: z.number().int().nonnegative(),
  textNodeCount: z.number().int().nonnegative(),
  nodes: z.array(accessibilityNodeSchema),
});

export const accessibilityTreeSnapshotSchema = nativeAccessibilityTreePayloadSchema.extend({
  helperAvailable: z.boolean(),
  errorMessage: z.string().optional(),
});

export type AccessibilityTreeStatus = z.infer<typeof accessibilityTreeStatusSchema>;
export type ReadAccessibilityTreeInput = z.infer<typeof readAccessibilityTreeInputSchema>;
export type AccessibilityTreeSnapshot = z.infer<typeof accessibilityTreeSnapshotSchema>;

export const createUnavailableAccessibilityTreeSnapshot = (
  targetId: TargetAppId,
  errorMessage: string,
  checkedAt: string,
  platform = "unknown",
): AccessibilityTreeSnapshot => {
  const target = targetAppDefinitions.find((definition) => definition.id === targetId);
  return {
    platform,
    checkedAt,
    target: target ?? targetAppDefinitions[0],
    helperAvailable: false,
    errorMessage,
    status: "helper_unavailable",
    accessTrusted: false,
    nodeCount: 0,
    textNodeCount: 0,
    nodes: [],
  };
};

export const canExtractTextFromAccessibilityTree = (snapshot: AccessibilityTreeSnapshot): boolean =>
  snapshot.helperAvailable &&
  snapshot.status === "readable" &&
  snapshot.accessTrusted &&
  snapshot.textNodeCount > 0;
