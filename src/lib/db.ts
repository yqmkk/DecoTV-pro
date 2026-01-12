/* eslint-disable @typescript-eslint/no-explicit-any */
import { AdminConfig } from './admin.types';
import { KvrocksStorage } from './kvrocks.db';
import { RedisStorage } from './redis.db';
import { Favorite, IStorage, PlayRecord, SkipConfig } from './types';
import { UpstashRedisStorage } from './upstash.db';

// 严格获取存储类型
const STORAGE_TYPE = (process.env.NEXT_PUBLIC_STORAGE_TYPE as any) || 'localstorage';

/**
 * 安全兜底类：当数据库未配置时，打印警告并防止崩溃
 */
class SafeEmptyStorage implements Partial<IStorage> {
  constructor() {
    console.warn('⚠️ [DB Warning]: 正在运行 SafeEmptyStorage 模式！请检查环境变量 NEXT_PUBLIC_STORAGE_TYPE');
  }
  async getPlayRecord() { return null; }
  async setPlayRecord() { return; }
  async getAllPlayRecords() { return {}; }
  async deletePlayRecord() { return; }
  async getFavorite() { return null; }
  async setFavorite() { return; }
  async getAllFavorites() { return {}; }
  async deleteFavorite() { return; }
  async registerUser() { return; }
  async verifyUser() { return false; }
  async checkUserExist() { return false; }
  async changePassword() { return; }
  async deleteUser() { return; }
  async getSearchHistory() { return []; }
  async addSearchHistory() { return; }
  async deleteSearchHistory() { return; }
  async getAllUsers() { return []; }
  async getAdminConfig() { return null; }
  async setAdminConfig() { return; }
  async getSkipConfig() { return null; }
  async setSkipConfig() { return; }
  async deleteSkipConfig() { return; }
  async getAllSkipConfigs() { return {}; }
  async clearAllData() { return; }
}

function createStorage(): IStorage {
  console.log('🚀 [DB Init]: 尝试初始化存储引擎 ->', STORAGE_TYPE);
  try {
    switch (STORAGE_TYPE) {
      case 'redis':
        return new RedisStorage();
      case 'upstash':
        return new UpstashRedisStorage();
      case 'kvrocks':
        return new KvrocksStorage();
      default:
        return new SafeEmptyStorage() as unknown as IStorage;
    }
  } catch (error) {
    console.error('❌ [DB Error]: 初始化存储失败:', error);
    return new SafeEmptyStorage() as unknown as IStorage;
  }
}

let storageInstance: IStorage | null = null;

function getStorage(): IStorage {
  if (!storageInstance) {
    storageInstance = createStorage();
  }
  return storageInstance;
}

export function generateStorageKey(source: string, id: string): string {
  return `${source}+${id}`;
}

export class DbManager {
  private storage: IStorage;

  constructor() {
    this.storage = getStorage();
  }

  async getPlayRecord(userName: string, source: string, id: string): Promise<PlayRecord | null> {
    const key = generateStorageKey(source, id);
    return (this.storage as any)?.getPlayRecord?.(userName, key) || null;
  }

  async savePlayRecord(userName: string, source: string, id: string, record: PlayRecord): Promise<void> {
    const key = generateStorageKey(source, id);
    await (this.storage as any)?.setPlayRecord?.(userName, key, record);
  }

  async getAllPlayRecords(userName: string): Promise<{ [key: string]: PlayRecord }> {
    return (this.storage as any)?.getAllPlayRecords?.(userName) || {};
  }

  async deletePlayRecord(userName: string, source: string, id: string): Promise<void> {
    const key = generateStorageKey(source, id);
    await (this.storage as any)?.deletePlayRecord?.(userName, key);
  }

  async getFavorite(userName: string, source: string, id: string): Promise<Favorite | null> {
    const key = generateStorageKey(source, id);
    return (this.storage as any)?.getFavorite?.(userName, key) || null;
  }

  async saveFavorite(userName: string, source: string, id: string, favorite: Favorite): Promise<void> {
    const key = generateStorageKey(source, id);
    await (this.storage as any)?.setFavorite?.(userName, key, favorite);
  }

  async getAllFavorites(userName: string): Promise<{ [key: string]: Favorite }> {
    return (this.storage as any)?.getAllFavorites?.(userName) || {};
  }

  async deleteFavorite(userName: string, source: string, id: string): Promise<void> {
    const key = generateStorageKey(source, id);
    await (this.storage as any)?.deleteFavorite?.(userName, key);
  }

  async isFavorited(userName: string, source: string, id: string): Promise<boolean> {
    const favorite = await this.getFavorite(userName, source, id);
    return favorite !== null;
  }

  async registerUser(userName: string, password: string): Promise<void> {
    await (this.storage as any)?.registerUser?.(userName, password);
  }

  async verifyUser(userName: string, password: string): Promise<boolean> {
    return (this.storage as any)?.verifyUser?.(userName, password) || false;
  }

  async checkUserExist(userName: string): Promise<boolean> {
    return (this.storage as any)?.checkUserExist?.(userName) || false;
  }

  async changePassword(userName: string, newPassword: string): Promise<void> {
    await (this.storage as any)?.changePassword?.(userName, newPassword);
  }

  async deleteUser(userName: string): Promise<void> {
    await (this.storage as any)?.deleteUser?.(userName);
  }

  async getSearchHistory(userName: string): Promise<string[]> {
    return (this.storage as any)?.getSearchHistory?.(userName) || [];
  }

  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    await (this.storage as any)?.addSearchHistory?.(userName, keyword);
  }

  async deleteSearchHistory(userName: string, keyword?: string): Promise<void> {
    await (this.storage as any)?.deleteSearchHistory?.(userName, keyword);
  }

  async getAllUsers(): Promise<string[]> {
    return (this.storage as any)?.getAllUsers?.() || [];
  }

  async getAdminConfig(): Promise<AdminConfig | null> {
    return (this.storage as any)?.getAdminConfig?.() || null;
  }

  async saveAdminConfig(config: AdminConfig): Promise<void> {
    await (this.storage as any)?.setAdminConfig?.(config);
  }

  async getSkipConfig(userName: string, source: string, id: string): Promise<SkipConfig | null> {
    return (this.storage as any)?.getSkipConfig?.(userName, source, id) || null;
  }

  async setSkipConfig(userName: string, source: string, id: string, config: SkipConfig): Promise<void> {
    await (this.storage as any)?.setSkipConfig?.(userName, source, id, config);
  }

  async deleteSkipConfig(userName: string, source: string, id: string): Promise<void> {
    await (this.storage as any)?.deleteSkipConfig?.(userName, source, id);
  }

  async getAllSkipConfigs(userName: string): Promise<{ [key: string]: SkipConfig }> {
    return (this.storage as any)?.getAllSkipConfigs?.(userName) || {};
  }

  async clearAllData(): Promise<void> {
    await (this.storage as any)?.clearAllData?.();
  }
}

export const db = new DbManager();
