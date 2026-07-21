import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import {
  defaultOnboardingStatus,
  type OnboardingStatus,
  onboardingStatusSchema,
} from "../shared/onboarding-model";
import type { TaskSnapshot } from "../shared/task-model";
import { parseTaskSnapshot } from "../shared/task-snapshot-parser";

const taskRowSchema = z.object({
  snapshot_json: z.string(),
});

const settingRowSchema = z.object({
  value_json: z.string(),
});

export class TaskRepository {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath, {
      enableForeignKeyConstraints: true,
      timeout: 5000,
    });
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

  close(): void {
    this.database.close();
  }
}
