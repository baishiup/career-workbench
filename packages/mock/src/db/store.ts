/**
 * 内存数据库 + 可选 localStorage 持久化。
 *
 * 写操作（新建简历、改 profile…）落到内存并同步到 localStorage，
 * 刷新/重开浏览器不丢；每个访客一份独立数据。Node（测试）环境没有
 * localStorage，自动退化为纯内存。
 */

import { createSeedDatabase } from "./seed.ts";
import { TABLE_NAMES, type Database, type TableName } from "./schema.ts";

/** bump 这个版本号即可在 seed 结构变更后丢弃旧的本地数据。 */
const STORAGE_KEY = "career-workbench:mock-db:v1";

function getLocalStorage(): Storage | null {
  try {
    return typeof globalThis !== "undefined" && "localStorage" in globalThis
      ? (globalThis as { localStorage?: Storage }).localStorage ?? null
      : null;
  } catch {
    // Safari 隐私模式等访问 localStorage 会抛错，直接退化为纯内存。
    return null;
  }
}

function loadPersisted(): Database | null {
  const storage = getLocalStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Database>;
    const merged = createSeedDatabase();
    // 以持久化数据为准，但缺失的表用 seed 补齐，避免老快照少表导致崩溃。
    for (const name of TABLE_NAMES) {
      const rows = parsed[name];
      if (Array.isArray(rows)) {
        (merged[name] as unknown[]) = rows;
      }
    }
    return merged;
  } catch {
    return null;
  }
}

class MockDatabase {
  private db: Database;

  constructor() {
    this.db = loadPersisted() ?? createSeedDatabase();
  }

  table<T extends TableName>(name: T): Database[T] {
    return this.db[name];
  }

  setTable<T extends TableName>(name: T, rows: Database[T]): void {
    this.db[name] = rows;
    this.persist();
  }

  persist(): void {
    const storage = getLocalStorage();
    if (!storage) {
      return;
    }
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    } catch {
      // 配额满或被禁用：忽略，运行期内存仍然可用。
    }
  }

  /** 清空本地数据并恢复到 seed，供 demo「重置」入口调用。 */
  reset(): void {
    this.db = createSeedDatabase();
    this.persist();
  }
}

export const mockDb = new MockDatabase();
