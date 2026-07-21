import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import type { TaskSnapshot } from "../shared/task-model";
import { parseTaskSnapshot } from "../shared/task-snapshot-parser";

const taskRowSchema = z.object({
  snapshot_json: z.string(),
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

  close(): void {
    this.database.close();
  }
}
