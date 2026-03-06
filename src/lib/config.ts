/**
 * 系统配置文件
 * 可根据需要修改各项配置
 */

// 高级功能验证码配置
export const PREMIUM_CODES = {
  // 固定验证码（永久有效）- 从环境变量读取
  FIXED_CODE: {
    key: 'YQFX',
    value: process.env.NEXT_PUBLIC_FIXED_CODE || 'YOUR_CODE_HERE',
  },
  // 是否启用月度动态验证码
  // true: 显示月度key（如 YQ3），用户需要获取当月验证码
  // false: 显示固定key（YQFX），用户使用固定验证码
  ENABLE_MONTHLY_CODES: process.env.NEXT_PUBLIC_ENABLE_MONTHLY_CODES === 'true',
  // 充值验证码数组（从环境变量读取，逗号分隔）
  // 使用条件：已解锁高级功能 且 分析次数为0
  RECHARGE_CODES: (process.env.NEXT_PUBLIC_RECHARGE_CODES || '').split(',').filter(Boolean),
  // 每个充值验证码增加的分析次数
  RECHARGE_COUNT_PER_CODE: 100,
} as const;

// 公众号配置
export const WECHAT_CONFIG = {
  // 公众号名称
  NAME: 'IT老五',
  // 公众号二维码图片路径（位于 public 目录下，通过 /xxx.jpg 访问）
  QRCODE_IMAGE: '/itlao5.jpg',
  // 公众号二维码图片名称（用于显示）
  QRCODE_NAME: 'itlao5.jpg',
} as const;

// 普通用户配置
export const FREE_USER_CONFIG = {
  // 可分析次数
  MAX_ANALYSIS_COUNT: 3,
  // 可选择平台数
  MAX_PLATFORMS_COUNT: 3,
  // 可输入关键字数
  MAX_KEYWORDS_COUNT: 2,
  // 是否支持报告打印功能
  ENABLE_PRINT: false,
  // 是否支持报告导出PDF功能
  ENABLE_EXPORT_PDF: false,
} as const;

// 高级用户配置（验证码解锁后）
export const PREMIUM_USER_CONFIG = {
  // 可分析次数
  MAX_ANALYSIS_COUNT: 50,
  // 可选择平台数
  MAX_PLATFORMS_COUNT: 10,
  // 可输入关键字数
  MAX_KEYWORDS_COUNT: 5,
  // 是否支持报告打印功能
  ENABLE_PRINT: true,
  // 是否支持报告导出PDF功能
  ENABLE_EXPORT_PDF: true,
} as const;

// 搜索结果配置
export const SEARCH_CONFIG = {
  // 普通用户每个平台返回结果数
  FREE_RESULT_COUNT: 100,
  // 高级用户每个平台基础结果数
  PREMIUM_BASE_RESULT_COUNT: 500,
  // 高级用户每个平台按月增加的结果数
  PREMIUM_RESULT_PER_MONTH: 100,
  // 高级用户每个平台最大结果数
  PREMIUM_MAX_RESULT_COUNT: 1000,
} as const;

/**
 * 支持选择的平台名称列表
 * 如果为空数组，则使用所有平台
 * 如果不为空，则只显示配置的平台
 * 
 * 可用平台ID列表：
 * 
 * 【社交媒体】
 * - weibo: 微博
 * - zhihu: 知乎
 * - xiaohongshu: 小红书
 * - wechat: 微信公众号
 * - tieba: 百度贴吧
 * - douban: 豆瓣
 * - tianya: 天涯社区
 * - mafengwo: 马蜂窝
 * - dianping: 大众点评
 * - meituan: 美团
 * 
 * 【新闻资讯】
 * - toutiao: 今日头条
 * - baidu: 百度资讯
 * - sina: 新浪新闻
 * - sohu: 搜狐新闻
 * - netease: 网易新闻
 * - qqnews: 腾讯新闻
 * - ifeng: 凤凰网
 * - yidian: 一点资讯
 * - uc: UC头条
 * - zaker: ZAKER
 * - caixin: 财新网
 * - jiemian: 界面新闻
 * - thepaper: 澎湃新闻
 * - bjnews: 新京报
 * - yicai: 第一财经
 * - cankao: 参考消息
 * - huanqiu: 环球网
 * - china: 中国网
 * - gmw: 光明网
 * 
 * 【官方媒体】
 * - people: 人民网
 * - xinhua: 新华网
 * - chinanews: 中国新闻网
 * - cctv: 央视网
 * - cntv: 中国网络电视台
 * - gov: 中国政府网
 * - 12315: 12315投诉平台
 * 
 * 【视频平台】
 * - douyin: 抖音
 * - bilibili: B站
 * - kuaishou: 快手
 * - youku: 优酷
 * - iqiyi: 爱奇艺
 * - tencentvideo: 腾讯视频
 * - mgtv: 芒果TV
 * - xigua: 西瓜视频
 * - haokan: 好看视频
 * 
 * 【科技财经】
 * - 36kr: 36氪
 * - huxiu: 虎嗅
 * - tmtpost: 钛媒体
 * - leiphone: 雷锋网
 * - donews: Donews
 * - techweb: TechWeb
 * - pingwest: PingWest
 * - ifanr: 爱范儿
 * - sootuu: 速途网
 * - eastmoney: 东方财富
 * - xueqiu: 雪球
 * - tonghuashun: 同花顺
 * - jrj: 金融界
 * - hexun: 和讯网
 * 
 * 【电商平台】
 * - taobao: 淘宝
 * - jd: 京东
 * - pdd: 拼多多
 * - tmall: 天猫
 * - suning: 苏宁易购
 * - gome: 国美
 * - dangdang: 当当网
 * - vip: 唯品会
 * 
 * 【汽车出行】
 * - autohome: 汽车之家
 * - dongchedi: 懂车帝
 * - pcauto: 太平洋汽车
 * - xcar: 爱卡汽车
 * - yiche: 易车网
 * - gaode: 高德地图
 * - didi: 滴滴出行
 * 
 * 【房产家居】
 * - lianjia: 链家
 * - ke: 贝壳找房
 * - anjuke: 安居客
 * - fang: 房天下
 * - leju: 乐居
 * 
 * 【招聘求职】
 * - boss: BOSS直聘
 * - zhaopin: 智联招聘
 * - 51job: 前程无忧
 * - liepin: 猎聘
 * - lagou: 拉勾网
 * 
 * 【教育培训】
 * - zhihuishu: 智慧树
 * - xuetangx: 学堂在线
 * - icourse163: 中国大学MOOC
 * - youdao: 有道精品课
 * - xueersi: 学而思
 * 
 * 【医疗健康】
 * - haodf: 好大夫在线
 * - guahao: 挂号网
 * - dingxiang: 丁香园
 * - chunyu: 春雨医生
 * 
 * 【旅游出行】
 * - ctrip: 携程
 * - qunar: 去哪儿
 * - tuniu: 途牛
 * - ly: 同程旅行
 * - fliggy: 飞猪
 * 
 * 【企业评价】
 * - tianyancha: 天眼查
 * - qcc: 企查查
 * - kanzhun: 看准网
 * - qixin: 启信宝
 * - zhazhipin: 职友集
 * 
 * 【投诉维权】
 * - ts21: 21CN聚投诉
 * - 12315online: 全国12315平台
 * - tousu: 黑猫投诉
 */
export const ENABLED_PLATFORMS: string[] = [
  // 示例：只启用部分平台，为空则全部显示
  // 'weibo', 'zhihu', 'xiaohongshu', 'wechat', 'toutiao', 'baidu',
  // 'douyin', 'bilibili', 'kuaishou', 'taobao', 'jd', 'pdd',
];

// 解锁状态过期时间（毫秒）
export const PREMIUM_EXPIRE_TIME = 24 * 60 * 60 * 1000; // 24小时

// 导出配置类型
export type AppConfig = {
  premiumCodes: typeof PREMIUM_CODES;
  wechat: typeof WECHAT_CONFIG;
  freeUser: typeof FREE_USER_CONFIG;
  premiumUser: typeof PREMIUM_USER_CONFIG;
  search: typeof SEARCH_CONFIG;
  enabledPlatforms: string[];
  premiumExpireTime: number;
};
