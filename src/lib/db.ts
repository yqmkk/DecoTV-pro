/* eslint-disable @typescript-eslint/no-explicit-any */

import { AdminConfig } from './admin.types';
import { KvrocksStorage } from './kvrocks.db';
import { RedisStorage } from './redis.db';
import { Favorite, IStorage, PlayRecord, SkipConfig } from './types';
import { UpstashRedisStorage } from './upstash.db';

// storage type 常量
const STORAGE_TYPE =
  (process.env.NEXT_PUBLIC_STORAGE_TYPE as
    | 'localstorage'
    | 'redis'
    | 'upstash'
    | 'kvrocks'
    | undefined) || 'localstorage';

/**
 * 核心安全类：当没有任何数据库配置时，作为兜底防止崩溃
 */
class SafeEmptyStorage implements Partial<IStorage> {
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
}

// 创建存储实例的工厂函数
function createStorage(): IStorage {
  try {
    switch (STORAGE_TYPE) {
      case 'redis':
        return new RedisStorage();
      case 'upstash':
        return new UpstashRedisStorage();
      case 'kvrocks':
        return new KvrocksStorage();
      case 'localstorage':
      default:
        // 返回安全兜底实例，绝不返回 null
        console.warn('Storage: Running in SafeEmptyStorage mode (No DB detected)');
        return new SafeEmptyStorage() as unknown as IStorage;
    }
  } catch (error) {
    console.error('Storage Initialization Error:', error);
    return new SafeEmptyStorage() as unknown as IStorage;
  }
}

// 单例存储实例
let storageInstance: IStorage | null = null;

function getStorage(): IStorage {
  if (!storageInstance) {
    storageInstance = createStorage();
  }
  return storageInstance;
}

// 工具函数：生成存储key
export function generateStorageKey(source: string, id: string): string {
  return `${source}+${id}`;
}

export class DbManager {
  private storage: IStorage;

  constructor() {
    this.storage = getStorage();
  }

  // 使用可选链 (?.) 确保即使 storage 缺少某些方法也不会让 Node.js 崩溃
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
    if (this.storage && typeof (this.storage as any).getAllUsers === 'function') {
      return (this.storage as any).getAllUsers();
    }
    return [];
  }

  async getAdminConfig(): Promise<AdminConfig | null> {
    if (this.storage && typeof (this.storage as any).getAdminConfig === 'function') {
      return (this.storage as any).getAdminConfig();
    }
    return null;
  }

  async saveAdminConfig(config: AdminConfig): Promise<void> {
    if (this.storage && typeof (this.storage as any).setAdminConfig === 'function') {
      await (this.storage as any).setAdminConfig(config);
    }
  }

  async getSkipConfig(userName: string, source: string, id: string): Promise<SkipConfig | null> {
    if (typeof (this.storage as any).getSkipConfig === 'function') {
      return (this.storage as any).getSkipConfig(userName, source, id);
    }
    return null;
  }

  async setSkipConfig(userName: string, source: string, id: string, config: SkipConfig): Promise<void> {
    if (typeof (this.storage as any).setSkipConfig === 'function') {
      await (this.storage as any).setSkipConfig(userName, source, id, config);
    }
  }

  async deleteSkipConfig(userName: string, source: string, id: string): Promise<void> {
    if (typeof (this.storage as any).deleteSkipConfig === 'function') {
      await (this.storage as any).deleteSkipConfig(userName, source, id);
    }
  }

  async getAllSkipConfigs(userName: string): Promise<{ [key: string]: SkipConfig }> {
    if (typeof (this.storage as any).getAllSkipConfigs === 'function') {
      return (this.storage as any).getAllSkipConfigs(userName);
    }
    return {};
  }

  async clearAllData(): Promise<void> {
    if (typeof (this.storage as any).clearAllData === 'function') {
      await (this.storage as any).clearAllData();
    }
  }
}

export const db = new DbManager();
