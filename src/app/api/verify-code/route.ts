import { NextRequest, NextResponse } from 'next/server';
import { PREMIUM_CODES } from '@/lib/config';

// 固定验证码（从配置读取）
const FIXED_CODES: Record<string, string> = {
  [PREMIUM_CODES.FIXED_CODE.key]: PREMIUM_CODES.FIXED_CODE.value,
};

// 生成固定的月份-体验码映射（基于年份种子）
function generateExperienceCodes(year: number): Record<string, string> {
  const codes: Record<string, string> = {};
  const seed = year * 1000; // 固定种子，确保同一年生成相同的码
  
  for (let month = 1; month <= 12; month++) {
    // 基于月份和年份生成6位随机码
    const baseCode = (seed + month * 7919) * 31; // 使用质数增加随机性
    const code = Math.abs(baseCode % 1000000).toString().padStart(6, '0');
    codes[`YQ${month}`] = code;
  }
  
  return codes;
}

// 获取当前年份的体验码映射
function getExperienceCodes(): Record<string, string> {
  const currentYear = new Date().getFullYear();
  const dynamicCodes = PREMIUM_CODES.ENABLE_MONTHLY_CODES 
    ? generateExperienceCodes(currentYear) 
    : {};
  // 合并动态验证码和固定验证码
  return { ...dynamicCodes, ...FIXED_CODES };
}

// 验证体验码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, month } = body;
    
    const currentMonth = new Date().getMonth() + 1;
    const expectedKey = `YQ${month || currentMonth}`;
    const codes = getExperienceCodes();
    
    if (!code) {
      return NextResponse.json({
        success: false,
        error: '请输入体验码',
        expectedKey: expectedKey
      });
    }
    
    // 验证码是否正确（支持月份验证码和固定验证码）
    let isValid = false;
    
    // 检查月份验证码
    if (codes[expectedKey] === code) {
      isValid = true;
    }
    
    // 检查固定验证码（任意时候都可使用）
    if (FIXED_CODES['YQFX'] === code) {
      isValid = true;
    }
    
    if (isValid) {
      // 返回验证成功，并设置一个过期时间（如1小时）
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1小时后过期
      return NextResponse.json({
        success: true,
        message: '验证成功，已解锁高级功能',
        expiresAt
      });
    } else {
      return NextResponse.json({
        success: false,
        error: '体验码错误，请检查后重试',
        expectedKey: expectedKey
      });
    }
  } catch (error) {
    console.error('验证体验码失败:', error);
    return NextResponse.json({
      success: false,
      error: '验证失败，请稍后重试'
    }, { status: 500 });
  }
}

// 获取当前月份的key
export async function GET() {
  const currentMonth = new Date().getMonth() + 1;
  const expectedKey = `YQ${currentMonth}`;
  
  return NextResponse.json({
    expectedKey,
    month: currentMonth
  });
}
