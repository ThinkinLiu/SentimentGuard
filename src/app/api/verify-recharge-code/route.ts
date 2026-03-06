import { NextRequest, NextResponse } from 'next/server';
import { PREMIUM_CODES } from '@/lib/config';
import { isRechargeCodeUsed, addUsedRechargeCode } from '@/lib/used-recharge-codes';

// 充值验证码验证接口
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;
    
    if (!code) {
      return NextResponse.json({
        success: false,
        error: '请输入充值验证码',
      });
    }
    
    // 检查验证码是否在有效列表中
    const isValidCode = PREMIUM_CODES.RECHARGE_CODES.includes(code);
    
    if (!isValidCode) {
      return NextResponse.json({
        success: false,
        error: '充值验证码无效',
      });
    }
    
    // 检查验证码是否已被使用（后端全局存储）
    if (isRechargeCodeUsed(code)) {
      return NextResponse.json({
        success: false,
        error: '该充值验证码已被使用',
      });
    }
    
    // 标记验证码为已使用
    const added = addUsedRechargeCode(code);
    if (!added) {
      return NextResponse.json({
        success: false,
        error: '验证码使用失败，请稍后重试',
      });
    }
    
    // 验证成功，返回充值次数
    return NextResponse.json({
      success: true,
      message: '充值成功',
      rechargeCount: PREMIUM_CODES.RECHARGE_COUNT_PER_CODE,
    });
  } catch (error) {
    console.error('验证充值验证码失败:', error);
    return NextResponse.json({
      success: false,
      error: '验证失败，请稍后重试'
    }, { status: 500 });
  }
}
