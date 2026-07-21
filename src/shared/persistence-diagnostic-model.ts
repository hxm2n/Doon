import { z } from "zod";

export const persistenceDiagnosticStatuses = ["ready", "failed"] as const;

export const persistenceDiagnosticStatusSchema = z.enum(persistenceDiagnosticStatuses);

export const persistenceDiagnosticSnapshotSchema = z.object({
  checkedAt: z.string(),
  databasePath: z.string(),
  status: persistenceDiagnosticStatusSchema,
  journalMode: z.string(),
  secureDelete: z.boolean(),
  taskCount: z.number().int().nonnegative(),
  settingCount: z.number().int().nonnegative(),
  smokeKey: z.string(),
  errorMessage: z.string().optional(),
});

export type PersistenceDiagnosticSnapshot = z.infer<typeof persistenceDiagnosticSnapshotSchema>;
