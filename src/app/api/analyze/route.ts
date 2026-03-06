import { NextRequest } from 'next/server';
import { SearchClient, LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { SEARCH_CONFIG, ENABLED_PLATFORMS } from '@/lib/config';

// 平台配置 - 约100家主流媒体平台（包含多个域名别名和关键词）

// 获取 SDK 配置
// 支持两种部署方式：
// 1. 扣子编程平台：自动注入认证信息，无需配置
// 2. 自有服务器：通过环境变量 COZE_API_KEY 配置 API 密钥
function getSDKConfig(customHeaders?: Record<string, string>): { config: Config; headers: Record<string, string> | undefined } {
  const apiKey = process.env.COZE_API_KEY;
  
  let config: Config;
  let headers = customHeaders;
  
  if (apiKey) {
    // 自有服务器部署：使用配置的 API 密钥
    config = new Config({ 
      apiKey,
      timeout: 60000,  // 60秒超时
    });
    // 自有服务器不需要转发 headers
    headers = undefined;
  } else {
    // 扣子编程平台：自动注入认证
    config = new Config();
  }
  
  return { config, headers };
}
const ALL_PLATFORMS = [
  // ===== 社交媒体 =====
  { id: 'weibo', name: '微博', domain: 'weibo.com', keywords: ['微博', 'weibo'], category: '社交媒体' },
  { id: 'zhihu', name: '知乎', domain: 'zhihu.com', keywords: ['知乎', 'zhihu'], category: '社交媒体' },
  { id: 'xiaohongshu', name: '小红书', domain: 'xiaohongshu.com', keywords: ['小红书', '红书', 'xiaohongshu'], category: '社交媒体' },
  { id: 'wechat', name: '微信公众号', domain: 'mp.weixin.qq.com', keywords: ['微信', '公众号', 'wechat'], category: '社交媒体' },
  { id: 'tieba', name: '百度贴吧', domain: 'tieba.baidu.com', keywords: ['贴吧', '百度贴吧', 'tieba'], category: '社交媒体' },
  { id: 'douban', name: '豆瓣', domain: 'douban.com', keywords: ['豆瓣', 'douban'], category: '社交媒体' },
  { id: 'tianya', name: '天涯社区', domain: 'tianya.cn', keywords: ['天涯', 'tianya'], category: '社交媒体' },
  { id: 'mafengwo', name: '马蜂窝', domain: 'mafengwo.cn', keywords: ['马蜂窝', 'mafengwo'], category: '社交媒体' },
  { id: 'dianping', name: '大众点评', domain: 'dianping.com', keywords: ['大众点评', '点评', 'dianping'], category: '社交媒体' },
  { id: 'meituan', name: '美团', domain: 'meituan.com', keywords: ['美团', 'meituan'], category: '社交媒体' },
  
  // ===== 新闻资讯 =====
  { id: 'toutiao', name: '今日头条', domain: 'toutiao.com', keywords: ['头条', '今日头条', 'toutiao'], category: '新闻资讯' },
  { id: 'baidu', name: '百度资讯', domain: 'baidu.com', keywords: ['百度', 'baidu'], category: '新闻资讯' },
  { id: 'sina', name: '新浪新闻', domain: 'sina.com.cn', keywords: ['新浪', 'sina'], category: '新闻资讯' },
  { id: 'sohu', name: '搜狐新闻', domain: 'sohu.com', keywords: ['搜狐', 'sohu'], category: '新闻资讯' },
  { id: 'netease', name: '网易新闻', domain: '163.com', keywords: ['网易', '163', 'netease'], category: '新闻资讯' },
  { id: 'qqnews', name: '腾讯新闻', domain: 'news.qq.com', keywords: ['腾讯', 'qq', 'tencent'], category: '新闻资讯' },
  { id: 'ifeng', name: '凤凰网', domain: 'ifeng.com', keywords: ['凤凰', 'ifeng'], category: '新闻资讯' },
  { id: 'yidian', name: '一点资讯', domain: 'yidianzixun.com', keywords: ['一点资讯', 'yidian'], category: '新闻资讯' },
  { id: 'uc', name: 'UC头条', domain: 'uc.cn', keywords: ['UC', 'uc头条'], category: '新闻资讯' },
  { id: 'zaker', name: 'ZAKER', domain: 'myzaker.com', keywords: ['ZAKER', 'zaker'], category: '新闻资讯' },
  { id: 'caixin', name: '财新网', domain: 'caixin.com', keywords: ['财新', 'caixin'], category: '新闻资讯' },
  { id: 'jiemian', name: '界面新闻', domain: 'jiemian.com', keywords: ['界面', 'jiemian'], category: '新闻资讯' },
  { id: 'thepaper', name: '澎湃新闻', domain: 'thepaper.cn', keywords: ['澎湃', 'thepaper'], category: '新闻资讯' },
  { id: 'bjnews', name: '新京报', domain: 'bjnews.com.cn', keywords: ['新京报'], category: '新闻资讯' },
  { id: 'yicai', name: '第一财经', domain: 'yicai.com', keywords: ['第一财经', '一财'], category: '新闻资讯' },
  { id: 'cankao', name: '参考消息', domain: 'cankaoxiaoxi.com', keywords: ['参考消息'], category: '新闻资讯' },
  { id: 'huanqiu', name: '环球网', domain: 'huanqiu.com', keywords: ['环球', 'huanqiu'], category: '新闻资讯' },
  { id: 'china', name: '中国网', domain: 'china.com.cn', keywords: ['中国网'], category: '新闻资讯' },
  { id: 'gmw', name: '光明网', domain: 'gmw.cn', keywords: ['光明网', '光明日报'], category: '新闻资讯' },
  
  // ===== 官方媒体 =====
  { id: 'people', name: '人民网', domain: 'people.com.cn', keywords: ['人民网', '人民日报'], category: '官方媒体' },
  { id: 'xinhua', name: '新华网', domain: 'xinhuanet.com', keywords: ['新华网', '新华社'], category: '官方媒体' },
  { id: 'chinanews', name: '中国新闻网', domain: 'chinanews.com.cn', keywords: ['中新网', '中国新闻网'], category: '官方媒体' },
  { id: 'cctv', name: '央视网', domain: 'cctv.com', keywords: ['央视', 'CCTV', '中央电视台'], category: '官方媒体' },
  { id: 'cntv', name: '中国网络电视台', domain: 'cntv.cn', keywords: ['CNTV'], category: '官方媒体' },
  { id: 'gov', name: '中国政府网', domain: 'gov.cn', keywords: ['政府网'], category: '官方媒体' },
  { id: '12315', name: '12315投诉平台', domain: '12315.cn', keywords: ['12315', '投诉'], category: '官方媒体' },
  
  // ===== 视频平台 =====
  { id: 'douyin', name: '抖音', domain: 'douyin.com', keywords: ['抖音', 'douyin', 'tiktok'], category: '视频平台' },
  { id: 'bilibili', name: 'B站', domain: 'bilibili.com', keywords: ['B站', '哔哩哔哩', 'bilibili'], category: '视频平台' },
  { id: 'kuaishou', name: '快手', domain: 'kuaishou.com', keywords: ['快手', 'kuaishou'], category: '视频平台' },
  { id: 'youku', name: '优酷', domain: 'youku.com', keywords: ['优酷', 'youku'], category: '视频平台' },
  { id: 'iqiyi', name: '爱奇艺', domain: 'iqiyi.com', keywords: ['爱奇艺', 'iqiyi'], category: '视频平台' },
  { id: 'tencentvideo', name: '腾讯视频', domain: 'v.qq.com', keywords: ['腾讯视频', 'qq视频'], category: '视频平台' },
  { id: 'mgtv', name: '芒果TV', domain: 'mgtv.com', keywords: ['芒果TV', '芒果'], category: '视频平台' },
  { id: 'xigua', name: '西瓜视频', domain: 'ixigua.com', keywords: ['西瓜视频', '西瓜'], category: '视频平台' },
  { id: 'haokan', name: '好看视频', domain: 'haokan.baidu.com', keywords: ['好看视频', '好看'], category: '视频平台' },
  
  // ===== 科技财经 =====
  { id: '36kr', name: '36氪', domain: '36kr.com', keywords: ['36氪', '36kr'], category: '科技财经' },
  { id: 'huxiu', name: '虎嗅', domain: 'huxiu.com', keywords: ['虎嗅', 'huxiu'], category: '科技财经' },
  { id: 'tmtpost', name: '钛媒体', domain: 'tmtpost.com', keywords: ['钛媒体', 'tmt'], category: '科技财经' },
  { id: 'leiphone', name: '雷锋网', domain: 'leiphone.com', keywords: ['雷锋网'], category: '科技财经' },
  { id: 'donews', name: 'Donews', domain: 'donews.com', keywords: ['Donews'], category: '科技财经' },
  { id: 'techweb', name: 'TechWeb', domain: 'techweb.com.cn', keywords: ['TechWeb'], category: '科技财经' },
  { id: 'pingwest', name: 'PingWest', domain: 'pingwest.com', keywords: ['PingWest'], category: '科技财经' },
  { id: 'ifanr', name: '爱范儿', domain: 'ifanr.com', keywords: ['爱范儿', 'ifanr'], category: '科技财经' },
  { id: 'sootuu', name: '速途网', domain: 'sootuu.com', keywords: ['速途网'], category: '科技财经' },
  { id: 'eastmoney', name: '东方财富', domain: 'eastmoney.com', keywords: ['东方财富', '股吧'], category: '科技财经' },
  { id: 'xueqiu', name: '雪球', domain: 'xueqiu.com', keywords: ['雪球', 'xueqiu'], category: '科技财经' },
  { id: 'tonghuashun', name: '同花顺', domain: '10jqka.com.cn', keywords: ['同花顺'], category: '科技财经' },
  { id: 'jrj', name: '金融界', domain: 'jrj.com.cn', keywords: ['金融界'], category: '科技财经' },
  { id: 'hexun', name: '和讯网', domain: 'hexun.com', keywords: ['和讯', 'hexun'], category: '科技财经' },
  
  // ===== 电商平台 =====
  { id: 'taobao', name: '淘宝', domain: 'taobao.com', keywords: ['淘宝', 'taobao'], category: '电商平台' },
  { id: 'jd', name: '京东', domain: 'jd.com', keywords: ['京东', 'jd', '京东商城'], category: '电商平台' },
  { id: 'pdd', name: '拼多多', domain: 'pinduoduo.com', keywords: ['拼多多', 'pdd'], category: '电商平台' },
  { id: 'tmall', name: '天猫', domain: 'tmall.com', keywords: ['天猫', 'tmall'], category: '电商平台' },
  { id: 'suning', name: '苏宁易购', domain: 'suning.com', keywords: ['苏宁', 'suning'], category: '电商平台' },
  { id: 'gome', name: '国美', domain: 'gome.com.cn', keywords: ['国美', 'gome'], category: '电商平台' },
  { id: 'dangdang', name: '当当网', domain: 'dangdang.com', keywords: ['当当', 'dangdang'], category: '电商平台' },
  { id: 'vip', name: '唯品会', domain: 'vip.com', keywords: ['唯品会', 'vip'], category: '电商平台' },
  
  // ===== 汽车出行 =====
  { id: 'autohome', name: '汽车之家', domain: 'autohome.com.cn', keywords: ['汽车之家'], category: '汽车出行' },
  { id: 'dongchedi', name: '懂车帝', domain: 'dongchedi.com', keywords: ['懂车帝'], category: '汽车出行' },
  { id: 'pcauto', name: '太平洋汽车', domain: 'pcauto.com.cn', keywords: ['太平洋汽车'], category: '汽车出行' },
  { id: 'xcar', name: '爱卡汽车', domain: 'xcar.com.cn', keywords: ['爱卡汽车'], category: '汽车出行' },
  { id: 'yiche', name: '易车网', domain: 'yiche.com', keywords: ['易车', 'yiche'], category: '汽车出行' },
  { id: 'gaode', name: '高德地图', domain: 'amap.com', keywords: ['高德', 'amap'], category: '汽车出行' },
  { id: 'didi', name: '滴滴出行', domain: 'didichuxing.com', keywords: ['滴滴', 'didi'], category: '汽车出行' },
  
  // ===== 房产家居 =====
  { id: 'lianjia', name: '链家', domain: 'lianjia.com', keywords: ['链家'], category: '房产家居' },
  { id: 'ke', name: '贝壳找房', domain: 'ke.com', keywords: ['贝壳', '贝壳找房'], category: '房产家居' },
  { id: 'anjuke', name: '安居客', domain: 'anjuke.com', keywords: ['安居客'], category: '房产家居' },
  { id: 'fang', name: '房天下', domain: 'fang.com', keywords: ['房天下', '搜房'], category: '房产家居' },
  { id: 'leju', name: '乐居', domain: 'leju.com', keywords: ['乐居'], category: '房产家居' },
  
  // ===== 招聘求职 =====
  { id: 'boss', name: 'BOSS直聘', domain: 'zhipin.com', keywords: ['BOSS直聘', 'boss直聘'], category: '招聘求职' },
  { id: 'zhaopin', name: '智联招聘', domain: 'zhaopin.com', keywords: ['智联招聘', '智联'], category: '招聘求职' },
  { id: '51job', name: '前程无忧', domain: '51job.com', keywords: ['前程无忧', '51job'], category: '招聘求职' },
  { id: 'liepin', name: '猎聘', domain: 'liepin.com', keywords: ['猎聘', 'liepin'], category: '招聘求职' },
  { id: 'lagou', name: '拉勾网', domain: 'lagou.com', keywords: ['拉勾', 'lagou'], category: '招聘求职' },
  
  // ===== 教育培训 =====
  { id: 'zhihuishu', name: '智慧树', domain: 'zhihuishu.com', keywords: ['智慧树'], category: '教育培训' },
  { id: 'xuetangx', name: '学堂在线', domain: 'xuetangx.com', keywords: ['学堂在线'], category: '教育培训' },
  { id: 'icourse163', name: '中国大学MOOC', domain: 'icourse163.org', keywords: ['慕课', 'MOOC'], category: '教育培训' },
  { id: 'youdao', name: '有道精品课', domain: 'youdao.com', keywords: ['有道', '网易有道'], category: '教育培训' },
  { id: 'xueersi', name: '学而思', domain: 'xueersi.com', keywords: ['学而思'], category: '教育培训' },
  
  // ===== 医疗健康 =====
  { id: 'haodf', name: '好大夫在线', domain: 'haodf.com', keywords: ['好大夫'], category: '医疗健康' },
  { id: 'guahao', name: '挂号网', domain: 'guahao.com', keywords: ['挂号网', '微医'], category: '医疗健康' },
  { id: 'dingxiang', name: '丁香园', domain: 'dxy.com', keywords: ['丁香园', 'dxy'], category: '医疗健康' },
  { id: 'chunyu', name: '春雨医生', domain: 'chunyuyisheng.com', keywords: ['春雨医生'], category: '医疗健康' },
  
  // ===== 旅游出行 =====
  { id: 'ctrip', name: '携程', domain: 'ctrip.com', keywords: ['携程', 'ctrip', '携程旅行'], category: '旅游出行' },
  { id: 'qunar', name: '去哪儿', domain: 'qunar.com', keywords: ['去哪儿', 'qunar'], category: '旅游出行' },
  { id: 'tuniu', name: '途牛', domain: 'tuniu.com', keywords: ['途牛', 'tuniu'], category: '旅游出行' },
  { id: 'ly', name: '同程旅行', domain: 'ly.com', keywords: ['同程', '同程旅行'], category: '旅游出行' },
  { id: 'fliggy', name: '飞猪', domain: 'fliggy.com', keywords: ['飞猪', 'fliggy'], category: '旅游出行' },
  
  // ===== 企业评价 =====
  { id: 'tianyancha', name: '天眼查', domain: 'tianyancha.com', keywords: ['天眼查'], category: '企业评价' },
  { id: 'qcc', name: '企查查', domain: 'qcc.com', keywords: ['企查查'], category: '企业评价' },
  { id: 'kanzhun', name: '看准网', domain: 'kanzhun.com', keywords: ['看准网', '看准'], category: '企业评价' },
  { id: 'qixin', name: '启信宝', domain: 'qixin.com', keywords: ['启信宝'], category: '企业评价' },
  { id: 'zhazhipin', name: '职友集', domain: 'jobui.com', keywords: ['职友集'], category: '企业评价' },
  
  // ===== 投诉维权 =====
  { id: 'ts21', name: '21CN聚投诉', domain: 'ts.21cn.com', keywords: ['聚投诉', '21cn'], category: '投诉维权' },
  { id: '12315online', name: '全国12315平台', domain: 'www.12315.cn', keywords: ['12315', '全国12315'], category: '投诉维权' },
  { id: 'tousu', name: '黑猫投诉', domain: 'tousu.sina.com.cn', keywords: ['黑猫投诉', '黑猫'], category: '投诉维权' },
];

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishTime?: string;
  author?: string;
  siteName?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentReason?: string;
  isRelevant: boolean;
}

interface PlatformResult {
  platform: typeof ALL_PLATFORMS[0];
  results: SearchResult[];
  negativeCount: number;
  positiveCount: number;
}

// SSE 编码器
const encoder = new TextEncoder();

function sendEvent(controller: ReadableStreamDefaultController, data: object) {
  // 将 JSON 字符串中的换行符替换为空格，避免 SSE 解析问题
  const jsonStr = JSON.stringify(data).replace(/\n/g, ' ').replace(/\r/g, '');
  controller.enqueue(encoder.encode(`data: ${jsonStr}\n\n`));
}

// 格式化时间
function formatPublishTime(time?: string): string | undefined {
  if (!time) return undefined;
  try {
    const date = new Date(time);
    if (isNaN(date.getTime())) return time;
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return time;
  }
}

// 从内容中提取作者信息
function extractAuthor(title: string, snippet: string, siteName?: string): string | undefined {
  const titlePatterns = [
    /^(.+?)[:：]/,
    /作者[：:]\s*(.+?)(?:\s|$)/,
    /文[／/]\s*(.+?)(?:\s|$)/,
    /by\s+(.+?)(?:\s|$)/i,
  ];
  
  for (const pattern of titlePatterns) {
    const match = title.match(pattern);
    if (match && match[1].length < 20) {
      return match[1].trim();
    }
  }
  
  const snippetPatterns = [
    /作者[：:]\s*([^\s\n]+)/,
    /记者[：:]\s*([^\s\n]+)/,
    /编辑[：:]\s*([^\s\n]+)/,
    /来源[：:]\s*([^\s\n]+)/,
  ];
  
  for (const pattern of snippetPatterns) {
    const match = snippet.match(pattern);
    if (match && match[1].length < 20) {
      return match[1].trim();
    }
  }
  
  return siteName;
}

// 将时间范围转换为搜索 API 支持的格式
// 支持的格式: "1d" (1天), "1w" (1周), "1m" (1月), "3m" (3月), "6m" (6月), "1y" (1年)
function getTimeRangeParam(startDate?: string, endDate?: string): string | undefined {
  if (!startDate && !endDate) return undefined;
  
  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  // 计算天数差
  if (start) {
    const diffTime = (end || now).getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 根据天数返回对应的时间范围参数
    // 严格按照搜索API支持的格式: 1d, 1w, 1m, 3m, 6m, 1y
    if (diffDays <= 1) return '1d';
    if (diffDays <= 7) return '1w';
    if (diffDays <= 31) return '1m';
    if (diffDays <= 92) return '3m';
    if (diffDays <= 183) return '6m';
    if (diffDays <= 366) return '1y';
    return '1y'; // 超过1年也限制为1年
  }
  
  return '1m'; // 默认返回1个月
}

// 判断发布时间是否在指定范围内
function isWithinTimeRange(publishTime: string | undefined, startDate?: string, endDate?: string): boolean {
  if (!publishTime) return true; // 没有时间信息的保留
  
  try {
    const publishDate = new Date(publishTime);
    if (isNaN(publishDate.getTime())) return true; // 解析失败的保留
    
    const now = new Date();
    const end = endDate ? new Date(endDate) : now;
    const start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 默认30天
    
    return publishDate >= start && publishDate <= end;
  } catch {
    return true;
  }
}

// 根据时间范围参数计算开始日期
function getStartDateFromRange(timeRange: string): Date {
  const now = new Date();
  switch (timeRange) {
    case '1d': return new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    case '1w': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '1m': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '3m': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '6m': return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    case '1y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

// 使用 AI 判断内容是否与公司相关
async function checkRelevanceAndSentiment(
  client: LLMClient,
  company: string,
  results: SearchResult[]
): Promise<{ isRelevant: boolean; sentiment: 'positive' | 'negative' | 'neutral'; sentimentReason?: string }[]> {
  if (results.length === 0) return [];

  const contentList = results
    .map((r, i) => `[${i + 1}] 标题: ${r.title}\n来源: ${r.siteName || '未知'}\n摘要: ${r.snippet}`)
    .join('\n\n');

  const prompt = `你是一个专业的舆情分析师。请分析以下搜索结果是否与"${company}"公司相关，并进行情感分析。

公司名称: ${company}

搜索结果:
${contentList}

请对每条搜索结果进行分析，返回JSON数组，每条结果包含：
- isRelevant: true/false - 判断该内容是否与"${company}"公司相关（宽松判断，只要内容可能涉及该公司即可）
- sentiment: "positive"(正面评价)/"negative"(负面评价)/"neutral"(中性或客观报道)
- sentimentReason: 仅当isRelevant为true且sentiment为negative时填写负面原因（简短描述，不超过10个字），其他情况为空字符串

判断相关性标准（宽松判断）：
1. 标题或摘要中包含公司名称的任何部分或简称
2. 内容提到该公司的产品、服务、品牌、高管、新闻等
3. 内容来自该公司的官方渠道或与其业务相关的讨论
4. 如果公司名较短（2-3个字），只要标题或摘要中出现该名称就认为相关
5. 不相关的情况：明确的同名不同公司、完全不涉及该公司的内容

示例返回格式：
[
  {"isRelevant": true, "sentiment": "positive", "sentimentReason": ""},
  {"isRelevant": true, "sentiment": "negative", "sentimentReason": "产品质量"},
  {"isRelevant": false, "sentiment": "neutral", "sentimentReason": ""},
  {"isRelevant": true, "sentiment": "neutral", "sentimentReason": ""}
]

只返回JSON数组，不要其他任何内容。`;

  try {
    const response = await client.invoke(
      [{ role: 'user', content: prompt }],
      { temperature: 0.1 }  // 降低温度使判断更稳定
    );

    const jsonMatch = response.content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((item: { 
        isRelevant?: boolean; 
        sentiment?: string; 
        sentimentReason?: string 
      }) => ({
        isRelevant: item.isRelevant ?? true,  // 默认为相关
        sentiment: (item.sentiment || 'neutral') as 'positive' | 'negative' | 'neutral',
        sentimentReason: item.sentimentReason || undefined,
      }));
    }
  } catch (error) {
    console.error('Relevance check error:', error);
  }

  // 如果 AI 分析失败，使用宽松的关键词匹配作为备选
  // 由于结果已经通过平台域名过滤搜索得到，默认认为相关
  return results.map((r) => {
    const companyLower = company.toLowerCase();
    const titleLower = r.title.toLowerCase();
    const snippetLower = r.snippet.toLowerCase();
    
    // 宽松匹配：只要标题或摘要中包含公司名的任何部分
    const companyNameParts = companyLower.split(/[\s-_]/);
    const hasMatch = companyLower.length <= 3 
      ? (titleLower.includes(companyLower) || snippetLower.includes(companyLower))
      : companyNameParts.some(part => part.length >= 2 && (titleLower.includes(part) || snippetLower.includes(part)));
    
    return {
      isRelevant: hasMatch || true,  // 默认相关，因为结果来自针对性搜索
      sentiment: 'neutral' as const,
      sentimentReason: undefined,
    };
  });
}

// 检查搜索结果是否匹配目标平台
function matchesPlatform(item: { url?: string; site_name?: string; title?: string; snippet?: string }, platform: typeof ALL_PLATFORMS[0]): boolean {
  const urlLower = (item.url || '').toLowerCase();
  const siteNameLower = (item.site_name || '').toLowerCase();
  const titleLower = (item.title || '').toLowerCase();
  const snippetLower = (item.snippet || '').toLowerCase();
  const contentLower = `${titleLower} ${snippetLower}`;
  
  // 检查URL是否包含平台域名
  if (urlLower.includes(platform.domain)) {
    return true;
  }
  
  // 检查站点名称是否包含平台名或关键词
  for (const keyword of platform.keywords) {
    if (siteNameLower.includes(keyword.toLowerCase())) {
      return true;
    }
  }
  
  // 对于社交媒体平台，放宽匹配条件
  // 如果内容中提到平台名，也算匹配
  for (const keyword of platform.keywords) {
    if (contentLower.includes(keyword.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

// 根据时间范围参数计算月数
function getMonthsFromTimeRange(timeRange: string): number {
  switch (timeRange) {
    case '1d': return 0.03;  // 约1天
    case '1w': return 0.25;  // 约1周
    case '1m': return 1;
    case '3m': return 3;
    case '6m': return 6;
    case '1y': return 12;
    default: return 1;
  }
}

// 解析发布时间为时间戳（用于排序）
function parsePublishTime(time?: string): number {
  if (!time) return 0;
  
  try {
    // 尝试解析各种日期格式
    // 格式1: 2024/03/05 或 2024-03-05
    const dateMatch = time.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (dateMatch) {
      return new Date(`${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`).getTime();
    }
    
    // 格式2: 03月05日 或 3月5日
    const monthDayMatch = time.match(/(\d{1,2})月(\d{1,2})日/);
    if (monthDayMatch) {
      const now = new Date();
      return new Date(now.getFullYear(), parseInt(monthDayMatch[1]) - 1, parseInt(monthDayMatch[2])).getTime();
    }
    
    // 格式3: X天前, X小时前, X分钟前
    const dayAgoMatch = time.match(/(\d+)\s*天前/);
    if (dayAgoMatch) {
      return Date.now() - parseInt(dayAgoMatch[1]) * 24 * 60 * 60 * 1000;
    }
    
    const hourAgoMatch = time.match(/(\d+)\s*小时前/);
    if (hourAgoMatch) {
      return Date.now() - parseInt(hourAgoMatch[1]) * 60 * 60 * 1000;
    }
    
    const minuteAgoMatch = time.match(/(\d+)\s*分钟前/);
    if (minuteAgoMatch) {
      return Date.now() - parseInt(minuteAgoMatch[1]) * 60 * 1000;
    }
    
    // 尝试直接解析
    const parsed = new Date(time);
    if (!isNaN(parsed.getTime())) {
      return parsed.getTime();
    }
    
    return 0;
  } catch {
    return 0;
  }
}

// 按时间倒序排序
function sortByTimeDesc(results: SearchResult[]): SearchResult[] {
  return results.sort((a, b) => parsePublishTime(b.publishTime) - parsePublishTime(a.publishTime));
}

// 根据情感优先级选择结果（负面和正面优先，中性填充）+ 按时间倒序
function selectResultsBySentiment(
  results: SearchResult[],
  maxCount: number = 100
): SearchResult[] {
  // 分离不同情感的结果，并在每个类别内部按时间倒序排序
  const negative = sortByTimeDesc(results.filter(r => r.sentiment === 'negative' && r.isRelevant));
  const positive = sortByTimeDesc(results.filter(r => r.sentiment === 'positive' && r.isRelevant));
  const neutral = sortByTimeDesc(results.filter(r => r.sentiment === 'neutral' && r.isRelevant));
  
  const selected: SearchResult[] = [];
  
  // 优先添加负面评价（已按时间倒序）
  selected.push(...negative);
  
  // 添加正面评价（已按时间倒序）
  selected.push(...positive);
  
  // 如果不足maxCount，用中性评价填充（已按时间倒序）
  if (selected.length < maxCount) {
    const remaining = maxCount - selected.length;
    selected.push(...neutral.slice(0, remaining));
  }
  
  // 最终结果按时间倒序排序
  return sortByTimeDesc(selected.slice(0, maxCount));
}

// 延迟函数
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 带重试的搜索函数
async function searchWithRetry(
  client: SearchClient,
  query: string,
  options: Record<string, unknown>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<{ web_items?: Array<{ title?: string; url?: string; snippet?: string; publish_time?: string; site_name?: string }> }> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await client.advancedSearch(query, options);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Search attempt ${attempt + 1} failed for query "${query}":`, lastError.message);
      if (attempt < maxRetries - 1) {
        await delay(retryDelay * (attempt + 1)); // 递增延迟
      }
    }
  }
  
  throw lastError;
}

// 搜索平台内容 - 优化版：先搜索企业名称，再搜索关键字，合并结果
async function searchPlatform(
  client: SearchClient,
  companyName: string,  // 企业名称（必填）
  keywords: string[],   // 关键字（可选）
  platform: typeof ALL_PLATFORMS[0],
  timeRangeParam?: string,
  months: number = 1,
  isPremium: boolean = false  // 是否为高级用户
): Promise<SearchResult[]> {
  try {
    // 根据用户类型计算搜索数量（从配置读取）
    // 普通用户：每个平台返回 SEARCH_CONFIG.FREE_RESULT_COUNT 条
    // 高级用户：(SEARCH_CONFIG.PREMIUM_BASE_RESULT_COUNT + SEARCH_CONFIG.PREMIUM_RESULT_PER_MONTH * 月数)，最大 SEARCH_CONFIG.PREMIUM_MAX_RESULT_COUNT 条
    const targetCount = isPremium 
      ? Math.min(
          SEARCH_CONFIG.PREMIUM_BASE_RESULT_COUNT + Math.ceil(months * SEARCH_CONFIG.PREMIUM_RESULT_PER_MONTH), 
          SEARCH_CONFIG.PREMIUM_MAX_RESULT_COUNT
        ) 
      : SEARCH_CONFIG.FREE_RESULT_COUNT;
    const allResults: SearchResult[] = [];
    const seenUrls = new Set<string>();
    
    // 根据时间范围参数计算开始日期，用于二次过滤
    const startDateObj = timeRangeParam ? getStartDateFromRange(timeRangeParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    // 构建搜索词列表：企业名称在前，关键字在后
    const searchTerms = [companyName, ...keywords];
    
    // 对每个搜索词分别搜索，然后合并结果
    // 每个搜索词的目标数量 = 总目标数量 / 搜索词数量
    const perTermTarget = Math.ceil(targetCount / searchTerms.length);
    
    for (const searchTerm of searchTerms) {
      if (allResults.length >= targetCount) break;
      
      const termResults: SearchResult[] = [];
      const batchSize = 50;
      const batches = Math.ceil(perTermTarget / batchSize);
      
      for (let batch = 0; batch < batches && termResults.length < perTermTarget; batch++) {
        // 策略1: 使用域名限制搜索（优先）
        const domainSearchOptions: {
          count: number;
          needSummary: boolean;
          timeRange?: string;
          sites?: string;
        } = {
          count: batchSize,
          needSummary: false,
          sites: platform.domain,
          timeRange: timeRangeParam || '1m',
        };
        
        // 使用不同的搜索词组合以获取更多结果
        const queries = batch === 0 
          ? [searchTerm] 
          : [`${searchTerm} 新闻`, `${searchTerm} 评价`, `${searchTerm} 口碑`, `${searchTerm} 投诉`];
        
        const query = queries[batch % queries.length];
        
        try {
          const domainResponse = await searchWithRetry(client, query, domainSearchOptions);
          
          const domainResults = (domainResponse.web_items || [])
            .filter((item) => item.title && item.url)
            .filter((item) => !seenUrls.has(item.url || ''))
            .filter((item) => {
              const itemDate = item.publish_time ? new Date(item.publish_time) : null;
              if (itemDate && !isNaN(itemDate.getTime())) {
                return itemDate >= startDateObj && itemDate <= now;
              }
              return true;
            })
            .map((item) => {
              seenUrls.add(item.url!);
              return {
                title: item.title || '',
                url: item.url || '',
                snippet: item.snippet || '',
                publishTime: formatPublishTime(item.publish_time),
                siteName: item.site_name || platform.name,
                author: extractAuthor(item.title || '', item.snippet || '', item.site_name),
                sentiment: 'neutral' as const,
                isRelevant: false,
              };
            });
          
          termResults.push(...domainResults);
          
          // 策略2: 如果域名搜索结果不足，使用关键词搜索补充
          if (domainResults.length < batchSize / 2 && termResults.length < perTermTarget) {
            const keywordSearchOptions: {
              count: number;
              needSummary: boolean;
              timeRange?: string;
            } = {
              count: batchSize,
              needSummary: false,
              timeRange: timeRangeParam || '1m',
            };
            
            const keywordQuery = `${searchTerm} ${platform.name}`;
            
            try {
              const keywordResponse = await searchWithRetry(client, keywordQuery, keywordSearchOptions);
              
              const additionalResults = (keywordResponse.web_items || [])
                .filter((item) => item.title && item.url)
                .filter((item) => !seenUrls.has(item.url || ''))
                .filter((item) => matchesPlatform(item, platform))
                .filter((item) => {
                  const itemDate = item.publish_time ? new Date(item.publish_time) : null;
                  if (itemDate && !isNaN(itemDate.getTime())) {
                    return itemDate >= startDateObj && itemDate <= now;
                  }
                  return true;
                })
                .map((item) => {
                  seenUrls.add(item.url!);
                  return {
                    title: item.title || '',
                    url: item.url || '',
                    snippet: item.snippet || '',
                    publishTime: formatPublishTime(item.publish_time),
                    siteName: item.site_name || platform.name,
                    author: extractAuthor(item.title || '', item.snippet || '', item.site_name),
                    sentiment: 'neutral' as const,
                    isRelevant: false,
                  };
                });
              
              termResults.push(...additionalResults);
            } catch (keywordError) {
              console.error(`Keyword search failed for ${platform.name}:`, keywordError);
            }
          }
        } catch (domainError) {
          console.error(`Domain search failed for ${platform.name}:`, domainError);
        }
      }
      
      allResults.push(...termResults.slice(0, perTermTarget));
    }
    
    console.log(`[Search] ${platform.name}: found ${allResults.length} results for company "${companyName}" with keywords "${keywords.join(', ')}" (target: ${targetCount}, timeRange: ${timeRangeParam || '1m'})`);
    return allResults;
  } catch (error) {
    console.error(`Search error for ${platform.name}:`, error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { 
    companyName,  // 企业名称（必填）
    keywords,     // 关键字（可选）
    platforms: selectedPlatformIds,
    startDate,
    endDate,
    isPremium = false,  // 是否为高级用户
  } = body;

  if (!companyName || !companyName.trim()) {
    return new Response(JSON.stringify({ error: '请提供企业名称' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 构建搜索词：企业名称 + 关键字
  // 先搜索企业名称，再搜索关键字（如果有的话）
  const company = companyName.trim();
  const searchKeywords = keywords && keywords.length > 0 ? keywords : [];

  // 获取可用平台列表（如果配置了ENABLED_PLATFORMS，则只使用配置的平台）
  const availablePlatforms = ENABLED_PLATFORMS.length > 0 
    ? ALL_PLATFORMS.filter(p => ENABLED_PLATFORMS.includes(p.id))
    : ALL_PLATFORMS;

  // 过滤出用户选择的平台
  const platforms = selectedPlatformIds && selectedPlatformIds.length > 0
    ? availablePlatforms.filter(p => selectedPlatformIds.includes(p.id))
    : availablePlatforms;

  if (platforms.length === 0) {
    return new Response(JSON.stringify({ error: '请选择至少一个平台' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 获取时间范围参数
  const timeRangeParam = getTimeRangeParam(startDate, endDate);

  // 获取 SDK 配置（支持扣子编程平台和自有服务器两种部署方式）
  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const { config, headers } = getSDKConfig(customHeaders);
  const searchClient = new SearchClient(config, headers);
  const llmClient = new LLMClient(config, headers);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        sendEvent(controller, { type: 'status', message: '正在初始化分析...' });

        const platformResults: PlatformResult[] = [];
        let totalNegative = 0;
        let totalPositive = 0;

        // 计算月数用于确定搜索数量
        const months = getMonthsFromTimeRange(timeRangeParam || '1m');

        sendEvent(controller, { type: 'status', message: `正在搜索 ${platforms.length} 个平台...` });

        // 串行搜索所有平台（避免API频率限制）
        const searchResults: Array<{ platform: typeof ALL_PLATFORMS[0]; results: SearchResult[] }> = [];
        
        for (let i = 0; i < platforms.length; i++) {
          const platform = platforms[i];
          sendEvent(controller, { 
            type: 'status', 
            message: `正在搜索 ${platform.name} (${i + 1}/${platforms.length})...` 
          });
          
          const results = await searchPlatform(searchClient, company, searchKeywords, platform, timeRangeParam, months, isPremium);
          searchResults.push({ platform, results });
          
          // 平台之间添加延迟，避免API频率限制
          if (i < platforms.length - 1) {
            await delay(500);
          }
        }

        console.log(`[Analysis] Search completed for ${searchResults.length} platforms:`, searchResults.map(s => `${s.platform.name}(${s.results.length})`).join(', '));

        // 逐个平台进行相关性和情感分析
        for (const { platform, results } of searchResults) {
          sendEvent(controller, {
            type: 'status',
            message: `正在分析 ${platform.name} 的 ${results.length} 条搜索结果...`,
          });

          let filteredResults: SearchResult[] = [];

          if (results.length > 0) {
            // 使用 AI 判断相关性和情感
            const analysis = await checkRelevanceAndSentiment(llmClient, company, results);
            
            // 标记相关性和情感
            const relevantResults = results
              .map((r, i) => ({
                ...r,
                isRelevant: analysis[i]?.isRelevant ?? true,
                sentiment: analysis[i]?.sentiment || 'neutral',
                sentimentReason: analysis[i]?.sentimentReason,
              }))
              .filter((r) => r.isRelevant);
            
            // 按情感优先级选择100条结果（负面和正面优先，中性填充）
            filteredResults = selectResultsBySentiment(relevantResults, 100);
          }

          const negativeCount = filteredResults.filter(
            (r) => r.sentiment === 'negative'
          ).length;
          const positiveCount = filteredResults.filter(
            (r) => r.sentiment === 'positive'
          ).length;

          totalNegative += negativeCount;
          totalPositive += positiveCount;

          platformResults.push({
            platform,
            results: filteredResults,
            negativeCount,
            positiveCount,
          });
        }

        // 计算风险等级
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (totalNegative >= 5) {
          riskLevel = 'high';
        } else if (totalNegative >= 2) {
          riskLevel = 'medium';
        }

        // 统计总数
        const totalResults = platformResults.reduce((sum, p) => sum + p.results.length, 0);

        console.log(`[Analysis] Final results: ${platformResults.length} platforms, ${totalResults} total results`);

        sendEvent(controller, {
          type: 'result',
          data: {
            companyName,
            keywords: searchKeywords,
            platforms: platformResults,
            totalNegative,
            totalPositive,
            totalResults,
            riskLevel,
            searchParams: {
              platformCount: platforms.length,
              timeRange: timeRangeParam,
              startDate,
              endDate,
            },
          },
        });

        controller.close();
      } catch (error) {
        console.error('Analysis error:', error);
        sendEvent(controller, {
          type: 'error',
          message: error instanceof Error ? error.message : '分析过程中发生错误',
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
