import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import {
  defaultOnboardingStatus,
  type OnboardingStatus,
  onboardingStatusSchema,
} from "../shared/onboarding-model";
import type { PersistenceDiagnosticSnapshot } from "../shared/persistence-diagnostic-model";
import type { TaskSnapshot } from "../shared/task-model";
import { parseTaskSnapshot } from "../shared/task-snapshot-parser";

const taskRowSchema = z.object({
  snapshot_json: z.string(),
});

const settingRowSchema = z.object({
  value_json: z.string(),
});

const runtimeDiagnosticRowSchema = z.object({
  value: z.string(),
});

const countRowSchema = z.object({
  count: z.number().int().nonnegative(),
});

const journalModeRowSchema = z.object({
  journal_mode: z.string(),
});

const secureDeleteRowSchema = z.object({
  secure_delete: z.union([z.number(), z.string()]),
});

export class TaskRepository {
  private readonly database: DatabaseSync;
  private readonly databasePath: string;

  constructor(databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true });
    this.databasePath = databasePath;
    this.database = new DatabaseSync(databasePath, {
      enableForeignKeyConstraints: true,
      timeout: 5000,
    });
    this.database.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      PRAGMA secure_delete = ON;
    `);
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        snapshot_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT
    `);
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT
    `);
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS runtime_diagnostics (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT
    `);
  }

  saveTask(task: TaskSnapshot): void {
    const snapshotJson = JSON.stringify(parseTaskSnapshot(task));
    this.database
      .prepare(`
        INSERT INTO tasks (id, snapshot_json, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          snapshot_json = excluded.snapshot_json,
          updated_at = excluded.updated_at
      `)
      .run(task.id, snapshotJson, new Date().toISOString());
  }

  loadLatestTask(): TaskSnapshot | undefined {
    const row = this.database
      .prepare("SELECT snapshot_json FROM tasks ORDER BY updated_at DESC LIMIT 1")
      .get();
    const parsedRow = taskRowSchema.optional().parse(row);
    if (parsedRow === undefined) {
      return undefined;
    }

    const snapshotJson: unknown = JSON.parse(parsedRow.snapshot_json);
    return parseTaskSnapshot(snapshotJson);
  }

  saveOnboardingStatus(status: OnboardingStatus): void {
    const valueJson = JSON.stringify(onboardingStatusSchema.parse(status));
    this.database
      .prepare(`
        INSERT INTO settings (key, value_json, updated_at)
        VALUES ('onboarding_status', ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value_json = excluded.value_json,
          updated_at = excluded.updated_at
      `)
      .run(valueJson, new Date().toISOString());
  }

  loadOnboardingStatus(): OnboardingStatus {
    const row = this.database
      .prepare("SELECT value_json FROM settings WHERE key = 'onboarding_status'")
      .get();
    const parsedRow = settingRowSchema.optional().parse(row);
    if (parsedRow === undefined) {
      return defaultOnboardingStatus;
    }

    const valueJson: unknown = JSON.parse(parsedRow.value_json);
    return onboardingStatusSchema.parse(valueJson);
  }

  runPersistenceDiagnostic(): PersistenceDiagnosticSnapshot {
    const checkedAt = new Date().toISOString();
    const smokeKey = "sqlite_smoke";
    try {
      this.database
        .prepare(`
          INSERT INTO runtime_diagnostics (key, value, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = excluded.updated_at
        `)
        .run(smokeKey, checkedAt, checkedAt);
      const diagnosticRow = runtimeDiagnosticRowSchema.parse(
        this.database.prepare("SELECT value FROM runtime_diagnostics WHERE key = ?").get(smokeKey),
      );
      const taskCountRow = countRowSchema.parse(
        this.database.prepare("SELECT COUNT(*) AS count FROM tasks").get(),
      );
      const settingCountRow = countRowSchema.parse(
        this.database.prepare("SELECT COUNT(*) AS count FROM settings").get(),
      );
      const journalModeRow = journalModeRowSchema.parse(
        this.database.prepare("PRAGMA journal_mode").get(),
      );
      const secureDeleteRow = secureDeleteRowSchema.parse(
        this.database.prepare("PRAGMA secure_delete").get(),
      );
      const secureDelete =
        secureDeleteRow.secure_delete === 1 || secureDeleteRow.secure_delete === "1";

      return {
        checkedAt,
        databasePath: this.databasePath,
        status: diagnosticRow.value === checkedAt ? "ready" : "failed",
        journalMode: journalModeRow.journal_mode,
        secureDelete,
        taskCount: taskCountRow.count,
        settingCount: settingCountRow.count,
        smokeKey,
        errorMessage: diagnosticRow.value === checkedAt ? undefined : "SQLite smoke row mismatch",
      };
    } catch (error) {
      return {
        checkedAt,
        databasePath: this.databasePath,
        status: "failed",
        journalMode: "",
        secureDelete: false,
        taskCount: 0,
        settingCount: 0,
        smokeKey,
        errorMessage: error instanceof Error ? error.message : "Unknown SQLite diagnostic error",
      };
    }
  }

  close(): void {
    this.database.close();
  }
}
