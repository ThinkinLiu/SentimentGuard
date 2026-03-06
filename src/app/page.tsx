'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Search, Loader2, ExternalLink, TrendingUp, TrendingDown, AlertCircle, Calendar as CalendarIcon, User, Globe, Newspaper, Video, Building2, MessageCircle, Settings, ChevronDown, X, FileText, Download, Printer, ArrowRight, Gift } from 'lucide-react';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PLATFORMS, DEFAULT_PLATFORMS, CATEGORY_ICONS } from '@/lib/platforms';
import { 
  FREE_USER_CONFIG, 
  PREMIUM_USER_CONFIG, 
  WECHAT_CONFIG,
  ENABLED_PLATFORMS,
  PREMIUM_EXPIRE_TIME,
  PREMIUM_CODES
} from '@/lib/config';

// 时间范围预设选项
const TIME_RANGE_OPTIONS = [
  { value: '1d', label: '1天内' },
  { value: '7d', label: '7天内' },
  { value: '15d', label: '15天内' },
  { value: '1m', label: '1个月内' },
  { value: '3m', label: '3个月内' },
  { value: '6m', label: '半年内' },
  { value: '1y', label: '1年内' },
  { value: 'custom', label: '自定义' },
];

// 获取时间范围对应的日期
function getDateRange(timeRange: string): { startDate?: string; endDate?: string } {
  const now = new Date();
  const endDate = format(now, 'yyyy-MM-dd');
  
  switch (timeRange) {
    case '1d':
      return { startDate: format(subDays(now, 1), 'yyyy-MM-dd'), endDate };
    case '7d':
      return { startDate: format(subDays(now, 7), 'yyyy-MM-dd'), endDate };
    case '15d':
      return { startDate: format(subDays(now, 15), 'yyyy-MM-dd'), endDate };
    case '1m':
      return { startDate: format(subMonths(now, 1), 'yyyy-MM-dd'), endDate };
    case '3m':
      return { startDate: format(subMonths(now, 3), 'yyyy-MM-dd'), endDate };
    case '6m':
      return { startDate: format(subMonths(now, 6), 'yyyy-MM-dd'), endDate };
    case '1y':
      return { startDate: format(subYears(now, 1), 'yyyy-MM-dd'), endDate };
    case 'custom':
      return {};
    default:
      return { startDate: format(subDays(now, 7), 'yyyy-MM-dd'), endDate };
  }
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishTime?: string;
  author?: string;
  siteName?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentReason?: string;
}

interface PlatformResult {
  platform: typeof PLATFORMS[0];
  results: SearchResult[];
  negativeCount: number;
  positiveCount: number;
}

interface AnalysisData {
  companyName: string;
  keywords: string[];
  platforms: PlatformResult[];
  totalNegative: number;
  totalPositive: number;
  totalResults?: number;
  riskLevel: 'low' | 'medium' | 'high';
  searchParams?: {
    platformCount: number;
    timeRange?: string;
    startDate?: string;
    endDate?: string;
  };
}

// 获取可用平台列表（如果配置了ENABLED_PLATFORMS，则只使用配置的平台）
const AVAILABLE_PLATFORMS = ENABLED_PLATFORMS.length > 0 
  ? PLATFORMS.filter(p => ENABLED_PLATFORMS.includes(p.id))
  : PLATFORMS;

// 根据可用平台获取默认选择的平台
const GET_DEFAULT_PLATFORMS = () => {
  if (ENABLED_PLATFORMS.length > 0) {
    // 如果配置了ENABLED_PLATFORMS，默认选择前3个可用平台
    return AVAILABLE_PLATFORMS.slice(0, Math.min(3, FREE_USER_CONFIG.MAX_PLATFORMS_COUNT)).map((p: typeof PLATFORMS[0]) => p.id);
  }
  return DEFAULT_PLATFORMS;
};

// 根据配置获取公众号回复的 key
// 如果启用月度验证码，返回月度 key（如 YQ3）
// 否则返回固定 key（YQFX）
const getExpectedKey = (month?: number): string => {
  if (PREMIUM_CODES.ENABLE_MONTHLY_CODES) {
    const currentMonth = month || new Date().getMonth() + 1;
    return `YQ${currentMonth}`;
  }
  return PREMIUM_CODES.FIXED_CODE.key;
};

export default function Home() {
  // 企业名称状态（必填）
  const [companyName, setCompanyName] = useState('');
  
  // 关键字状态（可选）
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [showMaxKeywordsDialog, setShowMaxKeywordsDialog] = useState(false); // 达到最大关键字数提示
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [streamingText, setStreamingText] = useState('');
  
  // 平台选择状态
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(GET_DEFAULT_PLATFORMS());
  const [showPlatformSelector, setShowPlatformSelector] = useState(false);
  
  // 高级功能解锁状态
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);
  const [showMaxPlatformsDialog, setShowMaxPlatformsDialog] = useState(false); // 达到最大平台数提示
  const [premiumCode, setPremiumCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [expectedKey, setExpectedKey] = useState(getExpectedKey());
  const [codeError, setCodeError] = useState('');
  
  // 分析次数限制状态
  const [analysisCount, setAnalysisCount] = useState(0);
  const [showAnalysisLimitDialog, setShowAnalysisLimitDialog] = useState(false); // 普通用户超过3次提示
  const [showMaxAnalysisDialog, setShowMaxAnalysisDialog] = useState(false); // 高级用户超过50次提示
  const [showReportPremiumDialog, setShowReportPremiumDialog] = useState(false); // 报告导出验证对话框
  const [reportPremiumAction, setReportPremiumAction] = useState<'print' | 'export'>('export'); // 记录触发验证的操作类型
  
  // 充值验证码相关状态
  const [rechargeCode, setRechargeCode] = useState('');
  const [verifyingRechargeCode, setVerifyingRechargeCode] = useState(false);
  const [rechargeCodeError, setRechargeCodeError] = useState('');
  const [showRechargeSuccess, setShowRechargeSuccess] = useState(false);
  const [rechargedCount, setRechargedCount] = useState(0);
  
  // 报告相关状态
  const [showReport, setShowReport] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  // 时间范围状态
  const [timeRange, setTimeRange] = useState('1m');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [showCustomDate, setShowCustomDate] = useState(false);

  // 平台选择限制（从配置读取）
  const MAX_PLATFORMS_FREE = FREE_USER_CONFIG.MAX_PLATFORMS_COUNT;
  const MAX_PLATFORMS_PREMIUM = PREMIUM_USER_CONFIG.MAX_PLATFORMS_COUNT;
  const getMaxPlatforms = () => isPremiumUnlocked ? MAX_PLATFORMS_PREMIUM : MAX_PLATFORMS_FREE;
  
  // 关键字数量限制（从配置读取）
  const MAX_KEYWORDS_FREE = FREE_USER_CONFIG.MAX_KEYWORDS_COUNT;
  const MAX_KEYWORDS_PREMIUM = PREMIUM_USER_CONFIG.MAX_KEYWORDS_COUNT;
  const getMaxKeywords = () => isPremiumUnlocked ? MAX_KEYWORDS_PREMIUM : MAX_KEYWORDS_FREE;
  
  // 分析次数限制（从配置读取）
  const MAX_ANALYSIS_FREE = FREE_USER_CONFIG.MAX_ANALYSIS_COUNT;
  const MAX_ANALYSIS_PREMIUM = PREMIUM_USER_CONFIG.MAX_ANALYSIS_COUNT;
  const getMaxAnalysisCount = () => isPremiumUnlocked ? MAX_ANALYSIS_PREMIUM : MAX_ANALYSIS_FREE;
  
  // 报告功能权限（从配置读取）
  const canPrint = isPremiumUnlocked ? PREMIUM_USER_CONFIG.ENABLE_PRINT : FREE_USER_CONFIG.ENABLE_PRINT;
  const canExportPdf = isPremiumUnlocked ? PREMIUM_USER_CONFIG.ENABLE_EXPORT_PDF : FREE_USER_CONFIG.ENABLE_EXPORT_PDF;
  
  // 初始化：从localStorage读取分析次数和解锁状态
  useEffect(() => {
    const savedCount = localStorage.getItem('analysisCount');
    const savedUnlocked = localStorage.getItem('isPremiumUnlocked');
    const savedUnlockTime = localStorage.getItem('premiumUnlockTime');
    
    if (savedCount) {
      setAnalysisCount(parseInt(savedCount, 10) || 0);
    }
    
    // 检查解锁状态是否过期
    if (savedUnlocked === 'true' && savedUnlockTime) {
      const unlockTime = parseInt(savedUnlockTime, 10);
      const now = Date.now();
      
      if (now - unlockTime < PREMIUM_EXPIRE_TIME) {
        setIsPremiumUnlocked(true);
      } else {
        // 已过期，清除状态
        localStorage.removeItem('isPremiumUnlocked');
        localStorage.removeItem('premiumUnlockTime');
      }
    }
  }, []);
  
  // 保存分析次数到localStorage
  const incrementAnalysisCount = () => {
    const newCount = analysisCount + 1;
    setAnalysisCount(newCount);
    localStorage.setItem('analysisCount', newCount.toString());
  };

  // 添加关键字
  const addKeyword = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    
    // 检查是否已存在
    if (keywords.includes(trimmed)) return;
    
    // 检查数量限制
    const maxKeywords = getMaxKeywords();
    if (keywords.length >= maxKeywords) {
      if (!isPremiumUnlocked) {
        setExpectedKey(getExpectedKey());
        setShowPremiumDialog(true);
      } else {
        setShowMaxKeywordsDialog(true);
      }
      return;
    }
    
    setKeywords(prev => [...prev, trimmed]);
  };

  // 移除关键字
  const removeKeyword = (keyword: string) => {
    setKeywords(prev => prev.filter(k => k !== keyword));
  };

  // 处理关键字输入回车
  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword(keywordInput);
      setKeywordInput('');
    }
  };

  // 切换平台选择
  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(id => id !== platformId);
      } else {
        const maxPlatforms = getMaxPlatforms();
        // 检查是否已达到上限
        if (prev.length >= maxPlatforms) {
          if (!isPremiumUnlocked) {
            // 普通用户：弹出解锁提示
            const currentMonth = new Date().getMonth() + 1;
            setExpectedKey(getExpectedKey());
            setShowPremiumDialog(true);
          } else {
            // 高级用户：弹出联系公众号提示
            setShowMaxPlatformsDialog(true);
          }
          return prev;
        }
        return [...prev, platformId];
      }
    });
  };

  // 按分类切换平台
  const toggleCategory = (category: string) => {
    const categoryPlatforms = AVAILABLE_PLATFORMS.filter(p => p.category === category).map(p => p.id);
    const allSelected = categoryPlatforms.every(id => selectedPlatforms.includes(id));
    
    if (allSelected) {
      setSelectedPlatforms(prev => prev.filter(id => !categoryPlatforms.includes(id)));
    } else {
      // 计算新增后的数量
      const newPlatforms = categoryPlatforms.filter(id => !selectedPlatforms.includes(id));
      const totalCount = selectedPlatforms.length + newPlatforms.length;
      const maxPlatforms = getMaxPlatforms();
      
      if (totalCount > maxPlatforms) {
        if (!isPremiumUnlocked) {
          const currentMonth = new Date().getMonth() + 1;
          setExpectedKey(getExpectedKey());
          setShowPremiumDialog(true);
        } else {
          setShowMaxPlatformsDialog(true);
        }
        return;
      }
      
      setSelectedPlatforms(prev => [...new Set([...prev, ...categoryPlatforms])]);
    }
  };

  // 全选/取消全选
  const toggleAllPlatforms = () => {
    const maxPlatforms = getMaxPlatforms();
    if (selectedPlatforms.length === AVAILABLE_PLATFORMS.length) {
      setSelectedPlatforms([]);
    } else if (AVAILABLE_PLATFORMS.length > maxPlatforms) {
      // 平台总数超过限制，选择最大数量的平台
      if (!isPremiumUnlocked) {
        const currentMonth = new Date().getMonth() + 1;
        setExpectedKey(getExpectedKey());
        setShowPremiumDialog(true);
        return;
      } else {
        // 高级用户：选择前10个平台
        setSelectedPlatforms(AVAILABLE_PLATFORMS.slice(0, MAX_PLATFORMS_PREMIUM).map(p => p.id));
        setShowMaxPlatformsDialog(true);
      }
    } else {
      setSelectedPlatforms(AVAILABLE_PLATFORMS.map(p => p.id));
    }
  };

  // 验证体验码
  const verifyCode = async () => {
    if (!premiumCode.trim()) {
      setCodeError('请输入体验码');
      return;
    }
    
    setVerifyingCode(true);
    setCodeError('');
    
    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: premiumCode.trim() })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsPremiumUnlocked(true);
        setShowPremiumDialog(false);
        setPremiumCode('');
        // 保存解锁状态到localStorage
        localStorage.setItem('isPremiumUnlocked', 'true');
        localStorage.setItem('premiumUnlockTime', Date.now().toString());
      } else {
        setCodeError(result.error || '体验码错误');
      }
    } catch (error) {
      setCodeError('验证失败，请稍后重试');
    } finally {
      setVerifyingCode(false);
    }
  };

  // 验证充值验证码
  const verifyRechargeCode = async () => {
    if (!rechargeCode.trim()) {
      setRechargeCodeError('请输入充值验证码');
      return;
    }
    
    setVerifyingRechargeCode(true);
    setRechargeCodeError('');
    
    try {
      const response = await fetch('/api/verify-recharge-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: rechargeCode.trim() })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 重置分析次数（用户可继续使用）
        setAnalysisCount(0);
        localStorage.setItem('analysisCount', '0');
        
        // 显示成功提示
        setRechargedCount(result.rechargeCount);
        setShowRechargeSuccess(true);
        setRechargeCode('');
        
        // 2秒后关闭对话框和成功提示
        setTimeout(() => {
          setShowMaxAnalysisDialog(false);
          setShowRechargeSuccess(false);
        }, 2000);
      } else {
        setRechargeCodeError(result.error || '充值验证码无效');
      }
    } catch (error) {
      setRechargeCodeError('验证失败，请稍后重试');
    } finally {
      setVerifyingRechargeCode(false);
    }
  };

  const analyzeCompany = useCallback(async () => {
    if (!companyName.trim() || selectedPlatforms.length === 0) return;

    // 检查分析次数限制
    const maxCount = getMaxAnalysisCount();
    if (analysisCount >= maxCount) {
      if (!isPremiumUnlocked) {
        // 普通用户超过3次，弹出解锁提示
        const currentMonth = new Date().getMonth() + 1;
        setExpectedKey(getExpectedKey());
        setShowAnalysisLimitDialog(true);
      } else {
        // 高级用户超过50次，弹出联系公众号提示
        setShowMaxAnalysisDialog(true);
      }
      return;
    }

    setLoading(true);
    setData(null);
    setStreamingText('');
    
    // 增加分析次数
    incrementAnalysisCount();

    // 构建时间范围参数
    let startDate: string | undefined;
    let endDate: string | undefined;
    
    if (timeRange === 'custom') {
      if (customStartDate) startDate = format(customStartDate, 'yyyy-MM-dd');
      if (customEndDate) endDate = format(customEndDate, 'yyyy-MM-dd');
    } else {
      const range = getDateRange(timeRange);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          companyName: companyName.trim(),  // 企业名称（必填）
          keywords: keywords,  // 关键字（可选）
          platforms: selectedPlatforms,
          startDate,
          endDate,
          isPremium: isPremiumUnlocked,  // 传递用户类型
        }),
      });

      if (!response.ok) {
        throw new Error('分析请求失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6);
              const parsed = JSON.parse(jsonStr);

              if (parsed.type === 'status') {
                setStreamingText(parsed.message);
              } else if (parsed.type === 'result') {
                setData(parsed.data);
              } else if (parsed.type === 'error') {
                console.error('Analysis error:', parsed.message);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
      setStreamingText('');
    }
  }, [companyName, keywords, selectedPlatforms, timeRange, customStartDate, customEndDate, analysisCount, isPremiumUnlocked]);

  const getSentimentBadge = (sentiment: string, reason?: string) => {
    if (sentiment === 'negative') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          负面评价
          {reason && <span className="text-xs opacity-80">({reason})</span>}
        </Badge>
      );
    }
    if (sentiment === 'positive') {
      return (
        <Badge variant="default" className="bg-green-500 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          正面评价
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <TrendingDown className="w-3 h-3" />
        中性评价
      </Badge>
    );
  };

  const getRiskBadge = (level: string) => {
    if (level === 'high') {
      return (
        <Badge variant="destructive" className="text-lg px-4 py-2">
          <AlertCircle className="w-5 h-5 mr-2" />
          高风险警示
        </Badge>
      );
    }
    if (level === 'medium') {
      return (
        <Badge variant="outline" className="text-lg px-4 py-2 border-orange-500 text-orange-500">
          <AlertTriangle className="w-5 h-5 mr-2" />
          中等风险
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-lg px-4 py-2 border-green-500 text-green-500">
        <TrendingUp className="w-5 h-5 mr-2" />
        低风险
      </Badge>
    );
  };

  // 平台卡片组件
  const PlatformCard = ({ 
    platformData, 
    getSentimentBadge 
  }: { 
    platformData: PlatformResult; 
    getSentimentBadge: (sentiment: string, reason?: string) => React.ReactNode;
  }) => (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${platformData.platform.color}`} />
            <CardTitle className="text-base">{platformData.platform.name}</CardTitle>
            {platformData.platform.category && (
              <Badge variant="outline" className="text-xs">
                {CATEGORY_ICONS[platformData.platform.category]}
                <span className="ml-1">{platformData.platform.category}</span>
              </Badge>
            )}
          </div>
          <div className="flex gap-2 text-sm">
            <span className="text-green-600">+{platformData.positiveCount}</span>
            <span className="text-red-600">-{platformData.negativeCount}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {platformData.results.length === 0 ? (
          <div className="text-center py-4 text-slate-400 text-sm">暂无搜索结果</div>
        ) : (
          <ScrollArea className="h-[280px] pr-3">
            <div className="space-y-2">
              {platformData.results.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border transition-all ${
                    result.sentiment === 'negative'
                      ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                      : result.sentiment === 'positive'
                      ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sm hover:text-blue-600 flex-1 line-clamp-2"
                    >
                      {result.title}
                    </a>
                    <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{result.snippet}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                    {result.publishTime && (
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {result.publishTime}
                      </span>
                    )}
                    {result.author && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {result.author}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">{getSentimentBadge(result.sentiment, result.sentimentReason)}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );

  // 获取时间范围显示文本
  const getTimeRangeLabel = () => {
    if (timeRange === 'custom') {
      if (customStartDate && customEndDate) {
        return `${format(customStartDate, 'MM/dd')} - ${format(customEndDate, 'MM/dd')}`;
      }
      return '自定义时间';
    }
    return TIME_RANGE_OPTIONS.find(o => o.value === timeRange)?.label || '7天内';
  };

  // 生成报告时间范围描述
  const getReportTimeRange = () => {
    if (timeRange === 'custom' && customStartDate && customEndDate) {
      return `${format(customStartDate, 'yyyy年MM月dd日')} 至 ${format(customEndDate, 'yyyy年MM月dd日')}`;
    }
    return getTimeRangeLabel();
  };

  // 导出PDF - 使用 html2canvas + iframe 隔离方案
  const exportToPdf = async () => {
    if (!reportRef.current || !data) return;
    
    setExportingPdf(true);
    
    try {
      // 创建一个完全隔离的 iframe 来渲染报告
      const iframe = document.createElement('iframe');
      iframe.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 800px;
        height: 5000px;
        border: none;
        background: white;
      `;
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('无法创建iframe文档');
      }
      
      // 获取选中的平台名称列表
      const platformNames = data.platforms.map(p => p.platform?.name || '').filter(Boolean).join('、');
      
      // 生成报告 HTML 内容
      const reportHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: 'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', 'SimHei', sans-serif;
              background: #ffffff;
              color: #1e293b;
              font-size: 14px;
              line-height: 1.6;
              -webkit-font-smoothing: antialiased;
            }
            
            .container {
              padding: 30px 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e2e8f0;
            }
            
            .header h1 {
              font-size: 26px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 12px;
            }
            
            .header .meta {
              color: #64748b;
              font-size: 13px;
              line-height: 1.8;
            }
            
            .header .platforms {
              margin-top: 8px;
              padding: 10px 15px;
              background: #f8fafc;
              border-radius: 6px;
              font-size: 12px;
              color: #475569;
              text-align: left;
            }
            
            .header .platforms strong {
              color: #1e293b;
            }
            
            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 25px;
            }
            
            .summary-item {
              text-align: center;
              padding: 18px 10px;
              border-radius: 8px;
            }
            
            .summary-item.blue { background: #eff6ff; }
            .summary-item.green { background: #f0fdf4; }
            .summary-item.red { background: #fef2f2; }
            .summary-item.gray { background: #f1f5f9; }
            
            .summary-item .number {
              font-size: 28px;
              font-weight: 700;
            }
            .summary-item.blue .number { color: #2563eb; }
            .summary-item.green .number { color: #16a34a; }
            .summary-item.red .number { color: #dc2626; }
            .summary-item.gray .number { color: #475569; }
            
            .summary-item .label {
              font-size: 12px;
              margin-top: 6px;
            }
            .summary-item.blue .label { color: #2563eb; }
            .summary-item.green .label { color: #16a34a; }
            .summary-item.red .label { color: #dc2626; }
            .summary-item.gray .label { color: #475569; }
            
            .risk-box {
              margin-bottom: 25px;
              padding: 18px;
              border-radius: 8px;
              border: 2px solid;
            }
            .risk-box.high { border-color: #dc2626; background: #fef2f2; }
            .risk-box.medium { border-color: #f97316; background: #fff7ed; }
            .risk-box.low { border-color: #16a34a; background: #f0fdf4; }
            
            .risk-box h3 {
              font-size: 16px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            .risk-box.high h3 { color: #dc2626; }
            .risk-box.medium h3 { color: #f97316; }
            .risk-box.low h3 { color: #16a34a; }
            
            .risk-box p {
              font-size: 13px;
              color: #475569;
            }
            
            .warning-box {
              margin-bottom: 25px;
              padding: 15px;
              background: #fef2f2;
              border: 1px solid #fecaca;
              border-radius: 8px;
            }
            
            .warning-box h4 {
              color: #991b1b;
              font-weight: 700;
              margin-bottom: 6px;
              font-size: 14px;
            }
            
            .warning-box p {
              color: #b91c1c;
              font-size: 13px;
            }
            
            .section-title {
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 15px;
              color: #1e293b;
              padding-bottom: 8px;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .platform-block {
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 1px solid #f1f5f9;
              page-break-inside: avoid;
            }
            
            .platform-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 12px;
            }
            
            .platform-info {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .platform-dot {
              width: 10px;
              height: 10px;
              border-radius: 50%;
            }
            
            .platform-name {
              font-weight: 700;
              font-size: 14px;
              color: #1e293b;
            }
            
            .platform-category {
              font-size: 12px;
              color: #94a3b8;
            }
            
            .platform-stats {
              display: flex;
              gap: 15px;
              font-size: 13px;
            }
            
            .stat-positive { color: #16a34a; }
            .stat-negative { color: #dc2626; }
            
            .result-item {
              padding: 12px;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              margin-bottom: 10px;
              page-break-inside: avoid;
            }
            
            .result-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            
            .result-content {
              flex: 1;
              padding-right: 10px;
            }
            
            .result-title {
              font-weight: 500;
              font-size: 13px;
              color: #1e293b;
              margin-bottom: 4px;
            }
            
            .result-snippet {
              font-size: 12px;
              color: #64748b;
              margin-bottom: 6px;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            
            .result-meta {
              font-size: 11px;
              color: #94a3b8;
            }
            
            .result-sentiment {
              padding: 4px 10px;
              border-radius: 4px;
              font-size: 12px;
              white-space: nowrap;
            }
            .result-sentiment.negative { background: #fef2f2; color: #dc2626; }
            .result-sentiment.positive { background: #f0fdf4; color: #16a34a; }
            .result-sentiment.neutral { background: #f1f5f9; color: #475569; }
            
            .result-reason {
              font-size: 11px;
              color: #dc2626;
              margin-top: 6px;
            }
            
            .no-results {
              color: #94a3b8;
              font-size: 13px;
              padding: 10px 0;
            }
            
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${data.companyName} 舆情分析报告</h1>
              ${data.keywords && data.keywords.length > 0 ? `<div class="meta">关键字：${data.keywords.join('、')}</div>` : ''}
              <div class="meta">生成时间：${format(new Date(), 'yyyy年MM月dd日 HH:mm')}</div>
              <div class="meta">时间范围：${getReportTimeRange()}</div>
              <div class="platforms">
                <strong>检索平台（${data.platforms.length}个）：</strong>${platformNames}
              </div>
            </div>
            
            <div class="summary">
              <div class="summary-item blue">
                <div class="number">${data.totalResults ?? data.platforms.reduce((sum, p) => sum + p.results.length, 0)}</div>
                <div class="label">相关内容</div>
              </div>
              <div class="summary-item green">
                <div class="number">${data.totalPositive}</div>
                <div class="label">正面评价</div>
              </div>
              <div class="summary-item red">
                <div class="number">${data.totalNegative}</div>
                <div class="label">负面评价</div>
              </div>
              <div class="summary-item gray">
                <div class="number">${(data.totalResults ?? data.platforms.reduce((sum, p) => sum + p.results.length, 0)) - data.totalPositive - data.totalNegative}</div>
                <div class="label">中性评价</div>
              </div>
            </div>
            
            <div class="risk-box ${data.riskLevel}">
              <h3>风险评估：${data.riskLevel === 'high' ? '高风险' : data.riskLevel === 'medium' ? '中等风险' : '低风险'}</h3>
              <p>${data.riskLevel === 'high' ? '检测到较多负面评价，舆情风险较高，建议立即采取公关措施，积极回应负面舆论。' : data.riskLevel === 'medium' ? '检测到一定数量的负面评价，舆情风险中等，建议密切关注舆论动向，适时回应。' : '整体舆情状况良好，负面评价较少，建议继续保持良好的企业形象。'}</p>
            </div>
            
            ${data.totalNegative > 0 ? `
            <div class="warning-box">
              <h4>⚠️ 负面评价警示</h4>
              <p>检测到 ${data.totalNegative} 条负面评价，建议及时关注并采取公关措施。负面评价可能影响企业声誉和公众形象。</p>
            </div>
            ` : ''}
            
            <div class="section-title">各平台舆情详情</div>
            
            ${data.platforms.map(platformData => {
              const colorMap: Record<string, string> = {
                'orange': '#f97316', 'pink': '#ec4899', 'amber': '#f59e0b',
                'cyan': '#06b6d4', 'blue': '#2563eb', 'green': '#16a34a',
                'red': '#dc2626', 'black': '#1e293b'
              };
              const colorStr = platformData.platform?.color || '';
              let dotColor = '#64748b';
              for (const [key, value] of Object.entries(colorMap)) {
                if (colorStr.includes(key)) {
                  dotColor = value;
                  break;
                }
              }
              
              return `
                <div class="platform-block">
                  <div class="platform-header">
                    <div class="platform-info">
                      <div class="platform-dot" style="background-color: ${dotColor}"></div>
                      <span class="platform-name">${platformData.platform?.name || '未知平台'}</span>
                      <span class="platform-category">(${platformData.platform?.category || '未知类别'})</span>
                    </div>
                    <div class="platform-stats">
                      <span class="stat-positive">正面 +${platformData.positiveCount}</span>
                      <span class="stat-negative">负面 -${platformData.negativeCount}</span>
                    </div>
                  </div>
                  
                  ${platformData.results.length === 0 ? '<div class="no-results">暂无搜索结果</div>' :
                    platformData.results.map(result => `
                      <div class="result-item">
                        <div class="result-top">
                          <div class="result-content">
                            <div class="result-title">${result.title}</div>
                            <div class="result-snippet">${result.snippet}</div>
                            <div class="result-meta">
                              ${result.publishTime ? result.publishTime : ''}
                              ${result.author ? (result.publishTime ? ' · ' : '') + result.author : ''}
                              ${result.siteName ? ((result.publishTime || result.author) ? ' · ' : '') + result.siteName : ''}
                            </div>
                          </div>
                          <span class="result-sentiment ${result.sentiment}">
                            ${result.sentiment === 'negative' ? '负面' : result.sentiment === 'positive' ? '正面' : '中性'}
                          </span>
                        </div>
                        ${result.sentimentReason ? `<div class="result-reason">原因：${result.sentimentReason}</div>` : ''}
                      </div>
                    `).join('')
                  }
                </div>
              `;
            }).join('')}
            
            <div class="footer">
              本报告由企业舆情分析系统自动生成，仅供参考
            </div>
          </div>
        </body>
        </html>
      `;
      
      // 写入 HTML
      iframeDoc.open();
      iframeDoc.write(reportHtml);
      iframeDoc.close();
      
      // 等待字体和样式加载
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 使用 html2canvas 截图
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 800,
      });
      
      // 清理 iframe
      document.body.removeChild(iframe);
      
      // 生成 PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = margin;
      
      // 添加第一页
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 2 * margin);
      
      // 添加后续页
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 2 * margin);
      }
      
      // 保存 PDF
      const fileName = `舆情分析报告_${data.companyName}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('PDF导出失败:', error);
    } finally {
      setExportingPdf(false);
    }
  };

  // 打印报告
  const printReport = () => {
    if (!reportRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>舆情分析报告 - ${data?.companyName}</title>
          <style>
            body { font-family: 'Microsoft YaHei', sans-serif; padding: 20px; }
            .report-header { text-align: center; margin-bottom: 30px; }
            .report-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .report-meta { color: #666; font-size: 14px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .summary-item { text-align: center; padding: 15px; border-radius: 8px; }
            .summary-value { font-size: 28px; font-weight: bold; }
            .summary-label { font-size: 12px; margin-top: 5px; }
            .platform-section { margin-bottom: 25px; }
            .platform-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .platform-name { font-size: 16px; font-weight: bold; }
            .result-item { padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 8px; }
            .result-title { font-weight: 500; margin-bottom: 5px; }
            .result-meta { font-size: 12px; color: #666; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
            .badge-negative { background: #fee2e2; color: #dc2626; }
            .badge-positive { background: #dcfce7; color: #16a34a; }
            .badge-neutral { background: #f3f4f6; color: #4b5563; }
            .warning-box { padding: 15px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 20px; }
            .warning-title { font-weight: bold; color: #dc2626; margin-bottom: 5px; }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          ${reportRef.current.innerHTML}
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Search className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold">企业舆情分析系统</h1>
              </div>
              <p className="text-sm text-slate-500 mt-1">实时监测各大平台对企业评价，智能识别恶意舆情风险</p>
            </div>
            <div className="flex items-center gap-3">
              {isPremiumUnlocked ? (
                <Badge variant="default" className="bg-green-600 text-sm px-3 py-1">
                  ✓ 已解锁高级功能
                </Badge>
              ) : (
                <Button 
                  variant="outline" 
                  className="text-primary border-primary hover:bg-primary/10"
                  onClick={() => {
                    const currentMonth = new Date().getMonth() + 1;
                    setExpectedKey(getExpectedKey());
                    setShowPremiumDialog(true);
                  }}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  免费解锁高级功能
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Section */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="pt-6">
            {/* 企业名称输入区域（必填） */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-slate-600 font-medium">
                  企业名称 <span className="text-red-500">*</span>：
                </span>
              </div>
              <Input
                placeholder="请输入企业名称（如：华为、阿里巴巴、腾讯）"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="text-lg h-12"
                disabled={loading}
              />
            </div>
            
            {/* 关键字输入区域（可选） */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-slate-600">
                  搜索关键字（可选，{keywords.length}/{getMaxKeywords()}）：
                </span>
                {!isPremiumUnlocked && (
                  <span className="text-xs text-slate-400">
                    高级用户可输入 {MAX_KEYWORDS_PREMIUM} 个关键字
                  </span>
                )}
              </div>
              
              {/* 已添加的关键字标签 */}
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {keywords.map((keyword, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="text-sm py-1 px-3 cursor-pointer hover:bg-slate-200"
                      onClick={() => removeKeyword(keyword)}
                    >
                      {keyword}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* 输入框 */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Input
                    placeholder={keywords.length === 0 
                      ? "可添加关键字进一步筛选（如：产品质量、服务态度），回车添加" 
                      : "继续输入关键字，回车添加"}
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    className="text-base h-11"
                    disabled={loading || keywords.length >= getMaxKeywords()}
                  />
                </div>
                <Button
                  onClick={analyzeCompany}
                  disabled={loading || !companyName.trim() || selectedPlatforms.length === 0}
                  className="h-11 px-8 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      分析中
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      开始分析
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* 剩余次数提示 */}
            <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
              <span>
                剩余分析次数：<strong className={analysisCount >= getMaxAnalysisCount() ? 'text-red-500' : 'text-primary'}>
                  {Math.max(0, getMaxAnalysisCount() - analysisCount)}
                </strong> / {getMaxAnalysisCount()} 次
                {isPremiumUnlocked && <Badge variant="default" className="ml-2 bg-green-600">高级用户</Badge>}
              </span>
              {!isPremiumUnlocked && (
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-primary text-sm"
                  onClick={() => {
                    const currentMonth = new Date().getMonth() + 1;
                    setExpectedKey(getExpectedKey());
                    setShowPremiumDialog(true);
                  }}
                >
                  解锁更多次数
                </Button>
              )}
            </div>

            {/* 筛选选项行 */}
            <div className="flex flex-wrap items-center gap-4">
              {/* 平台选择 */}
              <Popover open={showPlatformSelector} onOpenChange={setShowPlatformSelector}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10">
                    <Settings className="w-4 h-4 mr-2" />
                    选择媒体平台
                    <Badge variant="secondary" className="ml-2">
                      {selectedPlatforms.length}/{getMaxPlatforms()}
                    </Badge>
                    {isPremiumUnlocked && (
                      <Badge variant="default" className="ml-1 bg-green-600">已解锁</Badge>
                    )}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-4 max-h-[400px] overflow-y-auto" align="start" side="bottom" avoidCollisions={true}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">选择检索平台</span>
                    <span className="text-sm text-slate-500">
                      {isPremiumUnlocked ? `最多选择${MAX_PLATFORMS_PREMIUM}个平台` : `最多选择${MAX_PLATFORMS_FREE}个平台`}
                    </span>
                  </div>
                  {!isPremiumUnlocked && (
                    <div className="mb-3 p-2 bg-blue-50 rounded-lg text-xs text-blue-700 flex items-center justify-between">
                      <span>普通用户限制{MAX_PLATFORMS_FREE}个平台，如需更多请</span>
                      <Button 
                        variant="link" 
                        className="h-auto p-0 text-blue-600 font-medium"
                        onClick={() => {
                          const currentMonth = new Date().getMonth() + 1;
                          setExpectedKey(getExpectedKey());
                          setShowPlatformSelector(false);
                          setShowPremiumDialog(true);
                        }}
                      >
                        解锁高级功能
                      </Button>
                    </div>
                  )}
                  {isPremiumUnlocked && (
                    <div className="mb-3 p-2 bg-amber-50 rounded-lg text-xs text-amber-700">
                      高级用户最多选择{MAX_PLATFORMS_PREMIUM}个平台。如需搜索更多平台，请微信关注【{WECHAT_CONFIG.NAME}】公众号后留言。
                    </div>
                  )}
                  <div className="flex justify-end mb-3">
                    <Button variant="ghost" size="sm" onClick={toggleAllPlatforms}>
                      {selectedPlatforms.length === AVAILABLE_PLATFORMS.length ? '取消全选' : '全选'}
                    </Button>
                  </div>
                  
                  {Object.entries(
                    AVAILABLE_PLATFORMS.reduce((acc, p) => {
                      if (!acc[p.category]) acc[p.category] = [];
                      acc[p.category].push(p);
                      return acc;
                    }, {} as Record<string, typeof AVAILABLE_PLATFORMS>)
                  ).map(([category, platforms]) => (
                    <div key={category} className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={platforms.every(p => selectedPlatforms.includes(p.id))}
                          onCheckedChange={() => toggleCategory(category)}
                        />
                        <Label htmlFor={`category-${category}`} className="flex items-center gap-1 font-medium cursor-pointer">
                          {CATEGORY_ICONS[category]}
                          {category}
                        </Label>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pl-6">
                        {platforms.map((p) => (
                          <div key={p.id} className="flex items-center gap-2">
                            <Checkbox
                              id={p.id}
                              checked={selectedPlatforms.includes(p.id)}
                              onCheckedChange={() => togglePlatform(p.id)}
                            />
                            <Label htmlFor={p.id} className="flex items-center gap-1.5 cursor-pointer text-sm">
                              <div className={`w-2 h-2 rounded-full ${p.color}`} />
                              {p.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </PopoverContent>
              </Popover>

              {/* 时间范围选择 */}
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-slate-500" />
                <Select value={timeRange} onValueChange={(v) => {
                  setTimeRange(v);
                  setShowCustomDate(v === 'custom');
                }}>
                  <SelectTrigger className="w-[140px] h-10">
                    <SelectValue placeholder="选择时间范围" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_RANGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 自定义日期选择 */}
              {showCustomDate && (
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-10">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {customStartDate ? format(customStartDate, 'MM/dd') : '开始日期'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        locale={zhCN}
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-slate-400">至</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-10">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {customEndDate ? format(customEndDate, 'MM/dd') : '结束日期'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        locale={zhCN}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* 已选平台标签 */}
              {selectedPlatforms.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <span>已选 {selectedPlatforms.length} 个平台</span>
                </div>
              )}
            </div>

            {streamingText && (
              <div className="mt-4 text-sm text-slate-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {streamingText}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {data && (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="shadow-lg border-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    &quot;{data.companyName}&quot; 舆情分析报告
                    {data.keywords && data.keywords.length > 0 && (
                      <span className="text-base font-normal text-slate-500 ml-2">
                        （关键字：{data.keywords.join('、')}）
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getRiskBadge(data.riskLevel)}
                    <Dialog open={showReport} onOpenChange={setShowReport}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="ml-2">
                          <FileText className="w-4 h-4 mr-2" />
                          生成报告
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center justify-between">
                            <span>舆情分析报告</span>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  if (canPrint) {
                                    printReport();
                                  } else {
                                    const currentMonth = new Date().getMonth() + 1;
                                    setExpectedKey(getExpectedKey());
                                    setReportPremiumAction('print');
                                    setShowReportPremiumDialog(true);
                                  }
                                }}
                              >
                                <Printer className="w-4 h-4 mr-1" />
                                打印
                                {!canPrint && (
                                  <Badge variant="outline" className="ml-2 text-xs border-amber-500 text-amber-600 bg-amber-50">高级功能</Badge>
                                )}
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  if (canExportPdf) {
                                    exportToPdf();
                                  } else {
                                    const currentMonth = new Date().getMonth() + 1;
                                    setExpectedKey(getExpectedKey());
                                    setReportPremiumAction('export');
                                    setShowReportPremiumDialog(true);
                                  }
                                }} 
                                disabled={exportingPdf}
                              >
                                {exportingPdf ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4 mr-1" />
                                )}
                                导出PDF
                                {!canExportPdf && (
                                  <Badge variant="outline" className="ml-2 text-xs border-amber-500 text-amber-600 bg-amber-50">高级功能</Badge>
                                )}
                              </Button>
                            </div>
                          </DialogTitle>
                        </DialogHeader>
                        
                        {/* 报告内容 */}
                        <div ref={reportRef} style={{ padding: '16px', backgroundColor: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
                          {/* 报告头部 */}
                          <div style={{ textAlign: 'center', marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
                            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
                              {data.companyName} 舆情分析报告
                            </h1>
                            {data.keywords && data.keywords.length > 0 && (
                              <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '4px' }}>
                                关键字：{data.keywords.join('、')}
                              </div>
                            )}
                            <div style={{ color: '#64748b', fontSize: '14px' }}>
                              生成时间：{format(new Date(), 'yyyy年MM月dd日 HH:mm')}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                              时间范围：{getReportTimeRange()}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                              检索平台：{data.platforms.length} 个
                            </div>
                          </div>

                          {/* 摘要统计 */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb' }}>
                                {data.totalResults ?? data.platforms.reduce((sum, p) => sum + p.results.length, 0)}
                              </div>
                              <div style={{ fontSize: '12px', color: '#2563eb' }}>相关内容</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a' }}>{data.totalPositive}</div>
                              <div style={{ fontSize: '12px', color: '#16a34a' }}>正面评价</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626' }}>{data.totalNegative}</div>
                              <div style={{ fontSize: '12px', color: '#dc2626' }}>负面评价</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#475569' }}>
                                {(data.totalResults ?? data.platforms.reduce((sum, p) => sum + p.results.length, 0)) - data.totalPositive - data.totalNegative}
                              </div>
                              <div style={{ fontSize: '12px', color: '#475569' }}>中性评价</div>
                            </div>
                          </div>

                          {/* 风险评估 */}
                          <div style={{ marginBottom: '32px', padding: '16px', borderRadius: '8px', border: '2px solid', borderColor: data.riskLevel === 'high' ? '#dc2626' : data.riskLevel === 'medium' ? '#f97316' : '#16a34a', backgroundColor: data.riskLevel === 'high' ? '#fef2f2' : data.riskLevel === 'medium' ? '#fff7ed' : '#f0fdf4' }}>
                            <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '8px', color: data.riskLevel === 'high' ? '#dc2626' : data.riskLevel === 'medium' ? '#f97316' : '#16a34a' }}>
                              风险评估：{data.riskLevel === 'high' ? '高风险' : data.riskLevel === 'medium' ? '中等风险' : '低风险'}
                            </h3>
                            <p style={{ fontSize: '14px', color: '#475569' }}>
                              {data.riskLevel === 'high' && '检测到较多负面评价，舆情风险较高，建议立即采取公关措施，积极回应负面舆论。'}
                              {data.riskLevel === 'medium' && '检测到一定数量的负面评价，舆情风险中等，建议密切关注舆论动向，适时回应。'}
                              {data.riskLevel === 'low' && '整体舆情状况良好，负面评价较少，建议继续保持良好的企业形象。'}
                            </p>
                          </div>

                          {/* 负面评价警示 */}
                          {data.totalNegative > 0 && (
                            <div style={{ marginBottom: '32px', padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                              <h4 style={{ fontWeight: 'bold', color: '#991b1b', marginBottom: '8px' }}>⚠️ 负面评价警示</h4>
                              <p style={{ fontSize: '14px', color: '#b91c1c' }}>
                                检测到 {data.totalNegative} 条负面评价，建议及时关注并采取公关措施。负面评价可能影响企业声誉和公众形象。
                              </p>
                            </div>
                          )}

                          {/* 各平台详情 */}
                          <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>各平台舆情详情</h3>
                            {data.platforms.map((platformData) => (
                              <div key={platformData.platform.id} style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: (() => {
                                      const color = platformData.platform?.color || '';
                                      if (color.includes('orange')) return '#f97316';
                                      if (color.includes('pink')) return '#ec4899';
                                      if (color.includes('amber')) return '#f59e0b';
                                      if (color.includes('cyan')) return '#06b6d4';
                                      if (color.includes('blue')) return '#2563eb';
                                      if (color.includes('green')) return '#16a34a';
                                      if (color.includes('red')) return '#dc2626';
                                      if (color.includes('black')) return '#000000';
                                      return '#64748b';
                                    })() }} />
                                    <span style={{ fontWeight: 'bold' }}>{platformData.platform?.name || '未知平台'}</span>
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>({platformData.platform?.category || '未知类别'})</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '12px', fontSize: '14px' }}>
                                    <span style={{ color: '#16a34a' }}>正面 +{platformData.positiveCount}</span>
                                    <span style={{ color: '#dc2626' }}>负面 -{platformData.negativeCount}</span>
                                  </div>
                                </div>
                                
                                {platformData.results.length === 0 ? (
                                  <div style={{ fontSize: '14px', color: '#94a3b8', padding: '8px 0' }}>暂无搜索结果</div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {platformData.results.map((result, idx) => (
                                      <div key={idx} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                          <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px' }}>{result.title}</div>
                                            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{result.snippet}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#94a3b8' }}>
                                              {result.publishTime && (
                                                <span>📅 {result.publishTime}</span>
                                              )}
                                              {result.author && (
                                                <span>👤 {result.author}</span>
                                              )}
                                              {result.siteName && (
                                                <span>🌐 {result.siteName}</span>
                                              )}
                                            </div>
                                          </div>
                                          <span style={{ marginLeft: '8px', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: result.sentiment === 'negative' ? '#fef2f2' : result.sentiment === 'positive' ? '#f0fdf4' : '#f1f5f9', color: result.sentiment === 'negative' ? '#dc2626' : result.sentiment === 'positive' ? '#16a34a' : '#475569' }}>
                                            {result.sentiment === 'negative' ? '负面' : result.sentiment === 'positive' ? '正面' : '中性'}
                                          </span>
                                        </div>
                                        {result.sentimentReason && (
                                          <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                                            原因：{result.sentimentReason}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* 报告尾部 */}
                          <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                            本报告由企业舆情分析系统自动生成，仅供参考
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {data.totalResults ?? data.platforms.reduce((sum, p) => sum + p.results.length, 0)}
                    </div>
                    <div className="text-sm text-blue-600">相关内容</div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{data.totalPositive}</div>
                    <div className="text-sm text-green-600">正面评价</div>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">{data.totalNegative}</div>
                    <div className="text-sm text-red-600">负面评价</div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-3xl font-bold text-slate-600">
                      {(data.totalResults ?? data.platforms.reduce((sum, p) => sum + p.results.length, 0)) - data.totalPositive - data.totalNegative}
                    </div>
                    <div className="text-sm text-slate-600">中性评价</div>
                  </div>
                </div>

                {/* Warning Alert for Negative Reviews */}
                {data.totalNegative > 0 && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-800 dark:text-red-200">负面评价警示</h4>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          检测到 {data.totalNegative} 条负面评价，建议及时关注并采取公关措施。负面评价可能影响企业声誉和公众形象。
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Platform Results - 按分类标签展示 */}
            <Tabs defaultValue="全部" className="w-full">
              <TabsList className="flex flex-wrap w-full gap-1 h-auto bg-transparent p-0 mb-4">
                <TabsTrigger 
                  value="全部" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  全部 ({data.platforms.length})
                </TabsTrigger>
                {Array.from(new Set(data.platforms.map(p => p.platform.category))).map((category) => (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value="全部">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.platforms.map((platformData) => (
                    <PlatformCard key={platformData.platform.id} platformData={platformData} getSentimentBadge={getSentimentBadge} />
                  ))}
                </div>
              </TabsContent>
              
              {Array.from(new Set(data.platforms.map(p => p.platform.category))).map((category) => (
                <TabsContent key={category} value={category}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.platforms
                      .filter((p) => p.platform.category === category)
                      .map((platformData) => (
                        <PlatformCard key={platformData.platform.id} platformData={platformData} getSentimentBadge={getSentimentBadge} />
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        {/* Empty State */}
        {!data && !loading && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-400">输入公司名称开始分析</h2>
            <p className="text-slate-500 mt-2 mb-6">覆盖 {AVAILABLE_PLATFORMS.length} 家主流媒体平台，智能识别舆情风险</p>
            
            {/* 平台展示 - 简化版 */}
            <div className="max-w-5xl mx-auto">
              {/* 分类统计卡片 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                {Object.entries(
                  AVAILABLE_PLATFORMS.reduce((acc, p) => {
                    if (!acc[p.category]) acc[p.category] = [];
                    acc[p.category].push(p);
                    return acc;
                  }, {} as Record<string, typeof AVAILABLE_PLATFORMS>)
                ).map(([category, platforms]) => (
                  <div key={category} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 text-center">
                    <div className="text-2xl mb-1">
                      {CATEGORY_ICONS[category]}
                    </div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{category}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{platforms.length} 家</div>
                  </div>
                ))}
              </div>
              
              {/* 查看全部平台按钮 */}
              <Link 
                href="/platforms"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <span>查看全部 {AVAILABLE_PLATFORMS.length} 家平台</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">点击平台名称可直接跳转至官网</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-slate-900/80 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-slate-500">
          企业舆情分析系统 - 覆盖 {AVAILABLE_PLATFORMS.length} 家主流媒体平台，智能识别舆情风险，助力企业声誉管理
        </div>
      </footer>

      {/* 高级功能解锁对话框 */}
      <Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">解锁高级功能</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center text-sm text-slate-600">
              <p>免费解锁体验更多平台选择、更多分析次数、更完善分析结果、报告导出等高级功能</p>
            </div>
            
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-48 h-48 bg-white rounded-lg border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                <img 
                  src={WECHAT_CONFIG.QRCODE_IMAGE}
                  alt={`${WECHAT_CONFIG.NAME}公众号二维码`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500">扫码关注公众号</p>
                <p className="text-lg font-bold text-primary">【{WECHAT_CONFIG.NAME}】</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-center text-slate-600">
                在公众号回复 <span className="font-bold text-primary">{expectedKey}</span>
              </p>
              <p className="text-xs text-center text-slate-500">
                获取高级功能体验码
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="请输入体验码"
                value={premiumCode}
                onChange={(e) => {
                  setPremiumCode(e.target.value);
                  setCodeError('');
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {codeError && (
                <p className="text-sm text-red-500">{codeError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPremiumDialog(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1"
                onClick={verifyCode}
                disabled={verifyingCode}
              >
                {verifyingCode ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    验证中
                  </>
                ) : (
                  '验证体验码'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 报告导出验证对话框 */}
      <Dialog open={showReportPremiumDialog} onOpenChange={setShowReportPremiumDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">报告导出/打印为高级功能</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center text-sm text-slate-600">
              <p>免费解锁体验更多平台选择、更多分析次数、更完善分析结果、报告导出等高级功能</p>
            </div>
            
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-48 h-48 bg-white rounded-lg border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                <img 
                  src={WECHAT_CONFIG.QRCODE_IMAGE}
                  alt={`${WECHAT_CONFIG.NAME}公众号二维码`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500">扫码关注公众号</p>
                <p className="text-lg font-bold text-primary">【{WECHAT_CONFIG.NAME}】</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-center text-slate-600">
                在公众号回复 <span className="font-bold text-primary">{expectedKey}</span>
              </p>
              <p className="text-xs text-center text-slate-500">
                获取体验码，解锁高级功能
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="请输入体验码"
                value={premiumCode}
                onChange={(e) => {
                  setPremiumCode(e.target.value);
                  setCodeError('');
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {codeError && (
                <p className="text-sm text-red-500">{codeError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowReportPremiumDialog(false);
                  setPremiumCode('');
                  setCodeError('');
                }}
              >
                取消
              </Button>
              <Button
                className="flex-1"
                onClick={async () => {
                  if (!premiumCode.trim()) {
                    setCodeError('请输入体验码');
                    return;
                  }
                  
                  setVerifyingCode(true);
                  setCodeError('');
                  
                  try {
                    const response = await fetch('/api/verify-code', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ code: premiumCode.trim() })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                      setIsPremiumUnlocked(true);
                      setShowReportPremiumDialog(false);
                      setPremiumCode('');
                      // 保存解锁状态到localStorage
                      localStorage.setItem('isPremiumUnlocked', 'true');
                      localStorage.setItem('premiumUnlockTime', Date.now().toString());
                      // 验证成功后根据操作类型执行对应操作
                      setTimeout(() => {
                        if (reportPremiumAction === 'print') {
                          printReport();
                        } else {
                          exportToPdf();
                        }
                      }, 100);
                    } else {
                      setCodeError(result.error || '体验码错误');
                    }
                  } catch (error) {
                    setCodeError('验证失败，请稍后重试');
                  } finally {
                    setVerifyingCode(false);
                  }
                }}
                disabled={verifyingCode}
              >
                {verifyingCode ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    验证中
                  </>
                ) : (
                  '验证体验码'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 达到最大平台数提示对话框 */}
      <Dialog open={showMaxPlatformsDialog} onOpenChange={setShowMaxPlatformsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">已达到最大平台数</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center text-sm text-slate-600">
              <p>高级用户最多可选择 <strong>{MAX_PLATFORMS_PREMIUM} 个平台</strong> 进行搜索</p>
            </div>

            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-48 h-48 bg-white rounded-lg border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                <img 
                  src={WECHAT_CONFIG.QRCODE_IMAGE}
                  alt={`${WECHAT_CONFIG.NAME}公众号二维码`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500">扫码关注公众号</p>
                <p className="text-lg font-bold text-primary">【{WECHAT_CONFIG.NAME}】</p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-sm text-center text-amber-700">
                如需搜索更多平台，请微信关注【{WECHAT_CONFIG.NAME}】公众号后留言
              </p>
            </div>

            <div className="flex justify-center">
              <Button onClick={() => setShowMaxPlatformsDialog(false)}>
                我知道了
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 分析次数限制提示对话框 - 普通用户超过3次 */}
      <Dialog open={showAnalysisLimitDialog} onOpenChange={setShowAnalysisLimitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">体验次数已用完</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center text-sm text-slate-600">
              <p>免费用户最多可分析 <strong>{MAX_ANALYSIS_FREE} 次</strong></p>
              <p className="mt-1">您已使用 <strong>{analysisCount}</strong> 次</p>
            </div>

            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-48 h-48 bg-white rounded-lg border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                <img 
                  src={WECHAT_CONFIG.QRCODE_IMAGE}
                  alt={`${WECHAT_CONFIG.NAME}公众号二维码`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500">扫码关注公众号</p>
                <p className="text-lg font-bold text-primary">【{WECHAT_CONFIG.NAME}】</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-center text-slate-600">
                在公众号回复 <span className="font-bold text-primary">{expectedKey}</span>
              </p>
              <p className="text-xs text-center text-slate-500">
                获取体验码，解锁后可分析 {MAX_ANALYSIS_PREMIUM} 次
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="请输入体验码"
                value={premiumCode}
                onChange={(e) => {
                  setPremiumCode(e.target.value);
                  setCodeError('');
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {codeError && (
                <p className="text-sm text-red-500">{codeError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAnalysisLimitDialog(false);
                  setPremiumCode('');
                  setCodeError('');
                }}
              >
                取消
              </Button>
              <Button
                className="flex-1"
                onClick={async () => {
                  if (!premiumCode.trim()) {
                    setCodeError('请输入体验码');
                    return;
                  }
                  
                  setVerifyingCode(true);
                  setCodeError('');
                  
                  try {
                    const response = await fetch('/api/verify-code', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ code: premiumCode.trim() })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                      setIsPremiumUnlocked(true);
                      setShowAnalysisLimitDialog(false);
                      setPremiumCode('');
                      // 保存解锁状态到localStorage
                      localStorage.setItem('isPremiumUnlocked', 'true');
                      localStorage.setItem('premiumUnlockTime', Date.now().toString());
                    } else {
                      setCodeError(result.error || '体验码错误');
                    }
                  } catch (error) {
                    setCodeError('验证失败，请稍后重试');
                  } finally {
                    setVerifyingCode(false);
                  }
                }}
                disabled={verifyingCode}
              >
                {verifyingCode ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    验证中
                  </>
                ) : (
                  '验证体验码'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 分析次数限制提示对话框 - 高级用户超过50次 */}
      <Dialog open={showMaxAnalysisDialog} onOpenChange={(open) => {
        setShowMaxAnalysisDialog(open);
        if (!open) {
          setRechargeCode('');
          setRechargeCodeError('');
          setShowRechargeSuccess(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">体验次数已达上限</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!showRechargeSuccess ? (
              <>
                <div className="text-center text-sm text-slate-600">
                  <p>高级用户最多可分析 <strong>{MAX_ANALYSIS_PREMIUM} 次</strong></p>
                  <p className="mt-1">您已使用 <strong>{analysisCount}</strong> 次</p>
                </div>

                {/* 充值验证码输入区域 */}
                <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-center text-blue-700 font-medium">
                    输入充值验证码，增加 {PREMIUM_CODES.RECHARGE_COUNT_PER_CODE} 次分析次数
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="请输入充值验证码"
                      value={rechargeCode}
                      onChange={(e) => {
                        setRechargeCode(e.target.value);
                        setRechargeCodeError('');
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={verifyRechargeCode}
                      disabled={verifyingRechargeCode || !rechargeCode.trim()}
                    >
                      {verifyingRechargeCode ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          验证中
                        </>
                      ) : (
                        '充值'
                      )}
                    </Button>
                  </div>
                  {rechargeCodeError && (
                    <p className="text-xs text-red-500 text-center">{rechargeCodeError}</p>
                  )}
                </div>

                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-48 h-48 bg-white rounded-lg border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                    <img 
                      src={WECHAT_CONFIG.QRCODE_IMAGE}
                      alt={`${WECHAT_CONFIG.NAME}公众号二维码`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500">扫码关注公众号</p>
                    <p className="text-lg font-bold text-primary">【{WECHAT_CONFIG.NAME}】</p>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="text-sm text-center text-amber-700">
                    如需充值验证码，请在【{WECHAT_CONFIG.NAME}】公众号留言
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button variant="outline" onClick={() => setShowMaxAnalysisDialog(false)}>
                    我知道了
                  </Button>
                </div>
              </>
            ) : (
              /* 充值成功提示 */
              <div className="py-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-green-600 mb-2">充值成功！</p>
                <p className="text-sm text-slate-600">
                  已为您增加 <strong className="text-green-600">{rechargedCount}</strong> 次分析次数
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 关键字数量限制提示对话框 */}
      <Dialog open={showMaxKeywordsDialog} onOpenChange={setShowMaxKeywordsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">已达到最大关键字数</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center text-sm text-slate-600">
              <p>高级用户最多可输入 <strong>{MAX_KEYWORDS_PREMIUM} 个关键字</strong></p>
            </div>

            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-48 h-48 bg-white rounded-lg border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                <img 
                  src={WECHAT_CONFIG.QRCODE_IMAGE}
                  alt={`${WECHAT_CONFIG.NAME}公众号二维码`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500">扫码关注公众号</p>
                <p className="text-lg font-bold text-primary">【{WECHAT_CONFIG.NAME}】</p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-sm text-center text-amber-700">
                如需输入更多关键字，请在【{WECHAT_CONFIG.NAME}】公众号留言
              </p>
            </div>

            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setShowMaxKeywordsDialog(false)}>
                我知道了
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
