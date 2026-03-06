import fs from 'fs';
import path from 'path';

// 已使用充值验证码存储文件路径
const USED_CODES_FILE = path.join(process.cwd(), 'data', 'used-recharge-codes.json');

// 确保数据目录存在
function ensureDataDir() {
  const dataDir = path.dirname(USED_CODES_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 读取已使用的验证码列表
export function getUsedRechargeCodes(): string[] {
  try {
    ensureDataDir();
    if (fs.existsSync(USED_CODES_FILE)) {
      const content = fs.readFileSync(USED_CODES_FILE, 'utf-8');
      return JSON.parse(content);
    }
    return [];
  } catch (error) {
    console.error('读取已使用验证码文件失败:', error);
    return [];
  }
}

// 添加已使用的验证码
export function addUsedRechargeCode(code: string): boolean {
  try {
    ensureDataDir();
    const usedCodes = getUsedRechargeCodes();
    if (usedCodes.includes(code)) {
      return false; // 已经存在
    }
    usedCodes.push(code);
    fs.writeFileSync(USED_CODES_FILE, JSON.stringify(usedCodes, null, 2));
    return true;
  } catch (error) {
    console.error('写入已使用验证码文件失败:', error);
    return false;
  }
}

// 检查验证码是否已被使用
export function isRechargeCodeUsed(code: string): boolean {
  const usedCodes = getUsedRechargeCodes();
  return usedCodes.includes(code);
}
