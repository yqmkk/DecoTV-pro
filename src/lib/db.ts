/* eslint-disable @typescript-eslint/no-explicit-any */
import { AdminConfig } from './admin.types';
import { KvrocksStorage } from './kvrocks.db';
import { RedisStorage } from './redis.db';
import { Favorite, IStorage, PlayRecord, SkipConfig } from './types';
import { UpstashRedisStorage } from './upstash.db';

// 严格获取存储类型，并在控制台明确打印
const STORAGE_TYPE = (process.env.NEXT_PUBLIC_STORAGE_TYPE as any) || 'localstorage';

/**
 * 安全兜底类：当数据库未配置时，打印警告并防止崩溃
 */
class SafeEmptyStorage implements Partial<IStorage> {
  constructor() {
    console.warn('⚠️ [DB Warning]: 正在运行 SafeEmptyStorage 模式！所有保存操作都将无效。请检查环境变量 NEXT_PUBLIC_STORAGE_TYPE 是否为 redis');
  }
  async getPlayRecord() { return null; }
  async setPlayRecord() { console.log('❌ 写入失败：当前为 SafeEmptyStorage 模式'); return; }
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
  async setAdminConfig(config: AdminConfig) { 
    console.error('❌ 无法保存 AdminConfig：数据库未连接。配置内容：', JSON.stringify(config).substring(0, 50) + '...');
    return; 
  }
}

function createStorage(): IStorage {
  console.log('🚀 [DB Init]: 尝试初始化存储引擎 ->', STORAGE_TYPE);
  try {
    switch (STORAGE_TYPE) {
      case 'redis':
        console.log('✅ [DB Success]: 已选择 Redis 存储');
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

  async getAdminConfig(): Promise<AdminConfig | null> {
    return (this.storage as any)?.getAdminConfig?.() || null;
  }

  async saveAdminConfig(config: AdminConfig): Promise<void> {
    await (this.storage as any)?.setAdminConfig?.(config);
  }

  // ... 其余方法保持不变
  async getPlayRecord(userName: string, source: string, id: string): Promise<PlayRecord | null> {
    const key = generateStorageKey(source, id);
    return (this.storage as any)?.getPlayRecord?.(userName, key) || null;
  }

  async savePlayRecord(userName: string, source: string, id: string, record: PlayRecord): Promise<void> {
    const key = generateStorageKey(source, id);
    await (this.storage as any)?.setPlayRecord?.(userName, key, record);
  }
}

export const db = new DbManager();
